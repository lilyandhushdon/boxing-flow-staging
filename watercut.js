/* Water cut: the fight-week water loading plan. Nothing is typed in twice: the weight to cut is the latest weigh-in (weight.js) minus the fight weight, and the days
   are counted to the weigh-in date, so the plan redraws whenever a new weight is logged. Only two choices are saved, as bfWaterCut, so they sync to the account:
   { type: '24' | '2'   (hours between the weigh-in and the fight), exp: 'beginner' | 'intermediate' | 'advanced' }
   The dashboard shows the widget in fight week (7 days out to weigh-in day). Loads after weight.js, before home.js. */
(() => {
  const $ = id => document.getElementById(id);
  const C = window.bfCal, KEY = 'bfWaterCut';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const r1 = v => Math.round(v * 10) / 10;
  const todayKey = () => C.dkey(new Date());
  const diffDays = (a, b) => Math.round((C.fromKey(b) - C.fromKey(a)) / 86400000);
  const addDays = (k, n) => C.dkey(C.addDays(C.fromKey(k), n));
  const vol = l => l < 1 ? Math.round(l * 100) * 10 + ' mL' : r1(l).toFixed(1) + ' L';
  const rng = (a, b) => Math.abs(a - b) < 0.005 ? vol(a) : a < 1 || b < 1 ? vol(a) + ' – ' + vol(b) : r1(a).toFixed(1) + ' – ' + r1(b).toFixed(1) + ' L';

  // drinks to swap in during the load: [name, carbs g, sodium mg], from the fight dietitian's beverage swaps
  const DRINKS = [['Cordial', 25, 6], ['Sugar free cordial', 0, 38], ['Soft drink', 40, 38], ['Sugar free soft drink', 0.1, 15], ['Latte', 15, 130], ['Black coffee', 0, 20]];
  const TYPES ={'24':'24-hour', '2':'2-hour'}, EXPS = {beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced'};
  // the most that should come off through water, as a % of body weight: shorter time to rehydrate and less experience both mean less
  const CAPS = {beginner:{'2':2, '24':3}, intermediate:{'2':3, '24':4}, advanced:{'2':4, '24':5}};

  // log: the drinks of each day in mL, in the order they were added ({'2026-11-05': [500, 250]}); bottle: the size of the bottle drawn in the tracker
  let data = {type:'24', exp:'intermediate', bottle:1000, log:{}, time:'11:00'};   // time: when the weigh-in is on the day, shown in the weigh-in day's plan
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d){ if(typeof d.time === 'string' && /^\d\d:\d\d$|^$/.test(d.time)) data.time = d.time; if(TYPES[d.type]) data.type = d.type; if(EXPS[d.exp]) data.exp = d.exp; if([500, 750, 1000].includes(d.bottle)) data.bottle = d.bottle;
    if(d.log && typeof d.log === 'object') Object.entries(d.log).forEach(([k, a]) => { if(Array.isArray(a)) data.log[k] = a.filter(v => v > 0); }); } } catch(e){}
  const listeners = new Set(), emit = () => listeners.forEach(f => { try { f(); } catch(e){} });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){} emit(); };

  /* ---------- the numbers, from the weight log ---------- */
  // the weigh-in date: the one set in Weight, else the fight date of a camp the person set up (a starter camp's end date is only a placeholder)
  function weighIn(){
    const WT = window.bfWeight, camp = window.bfCamp && window.bfCamp.camp;
    return (WT && WT.target && WT.target.date) || (camp && !camp.auto && camp.fight) || '';
  }
  function state(){
    const WT = window.bfWeight; if(!WT) return null;
    const s = WT.stats(), target = WT.target && WT.target.kg, wi = weighIn(), t0 = todayKey(), days = wi ? diffDays(t0, wi) : null;
    const st = {ready:false, s, target, weighIn:wi, days, type:data.type, exp:data.exp};
    if(!s || !target || !wi) return st;
    const w = s.last, cut = Math.max(0, w - target), pct = cut / w * 100, compressed = days < 5, max = compressed ? Math.min(CAPS[data.exp][data.type], 3) : CAPS[data.exp][data.type];
    return Object.assign(st, {ready:true, w, cut, pct, max, compressed, over:pct > max + 0.05, needs:pct >= 1, stale:diffDays(s.lastDate, t0)});
  }
  const fightWeek = st => !!st && !!st.weighIn && st.days != null && st.days >= 0 && st.days <= 7;

  /* ---------- the water you have drunk ---------- */
  const drunk = (k = todayKey()) => (data.log[k] || []).reduce((a, b) => a + b, 0);
  function drink(ml){
    ml = Math.round(+ml); if(!(ml > 0 && ml <= 3000)) return false;
    const k = todayKey(); (data.log[k] = data.log[k] || []).push(ml);
    Object.keys(data.log).forEach(x => { if(diffDays(x, k) > 30) delete data.log[x]; });   // a month is plenty to keep
    save(); return true;
  }
  function undo(){ const k = todayKey(), a = data.log[k]; if(!a || !a.length) return; a.pop(); if(!a.length) delete data.log[k]; save(); }
  // bottles: one per bottle-size of today's goal (the top of the day's range), each filling as you drink. On a cut day the range is a limit, and it turns red when you pass it.
  function tracker(st, withSize){
    const t = todayKey(), ml = drunk(t), size = data.bottle, row = st && st.ready && st.days >= 0 ? day(st, Math.min(st.days, 7)) : null, lit = row && row.lit, goal = lit ? lit[1] * 1000 : 0;
    const limit = row && (row.k === 'cut' || row.k === 'weighin'), over = !!goal && limit && ml > goal + 50, n = goal ? Math.max(1, Math.ceil(goal / size)) : Math.max(1, Math.ceil(ml / size) + (ml % size === 0 ? 1 : 0));
    const bottles = Array.from({length:Math.min(n, 24)}, (_, i) => `<i class="wc-bottle${over ? ' over' : ''}" style="--f:${Math.round(Math.max(0, Math.min(1, (ml - i * size) / size)) * 100)}%"></i>`).join('');
    const left = goal ? Math.max(0, goal - ml) : 0;
    const line = !goal ? (row && row.k === 'weighin' ? 'Sips only until you are off the scale.' : '')
      : over ? `Over today's limit of ${vol(goal / 1000)}. Stop drinking and keep sips small.`
      : left > 0 ? (limit ? `${vol(left / 1000)} left today. Keep it to sips.` : `${vol(left / 1000)} to go, about ${r1(left / size).toFixed(1)} bottle${left / size > 1.05 ? 's' : ''}.`)
      : 'Today\'s water is done. Well done.';
    return `<div class="wc-track"><div class="wc-drunk"><b>${vol(ml / 1000)}</b><span>${goal ? `of ${row.water}` : 'today'}</span></div>
      <div class="wc-bottles" role="img" aria-label="${r1(ml / size).toFixed(1)} of ${n} bottles">${bottles}</div>
      ${line ? `<p class="t-note ${over ? 'wc-bad' : ''}">${line}</p>` : ''}
      <div class="wc-add"><button class="btn small ghost" data-wc-add="250">+ 250 mL</button><button class="btn small ghost" data-wc-add="500">+ 500 mL</button><button class="btn small" data-wc-add="${size}">+ 1 bottle</button><button class="linkbtn" data-wc-undo ${ml ? '' : 'disabled'}>Undo</button></div>
      ${withSize ? `<p class="c-label">Bottle size</p><div class="wc-seg">${[500, 750, 1000].map(s => `<button class="${s === size ? 'on' : ''}" data-wc-bottle="${s}" aria-pressed="${s === size}">${s === 1000 ? '1 L' : s + ' mL'}</button>`).join('')}</div>` : ''}</div>`;
  }

  // A hot bath estimate. Studies of MMA fighters (hot water at about 38 °C, one to two hours) measured 1.7 to 2.2 kg, about 2 to 2.8% of body weight; field reports are lower per
  // soak. So the range here is 1.5 to 2.5% of body weight for a one to two hour bath, and it varies a lot between people. It is not added to the water plan.
  function bath(st){
    if(!st || !st.ready) return null;
    const lo = r1(st.w * 0.015), hi = r1(st.w * 0.025);
    return {lo, hi, text:`${lo.toFixed(1)} – ${hi.toFixed(1)} kg`, share:st.cut > 0 ? Math.round(Math.min(1, hi / st.cut) * 100) : 0};
  }
  const bathNote = st => { const b = bath(st); return b ? `<p class="t-note wc-bath"><b>Hot bath estimate: ${b.text}</b> for a 1 to 2 hour soak at about 38 °C (1.5 to 2.5% of body weight). From studies of MMA fighters. Yours will differ, so weigh before and after.</p>` : ''; };

  /* ---------- the plan ---------- */
  // one day, d days before the weigh-in: how much to drink, the sodium, the food. Water is in mL per kg of body weight, so it follows the weight.
  // `lit` is the day's water range in litres (null for sips only); the water tracker uses it as the goal or the limit
  let lit = null;
  function day(st, d){ lit = null; const r = dayRaw(st, d); r.lit = lit; return r; }
  function dayRaw(st, d){
    // sodium in mg, by body weight: normal is about 30 to 45 mg/kg (2,400 to 3,600 mg at 80 kg), kept a little higher while loading so the body keeps flushing, then cut to a flat 500 mg or less
    const w = st.w, L = (a, b) => { lit = [w * a / 1000, w * b / 1000]; return rng(lit[0], lit[1]); }, mg = v => (Math.round(v / 100) * 100).toLocaleString('en-NZ'), Na = (a, b) => mg(w * a) + ' – ' + mg(w * b) + ' mg', LOW = 'Under 500 mg',
      k = d >= 4 ? 'normal' : d >= 2 ? 'load' : d === 1 ? 'peak' : 'weighin';
    const title = d === 0 ? 'Weigh-in day' : d + (d === 1 ? ' day out' : ' days out'), date = addDays(st.weighIn, -d);
    if(!st.needs) return {d, k:'normal', title, date, tag:d === 0 ? 'Weigh-in' : 'Normal', water:d === 0 ? 'Normal' : L(40, 50), sodium:Na(30, 45), food:'Normal',
      note:d === 0 ? 'No cut needed. Eat and drink as usual and weigh in.' : 'You are within a kilo of your fight weight, so there is nothing to cut. Drink to thirst and eat normally.'};
    if(d >= 4) return {d, k, title, date, tag:'Normal', water:L(40, 50), sodium:Na(30, 45), food:'Normal', note:d === 4 ? 'Train and eat as usual. The water load starts tomorrow.' : 'Train and eat as usual. Keep drinking to thirst.'};
    // The protocol from the fight dietitian's research summary: 100 mL per kg of body weight a day for the 3 days of the load (3 days out, 2 days out and the day before the weigh-in),
    // then 15 mL per kg from the hot bath on the night before until the weigh-in. 100 mL/kg is the most a day. loadDays is how many of the 3 load days are still ahead.
    const loadDays = Math.min(st.days, 3), pace = Math.round(w * 100 / 16 / 10) * 10, bathR = `${r1(w * 0.015).toFixed(1)} – ${r1(w * 0.025).toFixed(1)} kg`;   // pace: mL an hour over 16 waking hours
    const paceNote = ` About ${pace} mL an hour across your waking hours. Never more than 1 L in an hour, and ideally no more than 500 mL.${pace > 500 ? ' That is over 500 mL an hour, so start early and spread it evenly.' : ''}`;
    const few = loadDays < 3 ? ` You only have ${loadDays === 1 ? 'one day' : 'two days'} of loading, not three, so expect less to come off.` : '';
    if(d >= 2) return {d, k, title, date, tag:'Water load', water:L(100, 100), sodium:Na(40, 50), food:'Low-residue',
      note:'All fluids count towards the load (coffee included). Do not drop sodium out completely, and do not use distilled water.' + paceNote + (d === 3 ? ' Move to low-fibre food from today.' : '') + (d === 2 ? few : '')};
    if(d === 1) return {d, k, title, date, tag:'Load, then bath', water:L(100, 100), sodium:Na(40, 50), food:'Low-residue, small meals',
      parts:[['Day', 'The last load day: 100 mL/kg, with sodium kept in, spread across your waking hours.'], ['Before bed', 'Stop the load drinking before bed, and before the workout.'],
        ['Evening', `The sweat workout, then the hot bath (about ${bathR}). Keep each short, have someone nearby, and get out if you feel unwell.`],
        ['After the bath', `Switch to 15 mL/kg: ${vol(w * 0.015)} in total from here until the weigh-in. Sips only, sodium under 500 mg. Then sleep.`]],
      note:'Friday is a full load day. The cut to 15 mL/kg starts after the bath, not at midnight.' + paceNote + (loadDays === 1 ? few : '')};
    // weigh-in morning: still on the 15 mL/kg allowance from the bath. Weigh on waking, and one more short session only if still over.
    lit = [w * 15 / 1000, w * 15 / 1000];
    const left = st.w - st.target, b = left > 0.2 ? `${r1(Math.min(left, st.w * 0.015)).toFixed(1)} – ${r1(Math.min(left, st.w * 0.025)).toFixed(1)} kg` : '', at = data.time ? ' at ' + data.time : '';
    return {d, k, title, date, tag:'Weigh-in', water:`${vol(lit[1])} (sips)`, sodium:LOW + ' until after', food:'Light, low-fibre',
      parts:[['On waking', `Weigh yourself first. ${left > 0.2 ? `You are ${r1(left).toFixed(1)} kg over your fight weight.` : 'You are at your fight weight, so you are done.'}`],
        ['Morning', `Sips only, from the ${vol(w * 0.015)} allowance you started after the bath. Whatever is left of it, and no more.`],
        ...(left > 0.2 ? [['If still over', `One more short session is possible (about ${b}). Keep it short, have someone nearby, and finish well before the weigh-in. Dry off, rest, and only sip.`]] : []),
        ['Weigh-in' + at, 'Step on the scale, then start rehydrating straight away.']],
      note:'Sips only if you really need them, until you are off the scale. Then start rehydrating.'};
  }
  function days(st){
    const from = Math.min(st.days, 7), out = []; for(let d = from; d >= 0; d--) out.push(day(st, d)); return out;
  }
  // after the scale: fluids first, then carbs and salt. Volumes are fixed for the short window; the total is set by how much weight came off.
  function rehydrate(st){
    const two = st.type === '2', steps = two ? [
      {h:'Hour 1', t:'Initial rehydration', ml:'300 – 400 mL', n:'Electrolyte drink with about 500 to 1,000 mg of sodium a litre, sipped'},
      {h:'Hour 1.5', t:'Carbohydrate replenishment', ml:'300 – 400 mL', n:'Carbohydrate drink'},
      {h:'Hour 2', t:'Pre-fight', ml:'200 – 300 mL', n:'Water or a sports drink'}
    ] : [
      {h:'Hour 1', t:'Initial rehydration', ml:'400 – 600 mL', n:'Electrolyte drink with about 500 to 1,000 mg of sodium a litre, sipped'},
      {h:'Hour 2', t:'Carbohydrates and salt', ml:'400 – 500 mL', n:'A small meal of easy carbs (rice, toast, banana) with a pinch of salt'},
      {h:'Hours 3 – 6', t:'Keep it coming', ml:'About 500 mL an hour', n:'Water or a sports drink, with a normal meal'},
      {h:'Evening', t:'Back to full', ml:'To thirst', n:'Normal meals. Check your weight before bed: you want to be most of the way back.'}
    ];
    return {steps, total:st.cut > 0.2 ? rng(st.cut * 1.25, st.cut * 1.5) : ''};
  }

  /* ---------- the screen ---------- */
  const ui = {msg:''};
  const seg = (attr, opts, cur) => `<div class="wc-seg">${Object.entries(opts).map(([k, l]) => `<button class="${k === cur ? 'on' : ''}" data-${attr}="${k}" aria-pressed="${k === cur}">${l}</button>`).join('')}</div>`;
  function dayCard(r, today){
    return `<div class="wc-day wc-${r.k}${r.d === today ? ' now' : ''}"><div class="wc-top"><div><strong>${r.title}</strong><small>${r.d === today ? 'Today' : C.dayLabel(r.date)}</small></div><span class="wc-tag">${r.tag}</span></div>
      <div class="wc-grid"><div><span>Water</span><b>${esc(r.water)}</b></div><div><span>Sodium</span><b>${esc(r.sodium)}</b></div><div><span>Food</span><b>${esc(r.food)}</b></div></div>
      ${r.parts ? `<ul class="wc-parts">${r.parts.map(([h, t]) => `<li><b>${esc(h)}</b> ${esc(t)}</li>`).join('')}</ul>` : ''}
      <p class="t-note">${esc(r.note)}</p></div>`;
  }
  function body(){
    const st = state(), back = '<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>';
    const head = `${back}<h1>Water cut</h1><p class="sub">Your fight-week water loading plan, worked out from your weight, your fight weight and your weigh-in date. It updates each time you log your weight.</p>`;
    const WT = window.bfWeight, ss = WT && WT.stats(), tg = WT && WT.target, tk = todayKey();
    const setup = `<div class="nu-card"><h2 class="nu-fname">Your numbers</h2>
      <p class="t-note">Change any of these and the plan below updates. Weight and fight weight are saved in Weight too.</p>
      ${ui.msg ? `<p class="wc-warn">${esc(ui.msg)}</p>` : ''}
      <div class="nu-three wt-two"><label class="c-label">Weight now (kg)<input id="wcNow" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${ss ? r1(ss.last).toFixed(1) : ''}" placeholder="e.g. 80"></label>
        <label class="c-label">Fight weight (kg)<input id="wcTarget" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${tg && tg.kg ? r1(tg.kg).toFixed(1) : ''}" placeholder="e.g. 77"></label></div>
      <label class="c-label">Weigh-in date<input id="wcDate" type="date" min="${tk}" value="${esc(weighIn())}"></label>
      <label class="c-label">Weigh-in time<input id="wcTime" type="time" value="${esc(data.time)}"></label>
      <p class="c-label">Time between weigh-in and the fight</p>${seg('wc-type', TYPES, data.type)}
      <p class="c-label">Cutting experience</p>${seg('wc-exp', EXPS, data.exp)}
      <div class="acts"><button class="btn small" data-wc-save>Update plan</button></div></div>`;
    const note = '<p class="iq-note">A guide, not medical advice. Cutting weight through water carries real risks, and it is not for anyone under 18. Talk to your coach or a doctor before you do it, never use it to get under a weight you cannot make safely, and stop and drink if you feel dizzy, faint or unwell.</p>';
    if(!st) return head + '<p class="t-note">The weight log is not available.</p>';
    if(!st.ready){
      const miss = [!st.s && 'log your weight', !st.target && 'set your fight weight', !st.weighIn && 'set your weigh-in date'].filter(Boolean);
      return `${head}<div class="nu-card"><h2 class="nu-fname">Water today</h2>${tracker(st, true)}</div>${setup}<div class="nu-card"><h2 class="nu-fname">Set up your cut</h2><p class="t-note">To build the plan, ${miss.join(', ').replace(/, ([^,]*)$/, ' and $1')} in Weight.</p><div class="acts"><button class="btn" data-wc-weight>Open Weight</button></div></div>${note}`;
    }
    const wk = fightWeek(st), up = st.days > 7 ? st.days - 7 : 0, rows = st.days >= 0 ? days(st) : [], rh = st.days >= 0 ? rehydrate(st) : null;
    const banner = st.days < 0 ? '<div class="wc-note"><b>Your weigh-in date has passed.</b> Set the date of your next weigh-in in Weight to build a new plan.</div>'
      : up ? `<div class="wc-note"><b>Fight week starts in ${up} day${up === 1 ? '' : 's'}.</b> This is how your plan looks at your weight today. It will change as your weight does.</div>` : '';
    const warns = [];
    if(st.ready && !st.needs && st.w > st.target) warns.push('You are under a kilo from your fight weight, so there is no water cut to plan.');
    if(st.over) warns.push(`<b>${r1(st.cut)} kg is ${r1(st.pct)}% of your body weight, more than the ${st.max}% this plan allows</b> for a ${TYPES[st.type]} weigh-in at your level. Do not try to get all of it from water. Talk to your coach and a doctor, and think about a different weight class.`);
    if(st.compressed && st.days >= 0 && st.needs) warns.push(`With ${st.days === 0 ? 'the weigh-in today' : st.days + ' day' + (st.days === 1 ? '' : 's')} left there is little time to load water, so this plan is shorter and works less well. The limit is ${st.max}%.`);
    if(st.stale > 2) warns.push(`This uses your weigh-in from ${st.stale} days ago. Log today's weight to update it.`);
    return `${head}${banner}
      <div class="nu-card"><div class="wt-sum"><div><b>${r1(st.cut).toFixed(1)}</b><span>kg to cut</span></div><div><b>${r1(st.pct).toFixed(1)}%</b><span>of body weight</span></div><div><b>${st.days >= 0 ? st.days : '--'}</b><span>days to weigh-in</span></div></div>
        <p class="t-note">${r1(st.w).toFixed(1)} kg now (${st.stale === 0 ? 'today' : C.dayLabel(st.s.lastDate)}), fight weight ${r1(st.target).toFixed(1)} kg, weigh-in ${C.dayLabel(st.weighIn)}. Most you should take off with water: <b>${st.max}%</b> (${r1(st.w * st.max / 100).toFixed(1)} kg).</p>
        ${warns.map(w => `<p class="wc-warn">${w}</p>`).join('')}</div>
      <div class="nu-card"><h2 class="nu-fname">Water today</h2>${tracker(st, true)}</div>
      ${st.needs ? `<div class="nu-card"><h2 class="nu-fname">Hot bath</h2>${bathNote(st)}<p class="t-note">Studies of MMA fighters found about 1.7 kg lost in two 60-minute bath rounds, and about 2.2 kg in a 2-hour protocol. Salt (Epsom) in the water made no real difference. Your own loss is the only number that counts: weigh before and after, and your estimate here is a guide.</p>
        <p class="wc-warn">Heat on top of a water cut raises the risk of dizziness, fainting and heat illness. Keep it short, have someone nearby, drink what the plan allows, and get out if you feel unwell. Not for anyone under 18.</p></div>` : ''}
      ${setup}
      ${rows.length ? `<div class="nu-card"><h2 class="nu-fname">Day by day</h2>${rows.map(r => dayCard(r, st.days)).join('')}</div>` : ''}
      ${rh ? `<div class="nu-card"><h2 class="nu-fname">After the scale</h2><p class="t-note">Rehydrate slowly. Sip, do not gulp.${rh.total ? ` Over the next 24 hours, aim to take in about <b>${rh.total}</b>, which is 125 to 150% of the weight you lost.` : ''}</p>
        ${rh.steps.map(s => `<div class="wc-day wc-load"><div class="wc-top"><div><small>${s.h}</small><strong>${s.t}</strong></div><span class="wc-tag">${esc(s.ml)}</span></div><p class="t-note">${esc(s.n)}</p></div>`).join('')}</div>` : ''}
      <div class="nu-card"><h2 class="nu-fname">Drink swaps for the load</h2><p class="t-note">Water is not the only way to load: all fluids count, and coffee will not ruin it. Watch the sodium of what you swap in on the low-sodium days. Per serve:</p>
        <div class="wc-swaps">${DRINKS.map(([n, c, s]) => `<div><span>${n}</span><b>${c} g carb</b><small>${s} mg sodium</small></div>`).join('')}</div>
        <p class="t-note">Do not use distilled water (it has no electrolytes). If you get nausea, dizziness, fatigue, muscle spasms, confusion, swelling or headaches, stop and see a doctor.</p></div>
      <div class="nu-card"><h2 class="nu-fname">How this works</h2><ol class="wc-how"><li><b>Water loading.</b> 100 mL per kg of body weight a day for 3 days (the last is the day before weigh-in), then 15 mL per kg from the hot bath that night until the weigh-in. The idea is that the high intake makes the body flush more fluid than it normally would. The research on it is limited.</li><li><b>Salt.</b> Kept in during the load (never removed completely), then low the day before so less water is held.</li><li><b>Pace.</b> Never more than 1 L in an hour, ideally no more than 500 mL, with drinking spread across the day. Chugging large amounts is where the risk is.</li><li><b>Low-residue food.</b> Low-fibre food in the last days means less in the gut at the scale.</li><li><b>Cutting the water.</b> The body keeps flushing for a day after you stop drinking, so the last of the weight comes off.</li></ol></div>
      ${note}`;
  }
  window.renderWaterCut = function(){ $('watercutBody').innerHTML = body(); };
  const redraw = () => { if(!$('watercut').hidden){ const y = window.scrollY; $('watercutBody').innerHTML = body(); window.scrollTo(0, y); } };
  $('watercut').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
    if(d.section) show(d.section);
    else if('wcWeight' in d) show('weight');
    else if(d.wcAdd){ drink(d.wcAdd); redraw(); }
    else if('wcUndo' in d){ undo(); redraw(); }
    else if(d.wcBottle){ data.bottle = +d.wcBottle; save(); redraw(); }
    else if('wcSave' in d){
      const WT = window.bfWeight, now = $('wcNow').value, tg = $('wcTarget').value, dt = $('wcDate').value; data.time = $('wcTime').value || ''; save();
      if(now !== '' && !WT.add(now)){ ui.msg = 'Enter your weight in kilograms, like 80.'; return redraw(); }
      if(tg !== '' && !WT.setTarget(tg, dt)){ ui.msg = 'Enter your fight weight in kilograms, like 77.'; return redraw(); }
      if(tg === '' && WT.target && WT.target.kg) WT.setTarget(WT.target.kg, dt);
      ui.msg = ''; redraw();
    }
    else if(d.wcType && TYPES[d.wcType]){ data.type = d.wcType; save(); redraw(); }
    else if(d.wcExp && EXPS[d.wcExp]){ data.exp = d.wcExp; save(); redraw(); }
  });
  if(window.bfWeight) window.bfWeight.onChange(redraw);   // a new weigh-in or fight weight redraws the plan

  window.bfWaterCut = {
    state, fightWeek, day, days, rehydrate, vol, weighIn, tracker, drink, undo, drunk, bath, bathNote,
    today(st){ return st && st.ready && st.days >= 0 ? day(st, Math.min(st.days, 7)) : null; },
    onChange:fn => { listeners.add(fn); return () => listeners.delete(fn); },
    open(){ show('watercut'); }
  };
  if(!$('watercut').hidden) renderWaterCut();
})();
