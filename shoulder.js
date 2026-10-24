// Shoulder conditioning: a drill to build the endurance to keep your hands up in a fight and in sparring.
// Each round repeats the moves in 20-second blocks, with limited rest between rounds. A move has a name and two points; the coach says the first as the
// block starts and the second 10 seconds in (so arm circles go forward, then backward). To add a workout, add an entry to SHOULDER in the same shape.
const SHOULDER = [
  {name:'Shoulder conditioning drill', seg:20,
   blurb:'In and out, arm circles and straight punches, 20 seconds each, round after round with limited rest. Builds the endurance to keep your hands up.',
   ready:'Grab your 2 to 3 pound weights, or put on your gloves. Hands up.',
   moves:[
    ['In and out', ['Hands out in front of you at fighting height. Push out, pull in, and squeeze your shoulder blades together.', 'Keep it going. Don’t let your hands drop.']],
    ['Arm circles', ['Forward circles. Arms straight and locked, palms facing down.', 'Now backward circles. Keep your arms locked and your palms down.']],
    ['Straight punches', ['Throw straight punches up from your fighting stance. Keep your guard hand up.', 'Stay in your stance, elbows in. Keep punching.']]
   ]},
  {name:'8-minute shoulder burner', breakSec:20,
   blurb:'Eight one-minute rounds with 20-second breaks, holding the weights the whole time. Shadowboxing, one hand at a time, uppercuts, hooks, a punch ladder and an arm-circle finisher.',
   lenSub:'Eight one-minute rounds, each with its own focus, and a 20-second break between them where you keep holding the weights. Go through it twice for more work.',
   ready:'Grab your light weights, 1 to 5 pounds, and keep holding them through the breaks.',
   opts:[{r:8,m:1,note:'The full workout'},{r:16,m:1,note:'Twice through, for more work'}],
   brief:[
    ['What you need', 'Light hand weights, 1 to 5 pounds. Keep holding them through every break. Go lighter if your form slips.'],
    ['How it works', 'Eight one-minute rounds with a 20-second break between each. The coach talks you through every round.'],
    ['What it works', 'Your shoulders, lats, back and arms, with a high-intensity cardio boost too.'],
    ['Make it harder', 'Use heavier weights, or go through the rounds twice. Keep your form first.']
   ],
   rounds:[
    {name:'Warm-up shadowboxing', points:['Light and loose. Move your feet and throw easy punches with the weights.', 'Add some movement. Jab, cross, slip and move. Keep your shoulders relaxed.', 'Pick up the pace a little. Keep your hands up between punches.']},
    {name:'Left hand only', points:['Throw only your left hand. Keep your right hand up by your face.', 'Straight punches, hooks and uppercuts, all with your left. Keep them coming.', 'Stay in your stance. Keep your right hand by your face and don’t let the weight drop.']},
    {name:'Right hand only', points:['Now only your right hand. Keep your left hand up by your face.', 'Straight punches, hooks and uppercuts, all with your right. Keep them coming.', 'Stay in your stance. Keep your left hand by your face and don’t let the weight drop.']},
    {name:'Non-stop uppercuts', points:['Throw uppercuts continuously, alternating hands.', 'Keep your elbows tight and your hands up between each one.', 'Don’t stop. Stay sharp and keep the volume up.']},
    {name:'Non-stop hooks', points:['Throw hooks continuously, alternating hands.', 'Turn from your hips. Keep your elbows up and hold the weights tight.', 'Don’t stop. Keep the volume up.']},
    {name:'One, two, slip, slip', points:['Jab, cross, then slip to each side. Keep it flowing.', 'Keep your hands up as you slip. Stay balanced, and repeat.', 'Stay sharp. Don’t let your hands drop when you slip.']},
    {name:'The ladder', points:['Throw two punches, then four, then six. Keep your hands up between sets.', 'Now eight punches, then ten. Fast and sharp.', 'Start the ladder again: two, four, six, eight, ten. Keep going.']},
    {name:'The finisher', points:['Arm circles, forward. Arms straight, palms down.', 'Now backward circles. Keep your arms locked.', 'Static hold. Arms out in front, holding the weights. Don’t let them drop.']}
   ]}
];
// A workout with `rounds` instead of `moves` is a set of different one-minute rounds, each with its own focus, and a short break between them
// (breakSec) where the fighter keeps holding the weights. Each round has points the coach gives at even gaps through the minute. Its own `opts`, `brief`
// and `lenSub` replace the shared ones.
// rounds x minutes. Three three-minute rounds is the fight drill; two-minute rounds suit amateurs, so the form holds while strength builds.
const SHOULDER_OPTS = [{r:3,m:3,note:'The fight drill'},{r:3,m:2,note:'Amateur: shorter rounds keep your form'},{r:2,m:3,note:''},{r:4,m:3,note:''},{r:1,m:3,note:''}];
const SHOULDER_BRIEF = [
  ['What you need', 'Weights of 2 to 3 pounds in each hand, or 16-ounce boxing gloves if you don’t have hand weights.'],
  ['The goal', 'Do the whole drill without breaks or form mistakes. No dropping your arms, and no turning your palms.'],
  ['How often', 'About twice a week, at the end of your session, when your muscles are already tired. That is what builds the endurance.'],
  ['Amateur?', 'Use the two-minute rounds, so your form holds while you build strength.']
];
