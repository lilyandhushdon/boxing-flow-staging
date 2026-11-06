// Abs workouts: follow-along core sessions in Strength and conditioning. They use the same shape and screen as the recovery sessions (recovery.js): a list of moves, each with a name,
// the seconds it lasts (its reps at the tempo), and how to do it. "mins" is the length the session is named for: tests check that the moves add up to it. To add a workout, add an entry.
const ABS_REPS = 30, ABS_TEMPO = 1;   // every exercise is 30 reps at one count a second (1, 2, 1, 2), so the time follows from the reps
const ABS_SECS = ABS_REPS * ABS_TEMPO;
const ABS = [
  {id:'abs8', name:'Abs circuit', mins:4, blurb:'Eight ab exercises of 30 reps each, one count a second, back to back with no breaks, about 4 minutes. No equipment.', ready:'Lie on your back on a mat. Aim for 30 repetitions of each, counting one, two, one, two, with no break between exercises.',
   benefits:['Builds the abs and obliques that brace your body when you take a body shot.', 'Core strength for rotating through hooks and crosses, and for staying balanced when you throw.', 'No equipment, so you can do it at home, at the gym, or after a session.'],
   tips:['Lift with your abs, not by pulling on your neck. Keep your hands light behind your head or across your chest.', 'Slow and controlled beats fast and sloppy. If your lower back lifts or your neck aches, make the move smaller.'],
   safety:'Stop if you feel sharp pain in your back or neck. Take a short break between moves if you need one. Not medical advice.',
   moves:[
    {n:'Foot to foot crunch', s:ABS_SECS, c:'On your back, knees bent. Crunch up and reach your hands toward one foot, then the other.'},
    {n:'Alternating bicycle curls', s:ABS_SECS, c:'Curl up and bring one elbow toward the opposite knee, then switch, like pedalling a bicycle.'},
    {n:'Push through', s:ABS_SECS, c:'Crunch up and push your hands forward and through, keeping your abs braced and your lower back down.'},
    {n:'Four-count leg lifts', s:ABS_SECS, c:'Lift your legs in the four-count pattern, keeping your lower back pressed down and your abs tight.'},
    {n:'Arm reaching crunch', s:ABS_SECS, c:'Crunch up and reach your arms forward past your knees. Lower with control and go again.'},
    {n:'Leg up touch crunch', s:ABS_SECS, c:'Legs up. Crunch and reach up to touch your feet, then lower with control.'},
    {n:'Cross arm crunch', s:ABS_SECS, c:'Arms crossed over your chest. Crunch up, then lower slowly.'},
    {n:'Jackknife', s:ABS_SECS, c:'Bring your knees and shoulders in together, then lower. Last one, give it everything.'}]}
];
