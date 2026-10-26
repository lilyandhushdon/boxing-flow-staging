/* Film study: paste a YouTube link, watch it here, and write notes stamped with the moment in the video. Pausing opens a note box at that moment.
   Studies (link, title, notes, takeaways, where they stopped) live in localStorage under bfFilm, as plain JSON that can move to a database with sign-in.
   The player is YouTube's own embedded player (IFrame API), so a video's owner can block it from playing outside YouTube. */
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bfFilm';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  let studies = [];
  try { studies = JSON.parse(localStorage.getItem(KEY) || '[]'); if(!Array.isArray(studies)) studies = []; } catch(e){ studies = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(studies)); } catch(e){} };

  const ui = {id:null, fighter:null, draft:null, editing:null, msg:'', panel:false};   // draft: {t, resume} is a note being written
  let player = null, ready = false, tick = null, pauseTimer = null, apiPromise = null;
  const cur = () => studies.find(s => s.id === ui.id);
  const fighters = () => (window.FILM_FIGHTERS || []).slice().sort((a, b) => a.name.localeCompare(b.name));

  /* ---------- links and times ---------- */
  function startOf(u){   // ?t=90, ?t=1m30s or ?start=90
    const v = u.searchParams.get('t') || u.searchParams.get('start') || ''; if(/^\d+$/.test(v)) return +v;
    const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/); return m && v ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  }
  function parseLink(s){
    s = (s || '').trim(); if(/^[\w-]{11}$/.test(s)) return {vid:s, start:0};
    let u; try { u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s); } catch(e){ return null; }
    const h = u.hostname.replace(/^(www|m)\./, ''); let id = null;
    if(h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if(h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtube-nocookie.com'){
      if(u.pathname === '/watch') id = u.searchParams.get('v'); else { const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/); id = m && m[2]; } }
    return id && /^[\w-]{11}$/.test(id) ? {vid:id, start:startOf(u)} : null;
  }
  const clock = t => { t = Math.max(0, Math.floor(t)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const watchUrl = (st, t) => 'https://youtu.be/' + st.vid + (t ? '?t=' + Math.floor(t) : '');
  const when = ts => new Date(ts).toLocaleDateString(undefined, {day:'numeric', month:'short'});

  /* ---------- the YouTube player ---------- */
  function api(){
    if(window.YT && YT.Player) return Promise.resolve();
    if(apiPromise) return apiPromise;
    apiPromise = new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { if(prev) prev(); res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => { apiPromise = null; rej(); }; document.head.appendChild(s);
      setTimeout(() => { if(!(window.YT && YT.Player)){ apiPromise = null; rej(); } }, 12000);
    });
    return apiPromise;
  }
  function destroy(){
    clearInterval(tick); clearTimeout(pauseTimer); tick = null;
    try { player && player.destroy && player.destroy(); } catch(e){}
    player = null; ready = false;
  }
  function saveLast(){
    if(!player || !ready) return;
    try { const st = cur(), t = player.getCurrentTime(); if(st && t > 0){ st.last = Math.floor(t); save(); } } catch(e){}
  }
  function mount(st){
    destroy();
    api().then(() => {
      if(ui.id !== st.id || !$('filmPlayer')) return;
      player = new YT.Player('filmPlayer', {videoId:st.vid, width:'100%', height:'100%',
        playerVars:{playsinline:1, rel:0, modestbranding:1, start:Math.floor(st.last || 0)},
        events:{onReady:onReady, onStateChange:onState, onError:onError}});
    }).catch(() => { if($('fsErr')){ $('fsErr').hidden = false; $('fsErr').innerHTML = 'Couldn\'t load YouTube. Check your connection and try again. You can still read your notes below.'; } });
  }
  function onReady(){
    ready = true; tick = setInterval(saveLast, 5000);
    try { const d = player.getVideoData(), st = cur(); if(d && d.title && st && !st.fixed && st.title !== d.title){ st.title = d.title; save(); if($('fsTitle')) $('fsTitle').textContent = d.title; } } catch(e){}
  }
  function onState(e){
    clearTimeout(pauseTimer);
    if(e.data === 2) pauseTimer = setTimeout(paused, 450);   // a short wait, so dragging the scrub bar doesn't count as a pause
    else if(e.data === 0) saveLast();
  }
  function paused(){
    try { if(!player || player.getPlayerState() !== 2) return; } catch(e){ return; }
    saveLast(); if(!ui.draft && !ui.editing && player.getCurrentTime() > 1) openDraft(player.getCurrentTime(), true);   // not at the very start: that is a pause before it has begun
  }
  function onError(e){
    const blocked = e.data === 101 || e.data === 150, st = cur();
    $('fsErr').hidden = false;
    $('fsErr').innerHTML = (blocked ? 'The owner of this video doesn\'t allow it to play outside YouTube.' : e.data === 100 ? 'This video was removed or is private.' : 'This video can\'t be played here.')
      + (st ? ` <a href="${watchUrl(st)}" target="_blank" rel="noopener">Open it on YouTube</a>, then come back and add your notes.` : '');
  }

  /* ---------- notes ---------- */
  // A note is stamped a moment before the video was paused or the button was tapped: people react a second or two after they see something, so stamping the exact
  // instant lands just after it. The note box has buttons to nudge the time a little, and "Now" to take the video's time again.
  const LEAD = 2, BACK = 3;   // seconds: stamped this much earlier; a tap on a note's time starts the video this much earlier, for the run-up
  function openDraft(t, resume){
    ui.draft = {t:Math.max(0, Math.floor(t) - LEAD), resume:!!resume}; renderDraft(); setPanel(true);
    if(window.matchMedia && matchMedia('(pointer:fine)').matches) $('fsText')?.focus({preventScroll:true});
  }
  const nowTime = () => { try { return ready ? player.getCurrentTime() : 0; } catch(e){ return 0; } };
  const seek = t => { try { if(player && ready) player.seekTo(Math.max(0, t), true); } catch(e){} };
  function renderDraft(){
    const box = $('filmDraft'); if(!box) return;
    box.innerHTML = ui.draft ? `<div class="fs-draft"><div class="fs-when"><label for="fsText"><b>Note at <button type="button" class="fs-dt" id="fsDt" data-fs-check title="Jump the video to this moment">${clock(ui.draft.t)}</button></b></label>
      <span class="fs-nudge"><button type="button" data-fs-nudge="-5">&minus;5s</button><button type="button" data-fs-nudge="-1">&minus;1s</button><button type="button" data-fs-nudge="1">+1s</button><button type="button" data-fs-nudge="5">+5s</button><button type="button" data-fs-now>Now</button></span></div>
      <textarea id="fsText" rows="3" maxlength="600" placeholder="What did you see? e.g. He drops his right hand after the jab"></textarea>
      <div class="acts"><button class="btn small" data-fs-save>Save note</button><button class="btn small ghost" data-fs-cancel>Cancel</button></div></div>` : '';
  }
  function renderNotes(){
    const st = cur(); if(!st || !$('filmNotes')) return;
    $('fsCount').textContent = st.notes.length ? '(' + st.notes.length + ')' : '';
    $('filmNotes').innerHTML = st.notes.length ? st.notes.map(n => ui.editing === n.id
      ? `<div class="fs-note"><span class="fs-t">${clock(n.t)}</span><div class="fs-tx"><textarea id="fsEditText" rows="3" maxlength="600">${esc(n.text)}</textarea>
          <div class="acts"><button class="btn small" data-fs-editsave="${n.id}">Save</button><button class="btn small ghost" data-fs-cancel>Cancel</button></div></div></div>`
      : `<div class="fs-note"><button class="fs-t" data-fs-seek="${n.t}" aria-label="Go to ${clock(n.t)}">${clock(n.t)}</button><div class="fs-tx">${esc(n.text)}</div>
          <div class="fs-ac"><button class="mini-btn" data-fs-edit="${n.id}">Edit</button><button class="x" data-fs-del="${n.id}" aria-label="Delete note">&times;</button></div></div>`).join('')
      : '<p class="t-note">No notes yet. Pause the video at a moment worth remembering and write what you see.</p>';
  }
  function addNote(){
    const st = cur(), v = ($('fsText').value || '').trim(); if(!st || !ui.draft) return;
    if(!v){ $('fsText').focus(); return; }
    st.notes.push({id:uid(), t:ui.draft.t, text:v}); st.notes.sort((a, b) => a.t - b.t); save();
    const resume = ui.draft.resume; ui.draft = null; renderDraft(); renderNotes();
    if(resume && player && ready){ try { player.playVideo(); } catch(e){} }
  }

  /* ---------- the notes panel, and the frame that follows the visible screen ---------- */
  function setPanel(on){ ui.panel = !!on; const p = $('fsPanel'), s = $('fsStage'); if(p) p.classList.toggle('open', ui.panel); if(s) s.classList.toggle('p-open', ui.panel); const c = document.querySelector('.fs-chip.r'); if(c) c.hidden = ui.panel; }
  // On a phone the keyboard covers part of the page. The frame is sized and placed by the visual viewport (what can really be seen), so the video fills what is visible and
  // the panel sits above the keyboard, whatever the browser does to the page underneath.
  function fitStage(){
    const s = $('fsStage'); if(!s) return;
    const v = window.visualViewport;
    s.style.top = (v ? v.offsetTop : 0) + 'px'; s.style.height = (v ? v.height : window.innerHeight) + 'px';
  }
  if(window.visualViewport){ visualViewport.addEventListener('resize', fitStage); visualViewport.addEventListener('scroll', fitStage); }
  window.addEventListener('resize', fitStage); window.addEventListener('orientationchange', () => setTimeout(fitStage, 200));

  /* ---------- screens ---------- */
  function libraryHtml(){
    const list = studies.slice().sort((a, b) => (b.opened || 0) - (a.opened || 0));
    return `<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>
      <h1>Film study</h1>
      <p class="sub">Paste a YouTube link, watch it here, and pause to write a note at the exact moment. Build your own library of fights and sparring to learn from.</p>
      <form id="fsForm" class="fs-add"><input id="fsUrl" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste a YouTube link" aria-label="YouTube link"><button class="btn small" type="submit">Add video</button></form>
      <p class="t-note warn" id="fsMsg" ${ui.msg ? '' : 'hidden'}>${esc(ui.msg)}</p>
      ${fighters().length ? `<h2 class="hr-h">Study a fighter</h2><p class="t-note">Full fights from official channels. Tap a name, then a fight.</p>
        <div class="fs-fighters">${fighters().map(f => `<button class="fs-fighter" data-fs-fighter="${esc(f.name)}"><strong>${esc(f.name)}</strong><small>${f.fights.length} fights</small></button>`).join('')}</div>` : ''}
      <h2 class="hr-h">Your film study</h2>
      ${list.length ? `<div class="fs-list">${list.map(s => `<div class="fs-card"><button class="fs-open" data-fs-open="${s.id}"><img src="https://i.ytimg.com/vi/${s.vid}/mqdefault.jpg" alt="" loading="lazy">
          <span><strong>${esc(s.title || 'YouTube video')}</strong><small>${s.notes.length} note${s.notes.length === 1 ? '' : 's'} · opened ${when(s.opened || s.added)}</small></span></button>
          <button class="x" data-fs-delstudy="${s.id}" aria-label="Remove from your film study">&times;</button></div>`).join('')}</div>`
        : '<p class="t-note">Nothing here yet. Paste a link above to start your first study.</p>'}`;
  }
  function fighterHtml(f){
    return `<div class="brand"><button class="eyebrow back-link" data-fs-lib>&larr; Film study</button></div>
      <h1>${esc(f.name)}</h1><p class="sub">Full fights from official channels. Tap one to watch it here and take notes.</p>
      <div class="fs-list">${f.fights.map((x, i) => { const s = studies.find(y => y.vid === x[1]);
        return `<div class="fs-card"><button class="fs-open" data-fs-fight="${i}"><img src="https://i.ytimg.com/vi/${x[1]}/mqdefault.jpg" alt="" loading="lazy">
          <span><strong>${esc(f.name)} vs ${esc(x[0])}</strong><small>${esc(x[2])}${s ? ' · ' + s.notes.length + ' note' + (s.notes.length === 1 ? '' : 's') : ''}</small></span></button></div>`; }).join('')}</div>`;
  }
  function studyHtml(st){
    // The video fills the screen, and the notes are a panel over the bottom of it, so the video is always behind what is being typed. The panel opens by itself when a note
    // is started and can be closed to watch the whole picture. The frame follows the visible screen (fitStage), so an on-screen keyboard lifts the panel instead of the page.
    return `<div class="fs-stage" id="fsStage">
      <div id="filmPlayerBox"><div id="filmPlayer"></div></div>
      <button class="fs-chip l" data-fs-lib>&larr; Film study</button>
      <button class="fs-chip r" data-fs-panel>Notes <span id="fsCount"></span></button>
      <p class="fs-err" id="fsErr" hidden></p>
      <div class="fs-panel" id="fsPanel">
        <div class="fs-ph"><span class="fs-ptitle" id="fsTitle">${esc(st.title || 'YouTube video')}</span><button class="btn small" id="fsAdd">+ Note at this moment</button><button class="fs-x" data-fs-panel aria-label="Close notes">&times;</button></div>
        <div class="fs-pb">
          <div id="filmDraft"></div><div id="filmNotes"></div>
          <h2 class="hr-h">Key takeaways</h2>
          <textarea id="fsTake" class="fs-take" rows="4" maxlength="2000" placeholder="What are the main things to take from this video?">${esc(st.takeaways || '')}</textarea>
          <div class="acts"><button class="btn ghost" data-fs-copy>Copy notes</button><a class="btn ghost" href="${watchUrl(st)}" target="_blank" rel="noopener">Open on YouTube</a></div>
        </div></div></div>`;
  }
  window.renderFilm = function(){
    const st = cur();
    document.documentElement.classList.toggle('fs-on', !!st);
    if(st){ ui.panel = false; $('filmBody').innerHTML = studyHtml(st); fitStage(); renderDraft(); renderNotes(); mount(st); }
    else { destroy(); ui.id = null; ui.draft = ui.editing = null; const f = fighters().find(x => x.name === ui.fighter); if(!f) ui.fighter = null; $('filmBody').innerHTML = f ? fighterHtml(f) : libraryHtml(); }
  };
  window.filmLeave = function(){ document.documentElement.classList.remove('fs-on'); saveLast(); destroy(); ui.id = null; ui.fighter = null; ui.draft = ui.editing = null; };   // called when another screen opens, so the video stops

  function open(id){ const st = studies.find(s => s.id === id); if(!st) return; st.opened = Date.now(); save(); ui.id = id; ui.draft = ui.editing = null; renderFilm(); window.scrollTo(0, 0); }
  function notesText(st){
    return 'Film study: ' + (st.title || 'YouTube video') + '\n' + watchUrl(st) + '\n\n'
      + (st.notes.length ? st.notes.map(n => `[${clock(n.t)}] ${n.text}  (${watchUrl(st, n.t)})`).join('\n') : 'No notes.')
      + (st.takeaways ? '\n\nKey takeaways:\n' + st.takeaways : '') + '\n';
  }
  async function copy(btn, text){
    try { await navigator.clipboard.writeText(text); } catch(e){ const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch(err){} a.remove(); }
    const was = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = was; }, 1500);
  }

  $('filmBody').addEventListener('submit', e => {
    if(e.target.id !== 'fsForm') return; e.preventDefault();
    const p = parseLink($('fsUrl').value);
    if(!p){ ui.msg = 'That doesn\'t look like a YouTube link. Copy it from the YouTube app or the address bar and paste it here.'; renderFilm(); return; }
    ui.msg = ''; let st = studies.find(s => s.vid === p.vid);   // the same video opens the study you already have
    if(!st){ st = {id:uid(), vid:p.vid, title:'', added:Date.now(), opened:Date.now(), last:p.start || 0, notes:[], takeaways:''}; studies.push(st); }
    else if(p.start) st.last = p.start;
    save(); open(st.id);
  });
  $('filmBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset, st = cur();
    if(b.id === 'fsAdd'){ setPanel(true); if(ui.draft){ $('fsText').focus({preventScroll:true}); return; } let t = 0, playing = false; try { t = ready ? player.getCurrentTime() : 0; playing = ready && player.getPlayerState() === 1; } catch(err){} openDraft(t, playing); $('fsText')?.focus({preventScroll:true}); }
    else if(d.fsNudge && ui.draft){ ui.draft.t = Math.max(0, ui.draft.t + +d.fsNudge); $('fsDt').textContent = clock(ui.draft.t); seek(ui.draft.t); }   // the box keeps what was typed
    else if('fsNow' in d && ui.draft){ ui.draft.t = Math.floor(nowTime()); $('fsDt').textContent = clock(ui.draft.t); }
    else if('fsCheck' in d && ui.draft){ seek(ui.draft.t); }
    else if('fsSave' in d) addNote();
    else if('fsCancel' in d){ ui.draft = ui.editing = null; renderDraft(); renderNotes(); }
    else if(d.fsSeek){ if(player && ready){ try { player.seekTo(Math.max(0, +d.fsSeek - BACK), true); player.playVideo(); } catch(err){} } setPanel(false); }   // close the panel to watch it
    else if('fsPanel' in d) setPanel(!ui.panel);
    else if(d.fsEdit){ setPanel(true); ui.editing = d.fsEdit; ui.draft = null; renderDraft(); renderNotes(); $('fsEditText')?.focus(); }
    else if(d.fsEditsave){ const n = st.notes.find(x => x.id === d.fsEditsave), v = ($('fsEditText').value || '').trim(); if(n && v){ n.text = v; save(); } ui.editing = null; renderNotes(); }
    else if(d.fsDel){ st.notes = st.notes.filter(x => x.id !== d.fsDel); save(); renderNotes(); }
    else if('fsCopy' in d) copy(b, notesText(st));
    else if('fsLib' in d){ window.filmLeave(); renderFilm(); window.scrollTo(0, 0); }
    else if(d.fsFighter){ ui.fighter = d.fsFighter; renderFilm(); window.scrollTo(0, 0); }
    else if(d.fsFight){ const f = fighters().find(x => x.name === ui.fighter), x = f && f.fights[+d.fsFight]; if(!x) return;
      let s = studies.find(y => y.vid === x[1]);   // a fight you have already studied reopens with your notes
      if(!s){ s = {id:uid(), vid:x[1], title:f.name + ' vs ' + x[0], fixed:true, added:Date.now(), opened:Date.now(), last:0, notes:[], takeaways:''}; studies.push(s); save(); }
      open(s.id); }
    else if(d.fsOpen) open(d.fsOpen);
    else if(d.fsDelstudy){ const s = studies.find(x => x.id === d.fsDelstudy); if(s && confirm('Remove "' + (s.title || 'this video') + '" and its ' + s.notes.length + ' note' + (s.notes.length === 1 ? '' : 's') + ' from your film study?')){ studies = studies.filter(x => x !== s); save(); renderFilm(); } }
    else if(d.section) show(d.section);
  });
  $('filmBody').addEventListener('input', e => { if(e.target.id === 'fsTake'){ const st = cur(); if(st){ st.takeaways = e.target.value; save(); } } });
  document.addEventListener('visibilitychange', () => { if(document.hidden) saveLast(); });

  // for the dashboard widget: a fight to suggest (it changes each day, or with "Another"), the study to carry on with, and a way to start one
  const allFights = () => fighters().flatMap(f => f.fights.map(x => ({name:f.name, opp:x[0], vid:x[1], ch:x[2]})));
  function featured(offset){ const all = allFights(); return all.length ? all[(Math.floor(Date.now() / 86400000) * 7 + (offset || 0) * 37) % all.length] : null; }
  const latest = () => studies.slice().sort((a, b) => (b.opened || 0) - (a.opened || 0))[0] || null;
  function startFight(p){
    let s = studies.find(y => y.vid === p.vid);
    if(!s){ s = {id:uid(), vid:p.vid, title:p.name + ' vs ' + p.opp, fixed:true, added:Date.now(), opened:Date.now(), last:0, notes:[], takeaways:''}; studies.push(s); }
    s.opened = Date.now(); save(); ui.id = s.id; ui.draft = ui.editing = null; show('film'); window.scrollTo(0, 0);
  }
  function openStudy(id){ if(!studies.some(s => s.id === id)) return; ui.id = id; ui.draft = ui.editing = null; show('film'); window.scrollTo(0, 0); }
  window.bfFilm = {get studies(){ return studies; }, parseLink, clock, fighters, featured, latest, startFight, openStudy};
  if(!$('film').hidden) renderFilm();
})();
