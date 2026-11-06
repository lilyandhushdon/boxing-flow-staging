/* Fight prep: looks at what has been trained over the last two weeks (the activity log), compares it with what a fighter needs, and shows the gaps, with a
   workout to start for each one. The person can describe the opponent (pick a style or make one from traits) and the targets shift to suit: someone who walks
   forward needs more defence and shoulder endurance, a counterpuncher needs more tactics and output, and so on. Inside two weeks of the fight the heavy
   work is trimmed and recovery goes up. The opponent is saved on this device (bfOpp). Loads after home.js and uses the log it keeps (bfLog), bfCal and bfCamp. */
(function(){
  const C = window.bfCal, KEY = 'bfOpp', DAYS = 14;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // any number of opponents, one for each fight to come: { id, name, traits, photo }. The one picked is the next fight (opp); it drives the game plan and the dashboard card.
  const newOpp = () => ({id:'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:'', traits:[], plan:''});
  let opps = [], opp = null;
  try{
    const v = JSON.parse(localStorage.getItem('bfOpps') || 'null');
    if(v && Array.isArray(v.list) && v.list.length){ opps = v.list; opp = opps.find(o => o.id === v.active) || opps[0]; }
    else { const old = JSON.parse(localStorage.getItem(KEY) || 'null'); opp = Object.assign(newOpp(), old && Array.isArray(old.traits) ? old : {}); opps = [opp]; }   // the single opponent kept before there was a list
  }catch(e){ opp = newOpp(); opps = [opp]; }
  const save = () => { try{ localStorage.setItem('bfOpps', JSON.stringify({list:opps, active:opp.id})); }catch(e){} };
  // the matchup: a photo of you (bfMe) and of the opponent (opp.photo), shown as the versus card on the dashboard. Photos are shrunk and kept on this device.
  let mePhoto = '', meAdj = null; try{ const m = JSON.parse(localStorage.getItem('bfMe') || 'null') || {}; mePhoto = m.photo || ''; meAdj = m.adj || null; }catch(e){}
  const saveMe = () => { try{ localStorage.setItem('bfMe', JSON.stringify({photo:mePhoto, adj:meAdj})); }catch(e){} };
  // how a photo sits in its frame: zoom (z, 1 to 3) and the point it is centred on (x, y as a percent). The dashboard card uses the same numbers.
  const adjStyle = a => { const z = (a && a.z) || 1, x = a && a.x != null ? a.x : 50, y = a && a.y != null ? a.y : 50; return `object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%`; };
  const adjOf = who => who === 'me' ? (meAdj = meAdj || {z:1, x:50, y:50}) : (opp.adj = opp.adj || {z:1, x:50, y:50});
  const saveWho = who => who === 'me' ? saveMe() : save();
  let vsShow = localStorage.getItem('bfVersusOff') !== '1';   // the dashboard card can be switched off
  // the coach's plan for this fight: one point a line, kept with the opponent. An opponent saved before this existed starts with the plan the coach gave for the current fight.
  const COACH_PLAN = ['Box smart first', 'Then outbox him', 'Go to his body: he has been dropped with the left hook to the body', 'Output and calm', 'Numbers and calm'];
  opps.forEach(o => { if(o.plan == null) o.plan = o === opp ? COACH_PLAN.join('\n') : ''; });
  const planLines = o => (o.plan || '').split('\n').map(s => s.trim()).filter(Boolean);
  window.bfVersus = {get:() => ({me:mePhoto, opp:opp.photo || '', oppName:opp.name || '', show:vsShow, meStyle:adjStyle(meAdj), oppStyle:adjStyle(opp.adj), plan:planLines(opp), tips:opp.traits.map(id => TRAITS.find(t => t.id === id)).filter(Boolean).map(t => t.tip)})};
  function shrink(file, done){
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); done(c.toDataURL('image/jpeg', .85)); };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }
  const none = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
  const slot = (who, photo, label, cls) => `<div class="vs-slot ${cls}"><div class="vs-ph${photo ? ' adj' : ''}" data-vs-drag="${who}">${photo ? `<img src="${photo}" alt="${label}" draggable="false" style="${adjStyle(who === 'me' ? meAdj : opp.adj)}">` : none}</div>
    ${photo ? `<input type="range" class="vs-zoom" min="1" max="3" step="0.05" value="${((who === 'me' ? meAdj : opp.adj) || {}).z || 1}" data-vs-zoom="${who}" aria-label="Zoom ${label}"><span class="t-note">Slide to zoom, drag the photo to move it</span>` : ''}<strong>${label}</strong>
    <div class="vs-btns"><label class="btn small ghost">${photo ? 'Change' : 'Add photo'}<input type="file" accept="image/*" data-vs="${who}" hidden></label>${photo ? `<button type="button" class="btn small ghost" data-vs-clear="${who}">Remove</button>` : ''}</div></div>`;
  const matchup = () => `<div class="nu-card"><h2 class="nu-fname">The matchup</h2>
    <p class="t-note">Add an opponent for each fight coming up. The one you pick is your next fight: it sets your game plan and makes the versus card on your dashboard.</p>
    <div class="bw-chips">${opps.map((o, i) => `<button type="button" data-opp-pick="${o.id}" aria-pressed="${o.id === opp.id}">${esc(o.name || 'Opponent ' + (i + 1))}</button>`).join('')}<button type="button" data-opp-add>+ Add opponent</button></div>
    <div class="vs-pick">${slot('me', mePhoto, 'You · blue corner', 'blue')}${slot('opp', opp.photo, 'Opponent · red corner', 'red')}</div>
    <label class="c-label">Opponent's name<input id="prepName" type="text" maxlength="40" value="${esc(opp.name)}" placeholder="e.g. Saturday's opponent"></label>
    <label class="c-label">Coach's plan (one point a line, shown on your dashboard)<textarea id="prepPlan" rows="5" maxlength="600" placeholder="e.g. Jab first, go to the body">${esc(opp.plan || '')}</textarea></label><div class="t-row">${opps.length > 1 ? '<button type="button" class="btn small ghost" data-opp-del>Remove this opponent</button>' : ''}<button type="button" class="btn small ghost" data-vs-show>${vsShow ? 'Hide from dashboard' : 'Show on dashboard'}</button></div></div>`;
  const readLog = () => { try{ return JSON.parse(localStorage.getItem('bfLog') || '[]') || []; }catch(e){ return []; } };
  const presetIdx = name => Math.max(0, BASIC.findIndex(w => w.name === name));
  const scenIdx = frag => Math.max(0, SCENARIOS.findIndex(s => s.name.toLowerCase().includes(frag)));

  // what a fighter needs in two weeks, in sessions, and what to start for each
  const NEEDS = [
    {id:'tech',   name:'Technique and combinations', target:4, why:'Sharp, repeatable punches and combinations.', start:() => ({type:'coach', cfg:{focus:['jab','speed','power'], opt:0}}),
      has:e => ['coach','basic','timer'].includes(e.type) && !/defence|power/i.test(e.label || '')},
    {id:'defence',name:'Defence', target:2, why:'Slipping, rolling, blocking and countering so you do not get hit for free.', start:() => ({type:'basic', cfg:{preset:presetIdx('Defence drill'), opt:0}}),
      has:e => /defence/i.test(e.label || '')},
    {id:'tactics',name:'Tactics and ring IQ', target:2, why:'Game plans against different styles, and reading a fight.', start:() => ({type:'scenario', cfg:{scen:scenIdx(oppFrag()), sopt:0}}),
      has:e => ['scenario','iq'].includes(e.type)},
    {id:'output', name:'Output and volume', target:3, why:'Punches thrown per round: the work rate that wins amateur rounds.', start:() => ({type:'output', cfg:{out:2, oopt:2}}),
      has:e => ['output','timer'].includes(e.type)},
    {id:'power',  name:'Power on top of speed', target:2, why:'Fast shots with a tensed last punch, and explosive legs and hips.', start:() => ({type:'basic', cfg:{preset:presetIdx('Power'), opt:0}}),
      has:e => e.type === 'plyo' || /power/i.test(e.label || '')},
    {id:'engine', name:'Engine: running and intervals', target:4, why:'The aerobic base and the repeat efforts to last every round.', start:() => ({type:'run', cfg:{run:0}}),
      has:e => ['run','treadmill'].includes(e.type)},
    {id:'core',   name:'Core', target:3, why:'Abs and obliques to take body shots and rotate through punches.', start:() => ({type:'abs', cfg:{abs:0}}),
      has:e => e.type === 'abs'},
    {id:'neck',   name:'Neck strength', target:2, why:'A strong neck helps you take a shot and keep your head steady.', start:() => ({type:'neck', cfg:{neck:0}}),
      has:e => e.type === 'neck'},
    {id:'shoulders',name:'Shoulder endurance', target:2, why:'Keep your hands up for the whole fight.', start:() => ({type:'shoulder', cfg:{shd:0, shopt:0}}),
      has:e => e.type === 'shoulder'},
    {id:'sparring',name:'Sparring and gym work', target:2, why:'Live rounds are the only real test of all of it.', start:null,
      has:e => e.type === 'gym' && /spar|class|pad|fight prep/i.test(e.label || '')},
    {id:'recovery',name:'Recovery and mobility', target:3, why:'Stretching, mobility and recovery so you can train hard again.', start:() => ({type:'recovery', cfg:{rec:3}}),
      has:e => e.type === 'recovery'},
    {id:'flow',   name:'Flow and rhythm', target:2, why:'Dance, ballet and footwork to a beat: stay loose, relaxed and rhythmic, especially in fight week.', start:() => ({type:'flow', cfg:{flow:0}}),
      has:e => e.type === 'flow'},
    {id:'mind',   name:'Mental skills', target:3, why:'Breathing and reframing for nerves and bad moments.', start:() => ({type:'breath', cfg:{}}),
      has:e => ['breath','reframe','mdrill'].includes(e.type)}
  ];
  // how an opponent changes what is needed: a trait multiplies the targets it names
  const TRAITS = [
    {id:'pressure', name:'Walks forward, applies pressure', up:{defence:1.4, shoulders:1.2, output:1.2, tactics:1.2}, tip:'Keep your range, win the ring with angles, and make him pay on the way in.'},
    {id:'counter',  name:'Counterpuncher', up:{tactics:1.4, tech:1.2}, tip:'Vary your entries and never give him the same opening twice. Feints and patterns beat a counterpuncher.'},
    {id:'reach',    name:'Long reach, keeps moving', up:{engine:1.3, tactics:1.2, tech:1.1}, tip:'Cut the ring instead of chasing, and get in behind a safe attack. You need the legs to keep cutting it off.'},
    {id:'power',    name:'Heavy puncher', up:{defence:1.4, core:1.3}, tip:'Stay compact and calm, keep the guard tight and the core strong, and counter straight.'},
    {id:'volume',   name:'High volume, busy', up:{engine:1.3, output:1.3, shoulders:1.3}, tip:'Match his work rate or beat it. Output rounds and shoulder endurance keep you in the fight.'},
    {id:'southpaw', name:'Southpaw', up:{tactics:1.3, tech:1.2}, tip:'Work the angles on the outside of his lead foot and drill the straight punches through the gap.'},
    {id:'technical',name:'Technical and disciplined', up:{tactics:1.4, tech:1.2, output:1.1}, tip:'He beats you to position. Win it with timing, patterns and being first.'},
    {id:'fades',    name:'Starts fast, fades late', up:{engine:1.3, output:1.1}, tip:'Survive the start, stay composed, and keep your own pace for the late rounds.'}
  ];
  // a style from the fight scenarios, as traits
  const STYLES = [['The pressure fighter', ['pressure'], 'pressure'], ['The counterpuncher', ['counter'], 'counterpuncher'], ['The outfighter', ['reach'], 'outfighter'], ['The aggressive brawler', ['power','pressure'], 'brawler'], ['The technical boxer', ['technical'], 'technical']];
  const oppFrag = () => { const s = STYLES.find(x => x[1][0] === opp.traits[0]); return s ? s[2] : 'pressure'; };
  const daysToFight = () => { try{ const c = window.bfCamp && window.bfCamp.current(); return c && c.days != null ? c.days : null; }catch(e){ return null; } };

  // sessions ticked off on the calendar count too, including ones added afterwards: they never went through the timer, so they are not in the log.
  // One that is already in the log (same plan id, or on the same day with the same type, for older entries) is not counted twice.
  // tapping an area opens a menu of every workout that trains it: { name, sub, type, cfg }, started through the calendar's own starter
  const each = (name, f) => { try{ const a = eval(name); return Array.isArray(a) ? a.map(f).filter(Boolean) : []; }catch(e){ return []; } };   // the data lists are globals of the other scripts
  const basic = names => each('BASIC', (b, i) => names.includes(b.name) ? {name:b.name, sub:b.blurb || (b.exercises || []).slice(0, 4).join(', '), type:'basic', cfg:{preset:i, opt:0}} : null);
  const coachFor = test => each('FOCUS', f => test(f) ? {name:f.name, sub:f.desc + '. Coach-led.', type:'coach', cfg:{focus:[f.id], opt:0}} : null);
  const isDef = f => /defen|slip|guard|head/i.test(f.id + ' ' + f.name), isPow = f => f.id === 'power';
  const MENU = {
    tech:      () => [...coachFor(f => !isDef(f) && !isPow(f)), ...basic(['Bag basics', 'Combinations']), {name:'Round timer', sub:'Just the rounds and the bell.', type:'timer', cfg:{opt:0}}],
    defence:   () => [...basic(['Defence drill', 'Defence']), ...coachFor(isDef)],
    tactics:   () => [...each('SCENARIOS', (s, i) => ({name:s.name, sub:s.mission, type:'scenario', cfg:{scen:i, sopt:0}})), {name:'Boxing IQ', sub:'Quizzes on tactics and ring IQ.', type:'iq', cfg:{}}],
    output:    () => each('OUTPUT', (o, i) => ({name:o.name, sub:o.punches + ' punches a round.', type:'output', cfg:{out:i, oopt:0}})),
    power:     () => [...basic(['Power', 'Speed and power']), ...coachFor(isPow), ...each('PLYO', (p, i) => ({name:p.name, sub:'Explosive work.', type:'plyo', cfg:{plyo:i, popt:0}}))],
    engine:    () => [...each('RUNS', (r, i) => ({name:r.name, sub:r.effort ? r.effort + ' effort.' : '', type:'run', cfg:{run:i}})), ...each('TREADMILL', (t, i) => ({name:t.name, sub:'Treadmill intervals.', type:'treadmill', cfg:{tm:i}}))],
    neck:      () => each('NECK', (n, i) => ({name:n.name, sub:n.blurb, type:'neck', cfg:{neck:i}})),
    core:      () => each('ABS', (a, i) => ({name:a.name, sub:'Rep-based abdominals.', type:'abs', cfg:{abs:i}})),
    shoulders: () => each('SHOULDER', (h, i) => ({name:h.name, sub:'Keep your hands up for longer.', type:'shoulder', cfg:{shd:i, shopt:0}})),
    flow:      () => each('FLOW', (f, i) => ({name:f.name, sub:f.blurb, type:'flow', cfg:{flow:i}})),
    recovery:  () => each('RECOVERY', (r, i) => ({name:r.name, sub:r.blurb || '', type:'recovery', cfg:{rec:i}})),
    sparring:  () => [],
    mind:      () => [{name:'Box breathing', sub:'Settle nerves and sharpen focus.', type:'breath', cfg:{}}, {name:'Cognitive reframing', sub:'Practise turning your doubts around.', type:'reframe', cfg:{}},
                  ...each('DRILLS', (d, i) => ({name:d.name, sub:d.blurb, type:'mdrill', cfg:{md:i}}))]
  };
  let view = null, menuItems = [];
  function withPlanned(log){
    const plan = (C && C.plan) || [], today = C.dkey(new Date()), used = new Set(), out = log.slice();
    plan.filter(p => p.done && p.date <= today && p.type !== 'rest').forEach(p => {
      const i = log.findIndex((e, j) => !used.has(j) && (e.planId === p.id || (!e.planId && e.date === p.date && e.type === p.type)));
      if(i >= 0){ used.add(i); return; }
      out.push({id:p.id, date:p.date, ts:C.fromKey(p.date).getTime() + 12 * 3600000, type:p.type, cfg:p.cfg, label:C.label(p), minutes:0});
    });
    return out;
  }
  function analyse(){
    const log = withPlanned(readLog()), now = Date.now(), dtf = daysToFight();
    // a merged workout counts for each part it was made of
    const recent = log.filter(e => now - (e.ts || 0) < DAYS * 86400000).flatMap(e => e.type === 'build' && e.cfg && e.cfg.blocks ? e.cfg.blocks.map(b => ({type:b.type, cfg:b.cfg, label:e.label || ''})) : [e]);
    return NEEDS.map(n => {
      let target = n.target;
      for(const id of opp.traits){ const t = TRAITS.find(x => x.id === id); if(t && t.up[n.id]) target *= t.up[n.id]; }
      if(dtf != null && dtf <= 14){ if(['engine','power','shoulders','tech','output'].includes(n.id)) target *= .6; if(n.id === 'recovery') target *= 1.3; }   // the last two weeks are about being sharp and fresh
      target = Math.max(1, Math.round(Math.min(target, n.target * 2)));
      const done = recent.filter(n.has).length;
      return {...n, target, done, gap:Math.max(0, target - done), frac:Math.min(1, done / target)};
    });
  }

  function renderArea(){
    const n = NEEDS.find(x => x.id === view), r = analyse().find(x => x.id === view);
    menuItems = (MENU[view] || (() => []))();
    $('prepBody').innerHTML = `<div class="nu-card"><button class="eyebrow back-link" data-prep-back>&larr; Fight prep</button>
      <h2 class="nu-fname">${esc(n.name)}</h2>
      <p class="t-note">${esc(n.why)} ${r ? `You have done ${r.done} of ${r.target} in the last ${DAYS} days.` : ''}</p>
      ${menuItems.length ? menuItems.map((m, i) => `<div class="prep-top"><div><strong>${esc(m.name)}</strong>${m.sub ? `<span>${esc(m.sub)}</span>` : ''}</div><button class="btn small" data-prep-run="${i}">Start</button></div>`).join('')
        : `<p class="t-note">${view === 'sparring' ? 'Sparring and classes happen at the gym, so there is no timer workout for them. Book one into your calendar.' : 'No workouts found for this area.'}</p><button class="btn small" data-prep-cal>Open the calendar</button>`}</div>`;
    window.scrollTo(0, 0);
  }
  function render(){
    if(view) return renderArea();
    const rows = analyse(), dtf = daysToFight(), traits = opp.traits.map(id => TRAITS.find(t => t.id === id)).filter(Boolean);
    const gaps = rows.filter(r => r.gap > 0).sort((a, b) => b.gap / b.target - a.gap / a.target || b.gap - a.gap), top = gaps.slice(0, 3);
    const hasLog = withPlanned(readLog()).some(e => Date.now() - (e.ts || 0) < DAYS * 86400000);
    $('prepBody').innerHTML = `
      ${matchup()}<div class="nu-card"><h2 class="nu-fname">Your opponent</h2>
        <p class="t-note">Pick a style, or tick what you know about the fighter. The targets below change to suit them.</p>
        <div class="bw-chips">${STYLES.map(([n, tr]) => `<button type="button" data-prep-style="${tr.join(',')}" aria-pressed="${tr.length === opp.traits.length && tr.every(t => opp.traits.includes(t))}">${esc(n.replace('The ', ''))}</button>`).join('')}<button type="button" data-prep-style="" aria-pressed="${!opp.traits.length}">No opponent yet</button></div>
        <h3 class="cal-sub">Or make your own</h3>
        <div class="bw-chips">${TRAITS.map(t => `<button type="button" data-prep-trait="${t.id}" aria-pressed="${opp.traits.includes(t.id)}">${esc(t.name)}</button>`).join('')}</div>
        ${traits.length ? `<div class="prep-plan"><h3 class="cal-sub">Game plan${opp.name ? ' for ' + esc(opp.name) : ''}</h3>${traits.map(t => `<p class="t-note"><b>${esc(t.name)}.</b> ${esc(t.tip)}</p>`).join('')}</div>` : ''}</div>
      <div class="nu-card"><h2 class="nu-fname">What to work on</h2>
        <p class="t-note">${hasLog ? `The last ${DAYS} days of your training against what you need${dtf != null ? `, with ${dtf} day${dtf === 1 ? '' : 's'} to your fight` : ''}.` : 'Nothing logged in the last two weeks yet, so every area is open. Finish a workout and it counts here.'}${dtf != null && dtf <= 14 ? ' You are inside two weeks of the fight, so the heavy work is trimmed and recovery goes up: stay sharp and fresh.' : ''}</p>
        ${top.length ? top.map(r => `<div class="prep-top"><div><strong>${esc(r.name)}</strong><span>${r.done} of ${r.target} sessions. ${esc(r.why)}</span></div>${r.start ? `<button class="btn small" data-prep-start="${r.id}">Start one</button>` : `<span class="t-note">Book it in</span>`}</div>`).join('') : '<p class="t-note"><b>No gaps.</b> You are on target in every area for the last two weeks.</p>'}</div>
      <div class="nu-card"><h2 class="nu-fname">Every area</h2>
        ${rows.map(r => `<button type="button" class="prep-row" data-prep-area="${r.id}" aria-label="${esc(r.name)}: ${r.done} of ${r.target}. See the workouts."><div class="prep-h"><span>${esc(r.name)}</span><b class="${r.gap ? 'gap' : 'ok'}">${r.done} / ${r.target}</b></div><div class="nu-bar ${r.gap ? '' : 'ok'}"><i style="width:${r.frac * 100}%"></i></div></button>`).join('')}
        <p class="iq-note">Counts workouts finished in the last ${DAYS} days. The targets are a guide for an amateur fighter in camp, not a plan from a coach. Talk to your coach about what you need.</p></div>`;
  }
  window.renderPrep = () => { view = null; render(); };   // opening Fight prep starts at the overview

  $('prep').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
    if(d.section){ show(d.section); return; }
    if(d.prepArea){ view = d.prepArea; render(); return; }
    if(d.prepBack != null){ view = null; render(); return; }
    if(d.prepCal != null){ show('cal'); return; }
    if(d.prepRun != null){ const m = menuItems[+d.prepRun]; if(m) C.start({type:m.type, cfg:m.cfg}); return; }
    if(d.oppPick){ opp = opps.find(o => o.id === d.oppPick) || opp; save(); render(); return; }
    if(d.oppAdd != null){ opp = newOpp(); opps.push(opp); save(); render(); return; }
    if(d.oppDel != null){ if(opps.length > 1 && confirm('Remove ' + (opp.name || 'this opponent') + '?')){ opps = opps.filter(o => o !== opp); opp = opps[0]; save(); render(); } return; }
    if(d.vsShow != null){ vsShow = !vsShow; try{ localStorage.setItem('bfVersusOff', vsShow ? '0' : '1'); }catch(err){} render(); return; }
    if(d.vsClear){ if(d.vsClear === 'me'){ mePhoto = ''; meAdj = null; saveMe(); } else { delete opp.photo; delete opp.adj; save(); } render(); return; }
    if(d.prepStyle != null){ opp.traits = d.prepStyle ? d.prepStyle.split(',') : []; save(); render(); return; }
    if(d.prepTrait){ const s = new Set(opp.traits); s.has(d.prepTrait) ? s.delete(d.prepTrait) : s.add(d.prepTrait); opp.traits = [...s]; save(); render(); return; }
    if(d.prepStart){ const n = NEEDS.find(x => x.id === d.prepStart); if(n && n.start) C.start(n.start()); }
  });
  $('prep').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0], who = e.target.dataset && e.target.dataset.vs; if(!f || !who) return;
    shrink(f, data => { if(who === 'me'){ mePhoto = data; meAdj = null; saveMe(); } else { opp.photo = data; delete opp.adj; save(); } render(); });
  });
  // zoom with the slider; move the photo by dragging it (the picture follows the finger, so the point it is centred on moves the other way)
  let drag = null;
  $('prep').addEventListener('pointerdown', e => {
    const box = e.target.closest('[data-vs-drag].adj'); if(!box) return;
    const a = adjOf(box.dataset.vsDrag); drag = {box, who:box.dataset.vsDrag, a, sx:e.clientX, sy:e.clientY, x:a.x, y:a.y}; box.setPointerCapture(e.pointerId);
  });
  $('prep').addEventListener('pointermove', e => {
    if(!drag) return;
    const r = drag.box.getBoundingClientRect(), z = drag.a.z || 1, clamp = v => Math.max(0, Math.min(100, v));
    drag.a.x = clamp(drag.x - (e.clientX - drag.sx) / r.width * 100 / z); drag.a.y = clamp(drag.y - (e.clientY - drag.sy) / r.height * 100 / z);
    drag.box.firstElementChild.setAttribute('style', adjStyle(drag.a));
  });
  const endDrag = () => { if(drag){ saveWho(drag.who); drag = null; } };
  $('prep').addEventListener('pointerup', endDrag); $('prep').addEventListener('pointercancel', endDrag);
  $('prep').addEventListener('input', e => {
    if(e.target.dataset && e.target.dataset.vsZoom){ const who = e.target.dataset.vsZoom, a = adjOf(who); a.z = +e.target.value; e.target.closest('.vs-slot').querySelector('.vs-ph img').setAttribute('style', adjStyle(a)); saveWho(who); return; } if(e.target.id === 'prepName'){ opp.name = e.target.value.slice(0, 40); save(); } if(e.target.id === 'prepPlan'){ opp.plan = e.target.value.slice(0, 600); save(); } });
  if(!$('prep').hidden) render();
  if(window.renderToday && !$('today').hidden) window.renderToday();   // the dashboard may have drawn before the versus card's photos were here
})();
