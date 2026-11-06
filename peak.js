// Peak week intervals: short, sharp bursts with an easy recovery in between, so speed and power stay high while the heart rate stays low (in the green zone).
// A round is a number of cycles of one burst ("on") and one easy spell ("off"). The ratio is on:off, so 1:1 is 30 seconds on and 30 off, 2:1 is 30 on and 15 off, 1:2 is 15 on and 30 off.
// The easier the off part, and the longer it is, the lower the heart rate stays. A workout has a list of sharp moves and a list of easy ones; each cycle takes the next of each.
// A sharp move is [name (read out as it starts), a short cue]. To add a workout, add an entry. To add a timing, add an option: r rounds, c cycles in a round, w seconds on, rs seconds off.
const PEAK_HR = 147;   // beats a minute: the ceiling for the green zone. With a heart rate strap connected, the coach calls out when it goes over.
const EASY = [
  ['Bounce and breathe', 'Stay on your toes, hands up. Long breath out.'],
  ['Slow shadow', 'Slow and loose. Drop the shoulders.'],
  ['Walk it out', 'Walk, hands up. Breathe in through the nose.'],
  ['Hands down, shake out', 'Shake out your arms. Let the heart rate settle.']
];
const PEAK = [
  {name:'Speed and sharpness', blurb:'Fast, light bursts of jabs and 1-2s. Pure speed, then fully easy.',
   sharp:[['Fast jabs', 'Snap them out and back. Speed, not force.'], ['1-2 burst', 'Quick, light 1-2s. Reset and go.'], ['Jab, jab, cross', 'Fast hands, sharp turn on the cross.'], ['Double jab, step, cross', 'Two quick jabs, step in, fire the cross.'], ['1-2-3 flurry', 'Throw it fast. Do not stop between.'], ['Non-stop 1-2s', 'Loose arms. Speed comes from relaxing.']],
   easy:EASY},
  {name:'Power snaps', blurb:'Fast punches with the last one tensed. Power is speed plus a tensed finish.',
   sharp:[['Fast jabs, tense the last', 'Loose and fast, then snap the last one.'], ['1-2, tense the cross', 'Light 1-2. Sit into the cross.'], ['Fast hooks, tense the last', 'Turn through the hips. Snap the last.'], ['1-2-3, tense the hook', 'Fast, fast, then turn the hook over.'], ['Flurry, power finish', 'Fast flurry, one hard finisher.'], ['Body shots, tense the last', 'Stay low. Drive the last one with the legs.']],
   easy:EASY},
  {name:'Footwork and angles', blurb:'Explosive steps in, angle off, and out. Quick feet, light hands.',
   sharp:[['Step in, jab, step out', 'Quick in and quick out.'], ['Pivot and 1-2', 'Turn the feet, then fire the 1-2.'], ['Lateral step, hook', 'Step off the line and hook.'], ['In, combo, angle off', 'Throw and leave at an angle.'], ['Fast circles', 'Quick small steps, hands up.'], ['Cut the ring, jab', 'Close the distance fast, then jab.']],
   easy:EASY},
  {name:'Defence and counter', blurb:'Sharp defence into a quick counter, then easy movement between.',
   sharp:[['Slip and counter', 'Small slip, fast counter.'], ['Roll under, hook', 'Roll under and come up with the hook.'], ['Parry, cross', 'Quick parry and straight back.'], ['Pull back, counter', 'Lean back out of range, then fire.'], ['Block, return', 'Soak it up and return fast.'], ['Slip, slip, 1-2', 'Two slips, then a quick 1-2.']],
   easy:EASY},
  {name:'Bag bursts', blurb:'Short, hard bursts on the heavy bag. Fast and crisp, then step away and breathe.',
   sharp:[['Jab, cross on the bag', 'Crisp and fast. Step out after.'], ['Hooks to the body', 'Short and sharp. Stay low.'], ['1-2-3-2', 'Flow through it. Snap each punch.'], ['Fast uppercuts', 'Tight elbows, quick hands.'], ['Free punching burst', 'Everything fast. Do not hold it.'], ['Power finish', 'Quick start, hard last shot.']],
   easy:[['Step off the bag', 'Hands up, bounce and breathe out.'], ['Slow shadow', 'Loose and slow. Let the breathing fall.'], ['Walk it out', 'Walk with hands up. Nose breathing.'], ['Shake out', 'Shake out your arms and shoulders.']]},
  {name:'Free flow', blurb:'Your choice of sharp work each burst. Always fast, always fully easy in between.',
   sharp:[['Free punching, fast', 'Anything you like, at top speed.'], ['Free punching, sharp', 'Clean and crisp. Do not rush your form.'], ['Free movement and punches', 'Move, slip, throw. Light hands.'], ['Free punching, power finish', 'Fast, then a tensed last punch.']],
   easy:EASY}
];
const PEAK_OPTS = [
  {ratio:'1:1', r:4, c:6, w:15, rs:15, note:'Quick bursts and a short breather. Keeps the heart rate low.'},
  {ratio:'1:1', r:4, c:5, w:20, rs:20, note:'A steady 1:1. Good for speed.'},
  {ratio:'1:1', r:4, c:4, w:30, rs:30, note:'The classic 30 on, 30 off. Watch your heart rate on the longer bursts.'},
  {ratio:'2:1', r:4, c:4, w:30, rs:15, note:'More work, less rest. The heart rate climbs, so keep the bursts easy-fast.'},
  {ratio:'3:1', r:3, c:3, w:45, rs:15, note:'Long bursts. Only when you are fresh, and keep an eye on your heart rate.'},
  {ratio:'1:2', r:4, c:5, w:15, rs:30, note:'Sharp bursts with a long recovery. Keeps the heart rate in the green.'},
  {ratio:'1:2', r:4, c:6, w:10, rs:20, note:'Very short, very fast. Lowest strain for the speed.'},
  {ratio:'1:2', r:4, c:4, w:20, rs:40, note:'Twenty fast seconds, a long recovery. Heart rate comes right back down.'},
  {ratio:'1:3', r:4, c:5, w:10, rs:30, note:'The most recovery. Make the ten seconds as fast as you can.'}
];
const peakSecs = o => o.c * o.w + (o.c - 1) * o.rs;   // one round, with no rest after the last burst
const peakMins = (o, rest) => Math.round((o.r * peakSecs(o) + (o.r - 1) * rest) / 60);
const PEAK_BRIEF = [
  ['What it is', 'Short, sharp bursts with a proper recovery after each one. You throw everything fast for the "on" time, then go fully easy for the "off" time. The ratio is on to off: 1:1 is 30 seconds on and 30 off, 2:1 is 30 on and 15 off, 1:2 is 15 on and 30 off.'],
  ['Keeping your heart rate in the green', `The aim is to keep your heart rate under ${PEAK_HR} beats a minute. Shorter bursts and longer recoveries (1:2, 1:3) keep it lowest. If it climbs near ${PEAK_HR}, go easier on the off part, or pick a lower ratio. With a heart rate strap connected, the coach tells you when it goes over.`],
  ['How to do the bursts', 'Fast and loose, with every punch crisp. Speed comes from relaxing, not from straining. Stop the burst when the time is up, even if you feel you have more. On the off part, bounce and breathe out long, so the heart rate comes down before the next burst.'],
  ['Stay safe', 'Stop if you feel dizzy, faint, or have chest pain. In fight week, drink as your plan says and keep sessions short. This is a guide, not medical advice.']
];
// with a heart rate strap on, the coach calls out when the heart rate goes over the ceiling in a burst (at most once every 25 seconds)
(function(){
  let last = 0;
  const hr = () => window.bfHR;
  const check = () => {
    if(typeof mode === 'undefined' || mode !== 'peak' || typeof running === 'undefined' || !running || typeof steps === 'undefined' || !steps) return;
    const h = hr(), s = steps[idx]; if(!h || !h.bpm || !s || s.type === 'ready') return;
    if(h.bpm > PEAK_HR && Date.now() - last > 25000){ last = Date.now(); say(s.mini ? `Heart rate ${h.bpm}. Take it easy. Breathe out long.` : `Heart rate ${h.bpm}. Stay loose, do not strain.`, 100); }
  };
  setInterval(check, 2000);
})();
