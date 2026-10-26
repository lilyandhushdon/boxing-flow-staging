// Runs: steady, zone-based runs (outside or on a treadmill). The red zone work, hard intervals, is in treadmill.js; this is the green and yellow zone running that
// builds the engine: easy runs, a long run and a tempo run. A run is a warm-up, the main run and a cool-down. The main run is read out in blocks of 5 minutes so the
// voice can say how far in the runner is and keep them at the right effort. "mins" is the length the run is named for: tests check the three parts add up to it.
// To add a run, add an entry: a name, its effort, its minutes, the three parts and the words for each.
const RUN_BLOCK = 300;   // seconds between voice check-ins in the main run
// effort: how hard it should feel, the colour on the screen, and which of the five heart rate zones it sits in (see hr.js)
const RUN_EFFORT = {
  Green:  {color:'#4fd1b5', hr:[2],    feel:'Easy and conversational. You can speak in full sentences and mostly breathe through your nose.'},
  Yellow: {color:'#f5c95a', hr:[3, 4], feel:'Comfortably hard. You can say a few words at a time but you could not hold a conversation.'}
};
const RUNS = [
  {id:'recovery', name:'Recovery jog', effort:'Green', mins:20, warm:180, main:840, cool:180, blurb:'A very easy jog to loosen up and flush the legs after a hard day.',
   how:'Slower than you think you need to. The aim is to move, not to train. If you have to choose between too slow and too fast, go slower.'},
  {id:'easy30', name:'Easy run, 30 min', effort:'Green', mins:30, warm:300, main:1200, cool:300, blurb:'A steady, easy run that builds your aerobic engine.',
   how:'Hold one comfortable pace the whole way. If you cannot talk, slow down. This is the base that every hard round in the gym and the ring is built on.'},
  {id:'easy45', name:'Easy run, 45 min', effort:'Green', mins:45, warm:300, main:2100, cool:300, blurb:'The staple green zone run for building your engine.',
   how:'One steady, conversational pace. Most of your running should look like this. It feels too easy; that is how it works.'},
  {id:'easy60', name:'Easy run, 60 min', effort:'Green', mins:60, warm:300, main:3000, cool:300, blurb:'An hour of steady aerobic running.',
   how:'Settle into a pace you could hold all day. Drink and eat as you would for a long session, and keep it easy even when you feel good.'},
  {id:'long90', name:'Long run, 90 min', effort:'Green', mins:90, warm:600, main:4200, cool:600, blurb:'A long, slow run for stamina over a full fight camp.',
   how:'Slow and steady for the whole run. Take water with you. Long runs are about time on your feet, not speed.'},
  {id:'tempo30', name:'Tempo run, 30 min', effort:'Yellow', mins:30, warm:300, main:1200, cool:300, blurb:'A steady, comfortably hard run that raises the pace you can hold.',
   how:'Easy warm-up, then 20 minutes at a pace that feels comfortably hard and steady, then an easy cool-down. Do not start too fast: it should feel hard only in the last few minutes.'}
];
const fmtRun = s => s >= 3600 ? `${Math.floor(s / 3600)} hour${s >= 7200 ? 's' : ''}${s % 3600 ? ' ' + Math.round(s % 3600 / 60) + ' minutes' : ''}` : s % 60 ? `${Math.floor(s / 60)} minutes ${s % 60} seconds` : `${s / 60} minute${s === 60 ? '' : 's'}`;
// the steps of a run, in order. hrText is words like "zone 2, 112 to 130 beats a minute", or '' when the heart rate zones are not set up yet.
// Every step is {phase: 'warm' | 'main' | 'cool', start: true on the first step of a phase, sec, name, cue, say}.
function runSteps(w, hrText){
  const eff = RUN_EFFORT[w.effort], hr = hrText ? ` Aim for ${hrText}.` : '', out = [];
  const total = w.warm + w.main + w.cool;
  out.push({phase:'warm', start:true, sec:w.warm, name:'Warm-up', cue:'Walk, then ease into a very gentle jog. Loosen your shoulders and shake out your arms.',
    say:`Warm-up. ${fmtRun(w.warm)}. Walk, then ease into a very gentle jog.`});
  for(let at = 0; at < w.main; at += RUN_BLOCK){
    const sec = Math.min(RUN_BLOCK, w.main - at), first = at === 0, last = at + sec >= w.main, elapsed = w.warm + at, left = total - elapsed;
    out.push({phase:'main', start:first, sec, name:first ? w.name.replace(/, \d+ min$/, '') : 'Keep going', cue:eff.feel + hr,
      say: first ? `Now the run. ${fmtRun(w.main)}. ${eff.feel}${hr}`
         : last ? `Last block of the run. ${fmtRun(left - w.cool)} to go, then the cool-down. Hold your pace and stay relaxed.`
         : `${fmtRun(elapsed)} in. ${fmtRun(left)} to go. ${w.effort === 'Green' ? 'Stay easy. If you cannot talk, slow down.' : 'Steady and comfortably hard. Do not speed up.'}`});
  }
  out.push({phase:'cool', start:true, sec:w.cool, name:'Cool-down', cue:'Slow to an easy jog, then a walk. Let your breathing and heart rate come down.',
    say:`Cool-down. ${fmtRun(w.cool)}. Slow right down to a walk and let your breathing settle.`});
  return out;
}
const runSeconds = w => runSteps(w, '').reduce((n, x) => n + x.sec, 0);
