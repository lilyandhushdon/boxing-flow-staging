/* Training camp: a fight camp laid out like a Jira board. Phases (Base, Build, Peak, Fight week) are split into two-week sprints; each sprint has a goal
   and tasks with subtasks to focus on. Nothing is scheduled as a workout: people tick things off, edit the sprint goal and add their own tasks.
   The camp is built once from a fight date and a length (6, 8, 10 or 12 weeks), shrunk to fit if the fight is closer than the camp, and saved on this device
   (plain JSON, so it can move to a database with sign-in). The calendar shows which phase and sprint each day is in.
   The content is a general plan for a coach to review. It is written for the full 12-week phase lengths and trimmed to fit shorter camps. */
(function(){
  const C = window.bfCal, KEY = 'bfCamp';
  let camp = null; try{ camp = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){}
  const save = () => { try{ camp ? localStorage.setItem(KEY, JSON.stringify(camp)) : localStorage.removeItem(KEY); }catch(e){} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const {dkey, fromKey, addDays} = C;
  const todayKey = () => dkey(new Date());
  const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);
  const fmt = k => fromKey(k).toLocaleDateString('en-NZ', {day:'numeric', month:'short'});

  /* ---------- the phases, and what goes in them ---------- */
  const PHASES = [{id:'base', name:'Base', color:'#4fd1b5'}, {id:'build', name:'Build', color:'#f5c95a'}, {id:'peak', name:'Peak', color:'#ff7f6e'}, {id:'fight', name:'Fight week', color:'#a58bff'}];
  const SHARES = {6:[2,2,1,1], 8:[2,2,2,2], 10:[3,3,2,2], 12:[4,4,2,2]};   // weeks in each phase (Base, Build, Peak, Fight week) of each camp length
  const LENGTHS = [6, 8, 10, 12], DEFAULT_LEN = 8;
  const FULL = [4,4,2,2];                         // the lengths the content below is written for
  const L = (type, cfg) => ({type, cfg: cfg || {}});   // a "Practise" link into the app
  // Tasks are in order of importance. A shorter phase keeps the first ones. Subtasks with no link are ticked by hand.
  const CONTENT = [
    {goals:['Build your engine and lock in the fundamentals.', 'Add volume and keep your technique sharp when you are tired.'], tasks:[
      {t:'Footwork and balance', link:L('coach',{focus:['foot'],opt:0}), subs:['Reset your stance after every combination', 'Step off the line after each punch', 'Pivot out of the ropes and take the centre back']},
      {t:'Jab and straight punches', link:L('coach',{focus:['jab'],opt:0}), subs:['Return the jab to guard every time', 'Use a double jab to close the distance', 'Follow the jab with a straight right']},
      {t:'Conditioning base', link:L('timer',{opt:1}), subs:['Complete 6 round-timer sessions of 5 rounds or more', 'Keep round 5 as sharp as round 1', 'Finish every round with your hands up']},
      {t:'Defence basics', link:L('coach',{focus:['def'],opt:0}), subs:['Block and return', 'Slip the jab and counter', 'Keep your chin down on the way out']},
      {t:'Shoulder endurance', link:L('shoulder',{shd:0,shopt:0}), subs:['Do the shoulder conditioning drill twice a week', 'Keep your guard up through the last round']},
      {t:'Stay calm when tired', link:L('breath'), subs:['Learn box breathing, 4 seconds each side', 'Use one reset breath between rounds']},
      {t:'Output foundation', link:L('output',{out:1,oopt:0}), subs:['Hit the 90-punch round', 'Hit the 135-punch round']},
      {t:'Leg power', link:L('plyo',{plyo:1,popt:1}), subs:['Do lower-body plyometrics once a week', 'Land softly every time']}
    ]},
    {goals:['Add intensity and start using your skills against different styles.', 'Make your skills work under pressure and fatigue.'], tasks:[
      {t:'Fight scenarios', link:L('scenario',{scen:0,sopt:0}), subs:['Beat the pressure fighter: keep your back off the ropes', 'Beat the counterpuncher: never give him the same opening twice', 'Beat the outfighter: cut the ring, don\'t chase']},
      {t:'Combinations with a purpose', link:L('coach',{focus:['combo'],opt:0}), subs:['Finish every combination with an exit', 'Mix head and body in each one', 'Stop a combination early when the opening closes']},
      {t:'Output under fatigue', link:L('output',{out:3,oopt:0}), subs:['Hit the 210-punch round', 'Hit the 270-punch round', 'Keep your guard up in the last 30 seconds']},
      {t:'Defence and counters', link:L('coach',{focus:['counter'],opt:0}), subs:['Counter off every jab you parry or block', 'Slip and fire straight', 'Roll under and counter']},
      {t:'Explosive power', link:L('plyo',{plyo:2,popt:1}), subs:['Do upper-body plyometrics once a week', 'Do medicine ball rotational throws', 'Land every jump softly']},
      {t:'Ring craft', link:L('coach',{focus:['angles'],opt:0}), subs:['Cut off the ring without chasing', 'Take the centre back after the ropes', 'Win the outside foot']},
      {t:'Reframe the hard moments', link:L('reframe'), subs:['Practise 5 reframing cards', 'Pick a cue word for when you are tired']},
      {t:'Sparring notes', subs:['Spar, and note one thing that worked', 'Spar, and note one thing to fix']}
    ]},
    {goals:['Train at fight pace and sharpen everything you have built.', 'Fight pace on fresh legs: quality over volume.'], tasks:[
      {t:'Fight-pace rounds', link:L('output',{out:4,oopt:0}), subs:['Complete 5 rounds at your hardest sustainable pace', 'Hit the 360-punch round', 'Hit the 400-punch round']},
      {t:'Full fight scenarios', link:L('scenario',{scen:0,sopt:0}), subs:['Run a 5-round scenario in your opponent\'s style', 'Finish round 5 as strong as round 1']},
      {t:'Sparring at fight pace', subs:['Do your hardest sparring this block', 'Use your game plan in every round']},
      {t:'Mental sharpness', link:L('breath'), subs:['Visualise your fight plan three times', 'Use box breathing between rounds']},
      {t:'Stay fresh', subs:['Keep strength and plyometrics light', 'Make sleep a priority']}
    ]},
    {goals:['Taper: keep sharp, lose the fatigue.', 'Fight week: calm, ready and rested.'], tasks:[
      {t:'Taper the volume', subs:['Cut your training volume by about half', 'Keep every session short and sharp', 'Make your last hard session at least 3 days before the fight']},
      {t:'Rehearse the game plan', link:L('scenario',{scen:0,sopt:0}), subs:['Run a scenario in your opponent\'s style once', 'Visualise the fight, including the tough moments']},
      {t:'Calm and routine', link:L('breath'), subs:['Do box breathing every day', 'Practise your reset routine', 'Plan your fight-day timings']},
      {t:'Weight and fuel', subs:['Follow your coach\'s plan for weight, food and water']},
      {t:'Fight day', subs:['Have your warm-up ready', 'Pack your gear the night before', 'Fight']}
    ]}
  ];

  /* ---------- building a camp from a length and a fight date ---------- */
  function allocate(W, len){
    if(W <= 1) return [0,0,0,1];
    if(W === 2) return [0,0,1,1];
    if(W === 3) return [0,1,1,1];
    const base = SHARES[len], total = base.reduce((a,b) => a + b, 0);
    const w = base.map(x => Math.floor(W * x / total));
    let rem = W - w.reduce((a,b) => a + b, 0);
    base.map((x,i) => [W * x / total - w[i], i]).sort((a,b) => b[0] - a[0] || a[1] - b[1]).forEach(([,i]) => { if(rem > 0){ w[i]++; rem--; } });
    for(let i = 0; i < 4; i++) while(w[i] < 1){ const j = w.indexOf(Math.max(...w)); w[j]--; w[i]++; }   // every phase gets at least a week
    return w;
  }
  // Counted in days. Today and the fight day both count, so a fight 12 days away is 13 days of camp. The camp starts today when the fight is closer than a full camp,
  // and covers every day to the fight: nothing is left empty at the front. Only a fight further away than the chosen length starts later.
  const daysTo = fightKey => diffDays(todayKey(), fightKey) + 1;
  function plan(len, fightKey){
    const asked = daysTo(fightKey), total = Math.max(1, Math.min(len * 7, asked)), start = dkey(addDays(fromKey(fightKey), -(total - 1)));
    let days;
    if(total >= 21){ const weeks = Math.floor(total / 7); days = allocate(weeks, len).map(w => w * 7); days[days.findIndex(x => x > 0)] += total - weeks * 7; }   // whole weeks, and the spare days go to the first phase
    else { const fight = total <= 2 ? total : Math.min(7, Math.ceil(total / 2)), rest = total - fight, build = rest > 7 ? Math.round(rest * 0.4) : 0; days = [0, build, rest - build, fight]; }   // a short camp: peak, then the taper
    return {total, start, days, asked};
  }
  function build(len, fightKey){
    const {total, start, days, asked} = plan(len, fightKey);
    let offset = 0; const phases = [];
    PHASES.forEach((p, i) => {
      const d = days[i]; if(!d) return;
      const content = CONTENT[i], n = content.tasks.length, k = Math.max(1, Math.min(n, Math.round(n * (d / 7) / FULL[i])));
      const chosen = content.tasks.slice(0, k), sprints = []; let left = d, so = 0, used = 0;
      while(left > 0){
        const sd = Math.min(14, left), si = sprints.length, sprintsLeft = Math.ceil(left / 14), take = Math.ceil((chosen.length - used) / sprintsLeft);
        sprints.push({id:uid(), start:dkey(addDays(fromKey(start), offset + so)), end:dkey(addDays(fromKey(start), offset + so + sd - 1)),
          goal:content.goals[Math.min(si, content.goals.length - 1)], edited:false,
          tasks:chosen.slice(used, used + take).map(t => ({id:uid(), t:t.t, link:t.link, done:false, subs:t.subs.map(s => ({id:uid(), t:s, done:false}))}))});
        used += take; so += sd; left -= sd;
      }
      phases.push({id:p.id, name:p.name, color:p.color, days:d, weeks:Math.max(1, Math.round(d / 7)), start:sprints[0].start, end:sprints[sprints.length - 1].end, sprints});
      offset += d;
    });
    return {id:uid(), v:2, len, weeks:Math.ceil(total / 7), days:total, fight:fightKey, start, phases, asked};
  }

  // The camp people see first: 8 weeks from today, with no setup. Setting a fight date or another length rebuilds it, keeping their ticks, edited
  // goals and own tasks where the new camp still has the same task.
  const defaultCamp = (len = DEFAULT_LEN) => { const c = build(len, dkey(addDays(new Date(), len * 7 - 1))); c.auto = true; return c; };
  function carry(old, nu){
    if(!old) return nu;
    const oldTasks = new Map(); old.phases.forEach(p => p.sprints.forEach(s => s.tasks.forEach(k => oldTasks.set(p.id + '|' + k.t, k))));
    nu.phases.forEach(p => p.sprints.forEach((s, si) => {
      s.tasks.forEach(k => { const o = oldTasks.get(p.id + '|' + k.t); if(!o) return; k.done = o.done;
        k.subs.forEach(sb => { const os = o.subs.find(x => x.t === sb.t); if(os) sb.done = os.done; });
        o.subs.filter(x => x.custom).forEach(x => k.subs.push({...x})); });
      const op = old.phases.find(x => x.id === p.id), os = op && op.sprints[si]; if(os && os.edited){ s.goal = os.goal; s.edited = true; }
    }));
    old.phases.forEach(op => { const np = nu.phases.find(x => x.id === op.id); if(np) op.sprints.flatMap(s => s.tasks.filter(k => k.custom)).forEach(k => np.sprints[0].tasks.push(k)); });
    return nu;
  }

  /* ---------- what the camp says about a day, and about now ---------- */
  function phaseOn(k){
    if(!camp) return null;
    for(const p of camp.phases) for(const s of p.sprints) if(k >= s.start && k <= s.end)
      return {phase:p, sprint:s, name:p.name, color:p.color, week:Math.floor(diffDays(camp.start, k) / 7) + 1, weeks:camp.weeks};
    return null;
  }
  const taskDone = t => t.subs.length ? t.subs.every(s => s.done) : t.done;
  const counts = tasks => ({done:tasks.filter(taskDone).length, total:tasks.length});
  const phaseTasks = p => p.sprints.flatMap(s => s.tasks);
  function current(){
    if(!camp) return null;
    const t = todayKey();
    if(t < camp.start) return {state:'upcoming', days:diffDays(t, camp.start), camp};
    if(t > camp.fight) return {state:'finished', camp};
    const at = phaseOn(t) || phaseOn(camp.fight);
    return {state:'active', camp, ...at, days:diffDays(t, camp.fight)};
  }
  function find(id){
    for(const p of camp.phases) for(const s of p.sprints){
      if(s.id === id) return {sprint:s};
      for(const t of s.tasks){ if(t.id === id) return {task:t, sprint:s}; for(const sub of t.subs) if(sub.id === id) return {sub, task:t, sprint:s}; }
    }
    return {};
  }
  function toggle(id){
    const f = find(id); if(!f.task && !f.sub) return;
    if(f.sub) f.sub.done = !f.sub.done;
    else if(f.task.subs.length){ const to = !taskDone(f.task); f.task.subs.forEach(s => { s.done = to; }); }
    else f.task.done = !f.task.done;
    save();
  }

  /* ---------- the camp screen ---------- */
  const ui = {open:null, editing:null, adding:null, changing:false, info:null, len:DEFAULT_LEN, fight:''};
  const phaseNow = () => { const c = current(); return c && c.state === 'active' ? c.phase.id : null; };
  const minFight = () => dkey(addDays(new Date(), 1));
  function preview(){
    if(!ui.fight){ const end = dkey(addDays(new Date(), ui.len * 7 - 1)); return `<div class="c-prev"><b>${ui.len}-week camp</b><span>Starts today and ends on ${fmt(end)}. Add your fight date to fit the camp to it.</span></div>`; }
    const pl = plan(ui.len, ui.fight), span = d => d % 7 === 0 ? d / 7 + 'w' : d + 'd';
    let note = '';
    if(pl.asked < ui.len * 7) note = `<p class="t-note warn">The fight is ${pl.asked - 1} day${pl.asked === 2 ? '' : 's'} away. The camp starts today and every phase is fitted to the days you have.</p>`;
    else if(pl.asked > ui.len * 7) note = `<p class="t-note">The camp starts on ${fmt(pl.start)}, ${diffDays(todayKey(), pl.start)} days from now.</p>`;
    return `<div class="c-prev"><b>${pl.total < 28 ? pl.total + '-day' : Math.round(pl.total / 7) + '-week'} camp</b><span>${PHASES.map((p,i) => pl.days[i] ? `<i style="--c:${p.color}"></i>${p.name} ${span(pl.days[i])}` : '').filter(Boolean).join(' · ')}</span></div>${note}`;
  }
  function changeHtml(){
    return `<div class="c-change"><h2>Change your camp</h2>
      <div class="rounds">${LENGTHS.map(n => `<button class="round-opt" role="radio" data-len="${n}" aria-checked="${ui.len===n}"><span class="badge">${n}</span><span><strong>${n}-week camp${n===DEFAULT_LEN ? ' (starter)' : ''}</strong><span>${PHASES.map((p,i) => p.name + ' ' + SHARES[n][i] + 'w').join(' · ')}</span></span></button>`).join('')}</div>
      <label class="c-label">Fight date (optional)<input type="date" id="cFight" min="${minFight()}" value="${ui.fight}"></label>
      <div id="cPrev">${preview()}</div>
      <p class="t-note">Your ticks, your edited goals and the tasks you added are kept where the new camp has the same task.</p>
      <div class="acts"><button class="btn" id="cApply">Apply</button><button class="btn ghost" data-cancel-change>Cancel</button></div></div>`;
  }
  // "How the camp works": open the first time, then one tap away
  const INFO_KEY = 'bfCampInfoSeen';
  const infoSeen = () => { try { return !!localStorage.getItem(INFO_KEY); } catch(e){ return true; } };
  const markSeen = () => { try { localStorage.setItem(INFO_KEY, '1'); } catch(e){} };
  function infoHtml(){
    if(ui.info === null) ui.info = !infoSeen();
    if(!ui.info) return '<button class="info-bar" data-info aria-expanded="false"><span class="i">i</span><span>How your training camp works</span><svg class="icon chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
    return `<div class="info-card"><div class="info-top"><h2>How your training camp works</h2><button class="x" data-info-close aria-label="Close">&times;</button></div>
      <p><b>A focus for two weeks at a time.</b> Your camp is split into blocks of two weeks. Each block has one goal and a short list of things to work on, so you always know what you are trying to get better at.</p>
      <p><b>Put your coach's advice here.</b> Add what your coach tells you to work on, plus your own ideas, like "keep my hands up after the jab". Tick them off as they sink in.</p>
      <p><b>Use it when you train.</b> Nothing is scheduled for you. When you plan or do a workout in your calendar, look at this list and pick something to focus on in that session.</p>
      <p><b>Four phases.</b> <span class="ph-k" style="--c:${PHASES[0].color}">Base</span> builds fitness and fundamentals. <span class="ph-k" style="--c:${PHASES[1].color}">Build</span> adds skill and intensity. <span class="ph-k" style="--c:${PHASES[2].color}">Peak</span> sharpens you for the fight. <span class="ph-k" style="--c:${PHASES[3].color}">Fight week</span> is the taper.</p>
      <div class="acts"><button class="btn small" data-info-close>Got it</button></div></div>`;
  }
  const checkbox = (id, on) => `<button class="ck ${on?'on':''}" data-toggle="${id}" role="checkbox" aria-checked="${on}" aria-label="${on?'Done':'Not done'}">&#10003;</button>`;
  const inline = (id, value, ph) => `<div class="inl"><input id="inlIn" value="${esc(value||'')}" placeholder="${ph}" maxlength="140"><button class="btn small" data-ok>Save</button><button class="btn small ghost" data-cancel>Cancel</button></div>`;
  function taskHtml(t){
    const open = t.subs.filter(s => !s.done).length;
    return `<div class="tk"><div class="tk-row">${checkbox(t.id, taskDone(t))}<div class="tk-main"><strong class="${taskDone(t)?'struck':''}">${esc(t.t)}</strong>${t.subs.length ? `<span>${t.subs.length - open} of ${t.subs.length}</span>` : ''}</div>
      ${t.link ? `<button class="mini-btn" data-practise="${t.id}">Practise &rsaquo;</button>` : ''}${t.custom ? `<button class="x" data-del="${t.id}" aria-label="Delete task">&times;</button>` : ''}</div>
      ${t.subs.map(s => `<div class="sb">${checkbox(s.id, s.done)}<span class="${s.done?'struck':''}">${esc(s.t)}</span>${s.custom ? `<button class="x" data-del="${s.id}" aria-label="Delete subtask">&times;</button>` : ''}</div>`).join('')}
      ${ui.adding === t.id ? inline(t.id, '', 'e.g. Step back after the jab') : `<button class="add" data-add-sub="${t.id}">+ Add subtask</button>`}</div>`;
  }
  function sprintHtml(p, s, idx){
    const c = counts(s.tasks), now = todayKey() >= s.start && todayKey() <= s.end;
    return `<div class="sp ${now?'is-now':''}"><div class="sp-head"><b>Focus ${idx + 1}</b><span>${fmt(s.start)} to ${fmt(s.end)}</span><span class="sp-n">${c.done}/${c.total}</span></div>
      <div class="goal-line">${ui.editing === s.id ? inline(s.id, s.goal, 'Your focus for these two weeks') : `<p><b>Goal:</b> ${esc(s.goal)}</p><button class="mini-btn" data-edit-goal="${s.id}" aria-label="Edit the goal">Edit</button>`}</div>
      ${s.tasks.map(taskHtml).join('')}
      ${ui.adding === s.id ? inline(s.id, '', 'e.g. Coach: keep your chin down on the jab') : `<button class="add" data-add-task="${s.id}">+ Add something to work on</button>`}</div>`;
  }
  function campHtml(){
    const cur = current(), fightIn = diffDays(todayKey(), camp.fight);
    const sub = cur.state === 'upcoming' ? `Your camp starts ${cur.days === 1 ? 'tomorrow' : `on ${fmt(camp.start)}, in ${cur.days} days`}.` : cur.state === 'finished' ? 'Your camp is finished.' : `Week ${cur.week} of ${camp.weeks} · ${cur.name} · fight on ${fmt(camp.fight)}`;
    if(ui.open === null) ui.open = new Set([phaseNow() || camp.phases[0].id]);
    return `<div class="t-head"><div><div class="eyebrow">Training camp · ${camp.days && camp.days < 28 ? camp.days + ' days' : camp.weeks + ' weeks'}</div><h1>${cur.state === 'active' ? esc(cur.name) + ' phase' : 'Your camp'}</h1><p class="sub" style="margin:4px 0 0">${sub}</p></div>
      ${fightIn >= 0 ? `<div class="streak on"><b>${fightIn}</b><span>days to fight</span></div>` : ''}</div>
      ${infoHtml()}
      ${camp.auto ? `<p class="t-note">This is your starter ${camp.weeks}-week camp, starting today. Change the length or add your fight date to fit it to your fight.</p>` : ''}
      ${ui.changing ? changeHtml() : '<div class="acts"><button class="btn small" data-change>Change length or fight date</button></div>'}
      ${!camp.auto && (camp.days ? camp.days < camp.len * 7 : camp.asked < camp.len) ? `<p class="t-note warn">Fitted to the ${camp.days ? camp.days + ' days' : camp.weeks + ' weeks'} you had to the fight, with each phase trimmed to match.</p>` : ''}
      <div class="ph-list">${camp.phases.map(p => { const c = counts(phaseTasks(p)), open = ui.open.has(p.id), cur2 = phaseNow() === p.id;
        return `<section class="ph ${open?'open':''}" style="--c:${p.color}"><button class="ph-head" data-ph="${p.id}" aria-expanded="${open}"><span class="dot"></span><b>${p.name}</b>
          <span class="ph-w">${fmt(p.start)} to ${fmt(p.end)} · ${p.days && p.days < 14 ? p.days + ' day' + (p.days === 1 ? '' : 's') : p.weeks + ' wk'}</span>${cur2 ? '<em>you are here</em>' : ''}<span class="ph-n">${c.done}/${c.total}</span><svg class="icon chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
          ${open ? `<div class="ph-body">${p.sprints.map((s,i) => sprintHtml(p, s, i)).join('')}</div>` : ''}</section>`; }).join('')}</div>
      <div class="acts"><button class="btn ghost" id="cReset">Start over</button></div>
      <p class="iq-note">A general plan to work from, not a replacement for your coach.</p>`;
  }
  window.renderCamp = function(){
    $('campBody').innerHTML = campHtml();
    $('inlIn')?.focus();
  };

  $('campBody').addEventListener('click', e => {
    const t = e.target.closest('button'); if(!t) return; const d = t.dataset;
    if('info' in d){ ui.info = true; renderCamp(); }
    else if('infoClose' in d){ ui.info = false; markSeen(); renderCamp(); }
    else if(d.len){ ui.len = +d.len; renderCamp(); }
    else if('change' in d){ ui.changing = true; ui.len = camp.len; ui.fight = camp.auto ? '' : camp.fight; renderCamp(); }
    else if('cancelChange' in d){ ui.changing = false; renderCamp(); }
    else if(t.id === 'cApply'){
      ui.fight = ($('cFight') || {}).value || ui.fight || '';   // read the box itself: some phones announce a picked date with "change" and not "input"
      const fight = ui.fight || dkey(addDays(new Date(), ui.len * 7 - 1)), nu = build(ui.len, fight); nu.auto = !ui.fight;
      camp = carry(camp, nu); ui.changing = false; ui.open = null; save(); renderCamp();
    }
    else if(t.id === 'cReset'){ if(confirm('Start over with a fresh 8-week camp from today? Your ticks and the tasks you added will be cleared.')){ camp = defaultCamp(); ui.changing = false; ui.open = null; save(); renderCamp(); } }
    else if(d.ph){ ui.open.has(d.ph) ? ui.open.delete(d.ph) : ui.open.add(d.ph); renderCamp(); }
    else if(d.toggle){ toggle(d.toggle); renderCamp(); }
    else if(d.practise){ const f = find(d.practise); if(f.task && f.task.link) C.start({type:f.task.link.type, cfg:f.task.link.cfg}); }
    else if(d.editGoal){ ui.editing = d.editGoal; ui.adding = null; renderCamp(); }
    else if(d.addTask || d.addSub){ ui.adding = d.addTask || d.addSub; ui.editing = null; renderCamp(); }
    else if(d.del){ const f = find(d.del); if(f.sub){ f.task.subs = f.task.subs.filter(s => s.id !== d.del); } else if(f.task){ f.sprint.tasks = f.sprint.tasks.filter(x => x.id !== d.del); } save(); renderCamp(); }
    else if('cancel' in d){ ui.editing = ui.adding = null; renderCamp(); }
    else if('ok' in d) commit();
  });
  function commit(){
    const v = ($('inlIn').value || '').trim();
    if(ui.editing){ const f = find(ui.editing); if(f.sprint && v){ f.sprint.goal = v; f.sprint.edited = true; } }
    else if(ui.adding){ const f = find(ui.adding);
      if(v && f.task) f.task.subs.push({id:uid(), t:v, done:false, custom:true});
      else if(v && f.sprint) f.sprint.tasks.push({id:uid(), t:v, done:false, custom:true, subs:[]}); }
    ui.editing = ui.adding = null; save(); renderCamp();
  }
  $('campBody').addEventListener('keydown', e => { if(e.target.id === 'inlIn'){ if(e.key === 'Enter'){ e.preventDefault(); commit(); } else if(e.key === 'Escape'){ ui.editing = ui.adding = null; renderCamp(); } } });
  ['input', 'change'].forEach(ev => $('campBody').addEventListener(ev, e => { if(e.target.id === 'cFight'){ ui.fight = e.target.value; $('cPrev').innerHTML = preview(); } }));

  if(!camp || !camp.phases){ camp = defaultCamp(); save(); }
  else if(!camp.v && !camp.auto && camp.start > todayKey() && camp.asked < camp.len){ const auto = camp.auto; camp = carry(camp, build(camp.len, camp.fight)); camp.auto = auto; save(); }
  window.bfCamp = {get camp(){ return camp; }, showInfo:() => { ui.info = true; }, phaseOn, current, toggle:id => { toggle(id); }, counts, phaseTasks, taskDone, PHASES};
  if(!$('camp').hidden) renderCamp();
})();
