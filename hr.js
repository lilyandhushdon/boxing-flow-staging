/* Heart rate: connects to a Bluetooth chest strap (Polar H10, Garmin HRM and any strap that uses the standard heart rate service) with Web Bluetooth,
   shows live beats per minute and the training zone, and keeps the person's max heart rate on this device.
   Web Bluetooth works in Chrome and Edge on Android, Windows, Mac and Chromebook. iPhone browsers don't have it, so the screen says so.
   Other code reads it through window.bfHR: {state, bpm, zone, rr, zones(), on(fn), connect(), disconnect()}. */
(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'bfHR', STALE_MS = 8000;
  const ZONES = [
    {n:1, name:'Easy',    from:.50, color:'#7cc0ea', use:'Warm up, cool down and recover.'},
    {n:2, name:'Aerobic', from:.60, color:'#4fd1b5', use:'Steady work that builds your engine.'},
    {n:3, name:'Tempo',   from:.70, color:'#f5c95a', use:'Sparring pace. You can talk in short bursts.'},
    {n:4, name:'Hard',    from:.80, color:'#ff9a5c', use:'Hard rounds and hard output. Builds fight fitness.'},
    {n:5, name:'Max',     from:.90, color:'#ff6e6e', use:'All-out bursts. Only in short doses.'}
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let cfg = {age:null, max:null};
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch(e){} };

  const hr = {state:'off', bpm:null, rr:[], at:0, name:''};   // state: off, connecting, on, lost
  const listeners = new Set();
  const emit = () => { listeners.forEach(f => { try { f(hr); } catch(e){} }); paint(); };

  // max heart rate: their own number if they know it, otherwise estimated from age (Tanaka: 208 - 0.7 x age)
  const maxHR = () => cfg.max || (cfg.age ? Math.round(208 - 0.7 * cfg.age) : null);
  function zoneOf(bpm){
    const m = maxHR(); if(!m || !bpm) return null;
    let z = null; for(const x of ZONES) if(bpm >= x.from * m) z = x; return z;
  }
  const zones = () => { const m = maxHR(); return m ? ZONES.map((z, i) => ({...z, lo:Math.round(z.from * m), hi:i < 4 ? Math.round(ZONES[i + 1].from * m) - 1 : m})) : null; };
  const fresh = () => hr.bpm && Date.now() - hr.at < STALE_MS;

  /* ---------- the strap ---------- */
  const supported = !!(navigator.bluetooth && navigator.bluetooth.requestDevice);
  let dev = null, ch = null, wanted = false, tries = 0;

  function parse(dv){
    const f = dv.getUint8(0); let o = 1;
    hr.bpm = f & 1 ? dv.getUint16(o, true) : dv.getUint8(o); o += f & 1 ? 2 : 1;
    if(f & 8) o += 2;                                      // energy expended, not used
    if(f & 0x10){ const rr = []; for(; o + 1 < dv.byteLength; o += 2) rr.push(dv.getUint16(o, true) / 1024 * 1000); if(rr.length) hr.rr = rr.map(Math.round); }   // beat to beat, in ms
    hr.at = Date.now(); hr.state = 'on'; tries = 0; emit();
  }
  async function open(){
    const srv = await dev.gatt.connect();
    const svc = await srv.getPrimaryService('heart_rate');
    ch = await svc.getCharacteristic('heart_rate_measurement');
    ch.addEventListener('characteristicvaluechanged', e => parse(e.target.value));
    await ch.startNotifications();
  }
  async function connect(){
    if(!supported || hr.state === 'connecting') return;
    try {
      hr.state = 'connecting'; emit();
      dev = await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}]});
      hr.name = dev.name || 'Heart rate strap'; wanted = true;
      dev.addEventListener('gattserverdisconnected', lost);
      await open(); hr.state = 'on'; emit();
    } catch(e){ hr.state = 'off'; hr.error = e && e.name === 'NotFoundError' ? '' : 'Could not connect. Make sure the strap is wet, worn and not connected to another app, then try again.'; emit(); }
  }
  // the strap drops now and then mid-workout (sweat, a bump): keep trying to get it back
  function lost(){
    if(!wanted) return;
    hr.state = 'lost'; emit();
    if(tries++ > 12) { hr.state = 'off'; hr.error = 'Lost the strap. Tap connect to try again.'; wanted = false; emit(); return; }
    setTimeout(async () => { if(!wanted) return; try { await open(); hr.state = 'on'; emit(); } catch(e){ lost(); } }, Math.min(1000 * tries, 5000));
  }
  function disconnect(){ wanted = false; try { dev && dev.gatt.connected && dev.gatt.disconnect(); } catch(e){} hr.state = 'off'; hr.bpm = null; hr.rr = []; hr.error = ''; emit(); }
  setInterval(() => { if(hr.state === 'on' && !fresh()) paint(); }, 2000);   // a strap that goes quiet shows dashes, not a stale number

  /* ---------- the screen ---------- */
  const heart = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  function body(){
    const m = maxHR(), zs = zones();
    return `<div class="brand"><button class="eyebrow back-link" data-section="today">&larr; Dashboard</button></div>
      <h1>Heart rate</h1>
      <p class="sub">Connect a chest strap to see your heart rate and training zone live during a workout.</p>
      ${supported ? '' : '<p class="t-note warn">This browser can\'t connect to heart rate straps. Use Chrome or Edge on Android, Windows, Mac or Chromebook. iPhone support is planned for the app version.</p>'}
      <div class="hr-card"><div class="hr-live"><span class="hr-big" id="hrBig">--</span><span class="hr-unit">bpm</span></div>
        <div class="hr-zone" id="hrZone"></div><p class="t-note" id="hrStatus"></p>
        <div class="acts" id="hrActs"></div></div>
      <h2 class="hr-h">Your zones</h2>
      <div class="hr-set"><label class="c-label">Your age<input type="number" id="hrAge" inputmode="numeric" min="12" max="90" value="${cfg.age || ''}" placeholder="e.g. 28"></label>
        <label class="c-label">Max heart rate (if you know it)<input type="number" id="hrMax" inputmode="numeric" min="120" max="230" value="${cfg.max || ''}" placeholder="${cfg.age ? maxHR() + ' (estimated)' : 'e.g. 192'}"></label></div>
      <p class="t-note" id="hrNote">${m ? `Zones are worked out from a max of ${m} bpm${cfg.max ? '' : ' (estimated from your age, so it may be a little off)'}.` : 'Enter your age, or your max heart rate if you know it, to get your zones.'}</p>
      <div class="hr-zones" id="hrZones">${zs ? zs.map(z => `<div class="hr-z" style="--c:${z.color}"><b>${z.n}</b><span><strong>${z.name}</strong> <em>${z.lo}-${z.hi}${z.n === 5 ? '+' : ''} bpm</em><small>${z.use}</small></span></div>`).join('') : ''}</div>
      <p class="iq-note">Your heart rate stays on your device. Heart rate zones are a guide, not medical advice.</p>`;
  }
  function paint(){
    const z = fresh() ? zoneOf(hr.bpm) : null, on = hr.state === 'on' || hr.state === 'lost';
    const pill = $('hrPill');
    if(pill){ pill.hidden = !on; pill.style.setProperty('--c', z ? z.color : 'var(--muted)'); pill.querySelector('b').textContent = fresh() ? hr.bpm : '--'; pill.title = z ? 'Zone ' + z.n + ' ' + z.name : 'Heart rate'; }
    if(!$('hrBig')) return;
    $('hrBig').textContent = fresh() ? hr.bpm : '--'; $('hrBig').style.color = z ? z.color : '';
    $('hrZone').innerHTML = z ? `<span class="hr-chip" style="--c:${z.color}">Zone ${z.n} · ${z.name}</span>` : '';
    $('hrStatus').textContent = hr.state === 'connecting' ? 'Connecting. Pick your strap from the list.' : hr.state === 'lost' ? 'Signal lost. Reconnecting.' : hr.state === 'on' ? (hr.name + ' connected.' + (fresh() ? '' : ' Waiting for a reading. Check the strap is snug and wet.')) : (hr.error || 'Wet the strap pads, put it on, then connect.');
    $('hrActs').innerHTML = on ? '<button class="btn ghost" data-hr-off>Disconnect</button>' : `<button class="btn" data-hr-on ${supported && hr.state !== 'connecting' ? '' : 'disabled'}>Connect heart rate strap</button>`;
  }
  window.renderHR = function(){ $('hrBody').innerHTML = body(); paint(); };
  $('hrBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    if('hrOn' in b.dataset) connect(); else if('hrOff' in b.dataset) disconnect();
    else if(b.dataset.section) show(b.dataset.section);
  });
  $('hrBody').addEventListener('input', e => {
    if(e.target.id !== 'hrAge' && e.target.id !== 'hrMax') return;
    const age = +$('hrAge').value, max = +$('hrMax').value;
    cfg.age = age >= 12 && age <= 90 ? Math.round(age) : null; cfg.max = max >= 120 && max <= 230 ? Math.round(max) : null; save();
    const m = maxHR(), zs = zones();   // update the numbers without redrawing, so the inputs keep focus
    $('hrNote').textContent = m ? `Zones are worked out from a max of ${m} bpm${cfg.max ? '' : ' (estimated from your age, so it may be a little off)'}.` : 'Enter your age, or your max heart rate if you know it, to get your zones.';
    $('hrMax').placeholder = cfg.age ? m + ' (estimated)' : 'e.g. 192';
    $('hrZones').innerHTML = zs ? zs.map(z => `<div class="hr-z" style="--c:${z.color}"><b>${z.n}</b><span><strong>${z.name}</strong> <em>${z.lo}-${z.hi}${z.n === 5 ? '+' : ''} bpm</em><small>${z.use}</small></span></div>`).join('') : '';
    paint(); listeners.forEach(f => { try { f(hr); } catch(err){} });
  });

  window.bfHR = {get state(){ return hr.state; }, get bpm(){ return fresh() ? hr.bpm : null; }, get rr(){ return hr.rr; }, get zone(){ return fresh() ? zoneOf(hr.bpm) : null; },
    zones, maxHR, supported, on:fn => { listeners.add(fn); return () => listeners.delete(fn); }, connect, disconnect};
  if(!$('hr').hidden) renderHR();
})();
