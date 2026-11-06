/* Calories burned in a workout: an estimate, switched on in the Profile (burnOn in bfProfile). While a workout runs, every second adds up energy two ways:
   - with a heart rate strap connected (and the profile's sex, age and the weight log), from the heart rate (the Keytel formula), which follows how hard the body is working;
   - otherwise from a MET value for what is being done (METs are the usual ratings for how hard an activity is) x body weight x time. The METs here are rounded from the
     Compendium of Physical Activities. Without a strap this is a rough guide, commonly out by a fifth or more either way, because it can't know how hard you really worked.
   The total shows on the done screen and goes into the activity log with the session. Loads after home.js (it wraps logSession) and builder.js (it wraps the end of a workout). */
(function(){
  const P = () => window.bfProfile;
  const on = () => !!(P() && P().data.burnOn);
  const kgNow = () => { try { const s = window.bfWeight && window.bfWeight.stats(); return s && s.last ? s.last : null; } catch(e){ return null; } };
  const DEFAULT_KG = 75;
  let total = 0, since = 0, usedHr = 0, secs = 0, seen = null;

  // METs for the step being done
  function met(s){
    if(!s) return 1.5;
    if(s.type === 'ready') return 2;
    const rest = s.type === 'rest', mini = s.mini;
    if(mode === 'treadmill'){
      if(rest || mini) return rest ? 3 : 4;
      const sp = s.speed ? (s.speed[0] + s.speed[1]) / 2 : 9; return Math.max(6, sp * 1.05);
    }
    if(mode === 'run') return s.kind === 'main' ? 8 : 4.5;
    if(mode === 'recovery') return 2.3;
    if(mode === 'abs') return 5;
    if(mode === 'neck') return 4;
    if(mode === 'flow') return 3.5;   // dance and easy footwork are light to moderate
    if(mode === 'shoulder') return rest ? 2.5 : 4;
    if(mode === 'plyo') return rest ? 3 : mini ? 3.5 : 8;
    if(mode === 'timer') return rest ? 2.5 : 6.5;
    return rest ? 2.5 : 6.5;   // boxing: coach, basic, scenario and output rounds, bag work and shadowboxing
  }
  // kilocalories a second from a heart rate, or null if the strap isn't live or the profile is missing something
  function fromHr(kg){
    const h = window.bfHR, p = P() && P().data, age = P() && P().age();
    if(!h || h.state !== 'on' || !h.bpm || !p || !p.sex || !age) return null;
    const hr = h.bpm, w = kg, perMin = p.sex === 'male' ? (-55.0969 + .6309 * hr + .1988 * w + .2017 * age) / 4.184 : (-20.4022 + .4472 * hr - .1263 * w + .074 * age) / 4.184;
    return Math.max(perMin, 1.2 * w / 60) / 60;   // never below a resting rate
  }
  setInterval(() => {
    if(typeof steps === 'undefined' || !steps) return;
    if(steps !== seen){ seen = steps; if(!window.bfInChain) reset(); }   // a new workout starts the count again; the blocks of a built workout carry on
    if(!on() || !running || idx >= steps.length || $('timer').hidden) return;
    const kg = kgNow() || DEFAULT_KG, dt = speed || 1, h = fromHr(kg);
    const kcal = (h != null ? h : met(steps[idx]) * kg / 3600) * dt;
    total += kcal; since += kcal; secs += dt; if(h != null) usedHr += dt;
  }, 1000);
  function reset(){ total = 0; since = 0; usedHr = 0; secs = 0; }

  window.bfBurn = {reset, get total(){ return Math.round(total); }, get on(){ return on(); },
    // how the number was worked out, for the done screen
    note(){ const strap = secs && usedHr / secs > .5; return strap ? 'worked out from your heart rate' : kgNow() ? 'a rough estimate from the type of workout and your weight. A heart rate strap makes it more accurate' : 'a rough estimate from the type of workout and a 75 kg body. Log your weight, or connect a heart rate strap, for a better number'; }};

  // the done screen shows it, and the log keeps it with the session
  const endOne = finish;
  finish = function(){
    endOne.apply(this, arguments);
    if(!on() || total < 1) return;
    const d = $('doneStats'); if(d) d.insertAdjacentHTML('beforeend', `<div><b>${Math.round(total)}</b><span>kcal burned</span></div>`);
    const n = $('doneBurnNote') || Object.assign(document.createElement('p'), {id:'doneBurnNote', className:'t-note'});
    n.textContent = 'Calories burned: ' + bfBurn.note() + '.'; if(d && !n.parentNode) d.insertAdjacentElement('afterend', n);
  };
  const logOne = window.logSession;
  window.logSession = e => { if(on() && since >= 1){ e = {...e, kcal:Math.round(since)}; since = 0; } return logOne(e); };
})();
