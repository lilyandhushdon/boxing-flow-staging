/* Weight: a log of morning weigh-ins, a fight weight and weigh-in date, and what it takes to get there. Saved as one key, bfWeight, so it syncs to the account like the rest:
   { entries: [{d:'2026-10-26', kg:83.8, note:''}, ...], target: {kg:81, date:''} }   (one entry per day; an empty target date means "use the training camp's fight date").
   The dashboard reads window.bfWeight for its badge and widget. Loads after calendar.js and camp.js, before home.js. */
(() => {
  const $ = id => document.getElementById(id);
  const C = window.bfCal, KEY = 'bfWeight';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const r1 = v => Math.round(v * 10) / 10, kg = v => (v == null ? '--' : r1(v).toFixed(1));
  const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(r1(v)).toFixed(1);
  const todayKey = () => C.dkey(new Date());
  const diffDays = (a, b) => Math.round((C.fromKey(b) - C.fromKey(a)) / 86400000);
  const addDays = (k, n) => C.dkey(C.addDays(C.fromKey(k), n));
  const nice = k => k === todayKey() ? 'Today' : k === addDays(todayKey(), -1) ? 'Yesterday' : C.dayLabel(k);

  let data = {entries:[], target:{kg:null, date:''}};
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d && Array.isArray(d.entries)) data = {entries:d.entries.filter(e => e && e.d && +e.kg > 0), target:{kg:null, date:'', ...(d.target || {})}}; } catch(e){}
  const listeners = new Set(), emit = () => listeners.forEach(f => { try { f(); } catch(e){} });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){} emit(); };
  const sorted = () => data.entries.slice().sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);

  /* ---------- what the log says ---------- */
  const fightDate = () => data.target.date || (window.bfCamp && window.bfCamp.camp && window.bfCamp.camp.fight) || '';
  function stats(){
    const es = sorted(); if(!es.length) return null;
    const last = es.at(-1), prev = es.length > 1 ? es.at(-2) : null, first = es[0];
    const weekAgo = addDays(last.d, -7), base = [...es].reverse().find(e => e.d <= weekAgo) || (diffDays(first.d, last.d) >= 3 ? first : null);
    const win = es.filter(e => diffDays(e.d, last.d) < 7), avg7 = win.reduce((n, e) => n + +e.kg, 0) / win.length;
    // the pace: a straight line through the last two weeks of weigh-ins (needs at least three, over four days or more), in kg a day
    const two = es.filter(e => diffDays(e.d, last.d) <= 14); let slope = null;
    if(two.length >= 3 && diffDays(two[0].d, last.d) >= 4){
      const xs = two.map(e => diffDays(two[0].d, e.d)), ys = two.map(e => +e.kg), n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
      const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0); slope = den ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den : null;
    }
    return {n:es.length, last:+last.kg, lastDate:last.d, prev:prev ? +prev.kg : null, change:prev ? +last.kg - +prev.kg : null, start:+first.kg, startDate:first.d,
      lo:Math.min(...es.map(e => +e.kg)), hi:Math.max(...es.map(e => +e.kg)), avg7, week:base ? +last.kg - +base.kg : null, weekDays:base ? diffDays(base.d, last.d) : 0, slope};
  }
  // where you are against the fight weight: how much is left, in how long, how fast that is, and where the current pace lands
  function plan(){
    const s = stats(), t = data.target.kg; if(!s || !t) return null;
    const fd = fightDate(), days = fd ? diffDays(todayKey(), fd) : null, toGo = s.last - t;
    const perWeek = days != null && days > 0 ? toGo / (days / 7) : null, pct = perWeek != null ? perWeek / s.last * 100 : null;
    const projected = s.slope != null && fd && diffDays(s.lastDate, fd) >= 0 ? s.last + s.slope * diffDays(s.lastDate, fd) : null;   // the last weigh-in plus the pace, carried to weigh-in day
    return {target:t, fightDate:fd, days, toGo, perWeek, pct, projected, done:toGo <= 0.05};
  }

  function add(v, d, note){
    v = Math.round(+v * 10) / 10; d = d || todayKey();
    if(!(v >= 30 && v <= 300)) return false;
    const old = data.entries.find(e => e.d === d); data.entries = data.entries.filter(e => e.d !== d); data.entries.push({d, kg:v, note:note != null ? note : (old ? old.note : '')}); save(); return true;
  }

  /* ---------- the chart ---------- */
  function chart(){
    const es = sorted().filter(e => diffDays(e.d, todayKey()) <= 60), p = plan(); if(es.length < 2) return '<p class="t-note">Log a few days of weight and your chart appears here.</p>';
    const W = 360, H = 200, L = 38, R = 12, T = 12, B = 26, x0 = es[0].d, fd = fightDate(), x1 = fd && diffDays(es.at(-1).d, fd) > 0 ? fd : addDays(es.at(-1).d, 1);
    const span = Math.max(1, diffDays(x0, x1)), X = k => L + diffDays(x0, k) / span * (W - L - R);
    const vals = es.map(e => +e.kg).concat(p ? [p.target] : [], p && p.projected != null ? [p.projected] : []), lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    const avg = es.map(e => { const w = es.filter(o => diffDays(o.d, e.d) >= 0 && diffDays(o.d, e.d) < 7); return [e.d, w.reduce((n, o) => n + +o.kg, 0) / w.length]; });
    const line = pts => pts.map(([k, v], i) => (i ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const ticks = []; for(let v = lo; v <= hi; v += (hi - lo) > 8 ? 2 : 1) ticks.push(v);
    const lbl = (k, anchor) => `<text class="wt-ax" x="${X(k).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}">${C.fromKey(k).getDate()} ${C.MON[C.fromKey(k).getMonth()]}</text>`;
    const proj = p && p.projected != null && fd ? `<path class="wt-proj" d="M${X(es.at(-1).d).toFixed(1)} ${Y(+es.at(-1).kg).toFixed(1)} L${X(fd).toFixed(1)} ${Y(p.projected).toFixed(1)}"/><circle class="wt-pd" cx="${X(fd).toFixed(1)}" cy="${Y(p.projected).toFixed(1)}" r="3.5"/>` : '';
    return `<svg class="wt-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">
      ${ticks.map(v => `<line class="wt-grid" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="wt-ax" x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join('')}
      ${p ? `<line class="wt-target" x1="${L}" x2="${W - R}" y1="${Y(p.target).toFixed(1)}" y2="${Y(p.target).toFixed(1)}"/><text class="wt-tl" x="${W - R}" y="${(Y(p.target) - 5).toFixed(1)}" text-anchor="end">fight weight ${kg(p.target)}</text>` : ''}
      ${proj}<path class="wt-avg" d="${line(avg)}"/><path class="wt-line" d="${line(es.map(e => [e.d, +e.kg]))}"/>
      ${es.map(e => `<circle class="wt-dot" cx="${X(e.d).toFixed(1)}" cy="${Y(+e.kg).toFixed(1)}" r="3"/>`).join('')}
      ${lbl(es[0].d, 'start')}${fd && x1 === fd ? lbl(fd, 'end') : lbl(es.at(-1).d, 'end')}
    </svg>
    <p class="t-note wt-key"><i class="k1"></i>weigh-ins <i class="k2"></i>7-day average ${p && p.projected != null ? '<i class="k3"></i>where this pace lands' : ''}</p>`;
  }

  /* ---------- the screen ---------- */
  const ui = {editing:null, msg:''};
  function planHtml(s, p){
    const fd = fightDate(), camp = window.bfCamp && window.bfCamp.camp && window.bfCamp.camp.fight, usingCamp = !data.target.date && camp;
    let sum = '';
    if(p){
      if(p.done) sum = `<p class="wt-ok"><b>You are at your fight weight.</b> ${p.toGo < -0.5 ? `${kg(-p.toGo)} kg under it.` : ''}</p>`;
      else {
        sum = `<div class="wt-sum"><div><b>${kg(p.toGo)}</b><span>kg to lose</span></div><div><b>${p.days != null ? Math.max(0, p.days) : '--'}</b><span>days to ${fd ? 'weigh-in' : 'go'}</span></div><div><b>${p.perWeek != null ? kg(p.perWeek) : '--'}</b><span>kg a week needed</span></div></div>`;
        if(p.projected != null) sum += `<p class="t-note">At the pace of your last two weeks (${sign(s.slope * 7)} kg a week) you would weigh about <b>${kg(p.projected)} kg</b> at weigh-in, ${p.projected <= p.target + 0.05 ? 'on or under your fight weight.' : `${kg(p.projected - p.target)} kg over it.`}</p>`;
        if(p.pct != null) sum += `<p class="t-note">That is ${r1(p.pct)}% of your body weight a week.</p>`;   // just the number: the plan, a water cut included, is between the fighter and their coach
      }
    } else sum = `<p class="t-note">Set your fight weight and weigh-in date and this works out how much is left, and how fast.</p>`;
    return `<div class="nu-card"><h2 class="nu-fname">Fight weight</h2>${sum}
      <div class="nu-three wt-two"><label class="c-label">Fight weight (kg)<input id="wTarget" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${data.target.kg != null ? kg(data.target.kg) : ''}" placeholder="e.g. 81"></label>
        <label class="c-label">or kg to lose from now<input id="wLose" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="${s ? 'e.g. ' + kg(Math.max(0.5, s.last * 0.05)) : 'e.g. 3'}"></label></div>
      <label class="c-label">Weigh-in date<input id="wTDate" type="date" value="${esc(data.target.date)}"></label>
      <p class="t-note">${data.target.date ? '' : usingCamp ? `Leave the date empty to use your training camp's fight date (${C.dayLabel(camp)}).` : 'Leave the date empty to use your training camp\'s fight date.'}</p>
      <div class="acts"><button class="btn small" data-w-target>Save fight weight</button></div></div>`;
  }
  function body(){
    const s = stats(), p = plan(), es = sorted().reverse(), t = todayKey(), tdy = data.entries.find(e => e.d === t), ed = ui.editing ? data.entries.find(e => e.d === ui.editing) : null;
    const back = '<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>';
    const good = (v) => p ? ((v < 0) === (s.last > p.target)) : null;
    const dl = (v, unit = ' kg') => v == null ? '' : `<span class="wt-d ${good(v) == null ? '' : good(v) ? 'good' : 'bad'}">${v === 0 ? 'no change' : (v < 0 ? '▼ ' : '▲ ') + kg(Math.abs(v)) + unit}</span>`;
    return `${back}<h1>Weight</h1>
      <p class="sub">Weigh yourself at the same time each morning, after the toilet and before food or drink, so the numbers can be compared.</p>
      ${s ? `<div class="nu-card wt-now"><div class="wt-big"><b>${kg(s.last)}</b><span>kg</span></div><p class="t-note">${nice(s.lastDate)}${s.change != null ? ' · ' : ''}${dl(s.change)}${s.change != null ? ' since the last weigh-in' : ''}</p>
        <div class="wt-sum"><div><b>${kg(s.avg7)}</b><span>7-day average</span></div><div><b>${s.week != null ? sign(s.week) : '--'}</b><span>kg over ${s.weekDays || 7} days</span></div><div><b>${s.start !== s.last ? sign(s.last - s.start) : '0.0'}</b><span>kg since ${C.dayLabel(s.startDate).replace(/^\w+ /, '')}</span></div></div></div>` : ''}
      <div class="nu-card"><h2 class="nu-fname">${ed ? 'Change a weigh-in' : tdy ? 'Update today\'s weight' : 'Log your weight'}</h2>${ui.msg ? `<p class="t-note warn">${esc(ui.msg)}</p>` : ''}
        <div class="nu-three wt-two"><label class="c-label">Weight (kg)<input id="wKg" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${ed ? kg(+ed.kg) : tdy ? kg(+tdy.kg) : ''}" placeholder="e.g. 83.8"></label>
          <label class="c-label">Date<input id="wDate" type="date" max="${t}" value="${ed ? ed.d : t}"></label></div>
        <label class="c-label">Note (optional)<input id="wNote" type="text" maxlength="80" value="${esc(ed ? ed.note : tdy ? tdy.note : '')}" placeholder="e.g. after a long run, sauna, ate late"></label>
        <div class="acts"><button class="btn" data-w-save>Save weight</button>${ed ? '<button class="btn ghost" data-w-cancel>Cancel</button>' : ''}</div></div>
      ${planHtml(s, p)}
      <div class="nu-card"><h2 class="nu-fname">Trend</h2>${chart()}</div>
      ${s ? `<div class="nu-card"><h2 class="nu-fname">Numbers</h2><div class="wt-sum"><div><b>${kg(s.lo)}</b><span>lowest</span></div><div><b>${kg(s.hi)}</b><span>highest</span></div><div><b>${s.n}</b><span>weigh-ins</span></div></div>
        ${s.slope != null ? `<p class="t-note">Your pace over the last two weeks is ${sign(s.slope * 7)} kg a week.</p>` : '<p class="t-note">Log three or more weigh-ins over four days to see your pace.</p>'}</div>` : ''}
      ${es.length ? `<h2 class="hr-h">History</h2><div class="wt-hist">${es.map((e, i) => { const nx = es[i + 1], d = nx ? +e.kg - +nx.kg : null;
        return `<button class="nu-row" data-w-edit="${e.d}"><span><strong>${kg(+e.kg)} kg</strong><small>${nice(e.d)}${e.note ? ' · ' + esc(e.note) : ''}</small></span><b class="${d == null ? '' : good(d) == null ? '' : good(d) ? 'wt-g' : 'wt-b'}">${d == null ? '' : d === 0 ? '0.0' : (d < 0 ? '▼ ' : '▲ ') + kg(Math.abs(d))}</b></button>`; }).join('')}</div>` : ''}
      <p class="iq-note">A guide, not medical advice. Weight moves a kilo or more from day to day with food, water and salt, so watch the 7-day average, not one weigh-in.</p>`;
  }
  window.renderWeight = function(){ ui.editing = null; ui.msg = ''; $('weightBody').innerHTML = body(); };
  const redraw = () => { if(!$('weight').hidden){ const y = window.scrollY; $('weightBody').innerHTML = body(); window.scrollTo(0, y); } };
  $('weight').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
    if(d.section){ show(d.section); return; }
    if('wSave' in d){
      const ok = add($('wKg').value, $('wDate').value || todayKey(), ($('wNote').value || '').trim());
      if(!ok){ ui.msg = 'Enter your weight in kilograms, like 83.8.'; return redraw(); }
      if(ui.editing && ui.editing !== $('wDate').value){ data.entries = data.entries.filter(x => x.d !== ui.editing); save(); }
      ui.editing = null; ui.msg = ''; redraw();
    }
    else if('wCancel' in d){ ui.editing = null; ui.msg = ''; redraw(); }
    else if(d.wEdit){ ui.editing = d.wEdit; ui.msg = ''; redraw(); window.scrollTo(0, 0); }
    else if('wTarget' in d){
      const lose = $('wLose').value === '' ? null : +$('wLose').value, cur = stats();
      let v = $('wTarget').value === '' ? null : Math.round(+$('wTarget').value * 10) / 10;
      if(v == null && lose != null && cur) v = Math.round((cur.last - lose) * 10) / 10;   // "I need to lose 3 kg" sets the fight weight to this morning's weight minus 3
      if(v != null && !(v >= 30 && v <= 300)){ ui.msg = 'Enter your fight weight in kilograms, like 81.'; return redraw(); }
      data.target = {kg:v, date:$('wTDate').value || ''}; ui.msg = ''; save(); redraw();
    }
  });
  window.bfWeight = {
    get entries(){ return sorted(); }, get target(){ return data.target; },
    stats, plan, fightDate, add, kg, sign,
    // set the fight weight and weigh-in date from another screen (the water cut); an empty date keeps using the camp's fight date
    setTarget(v, date){ v = Math.round(+v * 10) / 10; if(!(v >= 30 && v <= 300)) return false; data.target = {kg:v, date:date || ''}; save(); return true; },
    onChange:fn => { listeners.add(fn); return () => listeners.delete(fn); },
    open(){ show('weight'); },
    // points for the dashboard's small chart: the last two weeks of weigh-ins
    spark(){ return sorted().filter(e => diffDays(e.d, todayKey()) <= 14).map(e => [diffDays(addDays(todayKey(), -14), e.d), +e.kg]); }
  };
  if(!$('weight').hidden) renderWeight();
})();
