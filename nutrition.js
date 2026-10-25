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
  const amtLabel = e => { const q = Math.round(e.amount * 10) / 10, l = e.unit_label || ''; return l === 'g' || !l ? `${q} g` : /^d/.test(l) ? (q === 1 ? l : `${q} x ${l}`) : `${q} ${l}`; };
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
    const floor = Math.max(bmr, p.sex === 'male' ? 1500 : 1200);
    let kcal = tdee + adj, capped = false;
    if(adj < 0 && kcal < Math.max(floor, tdee * 0.8)){ kcal = Math.max(floor, tdee * 0.8); capped = true; }   // never a crash diet: at most 20% under, and never below the minimum
    kcal = Math.round(kcal / 10) * 10;
    const protein = r0(p.weight_kg * (p.goal === 'lose' ? 2.2 : 2)), fat = r0(kcal * 0.25 / 9), carbs = Math.max(0, r0((kcal - protein * 4 - fat * 9) / 4));
    return {kcal, protein, carbs, fat, maintenance:Math.round(tdee / 10) * 10, capped};
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

  function dayHtml(){
    const t = sum(S.entries), tg = targets(), left = tg ? tg.kcal - t.kcal : 0;
    const macro = (label, v, max, cls) => `<div class="nu-macro"><span>${label}</span>${bar(v, max, cls)}<small>${r0(v)}${max ? ' / ' + max : ''} g</small></div>`;
    return `${head('Nutrition')}
      <div class="nu-day"><button class="nu-nav" data-nu-day="-1" aria-label="Previous day">&lsaquo;</button><b>${dayLabel(S.day)}</b><button class="nu-nav" data-nu-day="1" aria-label="Next day">&rsaquo;</button></div>${errBox()}
      <div class="nu-card nu-sum">${tg
        ? `<div class="nu-left ${left < 0 ? 'over' : ''}"><b>${energyNum(Math.abs(left)).toLocaleString()}</b><span>${unitKJ() ? 'kJ' : 'kcal'} ${left < 0 ? 'over' : 'left'}</span></div>${bar(t.kcal, tg.kcal, left < 0 ? 'over' : '')}<p class="t-note">${energy(t.kcal)} eaten of ${energy(tg.kcal)}</p>`
        : `<div class="nu-left"><b>${energyNum(t.kcal).toLocaleString()}</b><span>${unitKJ() ? 'kJ' : 'kcal'} eaten</span></div><p class="t-note"><button class="linkbtn" data-nu-view="settings">Set your daily targets</button> to see what's left.</p>`}
        <div class="nu-macros">${macro('Protein', t.protein, tg && tg.protein, 'p')}${macro('Carbs', t.carbs, tg && tg.carbs, 'c')}${macro('Fat', t.fat, tg && tg.fat, 'f')}</div></div>
      ${MEALS.map(([id, label]) => { const es = S.entries.filter(e => e.meal === id), mt = sum(es);
        return `<section class="nu-meal"><div class="nu-mh"><h2>${label}</h2><span>${es.length ? energy(mt.kcal) : ''}</span></div>
          ${es.map(e => `<button class="nu-row" data-nu-edit="${e.id}"><span><strong>${esc(e.name)}</strong><small>${esc([e.brand, e.source === 'quick' ? 'Quick add' : amtLabel(e)].filter(Boolean).join(' · '))}</small></span><b>${energy(e.kcal)}</b></button>`).join('')}
          <button class="add" data-nu-add="${id}">+ Add food</button></section>`; }).join('')}
      <div class="acts nu-foot"><button class="btn ghost small" data-nu-copy>Copy ${dayLabel(C.dkey(C.addDays(C.fromKey(S.day), -1))).toLowerCase()}'s meals here</button><button class="btn ghost small" data-nu-view="settings">Targets and settings</button></div>
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
  function pickHtml(){
    const p = S.pick, f = p.food, u = p.units[p.unit], grams = (num(p.qty) || 0) * u.grams, a = amounts(f.per100, grams);
    return `${head(p.entry ? 'Edit food' : 'Add food', 'data-nu-view="' + (p.entry ? 'day' : 'add') + '"')}${errBox()}
      <div class="nu-card"><h2 class="nu-fname">${esc(f.name)}</h2>${f.brand ? `<p class="t-note">${esc(f.brand)}</p>` : ''}
        <div class="nu-amt"><label class="c-label">Amount<input id="nuQty" type="number" inputmode="decimal" min="0" step="any" value="${esc(p.qty)}"></label>
          <label class="c-label">Unit<select id="nuUnit">${p.units.map((x, i) => `<option value="${i}" ${i === p.unit ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label></div>
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
    const p = {...(S.profile || {}), ...(S.draft || {})}, sg = suggest(p), m = p.manual_targets;
    const age = p.birth_year ? new Date().getFullYear() - p.birth_year : '';
    return `${head('Targets and settings', 'data-nu-view="day"')}${errBox()}
      <div class="nu-card"><h2 class="nu-fname">About you</h2>
        <div class="nu-three"><label class="c-label">Sex<select id="sSex"><option value="" ${p.sex ? '' : 'selected'}>Choose</option><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></label>${fld('sAge', 'Age', age)}${fld('sH', 'Height cm', p.height_cm)}</div>
        <div class="nu-three">${fld('sW', 'Weight kg', p.weight_kg)}<label class="c-label">Training<select id="sAct">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${+p.activity === v || (!p.activity && v === 1.55) ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="nu-three"><label class="c-label">Goal<select id="sGoal">${[['maintain', 'Maintain weight'], ['lose', 'Lose weight'], ['gain', 'Gain weight']].map(([v, l]) => `<option value="${v}" ${(p.goal || 'maintain') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="c-label">Pace<select id="sRate">${[0.25, 0.5].map(v => `<option value="${v}" ${+(p.rate_kg_week || 0.25) === v ? 'selected' : ''}>${v} kg a week</option>`).join('')}</select></label>
          <label class="c-label">Energy<select id="sUnit"><option value="kcal" ${p.energy_unit !== 'kj' ? 'selected' : ''}>kcal</option><option value="kj" ${p.energy_unit === 'kj' ? 'selected' : ''}>kJ</option></select></label></div>
        <div id="sSuggest">${suggestHtml(sg, p)}</div>
        <label class="nu-check"><input type="checkbox" id="sManual" ${m ? 'checked' : ''}> Set my own targets</label>
        <div class="nu-three" id="sOwn" ${m ? '' : 'hidden'}>${fld('sK', 'kcal', p.kcal_target)}${fld('sPg', 'Protein g', p.protein_g)}${fld('sCg', 'Carbs g', p.carbs_g)}${fld('sFg', 'Fat g', p.fat_g)}</div>
        <div class="acts"><button class="btn" data-nu-ssave>Save</button></div></div>
      <p class="t-note warn">Cutting weight for a fight? Plan it with your coach. Crash diets and dehydration hurt your performance and can be dangerous. These targets are a guide, not medical advice.</p>`;
  }
  const suggestHtml = (sg, p) => !sg ? '<p class="t-note">Fill in the details above and your targets appear here.</p>'
    : `<p class="t-note">Maintenance is about <b>${energy(sg.maintenance)}</b> a day. Suggested target: <b>${energy(sg.kcal)}</b>, with ${sg.protein} g protein, ${sg.carbs} g carbs and ${sg.fat} g fat.${sg.capped ? ' The pace was limited so you don\'t go too low.' : ''}</p>`;

  function paint(){
    const el = body(); if(!el || $('nutrition').hidden) return;
    const keep = el.querySelector('#nuSearch'), hadFocus = keep && document.activeElement === keep;
    let html;
    if(!S.ready) html = `${head('Nutrition')}<p class="t-note">Loading…</p>${errBox()}`;
    else if(!S.user) html = signInHtml();
    else html = ({day:dayHtml, add:addHtml, pick:S.pick ? pickHtml : dayHtml, quick:quickHtml, create:createHtml, settings:settingsHtml}[S.view] || dayHtml)();
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
  async function choose(food){
    const units = [], seen = new Set(), add = u => { if(u && u.grams > 0 && !seen.has(u.label)){ seen.add(u.label); units.push(u); } };
    add(food.serving);
    S.pick = {food, units: units.concat([{label:'g', grams:1}]), unit:0, qty: food.serving ? 1 : 100, entry:null};
    if(!food.serving) S.pick.unit = 0; S.view = 'pick'; S.err = ''; paint(); window.scrollTo(0, 0);
    if(food.source === 'usda' && food.id.startsWith('usda:')){   // everyday foods have their own serving sizes (1 medium banana...), fetched when one is chosen
      try {
        const j = await (await fetch('/api/foods?usda=' + food.id.slice(5))).json();
        if(S.pick && S.pick.food === food && j.servings && j.servings.length){
          const keepG = S.pick.units.find(u => u.label === 'g'), have = new Set(S.pick.units.map(u => u.label));
          const list = [...S.pick.units.filter(u => u !== keepG), ...j.servings.filter(u => !have.has(u.label)), keepG];
          S.pick.units = list; if(!food.serving){ S.pick.unit = list.length - 1; } paint();
        }
      } catch(e){}
    }
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
    await guard(async () => { const {error} = await S.sb.from('nutrition_profile').upsert({user_id:S.user.id, ...row}); if(error) throw error; S.draft = null; await loadProfile(); updateCache(); S.view = 'day'; emit(); });
  }
  function readSettings(){
    const age = num($('sAge').value);
    return {sex:$('sSex').value, birth_year: age ? new Date().getFullYear() - Math.round(age) : null, height_cm:num($('sH').value), weight_kg:num($('sW').value), activity:+$('sAct').value, goal:$('sGoal').value, rate_kg_week:+$('sRate').value, energy_unit:$('sUnit').value,
      manual_targets:$('sManual').checked, kcal_target:num($('sK').value), protein_g:num($('sPg').value), carbs_g:num($('sCg').value), fat_g:num($('sFg').value)};
  }

  /* ---------- barcode scanning (where the browser can: Chrome on Android and desktop) ---------- */
  let stream = null, scanTimer = null;
  function stopScan(){ clearInterval(scanTimer); if(stream) stream.getTracks().forEach(t => t.stop()); stream = null; const o = $('nuScan'); if(o) o.remove(); }
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
    if(!('BarcodeDetector' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return typed();
    try {
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      const o = document.createElement('div'); o.id = 'nuScan'; o.className = 'nu-scan';
      o.innerHTML = '<video playsinline muted></video><p>Point the camera at the barcode</p><div class="acts"><button class="btn ghost" data-nu-scanno>Cancel</button><button class="btn ghost" data-nu-scantype>Type it instead</button></div>';
      document.body.appendChild(o); const v = o.querySelector('video'); v.srcObject = stream; await v.play();
      const det = new BarcodeDetector({formats:['ean_13', 'ean_8', 'upc_a', 'upc_e']});
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
    if(d.nuView){ S.pick = null; S.editing = null; if(d.nuView === 'add') S.focusSearch = true; if(d.nuView === 'settings') S.draft = null; go(d.nuView); return; }
    if(d.nuDay){ S.day = C.dkey(C.addDays(C.fromKey(S.day), +d.nuDay)); S.entries = []; paint(); loadDay(S.day).then(() => { updateCache(); paint(); }).catch(fail); return; }
    if(d.nuAdd){ S.meal = d.nuAdd; S.q = ''; S.results = null; S.note = ''; S.focusSearch = true; go('add'); return; }
    if(d.nuMeal){ S.meal = d.nuMeal; paint(); return; }
    if(d.nuFood){ const [from, i] = d.nuFood.split(':'), list = from === 'results' ? S.results : from === 'custom' ? (S.q.trim().length >= 2 ? S.custom.filter(f => (f.name + ' ' + f.brand).toLowerCase().includes(S.q.trim().toLowerCase())) : S.custom) : S.recent; if(list[+i]) choose(list[+i]); return; }
    if(d.nuEdit){ const en = S.entries.find(x => x.id === d.nuEdit); if(!en) return;
      if(en.source === 'quick'){ S.editing = en; go('quick'); return; }
      S.pick = {food:foodFromEntry(en), units:[{label:en.unit_label || 'serving', grams:en.grams / en.amount}, {label:'g', grams:1}], unit:0, qty:en.amount, entry:en}; S.view = 'pick'; paint(); window.scrollTo(0, 0); return; }
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
    if(t.id === 'nuQty'){ S.pick.qty = t.value; const u = S.pick.units[S.pick.unit]; $('nuTotals').innerHTML = totalsHtml(amounts(S.pick.food.per100, (num(t.value) || 0) * u.grams)); return; }
    if(t.closest('#sSuggest, .nu-card') && /^s[A-Z]/.test(t.id || '') ){ if(t.id === 'sManual') $('sOwn').hidden = !t.checked; const p = readSettings(); S.draft = p; $('sSuggest').innerHTML = suggestHtml(suggest(p), p); }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if(t.id === 'nuUnit'){ const old = S.pick.units[S.pick.unit], nu = S.pick.units[+t.value]; S.pick.unit = +t.value;
      if(nu.label === 'g' && old.label !== 'g' && S.pick.qty <= 5) S.pick.qty = 100; else if(old.label === 'g' && nu.label !== 'g' && S.pick.qty >= 50) S.pick.qty = 1; paint(); }
    else if(/^s[A-Z]/.test(t.id || '')){ if(t.id === 'sManual') $('sOwn').hidden = !t.checked; const p = readSettings(); S.draft = p; $('sSuggest').innerHTML = suggestHtml(suggest(p), p); }
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
  window.bfNutri = {
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
