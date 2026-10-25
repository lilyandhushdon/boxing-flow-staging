/* Cloud: the Supabase client, sign-in state, and the sync that keeps everything the app remembers in the person's account.
   The app saves its settings, plan, history and progress on the device (localStorage keys that start with "bf"). This file watches those writes and, once someone is
   signed in, copies them to the app_data table (supabase/migrations) and brings changes made on other devices back. Each key is kept whole, and the newest change wins.
   Load it first, before the scripts that save things, so every write is seen. Needs supabase-config.js. Other files use window.bfCloud. */
(() => {
  const CFG = window.BF_SUPABASE, META = 'bfSyncMeta', SB_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const synced = k => typeof k === 'string' && /^bf/.test(k) && k !== META && k !== 'bfNutriCache';   // the nutrition cache is only a copy of what is already in the account
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem, rawGet = Storage.prototype.getItem;
  let meta = {uid:null, ts:{}, pushed:{}}, applying = false;
  try { const m = JSON.parse(rawGet.call(localStorage, META) || 'null'); if(m && m.ts) meta = m; } catch(e){}
  const saveMeta = () => { try { rawSet.call(localStorage, META, JSON.stringify(meta)); } catch(e){} };

  // every save of a "bf" key is noted with the time, so we know what is newer than what the account has
  const touch = k => { meta.ts[k] = Date.now(); saveMeta(); schedulePush(); };
  Storage.prototype.setItem = function(k, v){ rawSet.call(this, k, v); if(this === localStorage && !applying && synced(k)) touch(k); };
  Storage.prototype.removeItem = function(k){ rawRemove.call(this, k); if(this === localStorage && !applying && synced(k)) touch(k); };

  /* ---------- the client ---------- */
  const C = {sb:null, user:null, status:'off', last:null, authFns:new Set(), statusFns:new Set()};
  const setStatus = (s, extra) => { C.status = s; if(extra) C.last = extra; C.statusFns.forEach(f => { try { f(s); } catch(e){} }); };
  let initP = null;
  C.init = () => initP || (initP = (async () => {
    if(!CFG) throw new Error('no config');
    await new Promise((res, rej) => { if(window.supabase) return res(); const s = document.createElement('script'); s.src = SB_JS; s.onload = res; s.onerror = () => rej(new Error('lib')); document.head.appendChild(s); });
    C.sb = window.supabase.createClient(CFG.url, CFG.anonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
    C.sb.auth.onAuthStateChange((ev, sess) => {
      const was = C.user; C.user = sess ? sess.user : null;
      C.authFns.forEach(f => { try { f(ev, C.user, was); } catch(e){} });
      if(C.user && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && !was) startSync();
      if(ev === 'SIGNED_OUT') setStatus('off');
    });
    const {data} = await C.sb.auth.getSession(); C.user = data.session ? data.session.user : null;
    if(C.user) startSync();
    return C;
  })().catch(e => { initP = null; setStatus('off'); throw e; }));
  C.onAuth = fn => { C.authFns.add(fn); return () => C.authFns.delete(fn); };
  C.onStatus = fn => { C.statusFns.add(fn); return () => C.statusFns.delete(fn); };

  /* ---------- sync ---------- */
  const dirtyKeys = () => Object.keys(meta.ts).filter(k => synced(k) && (meta.ts[k] || 0) > (meta.pushed[k] || 0));
  let pushTimer = null, pushing = false, pulling = false;
  function schedulePush(){ clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); }
  async function push(){
    if(!C.sb || !C.user || pushing) return; const keys = dirtyKeys(); if(!keys.length) return;
    pushing = true; setStatus('syncing');
    try {
      const rows = keys.map(k => { const v = rawGet.call(localStorage, k); return {user_id:C.user.id, key:k, value:v, deleted:v === null, updated_at:new Date(meta.ts[k]).toISOString()}; });
      const {error} = await C.sb.from('app_data').upsert(rows, {onConflict:'user_id,key'}); if(error) throw error;
      keys.forEach((k, i) => { meta.pushed[k] = Math.max(meta.pushed[k] || 0, Date.parse(rows[i].updated_at)); }); saveMeta(); setStatus('ok', Date.now());
    } catch(e){ console.error('sync push', e); setStatus(navigator.onLine ? 'error' : 'offline'); pushTimer = setTimeout(push, 30000); }
    pushing = false;
  }
  // bring the account's copy to this device. A device that has never been linked to this account takes the account's version of anything the account has
  // (so a new phone's starter data can't overwrite the real thing); after that, the newer change wins.
  async function pull(){
    if(!C.sb || !C.user || pulling) return false; pulling = true; let changed = false;
    try {
      const {data, error} = await C.sb.from('app_data').select('*'); if(error) throw error;
      const first = meta.uid !== C.user.id;
      if(first && meta.uid){ for(const k of Object.keys(localStorage)) if(synced(k)) rawRemove.call(localStorage, k); meta = {uid:null, ts:{}, pushed:{}}; changed = true; }   // a different account: don't mix people's data
      const remote = new Set();
      applying = true;
      for(const r of data){
        remote.add(r.key); const lt = meta.ts[r.key] || 0, rt = Date.parse(r.updated_at);
        if(first || rt > lt){
          const same = r.deleted ? rawGet.call(localStorage, r.key) === null : rawGet.call(localStorage, r.key) === r.value;
          if(!same){ if(r.deleted) rawRemove.call(localStorage, r.key); else rawSet.call(localStorage, r.key, r.value); changed = true; }
          meta.ts[r.key] = rt; meta.pushed[r.key] = rt;
        } else if(lt === rt) meta.pushed[r.key] = rt;
      }
      applying = false;
      // things only this device has go up to the account
      for(const k of Object.keys(localStorage)) if(synced(k) && !remote.has(k) && !(k in meta.pushed)){ meta.ts[k] = meta.ts[k] || Date.now(); }
      meta.uid = C.user.id; saveMeta();
    } catch(e){ applying = false; console.error('sync pull', e); setStatus(navigator.onLine ? 'error' : 'offline'); pulling = false; return false; }
    pulling = false; return changed;
  }
  async function startSync(){
    setStatus('syncing');
    const changed = await pull(); await push();
    if(C.status === 'syncing') setStatus('ok', Date.now());
    if(changed) refreshNotice(true);
    C.sync = syncNow;
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
  document.addEventListener('visibilitychange', () => { if(!document.hidden && C.user && Date.now() - (C.last || 0) > 20000) syncNow(); });
  window.addEventListener('online', () => { if(C.user) syncNow(); });
  window.addEventListener('pagehide', () => { if(C.user && dirtyKeys().length) push(); });

  C.signOut = async () => { await C.sb.auth.signOut(); };
  window.bfCloud = C;
  // the client starts shortly after the page loads (at once if a sign-in link has just opened the app), so the signed-in state is known on the dashboard
  const early = /access_token|code=/.test(location.hash + location.search);
  setTimeout(() => C.init().catch(() => {}), early ? 0 : 900);
})();
