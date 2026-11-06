/* Nutrition: log what you eat, see calories and macros against a daily target, and keep it all in your own account.
   Sign-in and storage are Supabase (config in supabase-config.js; the tables and the rules that keep each person's rows private are in supabase/migrations).
   Foods come from /api/foods (netlify/functions/foods.mjs): USDA FoodData Central for everyday foods and Open Food Facts for packaged ones, New Zealand products first.
   An entry keeps the food's nutrients per 100 g, so changing the amount works out the totals again. Loads after calendar.js; home.js reads window.bfNutri for the widget. */
(() => {
  const $ = id => document.getElementById(id);
  const C = window.bfCal;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
  const CACHE = 'bfNutriCache';
  const ACTIVITY = [[1.2, 'Rarely train'], [1.375, 'Light: 1 to 3 sessions a week'], [1.55, 'Moderate: 3 to 5 sessions a week'], [1.725, 'Hard: 6 to 7 sessions a week'], [1.9, 'Very hard: twice a day or a physical job']];
  // "60 g", "2 x 1 cup, sliced", "1 serving": the amount and what it is an amount of, without saying the number twice
  const amtLabel = e => { const q = Math.round(e.amount * 10) / 10, l = e.unit_label || ''; return l === 'g' || !l ? `${q} g` : /^\d/.test(l) ? (q === 1 ? l : `${q} x ${l}`) : `${q} ${l}`; };
  const syncText = () => { const c = window.bfCloud, s = c && c.status; return s === 'syncing' ? 'Saving to your account…' : s === 'error' || s === 'offline' ? 'Offline. Changes are kept on this device and saved to your account when you are back online.' : 'Everything in the app is saved to your account' + (c && c.last ? ' · last synced ' + new Date(c.last).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : '') + '.'; };
  const r0 = v => Math.round(v), r1 = v => Math.round(v * 10) / 10, num = v => (v === '' || v == null || isNaN(+v) ? null : +v);
  const mealNow = () => { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 20 ? 'dinner' : 'snacks'; };
  const todayKey = () => C.dkey(new Date());

  const S = {sb:null, user:null, ready:false, day:todayKey(), entries:[], profile:null, view:'day', meal:mealNow(), err:'', busy:false,
    q:'', results:null, note:'', searching:false, recent:[], custom:[], pick:null, editing:null, sent:false, email:'', info:'', mode:'password', notice:''};
  const listeners = new Set(), emit = () => listeners.forEach(f => { try { f(); } catch(e){} });
  let cache = {}; try { cache = JSON.parse(localStorage.getItem(CACHE) || '{}') || {}; } catch(e){}
  const saveCache = () => { try { localStorage.setItem(CACHE, JSON.stringify(cache)); } catch(e){} };

  /* ---------- units and sums ---------- */
  const unitKJ = () => !!(S.profile && S.profile.energy_unit === 'kj') || (!S.profile && cache.unit === 'kj');
  const energy = k => unitKJ() ? r0(k * 4.184).toLocaleString() + ' kJ' : r0(k).toLocaleString() + ' kcal';
  const energyNum = k => unitKJ() ? r0(k * 4.184) : r0(k);
  const sum = list => list.reduce((t, e) => ({kcal:t.kcal + (+e.kcal || 0), protein:t.protein + (+e.protein || 0), carbs:t.carbs + (+e.carbs || 0), fat:t.fat + (+e.fat || 0)}), {kcal:0, protein:0, carbs:0, fat:0});
  const targets = () => { const p = S.profile; return p && p.kcal_target ? {kcal:p.kcal_target, protein:p.protein_g, carbs:p.carbs_g, fat:p.fat_g} : null; };
  const amounts = (per100, grams) => { const f = grams / 100, v = k => (per100[k] == null ? null : r1(per100[k] * f)); return {kcal:r0((per100.kcal || 0) * f), protein:r1((per100.protein || 0) * f), carbs:r1((per100.carbs || 0) * f), fat:r1((per100.fat || 0) * f), fibre:v('fibre'), sugar:v('sugar'), sodium_mg:per100.sodium_mg == null ? null : r0(per100.sodium_mg * f)}; };
  function updateCache(){
    if(!S.user) { cache = {unit:cache.unit}; saveCache(); return; }
    if(S.day === todayKey()){ const t = sum(S.entries); cache = {...cache, user:S.user.email, day:S.day, ...t, target:targets(), unit:S.profile ? S.profile.energy_unit : cache.unit}; saveCache(); }
  }

  /* ---------- the account (the client and sign-in state live in cloud.js, shared with the sync of the rest of the app) ---------- */
  let initP = null;
  function init(){
    if(initP) return initP;
    initP = (async () => {
      if(!window.bfCloud) throw new Error('cloud');
      await window.bfCloud.init(); S.sb = window.bfCloud.sb; S.user = window.bfCloud.user;
      window.bfCloud.onAuth((ev, user, was) => {
        S.user = user;
        if(ev === 'SIGNED_IN' && !was) afterSignIn();
        if(ev === 'SIGNED_OUT'){ S.entries = []; S.profile = null; S.view = 'day'; updateCache(); paint(); emit(); }
      });
      S.ready = true;
      if(S.user) await loadAll().catch(fail);
      paint(); emit();
    })().catch(e => { initP = null; S.ready = true; S.err = 'Couldn\'t reach the sign-in service. Check your connection and try again.'; paint(); emit(); });
    return initP;
  }
  async function afterSignIn(){
    // signing in with an emailed link opens the app with the token in the address: clear it, and land on this screen
    if(/access_token|refresh_token|error_description/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    S.sent = false; S.view = 'day'; await loadAll().catch(fail); updateCache(); show('nutrition'); emit();
  }
  const fail = e => { console.error(e); S.err = 'Something went wrong talking to the server. Check your connection and try again.'; S.busy = false; paint(); };
  async function loadAll(){ await Promise.all([loadProfile(), loadDay(S.day)]); updateCache(); }
  async function loadProfile(){ const {data, error} = await S.sb.from('nutrition_profile').select('*').maybeSingle(); if(error) throw error; S.profile = data; }
  async function loadDay(day){
    const {data, error} = await S.sb.from('food_entries').select('*').eq('day', day).order('created_at'); if(error) throw error;
    if(day === S.day) S.entries = data; return data;
  }
  // the week: each day's totals from Monday to Sunday, so over on one day and under on another shows up against the week's budget
  async function loadWeek(){
    const start = S.wkStart, end = C.dkey(C.addDays(C.fromKey(start), 6));
    const {data, error} = await S.sb.from('food_entries').select('day,kcal,protein,carbs,fat').gte('day', start).lte('day', end); if(error) throw error;
    if(start !== S.wkStart) return;
    S.wk = {}; for(const e of data || []){ const d = S.wk[e.day] || (S.wk[e.day] = {kcal:0, protein:0, carbs:0, fat:0}); d.kcal += +e.kcal || 0; d.protein += +e.protein || 0; d.carbs += +e.carbs || 0; d.fat += +e.fat || 0; }
  }
  async function loadFoods(){   // what to offer before anything is typed: recent foods and the person's own
    const [r, c] = await Promise.all([S.sb.from('food_entries').select('name,brand,source,source_id,per100,amount,unit_label,grams,kcal,protein,carbs,fat').not('source', 'eq', 'quick').order('created_at', {ascending:false}).limit(80),
      S.sb.from('custom_foods').select('*').order('created_at', {ascending:false})]);
    const seen = new Set(); S.recent = [];
    for(const e of r.data || []){ const k = e.source + ':' + (e.source_id || e.name); if(seen.has(k) || !e.per100) continue; seen.add(k); S.recent.push(foodFromEntry(e)); if(S.recent.length >= 15) break; }
    S.custom = (c.data || []).map(foodFromCustom);
  }
  const foodFromEntry = e => ({id:e.source + ':' + (e.source_id || ''), source:e.source, sourceId:e.source_id, name:e.name, brand:e.brand || '', per100:e.per100, serving:e.grams && e.amount ? {label:e.unit_label || '1 serving', grams:e.grams / e.amount} : null});
  const foodFromCustom = c => ({id:'custom:' + c.id, source:'custom', sourceId:c.id, name:c.name, brand:c.brand || '', per100:c.per100, serving:c.serving_g ? {label:c.serving_label || '1 serving', grams:+c.serving_g} : null});

  /* ---------- a person's targets, worked out from their body and goal (Mifflin-St Jeor, the usual formula) ---------- */
  function suggest(p){
    if(!p.sex || !p.height_cm || !p.weight_kg || !p.birth_year) return null;
    const age = new Date().getFullYear() - p.birth_year, bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * age + (p.sex === 'male' ? 5 : -161);
    const tdee = bmr * (p.activity || 1.55), adj = p.goal === 'lose' ? -(p.rate_kg_week || 0.25) * 1100 : p.goal === 'gain' ? (p.rate_kg_week || 0.25) * 1100 : 0;
    const kcal = Math.max(0, Math.round((tdee + adj) / 10) * 10);   // exactly what the pace works out to: no floor and no cap, the person decides (and can type any targets of their own)
    const protein = r0(p.weight_kg * (p.goal === 'lose' ? 2.2 : 2)), fat = r0(kcal * 0.25 / 9), carbs = Math.max(0, r0((kcal - protein * 4 - fat * 9) / 4));
    return {kcal, protein, carbs, fat, maintenance:Math.round(tdee / 10) * 10};
  }

  /* ---------- the screen ---------- */
  const body = () => $('nutriBody');
  const dayLabel = k => k === todayKey() ? 'Today' : k === C.dkey(C.addDays(new Date(), -1)) ? 'Yesterday' : k === C.dkey(C.addDays(new Date(), 1)) ? 'Tomorrow' : C.dayLabel(k);
  const bar = (v, max, cls) => `<div class="nu-bar ${cls}"><i style="width:${max ? Math.min(100, v / max * 100) : 0}%"></i></div>`;
  const errBox = () => S.err ? `<p class="t-note warn nu-err" role="alert">${esc(S.err)}</p>` : '';
  const head = (title, back) => `<div class="brand"><button class="eyebrow back-link" ${back || 'data-section="today"'}>&larr; ${back ? 'Back' : 'Dashboard'}</button></div><h1>${title}</h1>`;

  // One account for the person, on every device: email and password once on each device and it stays signed in (browsers and password managers fill it in).
  // A link by email is the other way in.
  function signInHtml(){
    const link = S.mode === 'link';
    return `${head('Nutrition')}
      <p class="sub">Log what you eat and see your calories and macros. Sign in once on each device and your food diary, and everything else in the app, is saved to your account.</p>${errBox()}${S.notice ? `<p class="t-note nu-ok">${esc(S.notice)}</p>` : ''}
      <div class="nu-card"><form id="nuSignIn">
        <label class="c-label">Email<input id="nuEmail" name="email" type="email" inputmode="email" autocomplete="username" required placeholder="you@example.com" value="${esc(S.email)}"></label>
        ${link ? '' : '<label class="c-label">Password<input id="nuPass" name="password" type="password" autocomplete="current-password" minlength="10" required placeholder="at least 10 characters"></label>'}
        <div class="acts">${link
          ? `<button class="btn" type="submit" ${S.busy ? 'disabled' : ''}>${S.sent ? 'Send it again' : 'Email me a sign-in link'}</button><button class="btn ghost" type="button" data-nu-mode="password">Use a password</button>`
          : `<button class="btn" type="submit" ${S.busy ? 'disabled' : ''}>Sign in</button><button class="btn ghost" type="button" data-nu-signup ${S.busy ? 'disabled' : ''}>Create account</button>`}</div></form>
        ${link
          ? (S.sent ? `<p class="t-note nu-ok">Check your inbox for ${esc(S.email)} and tap the link in the email. It opens Boxing Flow already signed in. If the email shows a code instead, type it here:</p>
              <form id="nuCode" class="fs-add"><input id="nuCodeIn" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Code" aria-label="Sign-in code"><button class="btn small" type="submit">Sign in</button></form>` : '<p class="t-note">No password needed: we email you a link.</p>')
          : '<p class="t-note">First time? Enter your email and a password and tap Create account. After that, Sign in on each new device. <button class="linkbtn" type="button" data-nu-mode="link">Email me a link instead</button></p>'}</div>`;
  }

  // the calorie targets were worked out for one weight: when the weight log has moved on, offer to work them out again (never silently)
  function retargetHtml(){
    const lw = window.bfWeight && window.bfWeight.stats(), p = S.profile;
    if(!lw || !p || !p.weight_kg || p.manual_targets || Math.abs(lw.last - p.weight_kg) < 0.5) return '';
    return `<p class="t-note nu-ok">Your weight is now ${lw.last.toFixed(1)} kg, and your targets were worked out at ${(+p.weight_kg).toFixed(1)} kg. <button class="linkbtn" data-nu-retarget>Update my targets</button></p>`;
  }
  async function retarget(){
    const lw = window.bfWeight.stats(), sg = suggest({...S.profile, weight_kg:lw.last}); if(!sg) return;
    await guard(async () => {
      const {error} = await S.sb.from('nutrition_profile').update({weight_kg:lw.last, kcal_target:sg.kcal, protein_g:sg.protein, carbs_g:sg.carbs, fat_g:sg.fat, updated_at:new Date().toISOString()}).eq('user_id', S.user.id); if(error) throw error;
      await loadProfile(); updateCache(); emit();
    });
  }
  function weekHtml(){
    const tg = targets(), today = todayKey(), start = S.wkStart, days = Array.from({length:7}, (_, i) => C.dkey(C.addDays(C.fromKey(start), i)));
    const end = C.fromKey(days[6]), st = C.fromKey(start), range = `${st.getDate()} ${C.MON[st.getMonth()]} – ${end.getDate()} ${C.MON[end.getMonth()]}`;
    const eat = k => (S.wk && S.wk[k]) || {kcal:0, protein:0, carbs:0, fat:0}, loading = !S.wk;
    const counted = days.filter(k => k <= today), total = sum(days.map(eat)), soFar = sum(counted.map(eat));
    const unit = unitKJ() ? 'kJ' : 'kcal', num = k => energyNum(Math.abs(k)).toLocaleString();
    let summary;
    if(!tg) summary = `<div class="nu-left"><b>${num(total.kcal)}</b><span>${unit} eaten this week</span></div><p class="t-note"><button class="linkbtn" data-nu-view="settings">Set your daily targets</button> to compare the week with what you should have eaten.</p>`;
    else {
      const weekT = tg.kcal * 7, soFarT = tg.kcal * counted.length, diff = soFar.kcal - soFarT, left = weekT - total.kcal;
      summary = `<div class="nu-wk3"><div><b>${num(weekT)}</b><span>${unit} planned for the week</span></div><div><b>${num(total.kcal)}</b><span>${unit} eaten so far</span></div><div class="${left < 0 ? 'over' : ''}"><b>${num(left)}</b><span>${unit} ${left < 0 ? 'over the week' : 'left for the week'}</span></div></div>
        ${bar(total.kcal, weekT, left < 0 ? 'over' : '')}
        ${counted.length ? `<p class="t-note">${counted.length === 7 ? 'The whole week' : `So far (${counted.length} day${counted.length > 1 ? 's' : ''})`}: you should have eaten <b>${energy(soFarT)}</b> and have eaten <b>${energy(soFar.kcal)}</b>, which is <b class="${diff > 0 ? 'nu-over' : ''}">${energy(Math.abs(diff))} ${diff > 0 ? 'over' : 'under'}</b>.</p>` : '<p class="t-note">This week has not started yet.</p>'}`;
    }
    const rows = days.map((k, i) => { const e = eat(k), future = k > today, d = tg ? e.kcal - tg.kcal : 0;
      return `<button class="nu-wkrow ${k === today ? 'today' : ''}" data-nu-openday="${k}"><span class="wd"><b>${C.DOW[i]}</b><small>${C.fromKey(k).getDate()}</small></span>
        <span class="wb">${bar(e.kcal, tg && tg.kcal, d > 0 ? 'over' : '')}</span>
        <span class="wn"><b>${future && !e.kcal ? '–' : energyNum(e.kcal).toLocaleString()}</b>${tg && !future ? `<small class="${d > 0 ? 'nu-over' : ''}">${d > 0 ? '+' : '−'}${num(d)}</small>` : ''}</span></button>`; }).join('');
    const mac = (l, v, m) => `<div class="nu-macro"><span>${l}</span>${bar(v, m, '')}<small>${r0(v)}${m ? ' / ' + m * 7 : ''} g</small></div>`;
    return `${head('Weekly overview', 'data-nu-view="day"')}
      <div class="nu-day"><button class="nu-nav" data-nu-wk="-1" aria-label="Previous week">&lsaquo;</button><b>${range}</b><button class="nu-nav" data-nu-wk="1" aria-label="Next week">&rsaquo;</button></div>${errBox()}
      <div class="nu-card nu-sum">${loading ? '<p class="t-note">Loading…</p>' : summary}</div>
      <div class="nu-card">${rows}</div>
      ${loading ? '' : `<div class="nu-card"><h2 class="hr-h" style="margin-top:0">Macros for the week</h2><div class="nu-macros">${mac('Protein', total.protein, tg && tg.protein)}${mac('Carbs', total.carbs, tg && tg.carbs)}${mac('Fat', total.fat, tg && tg.fat)}</div></div>`}
      <p class="iq-note">Days you went over and days you came in under balance out across the week. Tap a day to see or change what you ate. Not medical advice.</p>`;
  }
  function dayHtml(){
    const t = sum(S.entries), tg = targets(), left = tg ? tg.kcal - t.kcal : 0;
    const macro = (label, v, max, cls) => `<div class="nu-macro"><span>${label}</span>${bar(v, max, cls)}<small>${r0(v)}${max ? ' / ' + max : ''} g</small></div>`;
    return `${head('Nutrition')}
      ${retargetHtml()}
      <div class="nu-day"><button class="nu-nav" data-nu-day="-1" aria-label="Previous day">&lsaquo;</button><b>${dayLabel(S.day)}</b><button class="nu-nav" data-nu-day="1" aria-label="Next day">&rsaquo;</button></div>${errBox()}
      <div class="nu-card nu-sum">${tg
        ? `<div class="nu-left ${left < 0 ? 'over' : ''}"><b>${energyNum(Math.abs(left)).toLocaleString()}</b><span>${unitKJ() ? 'kJ' : 'kcal'} ${left < 0 ? 'over' : 'left'}</span></div>${bar(t.kcal, tg.kcal, left < 0 ? 'over' : '')}<p class="t-note">${energy(t.kcal)} eaten of ${energy(tg.kcal)}</p>`
        : `<div class="nu-left"><b>${energyNum(t.kcal).toLocaleString()}</b><span>${unitKJ() ? 'kJ' : 'kcal'} eaten</span></div><p class="t-note"><button class="linkbtn" data-nu-view="settings">Set your daily targets</button> to see what's left.</p>`}
        <div class="nu-macros">${macro('Protein', t.protein, tg && tg.protein, 'p')}${macro('Carbs', t.carbs, tg && tg.carbs, 'c')}${macro('Fat', t.fat, tg && tg.fat, 'f')}</div></div>
      ${MEALS.map(([id, label]) => { const es = S.entries.filter(e => e.meal === id), mt = sum(es);
        return `<section class="nu-meal"><div class="nu-mh"><h2>${label}</h2><span>${es.length ? energy(mt.kcal) : ''}</span></div>
          ${es.map(e => `<button class="nu-row" data-nu-edit="${e.id}"><span><strong>${esc(e.name)}</strong><small>${esc([e.brand, e.source === 'quick' ? 'Quick add' : amtLabel(e)].filter(Boolean).join(' · '))}</small></span><b>${energy(e.kcal)}</b></button>`).join('')}
          <button class="add" data-nu-add="${id}">+ Add food</button></section>`; }).join('')}
      <div class="acts nu-foot"><button class="btn small" data-nu-week>Weekly overview</button><button class="btn ghost small" data-nu-copy>Copy ${dayLabel(C.dkey(C.addDays(C.fromKey(S.day), -1))).toLowerCase()}'s meals here</button><button class="btn ghost small" data-nu-view="settings">Targets and settings</button><button class="btn ghost small" data-section="weight">Weight</button></div>
      <p class="iq-note">${window.bfCloud && window.bfCloud.owner ? 'Signed in automatically on this computer (owner mode)' : `Signed in as ${esc(S.user.email)} · <button class="linkbtn" data-nu-out>Sign out</button>`}<br>${syncText()}</p>
      <p class="iq-note">Food data: USDA FoodData Central and Open Food Facts. Nutrition values are a guide, and packaged-food data is entered by the public, so check labels. Not medical advice.</p>`;
  }

  const foodRow = (f, i, from) => `<button class="nu-row" data-nu-food="${from}:${i}"><span><strong>${esc(f.name)}</strong><small>${esc([f.brand, f.nz ? 'NZ' : '', f.source === 'custom' ? 'Your food' : ''].filter(Boolean).join(' · '))}${f.per100 ? ` · ${r0(f.per100.kcal || 0)} kcal per 100 g` : ''}</small></span></button>`;
  function resultsHtml(){
    if(S.q.trim().length < 2){
      const own = S.custom, rec = S.recent;
      return `${own.length ? `<h2 class="hr-h">Your foods</h2>${own.map((f, i) => foodRow(f, i, 'custom')).join('')}` : ''}
        ${rec.length ? `<h2 class="hr-h">Recent</h2>${rec.map((f, i) => foodRow(f, i, 'recent')).join('')}` : ''}
        ${!own.length && !rec.length ? '<p class="t-note">Search above for any food, scan a barcode, or add one of your own.</p>' : ''}`;
    }
    if(S.searching && !S.results) return '<p class="t-note">Searching…</p>';
    if(!S.results) return '';
    const mine = S.custom.filter(f => (f.name + ' ' + f.brand).toLowerCase().includes(S.q.trim().toLowerCase()));
    return `${S.note ? `<p class="t-note">${esc(S.note)}</p>` : ''}${mine.map((f, i) => foodRow(f, i, 'custom')).join('')}${S.results.map((f, i) => foodRow(f, i, 'results')).join('')}
      ${!S.results.length && !mine.length ? '<p class="t-note">Nothing found. Try a simpler word, or add it as your own food.</p>' : ''}`;
  }
  function addHtml(){
    const label = (MEALS.find(m => m[0] === S.meal) || [])[1];
    return `${head('Add to ' + label, 'data-nu-view="day"')}${errBox()}
      <div class="nu-meals">${MEALS.map(([id, l]) => `<button class="chip" aria-pressed="${S.meal === id}" data-nu-meal="${id}">${l}</button>`).join('')}</div>
      <input id="nuSearch" class="nu-search" type="search" autocomplete="off" placeholder="Search foods, e.g. chicken breast, weetbix, kumara" value="${esc(S.q)}" aria-label="Search foods">
      <div class="acts nu-tools"><button class="btn ghost small" data-nu-scan>Scan barcode</button><button class="btn ghost small" data-nu-view="quick">Quick add</button><button class="btn ghost small" data-nu-view="create">Create a food</button></div>
      <div id="nuResults">${resultsHtml()}</div>`;
  }

  // choosing an amount: a quantity, and what it is a quantity of (a serving, a cup, grams...)
  // ways to pick an amount: the food's own whole items first (1 medium banana, 1 egg, 2 biscuits, the whole pack), then grams and ounces
  const quickFor = u => u.kind === 'g' ? [50, 100, 150, 200, 250] : u.kind === 'oz' ? [1, 2, 4, 6, 8] : [0.5, 1, 1.5, 2, 3];
  const qlab = v => v === 0.5 ? '½' : v === 1.5 ? '1½' : String(v);
  function pickHtml(){
    const p = S.pick, f = p.food, u = p.units[p.unit], grams = (num(p.qty) || 0) * u.grams, a = amounts(f.per100, grams);
    return `${head(p.entry ? 'Edit food' : 'Add food', 'data-nu-view="' + (p.entry ? 'day' : 'add') + '"')}${errBox()}
      <div class="nu-card"><h2 class="nu-fname">${esc(f.name)}</h2>${f.brand ? `<p class="t-note">${esc(f.brand)}</p>` : ''}
        <p class="nu-lab">How much?</p>
        <div class="nu-units" role="radiogroup" aria-label="Unit">${p.units.map((x, i) => `<button type="button" class="chip" role="radio" aria-checked="${i === p.unit}" aria-pressed="${i === p.unit}" data-nu-unit="${i}">${esc(x.name || x.label)}</button>`).join('')}</div>
        <div class="nu-qty"><button type="button" class="nu-step" data-nu-step="-1" aria-label="Less">&minus;</button><input id="nuQty" type="number" inputmode="decimal" min="0" step="any" value="${esc(p.qty)}" aria-label="How many"><button type="button" class="nu-step" data-nu-step="1" aria-label="More">+</button></div>
        <div class="nu-quick">${quickFor(u).map(v => `<button type="button" class="chip" data-nu-set="${v}">${qlab(v)}</button>`).join('')}</div>
        <p class="t-note" id="nuGrams">That is ${Math.round(grams)} g${u.kind === 'item' ? '' : ''}.</p>
        ${p.entry ? '' : `<div class="nu-meals">${MEALS.map(([id, l]) => `<button class="chip" aria-pressed="${S.meal === id}" data-nu-meal="${id}">${l}</button>`).join('')}</div>`}
        <div class="nu-totals" id="nuTotals">${totalsHtml(a, grams)}</div>
        <div class="acts"><button class="btn" data-nu-save>${p.entry ? 'Save' : 'Add to ' + (MEALS.find(m => m[0] === S.meal) || [])[1]}</button>${p.entry ? '<button class="btn ghost" data-nu-del>Delete</button>' : ''}</div></div>
      <p class="iq-note">Values per 100 g: ${energy(f.per100.kcal || 0)}, protein ${f.per100.protein ?? '?'} g, carbs ${f.per100.carbs ?? '?'} g, fat ${f.per100.fat ?? '?'} g.</p>`;
  }
  const totalsHtml = (a, grams) => `<div><b>${energyNum(a.kcal).toLocaleString()}</b><span>${unitKJ() ? 'kJ' : 'kcal'}</span></div><div><b>${a.protein}</b><span>protein g</span></div><div><b>${a.carbs}</b><span>carbs g</span></div><div><b>${a.fat}</b><span>fat g</span></div>`;

  const fld = (id, label, val, extra = '') => `<label class="c-label">${label}<input id="${id}" type="number" inputmode="decimal" min="0" step="any" value="${val == null ? '' : esc(val)}" ${extra}></label>`;
  function quickHtml(){
    const e = S.editing;
    return `${head(e ? 'Edit quick add' : 'Quick add', 'data-nu-view="' + (e ? 'day' : 'add') + '"')}${errBox()}
      <p class="sub">Know the calories but not the food? Enter them directly.</p>
      <div class="nu-card"><label class="c-label">Name (optional)<input id="qName" type="text" maxlength="60" placeholder="Quick add" value="${esc(e ? (e.name === 'Quick add' ? '' : e.name) : '')}"></label>
        ${fld('qKcal', 'Calories (kcal)', e ? e.kcal : '', 'required')}<div class="nu-three">${fld('qP', 'Protein g', e ? e.protein : '')}${fld('qC', 'Carbs g', e ? e.carbs : '')}${fld('qF', 'Fat g', e ? e.fat : '')}</div>
        <div class="acts"><button class="btn" data-nu-qsave>${e ? 'Save' : 'Add to ' + (MEALS.find(m => m[0] === S.meal) || [])[1]}</button>${e ? '<button class="btn ghost" data-nu-del>Delete</button>' : ''}</div></div>`;
  }
  function createHtml(){
    return `${head('Create a food', 'data-nu-view="add"')}${errBox()}
      <p class="sub">Copy the numbers from the label (the "per 100 g" column).</p>
      <div class="nu-card"><label class="c-label">Name<input id="cName" type="text" maxlength="80" placeholder="e.g. Protein bar"></label><label class="c-label">Brand (optional)<input id="cBrand" type="text" maxlength="60"></label>
        ${fld('cKcal', 'Calories per 100 g (kcal)', '')}<div class="nu-three">${fld('cP', 'Protein g', '')}${fld('cC', 'Carbs g', '')}${fld('cF', 'Fat g', '')}</div>
        <div class="nu-three">${fld('cSg', 'One serving is (g)', '')}<label class="c-label">Serving name<input id="cSl" type="text" maxlength="30" placeholder="1 bar"></label></div>
        <div class="acts"><button class="btn" data-nu-csave>Save and use</button></div></div>`;
  }
  function settingsHtml(){
    const bp = (window.bfProfile && window.bfProfile.data) || {}, fromProfile = {};   // sex, age and height are kept in the profile
    if(bp.sex) fromProfile.sex = bp.sex; if(bp.birthYear) fromProfile.birth_year = bp.birthYear; if(bp.heightCm) fromProfile.height_cm = bp.heightCm;
    const p = {...(S.profile || {}), ...fromProfile, ...(S.draft || {})}, lw = window.bfWeight && window.bfWeight.stats();
    if(lw && !(S.draft && S.draft.weight_kg != null)) p.weight_kg = lw.last;   // the weight comes from the weight log: one number, not two
    const sg = suggest(p), m = p.manual_targets;
    const age = p.birth_year ? new Date().getFullYear() - p.birth_year : '';
    return `${head('Targets and settings', 'data-nu-view="day"')}${errBox()}
      <div class="nu-card"><h2 class="nu-fname">About you</h2>${lw ? `<p class="t-note">Your weight is taken from your weight log: ${lw.last.toFixed(1)} kg. <button class="linkbtn" data-section="weight">Open the weight log</button></p>` : ''}
        <div class="nu-three"><label class="c-label">Sex<select id="sSex"><option value="" ${p.sex ? '' : 'selected'}>Choose</option><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></label>${fld('sAge', 'Age', age)}${fld('sH', 'Height cm', p.height_cm)}</div>
        <div class="nu-three">${fld('sW', 'Weight kg', p.weight_kg)}<label class="c-label">Training<select id="sAct">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${+p.activity === v || (!p.activity && v === 1.55) ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="nu-three"><label class="c-label">Goal<select id="sGoal">${[['maintain', 'Maintain weight'], ['lose', 'Lose weight'], ['gain', 'Gain weight']].map(([v, l]) => `<option value="${v}" ${(p.goal || 'maintain') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="c-label">Pace<select id="sRate">${[0.25, 0.5, 0.75, 1, 1.5, 2].map(v => `<option value="${v}" ${+(p.rate_kg_week || 0.25) === v ? 'selected' : ''}>${v} kg a week</option>`).join('')}</select></label>
          <label class="c-label">Energy<select id="sUnit"><option value="kcal" ${p.energy_unit !== 'kj' ? 'selected' : ''}>kcal</option><option value="kj" ${p.energy_unit === 'kj' ? 'selected' : ''}>kJ</option></select></label></div>
        <div id="sSuggest">${suggestHtml(sg, p)}</div>
        <label class="nu-check"><input type="checkbox" id="sManual" ${m ? 'checked' : ''}> Set my own targets</label>
        <div class="nu-three" id="sOwn" ${m ? '' : 'hidden'}>${fld('sK', 'kcal', p.kcal_target)}${fld('sPg', 'Protein g', p.protein_g)}${fld('sCg', 'Carbs g', p.carbs_g)}${fld('sFg', 'Fat g', p.fat_g)}</div>
        <div class="acts"><button class="btn" data-nu-ssave>Save</button></div></div>
      <p class="t-note">Use the suggestion, or tick "Set my own targets" and type any numbers you want. A guide, not medical advice.</p>`;
  }
  const suggestHtml = (sg, p) => !sg ? '<p class="t-note">Fill in the details above and your targets appear here.</p>'
    : `<p class="t-note">Maintenance is about <b>${energy(sg.maintenance)}</b> a day. Suggested target: <b>${energy(sg.kcal)}</b>, with ${sg.protein} g protein, ${sg.carbs} g carbs and ${sg.fat} g fat.</p>`;

  function paint(){
    const el = body(); if(!el || $('nutrition').hidden) return;
    const keep = el.querySelector('#nuSearch'), hadFocus = keep && document.activeElement === keep;
    let html;
    if(!S.ready) html = `${head('Nutrition')}<p class="t-note">Loading…</p>${errBox()}`;
    else if(!S.user) html = signInHtml();
    else html = ({day:dayHtml, week:weekHtml, add:addHtml, pick:S.pick ? pickHtml : dayHtml, quick:quickHtml, create:createHtml, settings:settingsHtml}[S.view] || dayHtml)();
    el.innerHTML = html;
    if(hadFocus || (S.view === 'add' && S.focusSearch)){ const s = el.querySelector('#nuSearch'); if(s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); } S.focusSearch = false; }
  }
  if(window.bfCloud) window.bfCloud.onStatus(() => { if(!$('nutrition').hidden && S.view === 'day' && S.user) paint(); });
  window.renderNutrition = function(){ S.err = ''; if(!S.keep){ S.view = 'day'; S.pick = null; S.editing = null; } S.keep = false; paint(); init().then(() => { if(S.user && S.view === 'day') loadDay(S.day).then(() => { updateCache(); paint(); emit(); }).catch(fail); }); };
  const go = (view) => { S.view = view; S.err = ''; paint(); window.scrollTo(0, 0); if(view === 'add' || view === 'pick') ensureFoods(); };
  async function ensureFoods(){ try { await loadFoods(); if(S.view === 'add') { const r = $('nuResults'); if(r) r.innerHTML = resultsHtml(); } } catch(e){} }

  /* ---------- searching ---------- */
  let timer = null, ctrl = null;
  function search(q){
    S.q = q; clearTimeout(timer); if(ctrl) ctrl.abort();
    if(q.trim().length < 2){ S.results = null; S.note = ''; S.searching = false; const r = $('nuResults'); if(r) r.innerHTML = resultsHtml(); return; }
    S.searching = true; timer = setTimeout(async () => {
      ctrl = new AbortController();
      try {
        const res = await fetch('/api/foods?q=' + encodeURIComponent(q.trim()), {signal:ctrl.signal});
        if(!res.ok) throw new Error(res.status);
        const j = await res.json();
        S.results = j.items || [];
        S.note = [j.searchedAs ? `Also searched for "${j.searchedAs}".` : '', j.partial ? 'One food database didn\'t answer, so some results may be missing. Try again in a moment.' : ''].filter(Boolean).join(' ');
        S.err = '';
      } catch(e){ if(e.name === 'AbortError') return; S.results = []; S.note = ''; S.err = 'Couldn\'t search just now. Check your connection and try again.'; }
      S.searching = false; const r = $('nuResults'); if(r) r.innerHTML = (S.err ? errBox() : '') + resultsHtml();
    }, 350);
  }
  // the ways to measure a food: its own serving, the whole pack, and the everyday portions (1 medium banana, 1 cup, a slice...), then grams and ounces
  const UNIT_G = {label:'g', name:'Grams', grams:1, kind:'g'}, UNIT_OZ = {label:'oz', name:'Ounces', grams:28.3495, kind:'oz'};
  function unitsFor(food, portions, current){
    const out = [], seen = new Set(), add = u => {
      if(!u || !(u.grams > 0)) return; const b = u.label === 'g' ? UNIT_G : u.label === 'oz' ? UNIT_OZ : {kind:'item', ...u};
      if(!seen.has(b.label)){ seen.add(b.label); out.push(b); } };
    add(food.serving); add(food.pack); [...(portions || [])].sort((a, b) => a.grams - b.grams).forEach(add); add(current);   // sizes from small to large
    add(UNIT_G); add(UNIT_OZ);
    return [...out.filter(u => u.kind === 'item'), ...out.filter(u => u.kind !== 'item')];
  }
  const PREFER = [/\bmedium\b/i, /\b(large|whole|regular|average|each)\b/i, /\b(egg|slice|piece|biscuit|bar|serving|pack)\b/i];
  // where to start: one whole item (a medium banana, a large egg), never an arbitrary 100 g unless there is nothing else to measure by
  function startUnit(units, food){
    const items = units.filter(u => u.kind === 'item');
    if(!items.length) return {unit:units.findIndex(u => u.kind === 'g'), qty:100};
    const order = food && /\begg/i.test(food.name) ? [/\blarge\b/i, ...PREFER] : PREFER;
    return {unit:units.indexOf(order.map(re => items.find(u => re.test(u.label))).find(Boolean) || items[0]), qty:1};
  }
  async function choose(food){
    const units = unitsFor(food, []), st = startUnit(units, food);
    S.pick = {food, units, unit:st.unit, qty:st.qty, entry:null, touched:false}; S.view = 'pick'; S.err = ''; paint(); window.scrollTo(0, 0);
    if(food.source === 'usda' && food.id.startsWith('usda:')){   // everyday foods have their own portions, fetched when one is chosen
      try {
        const j = await (await fetch('/api/foods?usda=' + food.id.slice(5))).json();
        if(S.pick && S.pick.food === food && j.servings && j.servings.length){
          const cur = S.pick.units[S.pick.unit], list = unitsFor(food, j.servings);
          if(S.pick.touched){ const k = list.findIndex(u => u.label === cur.label); S.pick.units = list; S.pick.unit = k >= 0 ? k : 0; }
          else { const s2 = startUnit(list, food); S.pick.units = list; S.pick.unit = s2.unit; S.pick.qty = s2.qty; }
          paint();
        }
      } catch(e){}
    }
  }
  function pickUnit(i){
    const p = S.pick, old = p.units[p.unit], nu = p.units[i], grams = (num(p.qty) || 0) * old.grams; p.touched = true; p.unit = i;
    p.qty = nu.kind === 'g' ? (Math.round(grams) || 100) : nu.kind === 'oz' ? (Math.round(grams / nu.grams * 2) / 2 || 1) : old.kind === 'item' ? p.qty : 1;   // moving to grams or ounces keeps the same amount of food
    paint();
  }
  function stepQty(dir){
    const p = S.pick, u = p.units[p.unit], step = u.kind === 'g' ? 10 : 0.5;
    p.qty = Math.max(0, Math.round(((num(p.qty) || 0) + dir * step) * 100) / 100); p.touched = true; paint();
  }

  /* ---------- writing entries ---------- */
  async function guard(fn){ if(S.busy) return; S.busy = true; S.err = ''; try { await fn(); } catch(e){ console.error(e); S.err = 'Couldn\'t save that. Check your connection and try again.'; } S.busy = false; paint(); }
  async function saveEntry(){
    const p = S.pick, u = p.units[p.unit], qty = num(p.qty);
    if(!qty || qty <= 0){ S.err = 'Enter an amount.'; return paint(); }
    const grams = qty * u.grams, a = amounts(p.food.per100, grams);
    await guard(async () => {
      if(p.entry){
        const {error} = await S.sb.from('food_entries').update({amount:qty, unit_label:u.label, grams, ...a}).eq('id', p.entry.id); if(error) throw error;
      } else {
        const f = p.food, {error} = await S.sb.from('food_entries').insert({day:S.day, meal:S.meal, name:f.name, brand:f.brand || null, source:f.source, source_id:f.sourceId || (f.id.includes(':') ? f.id.split(':').slice(1).join(':') : null), amount:qty, unit_label:u.label, grams, per100:f.per100, ...a}); if(error) throw error;
      }
      S.pick = null; S.view = p.entry ? 'day' : 'add'; if(!p.entry){ S.q = ''; S.results = null; S.view = 'day'; }
      await loadDay(S.day); updateCache(); emit();
    });
  }
  async function deleteEntry(id){ await guard(async () => { const {error} = await S.sb.from('food_entries').delete().eq('id', id); if(error) throw error; S.pick = null; S.editing = null; S.view = 'day'; await loadDay(S.day); updateCache(); emit(); }); }
  async function saveQuick(){
    const kcal = num($('qKcal').value); if(kcal == null || kcal < 0){ S.err = 'Enter the calories.'; return paint(); }
    const row = {name:($('qName').value || '').trim() || 'Quick add', amount:1, unit_label:'serving', kcal:r0(kcal), protein:num($('qP').value) || 0, carbs:num($('qC').value) || 0, fat:num($('qF').value) || 0};
    await guard(async () => {
      const q = S.editing ? S.sb.from('food_entries').update(row).eq('id', S.editing.id) : S.sb.from('food_entries').insert({...row, day:S.day, meal:S.meal, source:'quick'});
      const {error} = await q; if(error) throw error; S.editing = null; S.view = 'day'; await loadDay(S.day); updateCache(); emit();
    });
  }
  async function saveCustom(){
    const name = ($('cName').value || '').trim(), kcal = num($('cKcal').value);
    if(!name || kcal == null){ S.err = 'A name and the calories are needed.'; return paint(); }
    const per100 = {kcal, protein:num($('cP').value) || 0, carbs:num($('cC').value) || 0, fat:num($('cF').value) || 0}, sg = num($('cSg').value);
    await guard(async () => {
      const {data, error} = await S.sb.from('custom_foods').insert({name, brand:($('cBrand').value || '').trim() || null, per100, serving_g:sg, serving_label:sg ? (($('cSl').value || '').trim() || '1 serving') : null}).select().single(); if(error) throw error;
      const food = foodFromCustom(data); S.custom.unshift(food); await choose(food);
    });
  }
  async function copyPrev(){
    const prev = C.dkey(C.addDays(C.fromKey(S.day), -1));
    await guard(async () => {
      const rows = await loadDay(prev); if(!rows.length){ S.err = 'Nothing was logged on ' + dayLabel(prev).toLowerCase() + '.'; return; }
      const copies = rows.map(({id, user_id, created_at, ...r}) => ({...r, day:S.day}));
      const {error} = await S.sb.from('food_entries').insert(copies); if(error) throw error; await loadDay(S.day); updateCache(); emit();
    });
  }
  async function saveSettings(){
    const p = readSettings(), sg = suggest(p);
    const row = {sex:p.sex || null, birth_year:p.birth_year || null, height_cm:p.height_cm, weight_kg:p.weight_kg, activity:p.activity, goal:p.goal, rate_kg_week:p.rate_kg_week, energy_unit:p.energy_unit, manual_targets:!!p.manual_targets,
      kcal_target: p.manual_targets ? p.kcal_target : sg && sg.kcal, protein_g: p.manual_targets ? p.protein_g : sg && sg.protein, carbs_g: p.manual_targets ? p.carbs_g : sg && sg.carbs, fat_g: p.manual_targets ? p.fat_g : sg && sg.fat, updated_at:new Date().toISOString()};
    if(!row.kcal_target){ S.err = 'Fill in your details, or set your own targets, so there is a target to save.'; S.draft = p; return paint(); }
    await guard(async () => { const {error} = await S.sb.from('nutrition_profile').upsert({user_id:S.user.id, ...row}); if(error) throw error; S.draft = null; await loadProfile(); updateCache(); S.view = 'day'; emit();
      if(window.bfProfile) window.bfProfile.set({sex:row.sex, birthYear:row.birth_year, heightCm:row.height_cm && Math.round(row.height_cm)});
      // a weight typed here is a weigh-in too, so it goes in the weight log
      const lw = window.bfWeight && window.bfWeight.stats(); if(window.bfWeight && row.weight_kg && (!lw || Math.abs(lw.last - row.weight_kg) >= 0.05)) window.bfWeight.add(row.weight_kg); });
  }
  function readSettings(){
    const age = num($('sAge').value);
    return {sex:$('sSex').value, birth_year: age ? new Date().getFullYear() - Math.round(age) : null, height_cm:num($('sH').value), weight_kg:num($('sW').value), activity:+$('sAct').value, goal:$('sGoal').value, rate_kg_week:+$('sRate').value, energy_unit:$('sUnit').value,
      manual_targets:$('sManual').checked, kcal_target:num($('sK').value), protein_g:num($('sPg').value), carbs_g:num($('sCg').value), fat_g:num($('sFg').value)};
  }

  /* ---------- barcode scanning ----------
     Browsers that have BarcodeDetector (Chrome on Android) use it. Everything else (iPhone, Windows, Firefox) reads the camera frames with ZXing (vendor/zxing.min.js,
     Apache-2.0), loaded only when someone scans. Both give detect(video) -> [{rawValue}]. */
  let stream = null, scanTimer = null;
  function stopScan(){ clearInterval(scanTimer); if(stream) stream.getTracks().forEach(t => t.stop()); stream = null; const o = $('nuScan'); if(o) o.remove(); }
  const loadZXing = () => window.ZXing ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/zxing.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function makeDetector(){
    if('BarcodeDetector' in window){ try { return new BarcodeDetector({formats:['ean_13', 'ean_8', 'upc_a', 'upc_e']}); } catch(e){} }
    await loadZXing();
    const Z = window.ZXing, hints = new Map(), reader = new Z.MultiFormatReader();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]); hints.set(Z.DecodeHintType.TRY_HARDER, true);
    reader.setHints(hints);
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', {willReadFrequently:true});
    return {detect: async v => {
      const w = v.videoWidth || v.width, h = v.videoHeight || v.height; if(!w || !h) return [];
      const k = Math.min(1, 1280 / w); canvas.width = Math.round(w * k); canvas.height = Math.round(h * k); ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      try { return [{rawValue:reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(canvas)))).getText()}]; } catch(e){ return []; }   // nothing readable in this frame
    }};
  }
  async function lookupBarcode(code){
    S.err = ''; try {
      const j = await (await fetch('/api/foods?barcode=' + encodeURIComponent(code))).json();
      if(j.error){ S.err = j.error; return paint(); }
      if(!j.item){ S.err = 'That barcode isn\'t in the food database yet. Search by name, or create it as your own food.'; return paint(); }
      await choose(j.item);
    } catch(e){ S.err = 'Couldn\'t look that up. Check your connection and try again.'; paint(); }
  }
  async function scan(){
    const typed = () => { const c = prompt('Type the barcode number (the digits under the bars):'); if(c && /^\d{8,14}$/.test(c.trim())) lookupBarcode(c.trim()); else if(c){ S.err = 'That doesn\'t look like a barcode.'; paint(); } };
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return typed();
    try {
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const o = document.createElement('div'); o.id = 'nuScan'; o.className = 'nu-scan';
      o.innerHTML = '<video playsinline muted></video><p>Point the camera at the barcode</p><div class="acts"><button class="btn ghost" data-nu-scanno>Cancel</button><button class="btn ghost" data-nu-scantype>Type it instead</button></div>';
      document.body.appendChild(o); const v = o.querySelector('video'); v.srcObject = stream; await v.play();
      const det = await makeDetector();
      scanTimer = setInterval(async () => { try { const r = await det.detect(v); if(r.length){ const c = r[0].rawValue; stopScan(); lookupBarcode(c); } } catch(e){} }, 300);
      o.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; stopScan(); if('nuScantype' in b.dataset) typed(); });
    } catch(e){ stopScan(); typed(); }
  }

  /* ---------- events ---------- */
  const root = $('nutrition');
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
    if(d.section){ show(d.section); return; }
    if(d.nuMode){ S.mode = d.nuMode; S.err = S.notice = ''; S.sent = false; paint(); return; }
    if('nuSignup' in d) return passwordAuth(true);
    if('nuRetarget' in d) return retarget();
    if(d.nuView){ S.pick = null; S.editing = null; if(d.nuView === 'add') S.focusSearch = true; if(d.nuView === 'settings') S.draft = null; go(d.nuView); return; }
    if('nuWeek' in d){ S.wkStart = C.dkey(C.weekStart(C.fromKey(S.day))); S.wk = null; go('week'); loadWeek().then(() => paint()).catch(fail); return; }
    if(d.nuWk){ S.wkStart = C.dkey(C.addDays(C.fromKey(S.wkStart), 7 * +d.nuWk)); S.wk = null; paint(); loadWeek().then(() => paint()).catch(fail); return; }
    if(d.nuOpenday){ S.day = d.nuOpenday; S.entries = []; go('day'); loadDay(S.day).then(() => { updateCache(); paint(); }).catch(fail); return; }
    if(d.nuDay){ S.day = C.dkey(C.addDays(C.fromKey(S.day), +d.nuDay)); S.entries = []; paint(); loadDay(S.day).then(() => { updateCache(); paint(); }).catch(fail); return; }
    if(d.nuAdd){ S.meal = d.nuAdd; S.q = ''; S.results = null; S.note = ''; S.focusSearch = true; go('add'); return; }
    if(d.nuMeal){ S.meal = d.nuMeal; paint(); return; }
    if(d.nuFood){ const [from, i] = d.nuFood.split(':'), list = from === 'results' ? S.results : from === 'custom' ? (S.q.trim().length >= 2 ? S.custom.filter(f => (f.name + ' ' + f.brand).toLowerCase().includes(S.q.trim().toLowerCase())) : S.custom) : S.recent; if(list[+i]) choose(list[+i]); return; }
    if(d.nuEdit){ const en = S.entries.find(x => x.id === d.nuEdit); if(!en) return;
      if(en.source === 'quick'){ S.editing = en; go('quick'); return; }
      const f0 = foodFromEntry(en), units = unitsFor(f0, [], {label:en.unit_label || 'serving', grams:en.grams / en.amount}), k = units.findIndex(u => u.label === (en.unit_label || 'serving'));
      S.pick = {food:f0, units, unit:Math.max(0, k), qty:en.amount, entry:en, touched:true}; S.view = 'pick'; paint(); window.scrollTo(0, 0); return; }
    if(d.nuUnit != null){ pickUnit(+d.nuUnit); return; }
    if(d.nuStep){ stepQty(+d.nuStep); return; }
    if(d.nuSet){ S.pick.touched = true; S.pick.qty = d.nuSet; paint(); return; }
    if('nuSave' in d) return saveEntry();
    if('nuDel' in d){ const en = S.pick ? S.pick.entry : S.editing; if(en && confirm('Delete "' + en.name + '"?')) deleteEntry(en.id); return; }
    if('nuQsave' in d) return saveQuick();
    if('nuCsave' in d) return saveCustom();
    if('nuSsave' in d) return saveSettings();
    if('nuCopy' in d) return copyPrev();
    if('nuScan' in d) return scan();
    if('nuOut' in d){ window.bfCloud.signOut(); return; }
  });
  root.addEventListener('input', e => {
    const t = e.target;
    if(t.id === 'nuSearch') return search(t.value);
    if(t.id === 'nuQty'){ S.pick.qty = t.value; S.pick.touched = true; const u = S.pick.units[S.pick.unit], g = (num(t.value) || 0) * u.grams; $('nuTotals').innerHTML = totalsHtml(amounts(S.pick.food.per100, g)); if($('nuGrams')) $('nuGrams').textContent = 'That is ' + Math.round(g) + ' g.'; return; }
    if(t.closest('#sSuggest, .nu-card') && /^s[A-Z]/.test(t.id || '') ){ if(t.id === 'sManual') $('sOwn').hidden = !t.checked; const p = readSettings(); S.draft = p; $('sSuggest').innerHTML = suggestHtml(suggest(p), p); }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if(/^s[A-Z]/.test(t.id || '')){ if(t.id === 'sManual') $('sOwn').hidden = !t.checked; const p = readSettings(); S.draft = p; $('sSuggest').innerHTML = suggestHtml(suggest(p), p); }
  });
  async function passwordAuth(create){
    S.email = ($('nuEmail').value || '').trim(); const pw = ($('nuPass') || {}).value || '';
    if(!S.email){ S.err = 'Enter your email.'; return paint(); }
    if(pw.length < 10){ S.err = 'Use a password of at least 10 characters.'; return paint(); }
    await init(); if(!S.sb) return;
    S.busy = true; S.err = S.notice = ''; paint();
    const r = create ? await S.sb.auth.signUp({email:S.email, password:pw, options:{emailRedirectTo:location.origin + '/app.html'}}) : await S.sb.auth.signInWithPassword({email:S.email, password:pw});
    S.busy = false;
    if(r.error){
      const m = r.error.message || '';
      S.err = /invalid login/i.test(m) ? 'That email and password don\'t match. If you have not made an account yet, tap Create account.'
        : /already (been )?registered|already exists/i.test(m) ? 'That email already has an account. Tap Sign in.'
        : /signups? (are )?(not allowed|disabled)/i.test(m) ? 'New accounts are switched off. Sign in with your existing account.'
        : /rate|limit/i.test(m) ? 'Too many tries just now. Wait a minute and try again.' : 'Couldn\'t do that: ' + m;
    } else if(create && !(r.data && r.data.session)) S.notice = 'Almost done: we emailed a confirmation link to ' + S.email + '. Tap it, then come back and Sign in.';
    paint();   // when a session starts, the sign-in listener takes over from here
  }
  root.addEventListener('submit', async e => {
    e.preventDefault();
    if(e.target.id === 'nuSignIn'){
      if(S.mode !== 'link') return passwordAuth(false);
      S.email = $('nuEmail').value.trim(); if(!S.email) return;
      await init(); if(!S.sb) return;
      S.busy = true; paint();
      const {error} = await S.sb.auth.signInWithOtp({email:S.email, options:{emailRedirectTo:location.origin + '/app.html'}});
      S.busy = false; if(error){ S.err = /rate|seconds|limit/i.test(error.message) ? 'Too many sign-in emails just now. Wait a minute and try again.' : 'Couldn\'t send the email. Check the address and try again.'; S.sent = false; } else { S.sent = true; S.err = ''; }
      paint();
    } else if(e.target.id === 'nuCode'){
      const token = $('nuCodeIn').value.trim(); if(!token) return;
      let r = await S.sb.auth.verifyOtp({email:S.email, token, type:'email'}); if(r.error) r = await S.sb.auth.verifyOtp({email:S.email, token, type:'signup'});
      if(r.error){ S.err = 'That code didn\'t work. Check it, or use the link in the email.'; paint(); }
    }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && $('nuScan')) stopScan(); });

  /* ---------- for the dashboard widget ---------- */
  window.bfNutri = {scanDetector:makeDetector, 
    onChange:fn => { listeners.add(fn); return () => listeners.delete(fn); },
    // what the widget shows, straight away from what was saved last time, and refreshed once the account answers
    summary(){
      if(S.ready && !S.user) return {state:'out'};
      if(S.ready && S.user && S.day === todayKey()) return {state:'in', ...sum(S.entries), target:targets() || cache.target, unit:S.profile ? S.profile.energy_unit : cache.unit};
      if(cache.user && cache.day === todayKey()) return {state:'in', kcal:cache.kcal || 0, protein:cache.protein || 0, carbs:cache.carbs || 0, fat:cache.fat || 0, target:cache.target, unit:cache.unit};
      return {state:S.ready || cache.user ? 'in' : 'wait', kcal:0, protein:0, carbs:0, fat:0, target:cache.target, unit:cache.unit};
    },
    addFood(){ S.meal = mealNow(); S.day = todayKey(); S.q = ''; S.results = null; S.view = 'add'; S.focusSearch = true; S.keep = true; show('nutrition'); },
    ensure:init,
  };
  // the dashboard widget needs the signed-in state too, so this starts as soon as the shared client does
  setTimeout(() => init().then(() => { if(S.user && !$('nutrition').hidden) paint(); }), 1000);
  if(!$('nutrition').hidden) renderNutrition();
})();
