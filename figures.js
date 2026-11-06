/* Move figures: a simple stick figure shown in the timer for the stretching, mobility, pliability and abs moves, so a move can be followed at a glance.
   A pose is a list of frames; with more than one, they play in turn like a short animation. A frame is drawn from angles, so it is easy to adjust:
     h: the hip [x, y] on a 200 x 125 picture (the floor is at y 114)    t: the torso, from the hip to the neck    t2: the upper torso, when the back bends
     a, a2: the near and far arm as [upper arm, forearm]                  l, l2: the near and far leg as [thigh, shin]
     hd: how far the head tips from the torso                              wall: x of a wall to draw
   Angles are in degrees, clockwise from straight up: 0 is up, 90 is to the right, 180 is down, 270 is to the left. The figure faces right.
   window.bfFig.key(sessionId, moveName) finds the figure for a move (none for the massage gun, foam roller and cold shower), and bfFig.svg(key) draws it. */
(function(){
  const U = {torso:36, ua:19, la:18, th:26, sh:25};
  const d2r = Math.PI / 180, dir = a => [Math.sin(a * d2r), -Math.cos(a * d2r)];
  const at = (p, a, n) => { const d = dir(a); return [p[0] + d[0] * n, p[1] + d[1] * n]; };
  const f1 = n => Math.round(n * 10) / 10;
  const line = (pts, cls) => `<polyline class="${cls}" points="${pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}"/>`;
  function frame(f){
    const hip = f.h, t = f.t, t2 = f.t2 == null ? t : f.t2;
    const mid = at(hip, t, U.torso / 2), neck = at(mid, t2, U.torso / 2), sh = at(mid, t2, U.torso / 2 - 4), head = at(neck, t2 + (f.hd || 0), 10);
    const arm = a => { const e = at(sh, a[0], U.ua); return [sh, e, at(e, a[1], U.la)]; }, leg = l => { const k = at(hip, l[0], U.th); return [hip, k, at(k, l[1], U.sh)]; };
    return (f.wall ? `<line class="fg-wall" x1="${f.wall}" y1="4" x2="${f.wall}" y2="114"/>` : '')
      + line(arm(f.a2 || f.a), 'fg-far') + line(leg(f.l2 || f.l), 'fg-far')
      + line([hip, mid, neck], 'fg-body') + `<circle class="fg-head" cx="${f1(head[0])}" cy="${f1(head[1])}" r="7.5"/>`
      + line(leg(f.l), 'fg-near') + line(arm(f.a), 'fg-near');
  }
  const F = (h, t, a, a2, l, l2, x) => ({h, t, a, a2, l, l2, ...(x || {})});
  const LY = [110, 109], LEGS_UP = [50, 150];   // lying on the back (head to the left); knees bent with the feet on the floor
  const supine = (t, a, a2, l, l2, x) => F(LY, t, a, a2, l, l2, x);
  const POSES = {
    // abs: the lying moves
    footcrunch: {ms:900, f:[supine(270, [70, 70], [70, 70], LEGS_UP, LEGS_UP), supine(292, [62, 62], [62, 62], LEGS_UP, LEGS_UP), supine(270, [70, 70], [70, 70], LEGS_UP, LEGS_UP), supine(292, [78, 78], [78, 78], [50, 150], [58, 150])]},
    bicycle:    {ms:900, f:[supine(296, [320, 150], [320, 150], [35, 120], [78, 78]), supine(296, [320, 150], [320, 150], [78, 78], [35, 120])]},
    pushthrough:{ms:1000, f:[supine(270, [275, 275], [275, 275], LEGS_UP, LEGS_UP), supine(302, [62, 62], [62, 62], LEGS_UP, LEGS_UP)]},
    legraise:   {ms:900, f:[supine(270, [90, 90], [90, 90], [96, 96], [96, 96]), supine(270, [90, 90], [90, 90], [48, 48], [48, 48]), supine(270, [90, 90], [90, 90], [2, 2], [2, 2]), supine(270, [90, 90], [90, 90], [48, 48], [48, 48])]},
    reachcrunch:{ms:1000, f:[supine(270, [270, 270], [270, 270], LEGS_UP, LEGS_UP), supine(302, [72, 72], [72, 72], LEGS_UP, LEGS_UP)]},
    legtouch:   {ms:1000, f:[supine(270, [8, 8], [8, 8], [8, 8], [8, 8]), supine(306, [14, 14], [14, 14], [8, 8], [8, 8])]},
    crosscrunch:{ms:1000, f:[supine(270, [112, 300], [100, 290], LEGS_UP, LEGS_UP), supine(304, [112, 300], [100, 290], LEGS_UP, LEGS_UP)]},
    jackknife:  {ms:1000, f:[supine(270, [270, 270], [270, 270], [98, 98], [98, 98]), supine(338, [40, 40], [40, 40], [24, 24], [24, 24])]},
    // stretches (held, so one frame)
    hamstring:  {ms:0, f:[F([90, 60], 62, [118, 124], [118, 124], [128, 126], [190, 172])]},
    quad:       {ms:0, f:[F([100, 62], 0, [190, 250], [30, 30], [182, 180], [186, 300])]},
    calf:       {ms:0, f:[F([84, 62], 20, [82, 90], [82, 90], [130, 176], [200, 200], {wall:134})]},
    hipflex:    {ms:0, f:[F([88, 80], 2, [100, 150], [100, 150], [96, 180], [186, 270])]},
    glute:      {ms:0, f:[supine(270, [70, 40], [60, 40], [20, 120], [50, 150])]},
    chest:      {ms:0, f:[F([100, 62], 8, [270, 270], [150, 170], [176, 180], [196, 190], {wall:58})]},
    shoulder:   {ms:0, f:[F([100, 62], 0, [86, 86], [128, 280], [180, 180], [180, 180])]},
    triceps:    {ms:0, f:[F([100, 62], 0, [340, 170], [58, 330], [180, 180], [180, 180])]},
    child:      {ms:0, f:[F([70, 96], 80, [92, 92], [92, 92], [100, 275], [100, 275], {hd:20})]},
    butterfly:  {ms:0, f:[F([100, 109], 38, [128, 196], [128, 196], [112, 262], [112, 262])]},
    // mobility (moving)
    catcow:     {ms:1500, f:[F([80, 84], 66, [180, 180], [180, 180], [180, 270], [180, 270], {t2:106, hd:30}), F([80, 84], 100, [180, 180], [180, 180], [180, 270], [180, 270], {t2:62, hd:-30})]},
    books:      {ms:1100, f:[F([110, 109], 270, [95, 95], [95, 95], [60, 150], [66, 156]), F([110, 109], 270, [95, 95], [20, 20], [60, 150], [66, 156]), F([110, 109], 270, [95, 95], [330, 300], [60, 150], [66, 156])]},
    hips9090:   {ms:1300, f:[F([100, 109], 355, [250, 250], [250, 250], [38, 150], [52, 160]), F([100, 109], 355, [250, 250], [250, 250], [72, 168], [78, 172])]},
    squat:      {ms:0, f:[F([95, 86], 14, [112, 70], [112, 70], [102, 186], [102, 186])]},
    lungerot:   {ms:1400, f:[F([86, 88], 66, [168, 176], [168, 176], [94, 180], [236, 236]), F([86, 88], 22, [180, 180], [0, 0], [94, 180], [236, 236])]},
    ankle:      {ms:1000, f:[F([96, 64], 12, [84, 84], [84, 84], [104, 188], [186, 186], {wall:140}), F([108, 64], 14, [84, 84], [84, 84], [112, 208], [186, 186], {wall:140})]},
    shoulderc:  {ms:700, f:[F([100, 62], 0, [0, 0], [0, 0], [180, 180], [180, 180]), F([100, 62], 0, [90, 90], [90, 90], [180, 180], [180, 180]), F([100, 62], 0, [180, 180], [180, 180], [180, 180], [180, 180]), F([100, 62], 0, [270, 270], [270, 270], [180, 180], [180, 180])]},
    wallslide:  {ms:1100, f:[F([84, 62], 0, [160, 10], [160, 10], [180, 180], [180, 180], {wall:68}), F([84, 62], 0, [8, 4], [8, 4], [180, 180], [180, 180], {wall:68})]},
    legswing:   {ms:900, f:[F([100, 62], 0, [90, 90], [90, 90], [180, 180], [122, 120], {wall:137}), F([100, 62], 0, [90, 90], [90, 90], [180, 180], [236, 232], {wall:137})]},
    // pliability
    fold:       {ms:0, f:[F([100, 62], 152, [190, 190], [190, 190], [182, 180], [182, 180], {hd:10})]},
    cobra:      {ms:0, f:[F([56, 109], 62, [196, 160], [196, 160], [270, 270], [270, 270], {t2:78, hd:-8})]}
  };
  // which figure goes with which move: by session, then the name of the move
  const MAP = {
    abs:{'Foot to foot crunch':'footcrunch', 'Alternating bicycle curls':'bicycle', 'Push through':'pushthrough', 'Four-count leg lifts':'legraise', 'Arm reaching crunch':'reachcrunch', 'Leg up touch crunch':'legtouch', 'Cross arm crunch':'crosscrunch', 'Jackknife':'jackknife'},
    stretch:{'Hamstrings':'hamstring', 'Quads':'quad', 'Calves':'calf', 'Hip flexors':'hipflex', 'Glutes':'glute', 'Chest':'chest', 'Shoulders':'shoulder', 'Triceps':'triceps', 'Lats and back':'child', 'Inner thighs':'butterfly'},
    mobility:{'Cat-cow':'catcow', 'Open books':'books', '90/90 hip switches':'hips9090', 'Deep squat':'squat', 'Lunge and rotate':'lungerot', 'Ankle rocks':'ankle', 'Shoulder circles':'shoulderc', 'Wall slides':'wallslide', 'Leg swings':'legswing'},
    upper:{'Cat-cow':'catcow', 'Open books':'books', 'Thread the needle':'books', 'Wall slides':'wallslide', 'Shoulder circles':'shoulderc', 'Chest opener':'chest', 'Cross-body shoulder':'shoulder', "Child's pose":'child'},
    arms:{'Triceps':'triceps'},
    bed:{'Figure four':'glute', 'Open books':'books', 'Cross-body shoulder':'shoulder', 'Chest opener':'chest'},
    pliability:{'Cat-cow':'catcow', 'Standing forward fold':'fold', 'Low lunge':'hipflex', 'Figure four':'glute', 'Butterfly':'butterfly', 'Deep squat hold':'squat', 'Cobra':'cobra', "Child's pose":'child', 'Thread the needle':'books', 'Chest opener':'chest', 'Cross-body shoulder':'shoulder'}
  };
  function svg(key){
    const p = POSES[key]; if(!p) return '';
    const n = p.f.length, ms = p.ms || 0;
    const body = p.f.map((f, i) => n > 1 ? `<g class="fg-f" style="animation:fgshow${n} ${n * ms}ms steps(1,end) ${i * ms}ms infinite"` + '>' + frame(f) + '</g>' : `<g>${frame(f)}</g>`).join('');
    return `<svg viewBox="0 0 200 125" role="img" aria-hidden="true"><line class="fg-floor" x1="8" y1="115" x2="192" y2="115"/>${body}</svg>`;
  }
  // for n frames: each one shows for 1/n of the cycle
  const css = [2, 3, 4].map(n => `@keyframes fgshow${n}{0%{opacity:1}${(100 / n - .01).toFixed(2)}%{opacity:1}${(100 / n).toFixed(2)}%{opacity:0}100%{opacity:0}}`).join('');
  const st = document.createElement('style'); st.textContent = css + '.fg-f{opacity:0}'; document.head.appendChild(st);
  window.bfFig = {key:(session, name) => (MAP[session] && MAP[session][name]) || '', svg, POSES, MAP, frame};
})();
