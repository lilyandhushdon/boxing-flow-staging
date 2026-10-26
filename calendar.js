/* Training calendar: plan sessions on days, with week and month views, pull in any way to train, tick sessions off, and export the plan to a
   phone calendar (.ics). The plan is saved on this device (localStorage). The saved events are plain JSON, so they map straight onto a database table
   when sign-in is added and the plan needs to follow the person across devices.
   An event: { id, date 'YYYY-MM-DD', time 'HH:MM' or '', type (a mode, or 'rest'), cfg (the choices, as in app.html?go=...), done, series }.
   This file loads after the main script and uses its functions (pickMode, applyParams, show, state and the workout lists). */
(function(){
  const KEY = 'bfPlan';
  let plan = []; try{ plan = JSON.parse(localStorage.getItem(KEY) || '[]') || []; }catch(e){}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(plan)); }catch(e){} };
  const pad = n => String(n).padStart(2,'0');
  const dkey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
  const addDays = (d,n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()+n); return x; };
  const weekStart = d => addDays(d, -((d.getDay()+6)%7));   // weeks start on Monday
  const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayName = k => fromKey(k).toLocaleDateString('en-NZ', {weekday:'long', day:'numeric', month:'long'});
  const timeL = t => { if(!t) return ''; const [h,m] = t.split(':').map(Number); return `${((h+11)%12)+1}:${pad(m)} ${h<12?'am':'pm'}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const X = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* ---------- every way to train, and the choices each one has ---------- */
  const optL = o => `${o.r} × ${o.m}-minute round${o.r>1?'s':''}`;
  // a session at the person's own gym: the app can't run it, so it is planned here and logged when it's done
  const GYM_KINDS = ['Boxing class', 'Sparring', 'Pad work', 'Bag work', 'Technique and drills', 'Strength and conditioning', 'Roadwork', 'Fight prep', 'Other'];
  const GYM_MINS = [30, 45, 60, 75, 90, 120], GYM_DEFAULT_MINS = 2;   // 60 minutes unless changed
  const gymMins = c => GYM_MINS[c && c.gm != null ? +c.gm : GYM_DEFAULT_MINS] || 60;
  const WAYS = [
    {id:'gym', area:'boxing', name:'Gym session', fields:()=>[{k:'gk', l:'What kind of session', o:GYM_KINDS}, {k:'gm', l:'How long', o:GYM_MINS.map(m => m + ' minutes')}, {k:'where', l:'Where, or who with (optional)', text:true, ph:'e.g. Eastside Boxing, Coach Mike'}]},
    {id:'coach', area:'boxing', name:'Coach workout', fields:()=>[{k:'focus', l:'Skills to work on', multi:true}, {k:'opt', l:'Rounds', o:OPTIONS.map(optL)}]},
    {id:'basic', area:'boxing', name:'Basic workout', fields:()=>[{k:'preset', l:'Workout', o:BASIC.map(w=>w.name)}, {k:'opt', l:'Rounds', o:OPTIONS.map(optL)}]},
    {id:'timer', area:'boxing', name:'Round timer', fields:()=>[{k:'opt', l:'Rounds', o:OPTIONS.map(optL)}]},
    {id:'scenario', area:'boxing', name:'Fight scenarios', fields:()=>[{k:'scen', l:'Opponent', o:SCENARIOS.map(s=>s.name)}, {k:'sopt', l:'Rounds', o:SCEN_OPTS.map(optL)}]},
    {id:'output', area:'boxing', name:'Output rounds', fields:()=>[{k:'out', l:'Target', o:OUTPUT.map(o=>`${o.name}, ${o.punches} punches`)}, {k:'oopt', l:'Rounds', o:OUT_OPTS.map(optL)}]},
    {id:'iq', area:'boxing', name:'Boxing IQ', fields:()=>[]},
    {id:'plyo', area:'sc', name:'Plyometrics', fields:()=>[{k:'plyo', l:'Workout', o:PLYO.map(w=>w.name)}, {k:'popt', l:'Rounds and timing', o:PLYO_OPTS.map(o=>`${o.r} rounds, ${o.w} sec on, ${o.rs} sec off`)}]},
    {id:'shoulder', area:'sc', name:'Shoulder conditioning', fields:c=>[{k:'shd', l:'Workout', o:SHOULDER.map(w=>w.name)}, {k:'shopt', l:'Rounds', o:(SHOULDER[+c.shd||0].opts||SHOULDER_OPTS).map(optL)}]},
    {id:'treadmill', area:'sc', name:'Treadmill intervals', fields:()=>[{k:'tm', l:'Workout', o:TREADMILL.map(w=>`${w.name}, ${w.mins} min`)}]},
    {id:'recovery', area:'sc', name:'Recovery', fields:()=>[{k:'rec', l:'Session', o:RECOVERY.map(w=>`${w.name}, ${w.mins} min`)}]},
    {id:'breath', area:'mind', name:'Box breathing', fields:()=>[]},
    {id:'reframe', area:'mind', name:'Cognitive reframing', fields:()=>[]},
    {id:'rest', area:'rest', name:'Rest day', fields:()=>[]}
  ];
  const AREAS = {boxing:'Boxing', sc:'Strength & conditioning', mind:'Mental skills', rest:'Rest'};
  const way = id => WAYS.find(w => w.id === id);
  const at = (arr,i) => arr[+i||0] || arr[0];
  // a person's own label first, then what the session is: "Heavy bag, jab and double jab · Round timer · 3 rounds of 3 min"
  function label(e){ const b = baseLabel(e), c = ((e && e.custom) || '').trim(); return c ? c + ' · ' + b : b; }
  function baseLabel(e){
    const c = e.cfg || {}, n = (way(e.type)||{}).name || e.type;
    switch(e.type){
      case 'coach': { const names = (c.focus&&c.focus.length ? c.focus : [...state.focus]).map(id=>(FOCUS.find(f=>f.id===id)||{}).name).filter(Boolean);
                      return n + (names.length ? ' · ' + names.slice(0,2).join(', ') + (names.length>2 ? ` +${names.length-2}` : '') : ''); }
      case 'gym': return n + ' · ' + at(GYM_KINDS, c.gk) + (c.where ? ' · ' + c.where : '') + ' · ' + gymMins(c) + ' min';
      case 'basic': return n + ' · ' + at(BASIC, c.preset).name;
      case 'scenario': return n + ' · ' + at(SCENARIOS, c.scen).name;
      case 'output': return n + ' · ' + at(OUTPUT, c.out).punches + ' punches';
      case 'plyo': return n + ' · ' + at(PLYO, c.plyo).name;
      case 'shoulder': return n + ' · ' + at(SHOULDER, c.shd).name;
      case 'treadmill': return n + ' · ' + at(TREADMILL, c.tm).name;
      case 'recovery': return n + ' · ' + at(RECOVERY, c.rec).name;
      case 'timer': return n + ' · ' + optL(at(OPTIONS, c.opt));
      default: return n;
    }
  }
  // the address that opens exactly this session in the app (the same form the landing page uses)
  function params(e){
    const p = new URLSearchParams({go: e.type === 'gym' ? 'calendar' : e.type}), c = e.cfg || {};   // a gym session has nothing to open in the app, so its link goes to the calendar
    if(c.focus && c.focus.length) p.set('focus', c.focus.join(','));
    ['opt','preset','scen','sopt','out','oopt','plyo','popt','shd','shopt','tm','rec'].forEach(k => { if(c[k] != null) p.set(k, c[k]); });
    return p;
  }

  /* ---------- the calendar ---------- */
  const cal = {view:'week', anchor:new Date(), sel:dkey(new Date())};
  const todayK = () => dkey(new Date());
  const byDay = k => plan.filter(e => e.date === k).sort((a,b) => (a.time||'99').localeCompare(b.time||'99'));
  function card(e){
    const w = way(e.type) || {};
    return `<div class="cs-wrap"><button class="cs-del" data-sdel="${e.id}" tabindex="-1" aria-label="Delete ${esc(label(e))}">Delete</button><div class="cs ${w.area||''} ${e.done?'is-done':''}">
      <button class="cs-main" data-open="${e.id}"><strong>${esc(label(e))}</strong><span>${[timeL(e.time), AREAS[w.area]||''].filter(Boolean).join(' · ')}</span></button>
      ${e.type==='rest' ? '' : `<button class="cs-tick" data-tick="${e.id}" aria-label="${e.done?'Mark not done':'Mark done'}">&#10003;</button>`}</div></div>`;
  }
  // the training camp's phase for a day, as a colour on the day's box, and a line saying which phases and sprints are on screen
  const phA = k => { const p = window.bfCamp && window.bfCamp.phaseOn(k); return p ? ` style="--ph:${p.color}"` : ''; };
  function phaseStrip(days){
    if(!window.bfCamp || !window.bfCamp.camp) return '';
    const seen = new Map();
    days.forEach(d => { const p = window.bfCamp.phaseOn(dkey(d)); if(p && !seen.has(p.sprint.id)) seen.set(p.sprint.id, p); });
    if(!seen.size) return '';
    const idx = p => p.phase.sprints.indexOf(p.sprint) + 1;
    return '<div class="cal-phases">' + [...seen.values()].map(p => `<span style="--c:${p.color}"><i></i>${p.name} · sprint ${idx(p)} · week ${p.week} of ${p.weeks}</span>`).join('') + '</div>';
  }
  window.renderCal = function(){
    $('calWeek').setAttribute('aria-pressed', cal.view==='week'); $('calMonth').setAttribute('aria-pressed', cal.view==='month');
    const a = cal.anchor; let html = '', title = '', days = [];
    if(cal.view === 'week'){
      const ws = weekStart(a); days = Array.from({length:7}, (_,i) => addDays(ws,i)); const end = days[6];
      title = `${ws.getDate()} ${MON[ws.getMonth()]} – ${end.getDate()} ${MON[end.getMonth()]} ${end.getFullYear()}`;
      html = '<div class="cw">' + days.map((d,i) => { const k = dkey(d), evs = byDay(k);
        return `<div class="cw-day ${k===todayK()?'today':''}" data-dropday="${k}"${phA(k)}><div class="cw-head"><div><b>${DOW[i]}</b><span>${d.getDate()} ${MON[d.getMonth()]}</span></div>
          <button data-add="${k}" aria-label="Add a session on ${dayName(k)}">+</button></div>${evs.length ? evs.map(card).join('') : '<div class="cw-empty">Nothing planned</div>'}</div>`; }).join('') + '</div>';
    } else {
      const first = new Date(a.getFullYear(), a.getMonth(), 1), start = weekStart(first);
      days = Array.from({length:42}, (_,i) => addDays(start,i));
      title = `${MONTH_LONG[a.getMonth()]} ${a.getFullYear()}`;
      html = '<div class="cal-month">' + DOW.map(d => `<div class="cal-dow">${d}</div>`).join('') + days.map(d => { const k = dkey(d), evs = byDay(k);
        return `<button class="cd ${d.getMonth()!==a.getMonth()?'out':''} ${k===todayK()?'today':''} ${k===cal.sel?'sel':''}" data-day="${k}" data-dropday="${k}"${phA(k)} aria-label="${dayName(k)}, ${evs.length} planned">
          <span>${d.getDate()}</span><span class="dots">${evs.slice(0,4).map(e => `<i class="${(way(e.type)||{}).area||''} ${e.done?'is-done':''}"></i>`).join('')}</span></button>`; }).join('') + '</div>'
        + `<div class="cal-day" data-dropday="${cal.sel}"><h3>${dayName(cal.sel)}<button data-add="${cal.sel}" aria-label="Add a session">+</button></h3>${byDay(cal.sel).map(card).join('') || '<div class="cw-empty">Nothing planned</div>'}</div>`;
    }
    const inView = plan.filter(e => e.type!=='rest' && days.some(d => dkey(d) === e.date && (cal.view==='week' || d.getMonth()===a.getMonth())));
    $('calTitle').innerHTML = `${title}<small>${inView.filter(e=>e.done).length} of ${inView.length} done</small>`;
    $('calBody').innerHTML = phaseStrip(days) + html;
  };
  const move = n => { const a = cal.anchor; cal.anchor = cal.view==='week' ? addDays(a, 7*n) : new Date(a.getFullYear(), a.getMonth()+n, 1); if(cal.view==='month') cal.sel = dkey(cal.anchor); renderCal(); };
  $('calWeek').onclick = () => { cal.view = 'week'; cal.anchor = fromKey(cal.sel); renderCal(); };
  $('calMonth').onclick = () => { cal.view = 'month'; cal.anchor = fromKey(cal.sel); renderCal(); };
  $('calPrev').onclick = () => move(-1); $('calNext').onclick = () => move(1);
  $('calToday').onclick = () => { cal.anchor = new Date(); cal.sel = todayK(); renderCal(); };
  $('calAdd').onclick = () => openAdd(cal.sel);
  $('calBody').addEventListener('click', e => {
    const del = e.target.closest('[data-sdel]');
    if(del){ plan = plan.filter(x => x.id !== del.dataset.sdel); save(); renderCal(); $('calSub').textContent = 'Session deleted.'; return; }
    const open = $('calBody').querySelector('.cs.swiped');
    if(open && e.target.closest('.cs') === open){ open.classList.remove('swiped'); return; }   // a tap on a swiped card just closes it
    const t = e.target.closest('[data-day],[data-add],[data-open],[data-tick]'); if(!t) return;
    if(t.dataset.day){ cal.sel = t.dataset.day; if(fromKey(cal.sel).getMonth() !== cal.anchor.getMonth()) cal.anchor = fromKey(cal.sel); renderCal(); }
    else if(t.dataset.add){ cal.sel = t.dataset.add; openAdd(t.dataset.add); }
    else if(t.dataset.open) openEvent(t.dataset.open);
    else if(t.dataset.tick){ const ev = plan.find(x => x.id === t.dataset.tick); if(ev){ if(ev.type === 'gym' && !ev.done) sessionDone({type:'gym', planId:ev.id, minutes:gymMins(ev.cfg)}); else { ev.done = !ev.done; save(); } renderCal(); } }
  });

  // swipe a session to the left to show Delete, the way a phone list works; swipe back or tap it to close
  (() => {
    const body = $('calBody'), W = 88;
    let sw = null, swipedAt = -1e9;
    const closeAll = except => body.querySelectorAll('.cs.swiped').forEach(c => { if(c !== except) c.classList.remove('swiped'); });
    body.addEventListener('pointerdown', e => {
      const c = e.target.closest('.cs'); if(!c || e.target.closest('.cs-tick') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      closeAll(c);
      sw = {c, id:e.pointerId, x:e.clientX, y:e.clientY, base:c.classList.contains('swiped') ? -W : 0, on:false, off:0};
    });
    body.addEventListener('pointermove', e => {
      if(!sw || e.pointerId !== sw.id) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if(!sw.on){
        if(Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5){ sw.on = true; sw.c.classList.add('swiping'); try { sw.c.setPointerCapture(e.pointerId); } catch(x){} }
        else if(Math.abs(dy) > 10){ sw = null; return; }   // they are scrolling
        else return;
      }
      sw.off = Math.max(-W - 12, Math.min(0, sw.base + dx)); sw.c.style.transform = 'translateX(' + sw.off + 'px)';
    });
    const finish = e => {
      if(!sw || e.pointerId !== sw.id) return;
      const {c, on, off} = sw; sw = null;
      if(!on) return;
      c.classList.remove('swiping'); c.style.transform = ''; c.classList.toggle('swiped', off < -W / 2); swipedAt = performance.now();
    };
    body.addEventListener('pointerup', finish); body.addEventListener('pointercancel', finish);
    body.addEventListener('click', e => { if(performance.now() - swipedAt < 350){ e.stopPropagation(); e.preventDefault(); } }, true);   // letting go after a swipe is not a tap
  })();

  // press and hold a session, then drop it on another day to move it
  window.holdDrag($('calBody'), {item:'.cs', target:'[data-dropday]', onDrop:(item, day) => {
    const id = item.querySelector('[data-open]')?.dataset.open, ev = plan.find(x => x.id === id), k = day.dataset.dropday;
    if(!ev || !k || ev.date === k) return;
    ev.date = k; save(); cal.sel = k; renderCal();
    $('calSub').textContent = 'Moved to ' + dayName(k) + '.';
  }});

  /* ---------- the sheet: add, edit and open a session ---------- */
  const sh = $('calSheet'), scrim = $('sheetScrim');
  const openSheet = html => { sh.innerHTML = html; sh.classList.add('open'); scrim.classList.add('open'); sh.setAttribute('aria-hidden','false'); sh.scrollTop = 0; document.body.style.overflow = 'hidden'; };
  const closeSheet = () => { sh.classList.remove('open'); scrim.classList.remove('open'); sh.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; };
  scrim.addEventListener('click', e => { if(sh.classList.contains('open')) closeSheet(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape' && sh.classList.contains('open')) closeSheet(); });
  const head = (t, sub) => `<div class="sheet-head"><div><h2>${t}</h2>${sub?`<p class="sub">${sub}</p>`:''}</div><button class="sheet-x" data-close aria-label="Close">${X}</button></div>`;

  let draft = null;
  function openAdd(k){
    draft = {id:null, date:k, time:'', type:null, cfg:{}, repeat:0};
    openSheet(head('Add a session', dayName(k) + '. Pick a way to train.') + ['boxing','sc','mind','rest'].map(g =>
      `<div class="grp">${AREAS[g]}</div>` + WAYS.filter(w => w.area===g).map(w => `<button class="pick" data-way="${w.id}">${w.name}</button>`).join('')).join(''));
  }
  function defaults(type){
    const c = {};
    if(type === 'coach'){ c.focus = [...state.focus]; c.opt = state.opt; }
    else way(type).fields({}).forEach(f => { if(f.o) c[f.k] = 0; });
    if(type === 'gym') c.gm = GYM_DEFAULT_MINS;
    return c;
  }
  function openForm(){
    const w = way(draft.type), fields = w.fields(draft.cfg);
    openSheet(head(draft.id ? 'Edit session' : w.name, draft.id ? w.name : dayName(draft.date)) + fields.map(f => f.multi
      ? `<label>${f.l}</label><div class="chips">${FOCUS.map(x => `<button type="button" data-chip="${x.id}" aria-pressed="${(draft.cfg.focus||[]).includes(x.id)}">${x.name}</button>`).join('')}</div>`
      : f.text ? `<label>${f.l}<input type="text" data-ft="${f.k}" maxlength="60" autocomplete="off" value="${esc(draft.cfg[f.k] || '')}" placeholder="${esc(f.ph || '')}"></label>`
      : `<label>${f.l}<select data-f="${f.k}">${f.o.map((o,i) => `<option value="${i}" ${(+draft.cfg[f.k]||0)===i?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`).join('')
      + `<label>Label (optional)<input type="text" data-custom maxlength="60" autocomplete="off" value="${esc(draft.custom || '')}" placeholder="${draft.type === 'gym' ? 'e.g. Tuesday sparring, Friday pads' : 'e.g. Heavy bag, jab and double jab'}"></label>`
      + `<div class="two"><label>Day<input type="date" data-date value="${draft.date}"></label><label>Time (optional)<input type="time" data-time value="${draft.time||''}"></label></div>`
      + (draft.id ? '' : `<label>Repeat<select data-repeat><option value="0">Just this once</option><option value="4">Every week for 4 weeks</option><option value="8">Every week for 8 weeks</option><option value="12">Every week for 12 weeks</option></select></label>`)
      + `<label>Notes (optional)<textarea data-notes rows="3" maxlength="1000" placeholder="What to work on, or how it went">${esc(draft.notes || '')}</textarea></label>`
      + `<div class="acts"><button class="btn" data-save>${draft.id ? 'Save' : 'Add to calendar'}</button><button class="btn ghost" data-close>Cancel</button></div>`);
  }
  function openEvent(id){
    const ev = plan.find(x => x.id === id); if(!ev) return;
    const w = way(ev.type) || {};
    openSheet(head(esc(label(ev)), `${dayName(ev.date)}${ev.time ? ' at ' + timeL(ev.time) : ''}`)
      + (ev.notes ? `<p class="ev-notes">${esc(ev.notes)}</p>` : '')
      + `<div class="acts">${ev.type==='rest' ? '' : `<button class="btn" data-start="${ev.id}" ${ev.type==='gym' && ev.done ? 'disabled' : ''}>${ev.type==='gym' ? (ev.done ? 'Logged' : 'Log it as done') : 'Start this session'}</button>`}
         ${ev.type==='rest' ? '' : `<button class="btn ghost" data-toggle="${ev.id}">${ev.done ? 'Mark not done' : 'Mark done'}</button>`}
         <button class="btn ghost" data-edit="${ev.id}">Edit</button></div>
         <div class="acts"><button class="btn ghost danger" data-del="${ev.id}">Delete</button>${ev.series ? `<button class="btn ghost danger" data-delall="${ev.id}">Delete the whole series</button>` : ''}</div>`);
  }
  function startPlan(ev){
    if(ev.type === 'gym'){ closeSheet(); if(!ev.done){ sessionDone({type:'gym', planId:ev.id, minutes:gymMins(ev.cfg)}); renderCal(); } return; }   // nothing to run: finishing it is logging it
    closeSheet(); planCtx.id = ev.id; applyParams(params(ev));
    if(ev.type === 'breath') openBreath(); else if(ev.type === 'reframe') openReframe(); else pickMode(ev.type);
    state.label = ev.custom || ''; const sl = document.getElementById('sessLabel'); if(sl) sl.value = state.label;
  }
  sh.addEventListener('click', e => {
    const t = e.target.closest('button'); if(!t) return;
    const d = t.dataset;
    if('close' in d) return closeSheet();
    if(d.way){ draft.type = d.way; draft.cfg = defaults(d.way); return openForm(); }
    if(d.chip){ const s = new Set(draft.cfg.focus || []); s.has(d.chip) ? s.delete(d.chip) : s.add(d.chip); draft.cfg.focus = [...s]; t.setAttribute('aria-pressed', s.has(d.chip)); return; }
    if('save' in d){
      if(draft.type === 'coach' && !(draft.cfg.focus||[]).length){ draft.cfg.focus = [...state.focus]; }
      if(draft.id){ const ev = plan.find(x => x.id === draft.id); if(ev) Object.assign(ev, {date:draft.date, time:draft.time, type:draft.type, cfg:draft.cfg, custom:(draft.custom || '').trim(), notes:(draft.notes || '').trim()}); }
      else {
        const weeks = draft.repeat || 1, series = weeks > 1 ? uid() : undefined;
        for(let i = 0; i < weeks; i++) plan.push({id:uid(), date:dkey(addDays(fromKey(draft.date), 7*i)), time:draft.time, type:draft.type, cfg:JSON.parse(JSON.stringify(draft.cfg)), custom:(draft.custom || '').trim(), notes:(draft.notes || '').trim(), done:false, series});
      }
      save(); cal.sel = draft.date; cal.anchor = fromKey(draft.date); closeSheet(); return renderCal();
    }
    if(d.start){ const ev = plan.find(x => x.id === d.start); if(ev) startPlan(ev); return; }
    if(d.toggle){ const ev = plan.find(x => x.id === d.toggle); if(ev){ if(ev.type === 'gym' && !ev.done) sessionDone({type:'gym', planId:ev.id, minutes:gymMins(ev.cfg)}); else { ev.done = !ev.done; save(); } closeSheet(); renderCal(); } return; }
    if(d.edit){ const ev = plan.find(x => x.id === d.edit); if(ev){ draft = {id:ev.id, date:ev.date, time:ev.time||'', type:ev.type, cfg:JSON.parse(JSON.stringify(ev.cfg||{})), custom:ev.custom||'', notes:ev.notes||'', repeat:0}; openForm(); } return; }
    if(d.del){ plan = plan.filter(x => x.id !== d.del); save(); closeSheet(); return renderCal(); }
    if(d.delall){ const ev = plan.find(x => x.id === d.delall); if(ev){ plan = plan.filter(x => x.series !== ev.series); save(); } closeSheet(); return renderCal(); }
  });
  sh.addEventListener('change', e => {
    const t = e.target;
    if(t.dataset.f){ draft.cfg[t.dataset.f] = +t.value; if(t.dataset.f === 'shd') draft.cfg.shopt = 0; if(t.dataset.f === 'shd') openForm(); }
    else if('date' in t.dataset){ if(t.value) draft.date = t.value; }
    else if('time' in t.dataset) draft.time = t.value;
    else if('repeat' in t.dataset) draft.repeat = +t.value;
  });
  sh.addEventListener('input', e => { const t = e.target; if('ft' in t.dataset) draft.cfg[t.dataset.ft] = t.value; else if('custom' in t.dataset) draft.custom = t.value; else if('notes' in t.dataset) draft.notes = t.value; });

  /* ---------- finishing a session: tick it off if it was planned, and put it in the activity log (home.js) ---------- */
  const cfgNow = type => ({
    coach: () => ({focus:[...state.focus], opt:state.opt}), basic: () => ({preset:state.preset, opt:state.opt}), timer: () => ({opt:state.opt}),
    scenario: () => ({scen:state.scen, sopt:state.sopt}), output: () => ({out:state.out, oopt:state.oopt}),
    plyo: () => ({plyo:state.plyo, popt:state.popt}), shoulder: () => ({shd:state.shd, shopt:state.shopt}), treadmill: () => ({tm:state.tm}), recovery: () => ({rec:state.rec})
  }[type] || (() => ({})))();
  window.sessionDone = info => {
    const pid = (info && info.planId) || planCtx.id, custom = ((info && info.label) || '').trim(), notes = ((info && info.notes) || '').trim();
    let ev = plan.find(x => x.id === pid), type = (info && info.type) || mode, cfg;
    if(ev){ type = ev.type; cfg = ev.cfg; }
    else {
      cfg = cfgNow(type);
      // not started from the calendar: if this kind of session is planned for today and not done yet, this is it (the exact same choices first)
      const open = plan.filter(x => x.date === todayK() && x.type === type && !x.done); ev = open.find(x => JSON.stringify(x.cfg || {}) === JSON.stringify(cfg)) || open[0];
    }
    if(ev){ ev.done = true; if(custom) ev.custom = custom; if(notes) ev.notes = notes; save(); }
    window.logSession?.({id:uid(), date:todayK(), ts:Date.now(), type, cfg, custom, notes, label:label({type, cfg, custom}), minutes:(info && info.minutes) || 0});
    if(planCtx.id === pid) planCtx.id = null;
    window.renderToday?.();   // the dashboard is up to date the moment a session ends, not only when it is next opened
  };
  // shared with the Today screen
  const openDay = (k, view) => { cal.sel = k; cal.anchor = fromKey(k); if(view) cal.view = view; show('cal'); };
  window.bfCal = {get plan(){ return plan; }, dkey, fromKey, addDays, weekStart, label, way, WAYS, DOW, MON, defaults, params, optL, timeL,
    dayLabel: k => fromKey(k).toLocaleDateString('en-NZ', {weekday:'short', day:'numeric', month:'short'}), start:startPlan, openDay, addFor:k => { openDay(k); openAdd(k); }};

  /* ---------- export to a phone calendar ---------- */
  const esc2 = s => String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const fold = l => { const out = []; while(l.length > 74){ out.push(l.slice(0,74)); l = ' ' + l.slice(74); } out.push(l); return out; };
  function ics(){
    const from = todayK(), list = plan.filter(e => e.date >= from && e.type !== 'rest');
    if(!list.length) return null;
    const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, 'app.html');
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Boxing Flow//Training calendar//EN','CALSCALE:GREGORIAN'];
    list.forEach(e => {
      const url = base + '?' + params(e).toString(), ymd = e.date.replace(/-/g,'');
      L.push('BEGIN:VEVENT', `UID:${e.id}@boxingflow`, `DTSTAMP:${stamp}`);
      if(e.time){
        const [h,m] = e.time.split(':').map(Number), end = new Date(2000,0,1,h,m+(e.type === 'gym' ? gymMins(e.cfg) : 45));
        L.push(`DTSTART:${ymd}T${pad(h)}${pad(m)}00`, `DTEND:${ymd}T${pad(end.getHours())}${pad(end.getMinutes())}00`);
      } else L.push(`DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${dkey(addDays(fromKey(e.date),1)).replace(/-/g,'')}`);
      L.push(`SUMMARY:${esc2('Boxing Flow: ' + label(e))}`, `DESCRIPTION:${esc2('Open it in Boxing Flow: ' + url)}`, `URL:${url}`);
      if(e.time) L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Training time','TRIGGER:-PT30M','END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.flatMap(fold).join('\r\n') + '\r\n';
  }
  $('calExport').onclick = () => {
    const text = ics();
    if(!text){ $('calSub').textContent = 'Add a session first, then you can send it to your phone calendar.'; return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'text/calendar'})); a.download = 'boxing-flow-training.ics';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    $('calSub').textContent = 'Downloaded. Open the file to add your upcoming sessions to your phone calendar.';
  };
  if(!$('cal').hidden) renderCal();
})();
