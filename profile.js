/* Profile: who the fighter is, in one place. Saved as one key, bfProfile, so it syncs to the account like the rest:
   { name, birthYear, sex, heightCm, maxHr, restHr, stance, weightClass, wins, losses, draws, gym, coach, bio }
   Nutrition reads sex, age and height from here and writes them back; heart rate reads age and max heart rate from here and writes them back; weight comes from the weight log.
   Other code reads it through window.bfProfile: {data, age(), set(patch), onChange(fn), open()}. Loads before hr.js and nutrition.js. */
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bfProfile';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch(e){ return {}; } };
  let data = read();
  const listeners = new Set();
  const year = () => new Date().getFullYear();
  const age = () => data.birthYear ? year() - data.birthYear : null;
  // another tab or the account may have changed it
  const reload = () => { const next = read(); if(JSON.stringify(next) !== JSON.stringify(data)){ data = next; listeners.forEach(f => { try { f(data); } catch(e){} }); if(!$('profile').hidden) paintLive(); } };
  function set(patch){
    const next = {...data};
    for(const [k, v] of Object.entries(patch)){ if(v == null || v === '') delete next[k]; else next[k] = v; }
    if(JSON.stringify(next) === JSON.stringify(data)) return;
    data = next; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){}
    listeners.forEach(f => { try { f(data); } catch(e){} });
  }
  const weightNow = () => { try { const s = window.bfWeight && window.bfWeight.stats(); return s ? s.last : null; } catch(e){ return null; } };
  const maxNow = () => { try { return window.bfHR && window.bfHR.maxHR ? window.bfHR.maxHR() : null; } catch(e){ return null; } };

  const tile = (v, l) => `<div><b>${v == null || v === '' ? '--' : v}</b><span>${l}</span></div>`;
  function summary(){
    const w = weightNow(), m = maxNow();
    return tile(age(), 'age') + tile(data.heightCm, 'cm tall') + tile(w != null ? (Math.round(w * 10) / 10).toFixed(1) : null, 'kg now') + tile(m, 'max bpm');
  }
  function zonesHtml(){
    const zs = window.bfHR && window.bfHR.zones && window.bfHR.zones(), m = maxNow();
    if(!zs) return '<p class="t-note">Add your age or your max heart rate above and your zones appear here.</p>';
    const rest = data.restHr, reserve = rest && m && m > rest ? m - rest : null;
    return `<p class="t-note">Worked out from a max of ${m} bpm${data.maxHr ? '' : ' (estimated from your age, so it may be a little off)'}.${reserve ? ` Your resting rate is ${rest} bpm, so your heart rate reserve is ${reserve} bpm.` : ''}</p>
      <div class="hr-zones">${zs.map(z => `<div class="hr-z" style="--c:${z.color}"><b>${z.n}</b><span><strong>${z.name}</strong> <em>${z.lo}-${z.hi}${z.n === 5 ? '+' : ''} bpm</em><small>${z.use}</small></span></div>`).join('')}</div>`;
  }
  const fight = () => {
    try {
      const t = window.bfWeight && window.bfWeight.target, fd = window.bfWeight && window.bfWeight.fightDate && window.bfWeight.fightDate(), C = window.bfCal, bits = [];
      if(t && t.kg) bits.push(`Fight weight ${(Math.round(t.kg * 10) / 10).toFixed(1)} kg`);
      if(fd && C) bits.push(`fight on ${C.dayLabel(fd)}`);
      return bits.join(', ');
    } catch(e){ return ''; }
  };
  const inp = (id, label, v, extra = '') => `<label class="c-label">${label}<input id="${id}" type="${extra.includes('text') ? 'text' : 'number'}" ${extra.includes('text') ? 'maxlength="60"' : 'inputmode="decimal" step="any"'} value="${esc(v)}"></label>`;
  function body(){
    const f = fight();
    return `<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>
      <h1>Profile</h1>
      <p class="sub">Your details in one place. Nutrition, heart rate zones and weight all use them, so you only type them once.</p>
      <div class="nu-card"><div class="wt-sum" id="pfSum">${summary()}</div>${f ? `<p class="t-note">${esc(f)}.</p>` : ''}</div>
      <div class="nu-card"><h2 class="nu-fname">About you</h2>
        ${inp('pfName', 'Name', data.name, 'text')}
        <div class="nu-three"><label class="c-label">Sex<select id="pfSex"><option value="" ${data.sex ? '' : 'selected'}>Choose</option><option value="male" ${data.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${data.sex === 'female' ? 'selected' : ''}>Female</option></select></label>${inp('pfAge', 'Age', age() || '')}${inp('pfH', 'Height cm', data.heightCm || '')}</div>
        <p class="t-note">Your weight comes from your weight log${weightNow() != null ? ` (${(Math.round(weightNow() * 10) / 10).toFixed(1)} kg)` : ''}. <button class="linkbtn" data-section="weight">Open weight</button></p></div>
      <div class="nu-card"><h2 class="nu-fname">Boxing</h2>
        <div class="nu-three"><label class="c-label">Stance<select id="pfStance"><option value="" ${data.stance ? '' : 'selected'}>Choose</option>${['Orthodox', 'Southpaw', 'Switch'].map(s => `<option ${data.stance === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>${inp('pfClass', 'Weight class', data.weightClass, 'text')}${inp('pfGym', 'Gym', data.gym, 'text')}</div>
        ${inp('pfCoach', 'Coach', data.coach, 'text')}
        <div class="nu-three">${inp('pfW', 'Wins', data.wins == null ? '' : data.wins)}${inp('pfL', 'Losses', data.losses == null ? '' : data.losses)}${inp('pfD', 'Draws', data.draws == null ? '' : data.draws)}</div>
        <label class="c-label">About you as a fighter<textarea id="pfBio" rows="4" maxlength="800" placeholder="Style, strengths, what you are working on, your goals">${esc(data.bio)}</textarea></label></div>
      <div class="nu-card"><h2 class="nu-fname">Heart rate</h2>
        <div class="nu-three wt-two">${inp('pfMax', 'Max heart rate (bpm)', data.maxHr || '')}${inp('pfRest', 'Resting heart rate (bpm)', data.restHr || '')}</div>
        <p class="t-note">Leave max empty to estimate it from your age. If you know it from a hard test or a race, type it in: it is more accurate. Measure your resting rate when you wake, before you get up.</p>
        <div id="pfZones">${zonesHtml()}</div>
        <p class="t-note"><button class="linkbtn" data-section="hr">Connect a heart rate strap</button></p></div>
      <div class="nu-card"><h2 class="nu-fname">Training by zone</h2>
        <p class="t-note">Zone 1 and 2 build your engine and help you recover: most of your roadwork. Zone 3 is sparring pace. Zone 4 and 5 are hard rounds and all-out bursts: keep them short and keep them to the days that need them. Spending most of your time in zones 1 to 3, and a smaller part in 4 and 5, is how most boxers build fight fitness.</p></div>
      <p class="iq-note">Your profile stays in your account and on your device. Zones are a guide, not medical advice.</p>`;
  }
  function paintLive(){ if($('pfSum')) $('pfSum').innerHTML = summary(); if($('pfZones')) $('pfZones').innerHTML = zonesHtml(); }
  window.renderProfile = function(){ $('profileBody').innerHTML = body(); };
  const intIn = (id, lo, hi) => { const n = num($(id).value); return n != null && n >= lo && n <= hi ? Math.round(n) : null; };
  const wr = {
    pfName: () => set({name:$('pfName').value.trim()}), pfSex: () => set({sex:$('pfSex').value}),
    pfAge: () => { const a = intIn('pfAge', 10, 99); set({birthYear: a ? year() - a : null}); },
    pfH: () => set({heightCm:intIn('pfH', 100, 230)}), pfStance: () => set({stance:$('pfStance').value}), pfClass: () => set({weightClass:$('pfClass').value.trim()}),
    pfGym: () => set({gym:$('pfGym').value.trim()}), pfCoach: () => set({coach:$('pfCoach').value.trim()}), pfBio: () => set({bio:$('pfBio').value.trim()}),
    pfW: () => set({wins:intIn('pfW', 0, 999)}), pfL: () => set({losses:intIn('pfL', 0, 999)}), pfD: () => set({draws:intIn('pfD', 0, 999)}),
    pfMax: () => set({maxHr:intIn('pfMax', 120, 230)}), pfRest: () => set({restHr:intIn('pfRest', 30, 120)})
  };
  const onEdit = e => { const f = wr[e.target.id]; if(!f) return; f(); paintLive(); };
  $('profile').addEventListener('input', onEdit); $('profile').addEventListener('change', onEdit);
  $('profile').addEventListener('click', e => { const b = e.target.closest('button'); if(b && b.dataset.section) show(b.dataset.section); });
  window.addEventListener('storage', e => { if(e.key === KEY) reload(); });
  document.addEventListener('visibilitychange', () => { if(!document.hidden) reload(); });
  window.bfProfile = {get data(){ return data; }, age, set, onChange:fn => { listeners.add(fn); return () => listeners.delete(fn); }, reload, open(){ show('profile'); }};
  if(!$('profile').hidden) renderProfile();   // opened by a link before this file loaded
})();
