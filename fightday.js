/* Fight-day fuel: the plan for the hours between the weigh-in and the fight (fluids, carbs and sodium, hour by hour). One input is saved, bfFightDay, so it syncs like the other plans:
   { time: 'HH:MM' (when you step off the scale), done: { stepId: true } (ticked-off steps, cleared when the time changes or with Reset) }
   Every step is an offset from the scale, so changing the time moves the whole clock. Loads after watercut.js. */
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bfFightDay';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let data = {time:'12:00', done:{}};
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d){ if(/^\d\d:\d\d$/.test(d.time)) data.time = d.time; if(d.done && typeof d.done === 'object') data.done = d.done; } } catch(e){}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){} };

  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const clock = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };
  const span = (a, b) => clock(mins(data.time) + a) + (b == null ? '' : ' to ' + clock(mins(data.time) + b));

  // the plan, as offsets in minutes from stepping off the scale. cls is the card colour (see .wc-day): load = fluids, peak = food, cut = stop.
  const STEPS = [
    {id:'scale', a:0, b:null, h:'The weigh-in', t:'Clear the scale', cls:'wc-weighin', tag:'Go', carbs:'', na:'',
      n:'Step on the scale, clear your weight, then go straight to your gear bag. No solid food yet.'},
    {id:'h1', a:15, b:75, h:'Hour 1', t:'Hydration first (Bottle 1)', cls:'wc-load', tag:'Liquid', carbs:'61 g', na:'2,062 mg',
      n:'Take 500 mL straight away, then sip the rest steadily and finish the bottle by the end of the hour. Fluids go in first so your blood volume comes back before any food. Nothing solid, on an empty stomach.'},
    {id:'h2', a:75, b:135, h:'Hour 2', t:'The 90 g fuel meal', cls:'wc-peak', tag:'Solid', carbs:'90 g', na:'',
      n:'Eat it at the start of the hour and chew every bite to mush. White bread only, no butter, fat, protein or lollies. No bottle this hour.'},
    {id:'h3', a:135, b:195, h:'Hour 3', t:'Top-off hydration (Bottle 2)', cls:'wc-load', tag:'Liquid', carbs:'61 g', na:'1,672 to 2,062 mg',
      n:'Sip it slowly and steadily over the full hour. Your stomach is still working on the toast, so do not chug.'},
    {id:'h4', a:195, b:255, h:'Hour 4', t:'Absorption rest', cls:'wc-cut', tag:'Nothing', carbs:'0 g', na:'',
      n:'No mix, no food, no lollies. Head to the venue and take a nap (set an alarm so you are up before the warm-up). Rest while your stomach empties. If your mouth is dry, single sips of plain water only.'},
    {id:'h5', a:255, b:285, h:'Hour 5', t:'The final push (half of Bottle 3)', cls:'wc-load', tag:'Liquid', carbs:'30 g', na:'',
      n:'Sip about 750 mL, half the bottle, over these 30 minutes. At the end, cap it and put it away. You are done taking in fuel.',
      warn:['Do not swap the rest of the bottle for a liquid gel. A gel is dense, concentrated sugar. Right before the warm-up it spikes your insulin, and with the warm-up on top you crash around 5:15 PM and walk in shaky, weak and empty.','A gel also freezes digestion and pulls water out of your blood into your gut to dilute the syrup. That leaves a heavy brick in your stomach when the body shots start, with cramping or vomiting.','You do not need the extra carbs. Your muscles are already full from Bottle 1, the toast meal and Bottle 2, and they cannot store more.']},
    {id:'fight', a:285, b:330, h:'Warm-up and fight', t:'Go get your hand raised', cls:'wc-weighin', tag:'Fight', carbs:'', na:'',
      n:'Warm-up starts now. Fight time is 45 minutes later. Digestion shuts down once your heart rate is up, so anything still in your stomach now will not move.'}
  ];

  const MEALS = [
    ['Option A', '3 slices of white toast, 1.5 tbsp honey and 1.5 tbsp jam', '~92 g carbs'],
    ['Option B', '3 slices of white toast and 3 tbsp pure honey', '~91 g carbs']
  ];

  const row = s => {
    const on = !!data.done[s.id];
    return `<div class="wc-day ${s.cls}${on ? ' fd-done' : ''}"><div class="wc-top"><div><small>${esc(s.h)} · ${esc(s.b == null ? span(s.a) : span(s.a, s.b))}</small><strong>${esc(s.t)}</strong></div><span class="wc-tag">${esc(s.tag)}</span></div>
      ${s.carbs || s.na ? `<div class="wc-grid"><div><span>Carbs</span><b>${esc(s.carbs || '0 g')}</b></div><div><span>Sodium</span><b>${esc(s.na || '--')}</b></div></div>` : ''}
      <p class="t-note">${esc(s.n)}</p>
      ${(s.warn || []).map(w => `<p class="wc-warn">${esc(w)}</p>`).join('')}
      <div class="acts"><button class="btn small ${on ? '' : 'ghost'}" data-fd-done="${s.id}" aria-pressed="${on}">${on ? 'Done ✓' : 'Mark done'}</button></div></div>`;
  };

  function body(){
    const back = '<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>';
    const head = `${back}<h1>Fight-day fuel</h1><p class="sub">Your plan for the hours between the scale and the fight: fluids first, then a solid carb meal, then a rest so your stomach is empty for the warm-up. Set the time you step off the scale and the whole clock moves.</p>`;
    const left = STEPS.filter(s => !data.done[s.id]).length;
    return `${head}
      <div class="nu-card"><h2 class="nu-fname">Your clock</h2>
        <label class="c-label">Time you clear the scale<input id="fdTime" type="time" value="${esc(data.time)}"></label>
        <div class="wt-sum"><div><b>~3.75 L</b><span>fluid</span></div><div><b>~242 g</b><span>carbs</span></div><div><b>${esc(clock(mins(data.time) + 285))}</b><span>warm-up</span></div></div>
        <p class="t-note">${left === STEPS.length ? 'Nothing ticked yet.' : left === 0 ? 'Every step is done.' : left + ' of ' + STEPS.length + ' steps to go.'} Tick each step as you finish it.</p>
        <div class="acts"><button class="linkbtn" data-fd-reset>Reset ticks</button></div></div>
      <div class="nu-card"><h2 class="nu-fname">The timeline</h2>${STEPS.map(row).join('')}</div>
      <div class="nu-card"><h2 class="nu-fname">The 90 g meal (pick one)</h2><p class="t-note">Hour 2. White bread only, toasted, and nothing with fat or fibre.</p>
        ${MEALS.map(([n, d, c]) => `<div class="wc-day wc-peak"><div class="wc-top"><div><small>${n}</small><strong>${esc(d)}</strong></div></div><p class="t-note">${esc(c)}</p></div>`).join('')}</div>
      <div class="nu-card"><h2 class="nu-fname">The night before</h2><ol class="wc-how"><li><b>Mix the bottles.</b> Three bottles of your drink mix: about 61 g carbs and 1,700 to 2,100 mg sodium each. Bottle 3 is only half used.</li><li><b>Pack the meal.</b> White bread, honey and jam, plus a small bottle of plain water for the rest hour.</li><li><b>Chill the bottles.</b> Cold fluid leaves the stomach faster than warm.</li><li><b>Shake before opening.</b> The powders settle into sludge at the bottom.</li></ol></div>
      <div class="nu-card"><h2 class="nu-fname">Why it is set up this way</h2><ol class="wc-how"><li><b>Fluids first.</b> After a cut your blood is thick, and digestion works poorly until blood volume is back. Drinking on an empty stomach gets it back fastest.</li><li><b>Keep the drink light.</b> Around 60 g of carbs an hour is about the most the gut can absorb. More sits in the gut, pulls water in and causes cramps. The extra carbs go in as the solid meal.</li><li><b>Food in Hour 2.</b> A big meal takes 1.5 to 2 hours to clear, so eating then leaves it gone before the warm-up. Eating after the last bottle does not.</li><li><b>Rest in Hour 4.</b> Lollies and sugar here can spike then crash your blood sugar right as you warm up.</li><li><b>Stop before the warm-up.</b> Once your heart rate climbs, blood leaves your stomach and digestion stops. Whatever is in there stays, and body shots will bring it up.</li></ol></div>
      <p class="iq-note">A guide, not medical advice. Volumes and carbs here are general numbers for an 80 kg fighter, so scale them to your own weight and what your stomach is used to. Trial the whole plan in training before a fight, and ask your coach, dietitian or doctor if you are unsure.</p>`;
  }

  window.renderFightDay = function(){ $('fightdayBody').innerHTML = body(); };
  const redraw = () => { const y = window.scrollY; renderFightDay(); window.scrollTo(0, y); };
  $('fightday').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
    if(d.section) show(d.section);
    else if(d.fdDone){ if(data.done[d.fdDone]) delete data.done[d.fdDone]; else data.done[d.fdDone] = true; save(); redraw(); }
    else if('fdReset' in d){ data.done = {}; save(); redraw(); }
  });
  $('fightday').addEventListener('change', e => {
    if(e.target.id === 'fdTime' && /^\d\d:\d\d$/.test(e.target.value)){ data.time = e.target.value; data.done = {}; save(); redraw(); }
  });
  window.bfFightDay = {open(){ show('fightday'); }};
  if(!$('fightday').hidden) renderFightDay();
})();
