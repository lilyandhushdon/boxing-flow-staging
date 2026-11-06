// Output rounds: pick a number of punches for a 3-minute round. The coach calls one combination after another, and the number of punches
// called adds up to exactly that number by the end of the round. The targets are sparring work rates, from a steady pace to a burst
// that is only possible by throwing every combination several times in a row ("1, 2, 3, times 2"), so the faster ones are called that way.
// To add a target, add a line to OUT_TARGETS: [punches in a round, name, average punches per call, style].
// Style: 'single' calls one combination at a time, 'mixed' repeats some, 'multi' makes every call a combination repeated,
// and 'blocks' is the fixed list of three-punch combinations in OUT_BLOCKS, each thrown ten times in a row.
const OUT_TARGETS = [
  [90,  'Low work rate',       3,   'single'],      // 30 a minute
  [135, 'Moderate work rate',  3,   'single'],      // 45 a minute
  [210, 'High output',         3.5, 'single'],      // 70 a minute
  [270, 'Very high output',    4,   'mixed'],       // 90 a minute
  [360, 'Extreme burst pace',  6,   'multi'],       // 120 a minute
  [400, 'Elite output',        6,   'multi'],
  [500, 'Maximum output',      7,   'multi'],
  [540, '3-punch blocks',      30,  'blocks'],     // 18 combinations x 10 times
  [135, '3-punch combinations', 3,  'fix3'],       // a full round of nothing but three-punch combinations, each thrown once: 45 calls
  [144, '4-punch combinations', 4,  'fix4'],       // 36 calls
  [150, '5-punch combinations', 5,  'fix5'],       // 30 calls
  [150, '6-punch combinations', 6,  'fix6']        // 25 calls
];
// Three-punch blocks: each combination is thrown 10 times in a row, about 10 seconds, so 18 of them fill a 3-minute round.
// Rip is the rip uppercut. The first twelve are the ones timed in the gym; the last six are extras to fill the round, change them freely.
const OUT_BLOCKS = ['1-2-1','1-2-3','1-2-5','1-2-Rip','3-2-3','2-3-2','2-1-2','4-3-2','1-1-2','1-3-2','3-6-Rip','Rip-3-2',
                    '1-2-6','2-1-3','1-3-3','3-2-1','1-1-3','2-3-6'];
const OUT_BLOCK_REPS = 10;
const OUT_LEAD = 4, OUT_TAIL = 4;                 // seconds before the first call and after the last, inside the 3-minute round
const OUT_FEEL = {single:'one combination at a time', mixed:'longer combinations, some repeated', multi:'every call is a combination repeated, like 1, 2, 3 times 2',
  blocks:'18 three-punch combinations, each thrown 10 times in a row, about 10 seconds each',
  fix3:'every call is a three-punch combination, thrown once', fix4:'every call is a four-punch combination, thrown once', fix5:'every call is a five-punch combination, thrown once', fix6:'every call is a six-punch combination, thrown once'};
const OUTPUT = OUT_TARGETS.map(([punches, label, avg, style]) => ({name:label, punches, avg, style,
  blurb:`${punches} punches a round · ${Math.round(punches/3)} a minute · ${OUT_FEEL[style]}`}));
const OUT_OPTS = [{r:3,m:3},{r:5,m:3},{r:1,m:3},{r:6,m:3}];   // rounds x minutes

// the numbers are the usual boxing numbers: 1 jab, 2 cross, 3 lead hook, 4 rear hook, 5 lead uppercut, 6 rear uppercut. "body" after a number is that punch to the body (3body is the lead hook to the body),
// and Rip is the rip uppercut. Each key is how many punches the combination has.
const OUT_COMBOS = {
  1:['Jab','Cross','3body'],
  2:['1-2','1-1','2-3','1-6','3-2','1-3','1-4body','2-3body','1-Rip','3body-2'],
  3:['1-2-3','1-1-2','1-2-1','2-3-2','1-6-3','1-2-5','3-2-3','1-3-2','1-2-Rip','1-2-3body','2-3body-2','1-3body-2','1-4body-3','3body-3-2'],
  4:['1-2-3-2','1-1-2-3','1-2-1-2','1-2-5-2','1-6-3-2','2-3-2-3','1-2-3body-2','1-2-Rip-2','1-3-2-3','2-3-2-Rip','1-1-2-3body','1-2-3body-3'],
  5:['1-2-3-2-1','1-2-3-2-3','1-2-5-2-3','1-1-2-3-2','1-2-1-2-3','1-2-3body-3-2','1-2-Rip-2-3','1-2-3-2-Rip','2-3-2-3-2','1-3-2-3-2','1-2-3body-2-3'],
  6:['1-2-3-2-1-2','1-1-2-3-2-1','1-2-3-6-3-2','1-2-5-2-3-2','1-2-3-4-3-2','1-2-3-2-3-2','1-1-2-3body-3-2','1-2-Rip-3-2-3','1-2-3-2-Rip-2','1-2-3body-3-2-3']
};
// what the coach says for a combination: "1-2-3body" becomes "1, 2, 3 body"
const outSay = combo => combo.replace(/(\d)body/g, '$1 body').replace(/Rip/g, 'rip').replace(/-/g, ', ');
// the sizes of call the coach can say: one combination of 1 to 6 punches, or one of 2 to 6 repeated 2 or 3 times
const OUT_MAX_REPS = 3;                            // a combination is never thrown more than three times in a row
const OUT_SIZES = (() => { const s = new Set([1,2,3,4,5,6]); for(let L=2; L<=6; L++) for(let r=2; r<=OUT_MAX_REPS; r++) s.add(L*r); return [...s].sort((a,b) => a-b); })();
// the repeated calls used for the fastest rounds: a short combination (2 to 4 punches) thrown 2 or 3 times
const OUT_MULTI = (() => { const s = new Set(); for(let L=2; L<=4; L++) for(let r=2; r<=OUT_MAX_REPS; r++) s.add(L*r); return [...s].sort((a,b) => a-b); })();
const nearest = (list, want) => list.reduce((best,s) => Math.abs(s-want) < Math.abs(best-want) ? s : best, list[0]);
let lastCombo = '';
function outCall(size, multi){                     // how to throw `size` punches: [length of the combination, times it is thrown]
  let ways = [];
  const lo = multi ? 2 : 1;                          // in the fastest rounds, every call is a combination repeated
  if(size <= 6 && !multi) ways.push([size,1]);
  for(let L=2; L<=(multi?4:6); L++) if(size%L === 0 && size/L >= 2 && size/L <= OUT_MAX_REPS) ways.push([L, size/L]);
  if(!ways.length) ways = size <= 6 ? [[size,1]] : [[6, Math.min(OUT_MAX_REPS, Math.round(size/6) || 1)]];
  const [L, reps] = ways[Math.random()*ways.length|0];
  let pool = OUT_COMBOS[L].filter(c => c !== lastCombo); if(!pool.length) pool = OUT_COMBOS[L];
  const combo = pool[Math.random()*pool.length|0]; lastCombo = combo;
  const say = outSay(combo);
  return {size: L*reps, display: reps > 1 ? `${combo} × ${reps}` : combo, speech: reps > 1 ? `${say}, times ${reps}` : say};
}
// the calls for one round, spaced evenly, whose sizes add up to exactly the target
function makeCalls(target){
  if(target.style === 'blocks') return blockCalls();
  if(/^fix\d$/.test(target.style)) return fixedCalls(target, +target.style[3]);
  const total = target.punches, multi = target.style === 'multi', calls = Math.max(8, Math.round(total / target.avg));
  const list = multi ? OUT_MULTI : OUT_SIZES, sizes = []; let sum = 0;
  for(let i=0; i < calls-2; i++){
    const want = Math.max(1, (total*(i+1)/calls - sum) * (.75 + Math.random()*.5));            // a little variety; the running total corrects it
    let s = nearest(list, want);
    if(target.style === 'mixed' && Math.random() < .5) s = nearest(OUT_SIZES.filter(x => x <= 6), want);   // some calls are a single combination
    sizes.push(s); sum += s;
  }
  let left = total - sum, pair = null;                // the last two calls share what is left, so the round adds up exactly
  for(const a of OUT_SIZES){ const b = left - a; if(b >= 1 && OUT_SIZES.includes(b) && (!pair || Math.abs(a-b) < Math.abs(pair[0]-pair[1]))) pair = [a,b]; }
  if(pair) sizes.push(...pair);
  else while(left > 0){ const s = [...OUT_SIZES].reverse().find(x => x <= left); sizes.push(s); left -= s; }
  const gap = (180 - OUT_LEAD - OUT_TAIL) / sizes.length; let cum = 0, halfDone = false;
  return sizes.map((size,i) => { const c = outCall(size, multi && size >= 4 && i < sizes.length-2); cum += c.size;
    const half = !halfDone && cum >= total/2; if(half) halfDone = true;
    return {...c, t: OUT_LEAD + i*gap, cum, speech: (half ? 'Halfway. ' : '') + c.speech}; });
}
// a round of one length of combination: every call has exactly L punches and is thrown once, drawn from the whole list before any comes round again
function fixedCalls(target, L){
  const n = Math.round(target.punches / L), gap = (180 - OUT_LEAD - OUT_TAIL) / n, calls = []; let bag = [], last = '';
  for(let i=0; i<n; i++){
    if(!bag.length){ bag = OUT_COMBOS[L].slice().sort(() => Math.random() - .5); if(bag[bag.length-1] === last && bag.length > 1) bag.unshift(bag.pop()); }
    const combo = bag.pop(); last = combo;
    calls.push({size:L, display:combo, t:OUT_LEAD + i*gap, cum:(i+1)*L, speech:(i === Math.floor(n/2) ? 'Halfway. ' : '') + outSay(combo)});
  }
  return calls;
}
// the three-punch blocks: one call every ~10 seconds, each a combination to throw ten times, 30 punches a block
function blockCalls(){
  const lead = 3, gap = 9.8;
  return OUT_BLOCKS.map((combo,i) => ({size: 3*OUT_BLOCK_REPS, display: combo + ' × ' + OUT_BLOCK_REPS, t: lead + i*gap, cum: (i+1)*3*OUT_BLOCK_REPS,
    speech: (i === OUT_BLOCKS.length/2 ? 'Halfway. ' : '') + outSay(combo) + ', times ' + OUT_BLOCK_REPS}));
}
