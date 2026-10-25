/* The Today screen: the app's home. A set of widgets, built to bring people back: today's session, a one-tap coach workout, a mini month calendar,
   the week with its ticks, the streak and a weekly goal, a suggestion that fits what they have and haven't done lately, and the last few sessions
   to do again. Press and hold a widget to pick it up and drop it on another to swap places; the order is remembered.
   Everything is worked out from two things saved on this device: the calendar plan (calendar.js) and an activity log, one entry for every session
   finished. Both are plain JSON, so they can move to a database when sign-in is added. This file loads after calendar.js and drag.js.
   A log entry: { id, date 'YYYY-MM-DD', ts, type (a mode id), cfg (the choices, as the calendar saves them), label, minutes }. */
(function(){
  const C = window.bfCal, LKEY = 'bfLog', GKEY = 'bfGoal', OKEY = 'bfWidgets';
  const DEFAULT_ORDER = ['today','camp','nutri','quick','live','film','minical','week','progress','suggest','recent','explore'];
  let log = []; try{ log = JSON.parse(localStorage.getItem(LKEY) || '[]') || []; }catch(e){}
  let goal = 3; try{ goal = Math.min(7, Math.max(1, +localStorage.getItem(GKEY) || 3)); }catch(e){}
  let saved = []; try{ saved = JSON.parse(localStorage.getItem(OKEY) || '[]') || []; }catch(e){}
  const saveLog = () => { try{ localStorage.setItem(LKEY, JSON.stringify(log.slice(-500))); }catch(e){} };
  const todayK = () => C.dkey(new Date());

  window.logSession = e => { log.push(e); saveLog(); };

  /* ---------- what the log says ---------- */
  const daysWithSessions = () => new Set(log.map(e => e.date));
  function streak(){
    // consecutive days with a session, counted back from today (or from yesterday, so today isn't lost until it ends)
    const days = daysWithSessions(); let d = new Date(); if(!days.has(C.dkey(d))) d = C.addDays(d, -1);
    let n = 0; while(days.has(C.dkey(d))){ n++; d = C.addDays(d, -1); }
    return n;
  }
  const weekDays = () => { const ws = C.weekStart(new Date()); return Array.from({length:7}, (_,i) => C.addDays(ws, i)); };
  function weekStats(){
    const keys = new Set(weekDays().map(C.dkey)), inWeek = log.filter(e => keys.has(e.date));
    return {sessions: inWeek.length, minutes: inWeek.reduce((n,e) => n + (e.minutes||0), 0)};
  }
  const lastCfg = type => { for(let i = log.length - 1; i >= 0; i--) if(log[i].type === type) return log[i].cfg || {}; return null; };
  const lastDone = type => { for(let i = log.length - 1; i >= 0; i--) if(log[i].type === type) return log[i].ts; return 0; };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  const when = k => { if(k === todayK()) return 'Today'; if(k === C.dkey(C.addDays(new Date(), -1))) return 'Yesterday'; return C.dayLabel(k); };

  /* ---------- starting things ---------- */
  const startSession = (type, cfg) => C.start({type, cfg: cfg || C.defaults(type)});
  const quickCfg = () => lastCfg('coach') || {focus:['jab','speed','power'], opt:0};
  function quickCoach(){ applyParams(C.params({type:'coach', cfg:quickCfg()})); pickMode('coach'); start(); }   // straight into the coach workout, no setup screen

  /* ---------- a suggestion that fits what they have and haven't done ---------- */
  const AREA_MODES = {boxing:['coach','basic','timer','scenario','output','iq'], sc:['plyo','shoulder'], mind:['breath','reframe']};
  function suggestions(){
    const out = [], now = Date.now(), t = todayK(), planned = C.plan.some(e => e.date === t && e.type !== 'rest' && !e.done);
    const doneToday = daysWithSessions().has(t), s = streak();
    if(s > 0 && !doneToday && !planned) out.push({title:`Keep your ${s}-day streak`, text:'Any session counts, even two minutes of box breathing.', type:'breath', cfg:{}, quick:true});
    // the area they have done least in the last two weeks, then the way to train in it they have done least recently
    const recent = log.filter(e => now - e.ts < 14*86400000), area = k => (C.way(k)||{}).area;
    const counts = Object.fromEntries(Object.keys(AREA_MODES).map(a => [a, recent.filter(e => area(e.type) === a).length]));
    const order = Object.keys(AREA_MODES).sort((a,b) => counts[a] - counts[b] || Math.min(...AREA_MODES[a].map(lastDone)) - Math.min(...AREA_MODES[b].map(lastDone)));
    const a = order[0], type = [...AREA_MODES[a]].sort((x,y) => lastDone(x) - lastDone(y))[0];
    const cfg = lastCfg(type) || C.defaults(type), ev = {type, cfg}, nice = {boxing:'boxing', sc:'strength and conditioning', mind:'mental skills'}[a];
    out.push({title: counts[a] === 0 && log.length ? `Nothing in ${nice} for two weeks` : 'Suggested for you', text: C.label(ev), type, cfg});
    return out.slice(0, 2);
  }

  /* ---------- the mini month calendar ---------- */
  function miniCal(){
    const now = new Date(), first = new Date(now.getFullYear(), now.getMonth(), 1), start = C.weekStart(first), t = todayK();
    const days = Array.from({length:42}, (_,i) => C.addDays(start, i));
    const cells = days.map(d => { const k = C.dkey(d), evs = C.plan.filter(e => e.date === k), logged = log.some(e => e.date === k);
      const dots = evs.slice(0,3).map(e => `<i class="${(C.way(e.type)||{}).area||''} ${e.done?'is-done':''}"></i>`).join('') + (logged && !evs.length ? '<i class="is-done on"></i>' : '');
      const ph = window.bfCamp && window.bfCamp.phaseOn(k);
      return `<span class="mc-d ${d.getMonth()!==now.getMonth()?'out':''} ${k===t?'today':''} ${ph?'ph':''}"${ph ? ` style="--ph:${ph.color}"` : ''}><b>${d.getDate()}</b><span class="dots">${dots}</span></span>`; }).join('');
    return `<div class="mc-top"><span>${now.toLocaleDateString('en-NZ', {month:'long', year:'numeric'})}</span><span class="mc-go">Open &rsaquo;</span></div>
      <div class="mc">${C.DOW.map(d => `<span class="mc-w">${d[0]}</span>`).join('')}${cells}</div>`;
  }

  /* ---------- the widgets ---------- */
  // Each widget is an element made once and kept: its contents are refreshed in place and its place on screen is set with the CSS `order`.
  // So swapping two widgets moves nothing in the page, and the live preview inside the quick-start widget never has to reload.
  const chev = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  function widgets(){
    const t = todayK(), planned = C.plan.filter(e => e.date === t && e.type !== 'rest').sort((a,b) => (a.time||'99').localeCompare(b.time||'99'));
    const open = planned.filter(e => !e.done), ws = weekStats(), q = quickCfg();
    const qNames = (q.focus||[]).map(id => (FOCUS.find(f => f.id === id)||{}).name).filter(Boolean);
    const upcoming = C.plan.filter(e => e.date > t && e.type !== 'rest').sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')))[0];
    const W = {};

    W.today = {cls:'hero', html:`<h2>Today</h2>` + (open.length
      ? open.slice(0,2).map(e => `<div class="t-item"><div><strong>${esc(C.label(e))}</strong><span>${e.time ? C.timeL(e.time) : 'Planned for today'}</span></div><button class="btn small" data-start-plan="${e.id}">Start</button></div>`).join('') + (open.length > 2 ? `<p class="t-note">+ ${open.length - 2} more today</p>` : '')
      : planned.length
        ? `<p class="t-big">Today's done. Nice work.</p>` + (upcoming ? `<p class="t-note">Next up: ${C.dayLabel(upcoming.date)}, ${esc(C.label(upcoming))}</p>` : `<p class="t-note">Plan your next session to keep the run going.</p>`)
        : `<p class="t-big">Nothing planned today.</p><p class="t-note">${upcoming ? `Next up: ${C.dayLabel(upcoming.date)}, ${esc(C.label(upcoming))}` : 'Pick a session, or plan your week.'}</p><div class="t-row"><button class="btn small ghost" data-plan-today>Plan a session</button></div>`)};

    // the training camp: where they are in it, the two-week goal, and the next open tasks, ticked off right here
    W.camp = (() => {
      const B = window.bfCamp, cur = B && B.current(), open = '<button class="linkbtn" data-camp-open>Open camp &rsaquo;</button>';
      if(!cur) return {cls:'campw', html:`<h2>Training camp</h2><p class="t-big">Plan your fight camp</p><p class="t-note">An 8-week camp to start, or choose 6, 10 or 12. Two weeks at a time, each with a goal and things to work on.</p><div class="t-row"><button class="btn small" data-camp-open>Set up a camp</button></div>`};
      if(cur.state === 'upcoming') return {cls:'campw', html:`<div class="q-top"><h2>Training camp</h2>${open}</div><p class="t-big">${cur.days === 1 ? 'Starts tomorrow' : `Starts in ${cur.days} days`}</p><p class="t-note">${cur.camp.weeks} weeks to your fight on ${C.dayLabel(cur.camp.fight)}.</p>`};
      if(cur.state === 'finished') return {cls:'campw', html:`<div class="q-top"><h2>Training camp</h2>${open}</div><p class="t-big">Camp finished</p><p class="t-note">Start a new one when you have your next fight.</p>`};
      const tasks = cur.sprint.tasks, c = B.counts(tasks), todo = tasks.filter(t => !B.taskDone(t)).slice(0, 3), pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      return {cls:'campw', html:`<div class="q-top"><h2>Training camp</h2>${open}</div>
        <p class="t-note"><b style="color:${cur.color}">${cur.name}</b> · week ${cur.week} of ${cur.weeks} · ${cur.days} days to fight</p>
        <p class="t-note">Your focus for the next 2 weeks</p><p class="t-big" style="font-size:20px">${esc(cur.sprint.goal)}</p>
        <div class="goal-bar"><i style="width:${pct}%"></i></div><p class="t-note">${c.done} of ${c.total} focus tasks done</p><p class="t-note"><button class="linkbtn" data-camp-info>What's this?</button></p>${cur.camp.auto ? `<p class="t-note">Starter ${cur.camp.weeks}-week camp. Open it to set your fight date or change the length.</p>` : ''}
        ${todo.map(t => `<div class="sb"><button class="ck" data-camp-task="${t.id}" aria-label="Mark done">&#10003;</button><span>${esc(t.t)}</span></div>`).join('') || '<p class="t-note">Everything in this two-week focus is done.</p>'}`};
    })();

    W.quick = {cls:'quick', html:`<p class="t-big">${esc(qNames.slice(0,3).join(', ') || 'Jab technique')}</p>
      <p class="t-note">${C.optL(OPTIONS[q.opt||0])}, with the 3D coach. Starts straight away.</p>
      <div class="t-row"><button class="btn small" data-quick>Start now</button></div>`};

    // nutrition: calories left today and the macros, or a prompt to sign in. The numbers come from window.bfNutri, which keeps the last ones so this paints at once.
    if(window.bfNutri){
      const ns = window.bfNutri.summary(), head = '<div class="q-top"><h2>Nutrition</h2><button class="linkbtn" data-nutri-open>Open &rsaquo;</button></div>', kj = ns.unit === 'kj', e = k => (kj ? Math.round(k * 4.184) : Math.round(k)).toLocaleString(), u = kj ? 'kJ' : 'kcal';
      const mac = (l, v, m, c) => `<div class="nu-macro"><span>${l}</span><div class="nu-bar ${c}"><i style="width:${m ? Math.min(100, v / m * 100) : 0}%"></i></div><small>${Math.round(v)}${m ? ' / ' + m : ''} g</small></div>`;
      W.nutri = {cls:'nutriw', html: ns.state === 'out'
        ? `${head}<p class="t-big" style="font-size:20px">Track your food</p><p class="t-note">Log meals, see your calories and macros, and keep your food diary saved to your account.</p><div class="t-row"><button class="btn small" data-nutri-open>Sign in to start</button></div>`
        : ns.state === 'wait' ? `${head}<p class="t-note">Loading…</p>`
        : `${head}${ns.target ? `<div class="nu-left ${ns.kcal > ns.target.kcal ? 'over' : ''}"><b>${e(Math.abs(ns.target.kcal - ns.kcal))}</b><span>${u} ${ns.kcal > ns.target.kcal ? 'over' : 'left today'}</span></div><div class="nu-bar ${ns.kcal > ns.target.kcal ? 'over' : ''}"><i style="width:${Math.min(100, ns.kcal / ns.target.kcal * 100)}%"></i></div>`
            : `<div class="nu-left"><b>${e(ns.kcal)}</b><span>${u} eaten today</span></div><p class="t-note"><button class="linkbtn" data-nutri-open>Set your daily targets</button> to see what is left.</p>`}
          <div class="nu-macros">${mac('Protein', ns.protein, ns.target && ns.target.protein, 'p')}${mac('Carbs', ns.carbs, ns.target && ns.target.carbs, 'c')}${mac('Fat', ns.fat, ns.target && ns.target.fat, 'f')}</div>
          <div class="t-row"><button class="btn small" data-nutri-add>Add food</button></div>`};
    }

    // film study: a fight to watch (a new one each day, or tap Another), and the study they were last in
    const FB = window.bfFilm; filmPick = FB && FB.featured(filmOffset); const lastStudy = FB && FB.latest();
    if(filmPick) W.film = {cls:'filmw', html:`<div class="q-top"><h2>Film study</h2><button class="linkbtn" data-film-open>Open &rsaquo;</button></div>
      <div class="fw-row"><button class="fw-thumb" data-film-fight aria-label="Watch ${esc(filmPick.name)} vs ${esc(filmPick.opp)}"><img src="https://i.ytimg.com/vi/${filmPick.vid}/mqdefault.jpg" alt="" loading="lazy"><span class="fw-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></button>
        <div class="fw-info"><p class="t-note">Fight to study</p><p class="t-big" style="font-size:18px">${esc(filmPick.name)} vs ${esc(filmPick.opp)}</p><p class="t-note">${esc(filmPick.ch)} · full fight</p></div></div>
      <div class="t-row"><button class="btn small" data-film-fight>Watch and take notes</button><button class="btn small ghost" data-film-next>Another fight</button></div>
      ${lastStudy ? `<p class="t-note">Carry on: <button class="linkbtn" data-film-cont="${lastStudy.id}">${esc(lastStudy.title || 'YouTube video')}</button>${lastStudy.notes.length ? ` · ${lastStudy.notes.length} note${lastStudy.notes.length === 1 ? '' : 's'}` : ''}</p>` : ''}`};

    W.live = {cls:'live', html:''};   // made once in ensureDom, so the stream never reloads when the dashboard refreshes

    W.minical = {cls:'mini', html:`<h2>Calendar</h2>${miniCal()}`};

    W.week = {cls:'', html:`<h2>This week</h2><div class="wk">${weekDays().map((d,i) => { const k = C.dkey(d), p = C.plan.filter(e => e.date === k && e.type !== 'rest'), l = log.filter(e => e.date === k).length, doneP = p.filter(e => e.done).length;
      const st = l || doneP ? 'is-done' : p.length ? 'planned' : '';
      return `<button class="wk-d ${st} ${k===t?'today':''}" data-day="${k}" aria-label="${C.dayLabel(k)}: ${l||doneP} done, ${p.length} planned"><small>${C.DOW[i]}</small><b>${d.getDate()}</b><i></i></button>`; }).join('')}</div>
      <div class="t-row"><button class="btn small ghost" data-open-cal>Open calendar</button><button class="btn small ghost" data-plan-today>Add a session</button></div>`};

    const pct = Math.min(100, Math.round(ws.sessions / goal * 100));
    W.progress = {cls:'', html:`<h2>Progress</h2><div class="stats3"><div><b>${ws.sessions}</b><span>sessions this week</span></div><div><b>${ws.minutes}</b><span>minutes this week</span></div><div><b>${log.length}</b><span>sessions in total</span></div></div>
      <div class="goal"><div class="goal-bar"><i style="width:${pct}%"></i></div><div class="goal-row"><span>${ws.sessions >= goal ? 'Weekly goal hit. Keep going.' : `${goal - ws.sessions} to reach your goal`}</span><button data-goal>Goal: ${goal} a week</button></div></div>
      ${log.length ? '' : '<p class="t-note">Finish your first session to start your streak.</p>'}`};

    W.suggest = {cls:'suggest', html:`<h2>Suggested for you</h2>${suggestions().map((g,i) => `<div class="t-item"><div><strong>${esc(g.title)}</strong><span>${esc(g.text)}</span></div><button class="btn small" data-suggest="${i}">${g.quick ? 'Quick one' : 'Start'}</button></div>`).join('')}`};

    const recent = log.slice(-3).reverse();
    if(recent.length) W.recent = {cls:'', html:`<h2>Do it again</h2>${recent.map((e,i) => `<div class="t-item"><div><strong>${esc(e.label)}</strong><span>${when(e.date)} · ${e.minutes||'?'} min</span></div><button class="btn small ghost" data-again="${log.length-1-i}">Again</button></div>`).join('')}`};

    W.explore = {cls:'', html:`<h2>Explore</h2><div class="t-links"><button data-go-section="modes">Boxing${chev}</button><button data-go-section="sc">Strength &amp; conditioning${chev}</button><button data-go-section="mind">Mental skills${chev}</button><button data-go-section="cal">Training calendar${chev}</button></div>`};
    return W;
  }

  let filmPick = null, filmOffset = 0;
  const els = {}, LIVE_URL = 'https://boxingworld.com/';
  function liveStop(){
    const box = $('liveBox'); if(!box) return;
    box.classList.remove('on'); box.innerHTML = '<button class="live-go" data-live-on aria-label="Watch Boxing World TV live"><span class="live-tag"><i></i>LIVE 24/7</span><span class="live-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span><strong>Watch free boxing now</strong></button>';
    $('liveNote').innerHTML = 'A free 24/7 boxing channel from <a href="https://boxingworld.com/" target="_blank" rel="noopener">boxingworld.com</a>. Full fights, knockouts and classics.';
  }
  function liveStart(){
    const box = $('liveBox'); box.classList.add('on');
    box.innerHTML = `<iframe src="${LIVE_URL}" title="Boxing World TV, live 24/7" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    $('liveNote').innerHTML = 'Tap the player to unmute. <button class="linkbtn" data-live-off>Stop</button>';
  }
  window.liveStop = liveStop;   // called when another screen opens, so the stream doesn't keep playing out of sight
  function ensureDom(){
    if($('tGrid')) return;
    $('todayBody').innerHTML = `<div class="t-head" id="tHead"></div>
      <div class="t-grid" id="tGrid">${DEFAULT_ORDER.map(id => `<section class="tw" data-w="${id}" hidden></section>`).join('')}</div>
      <p class="t-hint">Press and hold a widget, then drop it on another to swap them. <button data-reset-layout>Reset layout</button></p>`;
    DEFAULT_ORDER.forEach(id => { els[id] = document.querySelector(`#tGrid [data-w="${id}"]`); });
    // the quick-start widget is a small version of the coach card: the live preview, with the start buttons beside it
    els.quick.innerHTML = `<div class="q-top"><h2>Quick coach workout</h2><button class="linkbtn" data-go-modes>All ways to train &rsaquo;</button></div><div class="q-row"><div class="qprev"><div class="qfall" aria-hidden="true"><div class="ring"><b>01:30</b></div><div class="bar"></div></div><iframe data-src="index.html?preview" data-on="today" title="Preview of a coach workout" tabindex="-1" aria-hidden="true"></iframe></div><div class="q-info"></div></div>`;
    els.quick.style.cursor = 'pointer';
    // Boxing World TV: a free 24/7 boxing channel. The page is only loaded when they tap, so the dashboard stays light and the stream doesn't start by itself.
    els.live.innerHTML = `<div class="q-top"><h2>Boxing World TV</h2><a class="linkbtn" href="${LIVE_URL}" target="_blank" rel="noopener">Open site &rsaquo;</a></div>
      <div class="live-box" id="liveBox"></div><p class="t-note" id="liveNote"></p>`;
    liveStop();
    els.minical.setAttribute('role', 'button'); els.minical.tabIndex = 0; els.minical.setAttribute('aria-label', 'Open your training calendar');
  }
  // the badge beside the greeting: how long until the fight (from the training camp). With no camp date to count to, it falls back to the streak.
  function countdown(s){
    const B = window.bfCamp, cur = B && B.current();
    if(cur && cur.state !== 'finished'){
      const days = Math.round((C.fromKey(cur.camp.fight) - C.fromKey(todayK())) / 86400000);
      if(days >= 0){
        const w = Math.floor(days / 7), d = days % 7;
        return `<div class="streak on" title="${cur.camp.auto ? 'The end of your starter camp. Set your fight date in the training camp.' : 'Until your fight on ' + C.dayLabel(cur.camp.fight)}"><b>${days}</b><span>${days === 1 ? 'day' : 'days'} ${cur.camp.auto ? 'of camp left' : 'to fight'}</span>${days >= 7 ? `<small>${w} week${w === 1 ? '' : 's'}${d ? ` ${d} day${d === 1 ? '' : 's'}` : ''}</small>` : ''}</div>`;
      }
    }
    return `<div class="streak ${s ? 'on' : ''}" title="Days in a row with a session"><b>${s}</b><span>day streak</span></div>`;
  }
  let shown = [];   // the order on screen right now
  function renderToday(){
    ensureDom();
    const W = widgets(), s = streak();
    $('tHead').innerHTML = `<div><div class="eyebrow">${new Date().toLocaleDateString('en-NZ', {weekday:'long', day:'numeric', month:'long'})}</div><h1>${greeting()}</h1></div>
      ${countdown(s)}`;
    shown = [...saved.filter(id => W[id]), ...DEFAULT_ORDER.filter(id => W[id] && !saved.includes(id))];
    DEFAULT_ORDER.forEach(id => {
      const el = els[id], w = W[id]; el.hidden = !w; if(!w) return;
      el.className = 'tw ' + w.cls;
      if(id !== 'live') (id === 'quick' ? el.querySelector('.q-info') : el).innerHTML = w.html;
      el.style.order = shown.indexOf(id);
    });
  }
  window.renderToday = renderToday;
  function swap(a, b){
    const i = shown.indexOf(a), j = shown.indexOf(b); if(i < 0 || j < 0) return;
    [shown[i], shown[j]] = [shown[j], shown[i]]; saved = [...shown];
    try{ localStorage.setItem(OKEY, JSON.stringify(saved)); }catch(e){}
    shown.forEach((id, k) => { els[id].style.order = k; });
  }
  window.holdDrag($('todayBody'), {item:'.tw', target:'.tw', onDrop:(a, b) => swap(a.dataset.w, b.dataset.w)});

  $('todayBody').addEventListener('click', e => {
    const b = e.target.closest('button'), mini = e.target.closest('[data-w="minical"]');
    if(e.target.closest('[data-w="quick"]') && !(b && 'quick' in b.dataset)){ show('modes'); return; }
    if(b && 'campTask' in b.dataset){ window.bfCamp.toggle(b.dataset.campTask); renderToday(); return; }
    if(b && 'campInfo' in b.dataset){ window.bfCamp.showInfo(); show('camp'); return; }
    if((b && 'campOpen' in b.dataset) || (!b && e.target.closest('[data-w="camp"]'))){ show('camp'); return; }   // the widget itself opens How do you want to train?
    if(!b){ if(mini) C.openDay(todayK(), 'month'); return; }
    const d = b.dataset;
    if(d.startPlan){ const ev = C.plan.find(x => x.id === d.startPlan); if(ev) C.start(ev); }
    else if('nutriOpen' in d) show('nutrition');
    else if('nutriAdd' in d) window.bfNutri.addFood();
    else if('filmOpen' in d) show('film');
    else if('filmFight' in d){ if(filmPick) window.bfFilm.startFight(filmPick); }
    else if('filmNext' in d){ filmOffset++; renderToday(); }
    else if(d.filmCont) window.bfFilm.openStudy(d.filmCont);
    else if('liveOn' in d) liveStart();
    else if('liveOff' in d) liveStop();
    else if('quick' in d) quickCoach();
    else if('quickChange' in d){ applyParams(C.params({type:'coach', cfg:quickCfg()})); pickMode('coach'); }
    else if(d.day) C.openDay(d.day);
    else if('openCal' in d) C.openDay(todayK());
    else if('planToday' in d) C.addFor(todayK());
    else if('goal' in d){ goal = goal % 7 + 1; try{ localStorage.setItem(GKEY, goal); }catch(err){} renderToday(); }
    else if(d.suggest){ const g = suggestions()[+d.suggest]; if(g){ if(g.type === 'breath' && g.quick) bset.mins = 2; startSession(g.type, g.cfg); } }
    else if(d.again){ const en = log[+d.again]; if(en) startSession(en.type, en.cfg); }
    else if(d.goSection) show(d.goSection);
    else if('resetLayout' in d){ saved = []; try{ localStorage.removeItem(OKEY); }catch(err){} renderToday(); }
  });
  $('todayBody').addEventListener('keydown', e => { if((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-w="minical"]')){ e.preventDefault(); C.openDay(todayK(), 'month'); } });
  if(window.bfNutri) window.bfNutri.onChange(() => { if(!$('today').hidden) renderToday(); });   // the widget follows the diary
  if(!$('today').hidden){ renderToday(); window.syncPreviews?.('today'); }
})();
