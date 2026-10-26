/* Cloud: the Supabase client, sign-in state, and the sync that keeps everything the app remembers in the person's account.
   The app saves its settings, plan, history and progress on the device (localStorage keys that start with "bf"). This file watches those writes and, once someone is
   signed in, copies them to the app_data table (supabase/migrations) within a moment, and brings changes made on other devices back (checked every 30 seconds).
   Each key is kept whole, and the newest change wins. Before this device's copy of anything is replaced, it is kept aside so the update can be undone.
   Load it first, before the scripts that save things, so every write is seen. Needs supabase-config.js. Other files use window.bfCloud. */
(() => {
  const CFG = window.BF_SUPABASE, META = 'bfSyncMeta', SB_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const synced = k => typeof k === 'string' && /^bf/.test(k) && k !== META && k !== 'bfNutriCache';   // the nutrition cache is only a copy of what is already in the account
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem, rawGet = Storage.prototype.getItem;
  // ts: when each key last changed here; pushed: the change time the account is known to have; backup: this device's copy of a key just before an update replaced it
  let meta = {uid:null, ts:{}, pushed:{}, backup:{}}, applying = false;
  try { const m = JSON.parse(rawGet.call(localStorage, META) || 'null'); if(m && m.ts) meta = {backup:{}, ...m}; } catch(e){}
  const saveMeta = () => { try { rawSet.call(localStorage, META, JSON.stringify(meta)); } catch(e){} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // every save of a "bf" key is noted with the time, so we know what is newer than what the account has
  const touch = k => { meta.ts[k] = Date.now(); saveMeta(); schedulePush(); };
  Storage.prototype.setItem = function(k, v){ rawSet.call(this, k, v); if(this === localStorage && !applying && synced(k)) touch(k); };
  Storage.prototype.removeItem = function(k){ rawRemove.call(this, k); if(this === localStorage && !applying && synced(k)) touch(k); };

  /* ---------- the client ---------- */
  const C = {sb:null, user:null, session:null, owner:false, status:'off', error:'', last:null, ready:false, authFns:new Set(), statusFns:new Set()};
  const setStatus = (s, extra) => { C.status = s; if(extra) C.last = extra; C.statusFns.forEach(f => { try { f(s); } catch(e){} }); paintSyncLine(); };
  let initP = null;
  C.init = () => initP || (initP = (async () => {
    if(!CFG) throw new Error('no config');
    await new Promise((res, rej) => { if(window.supabase) return res(); const s = document.createElement('script'); s.src = SB_JS; s.onload = res; s.onerror = () => rej(new Error('lib')); document.head.appendChild(s); });
    C.sb = window.supabase.createClient(CFG.url, CFG.anonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
    C.sb.auth.onAuthStateChange((ev, sess) => {
      const was = C.user; C.user = sess ? sess.user : null; C.session = sess || null;
      C.authFns.forEach(f => { try { f(ev, C.user, was); } catch(e){} });
      if(C.user && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && !was) startSync();
      if(ev === 'SIGNED_OUT') setStatus('off'); else paintSyncLine();
    });
    const {data} = await C.sb.auth.getSession(); C.user = data.session ? data.session.user : null; C.session = data.session || null;
    if(!C.user) await ownerSignIn();
    if(C.user) startSync();
    return C;
  })().catch(e => { initP = null; C.error = 'the sign-in service could not be reached'; setStatus('off'); throw e; }).finally(() => { C.ready = true; paintSyncLine(); }));
  // Owner mode, for while the app is being built: on this computer (or the home network) a git-ignored file, dev-owner.js, holds the owner's login and the app signs in by
  // itself, so nothing asks for a sign-in. It is never loaded from the internet: only from localhost and private network addresses, and the live site refuses to serve it.
  // When the app has its own sign-up and sign-in, this goes away.
  const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;
  async function ownerSignIn(){
    if(!LOCAL_HOST.test(location.hostname)) return;
    await new Promise(res => { const s = document.createElement('script'); s.src = 'dev-owner.js'; s.onload = s.onerror = res; document.head.appendChild(s); });
    const o = window.BF_OWNER; if(!o || !o.email || !o.password) return;
    try { const {data, error} = await C.sb.auth.signInWithPassword({email:o.email, password:o.password}); if(!error && data.session){ C.user = data.session.user; C.session = data.session; C.owner = true; } } catch(e){}
  }
  C.onAuth = fn => { C.authFns.add(fn); return () => C.authFns.delete(fn); };
  C.onStatus = fn => { C.statusFns.add(fn); return () => C.statusFns.delete(fn); };

  /* ---------- sync ---------- */
  const dirtyKeys = () => Object.keys(meta.ts).filter(k => synced(k) && (meta.ts[k] || 0) > (meta.pushed[k] || 0));
  const rowsFor = keys => keys.map(k => { const v = rawGet.call(localStorage, k); return {user_id:C.user.id, key:k, value:v, deleted:v === null, updated_at:new Date(meta.ts[k]).toISOString()}; });
  const markPushed = (keys, rows) => { keys.forEach((k, i) => { meta.pushed[k] = Math.max(meta.pushed[k] || 0, Date.parse(rows[i].updated_at)); }); saveMeta(); };
  const why = e => (e && (e.message || e.details || e.hint)) || String(e);
  let pushTimer = null, pushing = false, pulling = false;
  function schedulePush(){ clearTimeout(pushTimer); pushTimer = setTimeout(push, 300); }   // a moment, so a burst of edits goes up as one
  async function push(){
    if(!C.sb || !C.user || pushing) return; const keys = dirtyKeys(); if(!keys.length) return;
    pushing = true; setStatus('syncing');
    try {
      const rows = rowsFor(keys), {error} = await C.sb.from('app_data').upsert(rows, {onConflict:'user_id,key'}); if(error) throw error;
      markPushed(keys, rows); C.error = ''; setStatus('ok', Date.now());
    } catch(e){ console.error('sync push', e); C.error = why(e); setStatus(navigator.onLine ? 'error' : 'offline'); clearTimeout(pushTimer); pushTimer = setTimeout(push, 15000); }
    pushing = false;
    if(dirtyKeys().length && C.status === 'ok') schedulePush();   // something changed while it was going up
  }
  // when the page is closing or hidden a normal request can be cancelled, so the changes go straight to the database API in a request the browser finishes by itself
  function flush(){
    if(!C.user || !C.session || !dirtyKeys().length) return;
    const keys = dirtyKeys(), rows = rowsFor(keys), body = JSON.stringify(rows);
    if(body.length > 60000) return push();   // too big for a closing page: send it the normal way
    try {
      fetch(CFG.url + '/rest/v1/app_data?on_conflict=user_id,key', {method:'POST', keepalive:true, headers:{apikey:CFG.anonKey, authorization:'Bearer ' + C.session.access_token, 'content-type':'application/json', prefer:'resolution=merge-duplicates,return=minimal'}, body})
        .then(r => { if(r.ok){ markPushed(keys, rows); setStatus('ok', Date.now()); } });
    } catch(e){ push(); }
  }
  // bring the account's copy to this device. A device that has never been linked to this account takes the account's version of anything the account has
  // (so a new phone's starter data can't overwrite the real thing); after that, the newer change wins. Nothing here deletes this device's data: whatever an update
  // replaces is kept in meta.backup first, and C.restoreBackup() puts it back.
  // a starter camp (auto) is a placeholder: it must never win over a camp the person really set up, even if its timestamp is newer
  const placeholder = (k, v) => { if(k !== 'bfCamp' || !v) return false; try { return !!JSON.parse(v).auto; } catch(e){ return false; } };
  async function pull(){
    if(!C.sb || !C.user || pulling) return false; pulling = true; let changed = false;
    try {
      const {data, error} = await C.sb.from('app_data').select('*'); if(error) throw error;
      const first = meta.uid !== C.user.id, remote = new Set();
      applying = true;
      for(const r of data){
        remote.add(r.key); const lt = meta.ts[r.key] || 0, rt = Date.parse(r.updated_at);
        const mine0 = rawGet.call(localStorage, r.key);
        if(first || rt > lt || (placeholder(r.key, mine0) && !placeholder(r.key, r.value))){
          const mine = mine0, same = r.deleted ? mine === null : mine === r.value;
          if(!same){
            if(mine !== null && mine.length < 200000) meta.backup[r.key] = {v:mine, at:Date.now()};
            if(r.deleted) rawRemove.call(localStorage, r.key); else rawSet.call(localStorage, r.key, r.value); changed = true;
          }
          meta.ts[r.key] = rt; meta.pushed[r.key] = rt;
        } else if(lt === rt) meta.pushed[r.key] = rt;
      }
      applying = false;
      // things only this device has go up to the account
      for(const k of Object.keys(localStorage)) if(synced(k) && !remote.has(k) && !(k in meta.pushed)){ meta.ts[k] = meta.ts[k] || Date.now(); }
      meta.uid = C.user.id; saveMeta(); C.error = '';
    } catch(e){ applying = false; console.error('sync pull', e); C.error = why(e); setStatus(navigator.onLine ? 'error' : 'offline'); pulling = false; return false; }
    pulling = false; return changed;
  }
  const hasBackup = () => Object.keys(meta.backup || {}).length > 0;
  C.restoreBackup = () => {
    for(const [k, b] of Object.entries(meta.backup || {})){ applying = true; if(b.v === null) rawRemove.call(localStorage, k); else rawSet.call(localStorage, k, b.v); applying = false; touch(k); }
    meta.backup = {}; saveMeta(); setTimeout(() => location.reload(), 600);
  };
  async function startSync(){
    setStatus('syncing');
    const changed = await pull(); await push();
    if(C.status === 'syncing') setStatus('ok', Date.now());
    if(changed) refreshNotice(true);
  }
  async function syncNow(){ const changed = await pull(); await push(); if(C.status === 'syncing') setStatus('ok', Date.now()); if(changed) refreshNotice(false); return changed; }
  C.syncNow = syncNow;

  // the app holds what it loaded in memory, so new data from the account needs a fresh start. Right after the page opens that happens by itself;
  // later, in case something is in the middle of being done, a bar asks first.
  function refreshNotice(auto){
    const busy = () => { const t = document.getElementById('timer'); return t && !t.hidden; };
    const recent = (() => { try { return Date.now() - +(sessionStorage.getItem('bfSyncReload') || 0) < 20000; } catch(e){ return true; } })();
    if(auto && performance.now() < 15000 && !busy() && !recent){ try { sessionStorage.setItem('bfSyncReload', Date.now()); } catch(e){} location.reload(); return; }
    if(document.getElementById('syncBar')) return;
    const bar = document.createElement('div'); bar.id = 'syncBar'; bar.className = 'sync-bar'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>Your data was updated from another device.</span><button class="btn small" id="syncGo">Refresh</button>';
    document.body.appendChild(bar); bar.querySelector('#syncGo').onclick = () => location.reload();
  }
  document.addEventListener('visibilitychange', () => { if(document.hidden) flush(); else if(C.user && Date.now() - (C.last || 0) > 10000) syncNow(); });
  window.addEventListener('online', () => { if(C.user) syncNow(); });
  window.addEventListener('pagehide', flush);
  setInterval(() => { if(!document.hidden && C.user && !pulling && !pushing) syncNow(); }, 30000);   // changes from other devices arrive within half a minute

  /* ---------- the status line in the menu ---------- */
  const clock = t => new Date(t).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  function paintSyncLine(){
    const el = document.getElementById('syncLine'); if(!el) return;
    let h;
    if(!C.ready && !C.user) h = 'Connecting…';
    else if(!C.user) h = 'Not signed in: your data is only on this device. <button class="linkbtn" data-sync="signin">Sign in</button>';
    else if(C.status === 'syncing') h = 'Saving to your account…';
    else if(C.status === 'error' || C.status === 'offline') h = (C.status === 'offline' ? 'Offline.' : 'Couldn\'t save to your account' + (C.error ? ' (' + esc(C.error) + ')' : '') + '.') + ' Your changes are kept on this device and sent when it works. <button class="linkbtn" data-sync="now">Try again</button>';
    else h = 'Saved to your account' + (C.owner ? ' (owner mode)' : '') + (C.last ? ' · ' + clock(C.last) : '') + ' <button class="linkbtn" data-sync="now">Sync now</button>';
    if(hasBackup()) h += '<br><button class="linkbtn" data-sync="restore">Undo the last update from your account</button>';
    el.innerHTML = h;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-sync]'); if(!b) return; const a = b.dataset.sync;
    if(a === 'now') syncNow(); else if(a === 'restore'){ if(confirm('Put back what this device had before the last update from your account?')) C.restoreBackup(); }
    else if(a === 'signin' && window.show){ if(window.setMenu) window.setMenu(false); window.show('nutrition'); }
  });
  document.addEventListener('DOMContentLoaded', paintSyncLine);

  C.signOut = async () => { await C.sb.auth.signOut(); };
  window.bfCloud = C;
  // the client starts shortly after the page loads (at once if a sign-in link has just opened the app), so the signed-in state is known on the dashboard
  const early = /access_token|code=/.test(location.hash + location.search);
  setTimeout(() => C.init().catch(() => {}), early ? 0 : 300);
})();
