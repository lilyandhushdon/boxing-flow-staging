// Treadmill interval workouts from Red Zone Running. All are advanced and all run at a 1.5% gradient.
// A workout is a list of loads, run in order (the whole list is run "passes" times). A load is a pattern of on and off intervals, repeated "reps" times, run at a speed
// range in km/h, with "after" seconds of recovery once the load is done. "mins" is the length the workout is named for: tests check that the loads add up to it.
// To add a workout, add an entry: a name, its minutes, a blurb, how it works, and its loads.
const TM_GRADIENT = 1.5;
const TREADMILL = [
  {name:'Norwegian', mins:22, passes:1, blurb:'Four long runs with a rest between.',
   how:'Four runs of 4 minutes at a strong, steady pace. After each of the first three you rest for 2 minutes. The fourth is the last one.',
   loads:[
    {seq:[['on',240]], reps:1, speed:[15,17], after:120},
    {seq:[['on',240]], reps:1, speed:[15,17], after:120},
    {seq:[['on',240]], reps:1, speed:[15,17], after:120},
    {seq:[['on',240]], reps:1, speed:[15,17], after:0}]},
  {name:'Brianstorm', mins:20, passes:1, blurb:'Four loads of short intervals, shorter and faster each time.',
   how:'Four loads of quick on and off intervals. The intervals get shorter and the speed climbs with every load. Each load takes 3 minutes, with 2 minutes of recovery after it. The recovery times are not printed on the original sheet: 2 minutes is what makes the workout the full 20 minutes.',
   loads:[
    {seq:[['on',30],['off',15]], reps:4, speed:[16,18], after:120},
    {seq:[['on',20],['off',10]], reps:6, speed:[17,19], after:120},
    {seq:[['on',15],['off',15]], reps:6, speed:[18,20], after:120},
    {seq:[['on',10],['off',10]], reps:9, speed:[19,21], after:120}]},
  {name:'Crying Lightning', mins:36, passes:4, blurb:'Six loads from a sprint to a long hold, done four times.',
   how:'Six loads, each one minute long except the last. The first loads are short and very fast, and every load after that is a little longer and a little slower. Load 6 is 50 seconds on, 10 off, then 60 seconds on. Recover for 2 minutes after load 6, then go through all six loads again, four times in all.',
   loads:[
    {seq:[['on',15],['off',45]], reps:1, speed:[20,22], after:0},
    {seq:[['on',20],['off',40]], reps:1, speed:[20,22], after:0},
    {seq:[['on',30],['off',30]], reps:1, speed:[19,21], after:0},
    {seq:[['on',40],['off',20]], reps:1, speed:[18,20], after:0},
    {seq:[['on',45],['off',15]], reps:1, speed:[17,19], after:0},
    {seq:[['on',50],['off',10],['on',60]], reps:1, speed:[16,18], after:120}]},
  {name:'Sharpshooter', mins:39, passes:2, blurb:'Sprints that build to a long run, then all of it again.',
   how:'Four loads that go from short, fast sprints to a long run. Rest for 2 minutes after loads 1, 2 and 3. After load 4, go straight back to load 1 and work through all the loads again.',
   loads:[
    {seq:[['on',15],['off',15]], reps:8, speed:[20,22], after:120},
    {seq:[['on',30],['off',15]], reps:4, speed:[19,21], after:120},
    {seq:[['on',60],['off',15]], reps:2, speed:[17,19], after:120},
    {seq:[['on',120],['off',120]], reps:1, speed:[16,18], after:0}]},
  {name:'Apples & Pairs', mins:30, passes:1, blurb:'Pairs of runs split by a one-minute rest, shorter each load.',
   how:'Four loads, each a pair of runs with a 1-minute rest in the middle. The runs get shorter and the speed goes up with every load. Rest for 2 minutes after loads 1, 2 and 3.',
   loads:[
    {seq:[['on',240],['off',60],['on',240]], reps:1, speed:[15,17], after:120},
    {seq:[['on',180],['off',60],['on',180]], reps:1, speed:[15,17], after:120},
    {seq:[['on',120],['off',60],['on',120]], reps:1, speed:[16,18], after:120},
    {seq:[['on',60],['off',60],['on',60]], reps:1, speed:[17,19], after:0}]}
];
const tmSeq = l => l.seq.reduce((n, [, s]) => n + s, 0);                                         // one go through a load's pattern, in seconds
const tmSeconds = w => w.passes * w.loads.reduce((n, l) => n + l.reps * tmSeq(l) + l.after, 0);   // the whole workout
const tmSpeed = sp => sp[0] + '–' + sp[1];
const tmClock = s => s < 60 ? s + ' secs' : s % 60 ? (s / 60 | 0) + ' min ' + s % 60 + ' secs' : s / 60 + ' min';
const tmLoadText = l => l.seq.map(([k, s]) => tmClock(s) + ' ' + k).join(' : ') + (l.reps > 1 ? ', ' + l.reps + ' times' : '');
