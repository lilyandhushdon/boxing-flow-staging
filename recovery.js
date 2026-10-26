// Recovery sessions: simple guided routines for after hard training or on a rest day. A session is a list of moves; a move has a name, the seconds it lasts (each side, when
// "both" is true), and how to do it. A move done on both sides becomes two steps with a short switch between them. "mins" is the length the session is named for: tests check
// that the moves add up to it. To add a session, add an entry: a name, its minutes, its benefits, tips, a safety note and its moves.
const REC_SWITCH = 4;   // seconds to change sides
const RECOVERY = [
  {id:'cold', name:'Cold shower', mins:5, blurb:'Warm, cold, warm, cold: about 5 minutes under the shower.', ready:'Start under normal warm water and breathe slowly: in through your nose, out through your mouth.',
   benefits:['Eases soreness and swelling after hard sessions, especially sparring, running and conditioning.', 'Wakes you up and lifts your mood.', 'Trains slow, calm breathing under stress, the same skill you need in the ring.'],
   tips:['Best after sparring or conditioning, or on a rest day. Straight after heavy lifting it can slightly blunt muscle gain, so leave it for another time.', 'Make it as cold as you can stay calm in. Breathe out long and slow, and relax your shoulders and jaw.'],
   safety:'Skip it if you feel unwell or have a heart or blood pressure condition, and get out if you feel dizzy. Not medical advice.',
   moves:[
    {n:'Settle', s:30, c:'Warm water. Slow breathing: in for 4, out for 6. Get calm before the cold.'},
    {n:'Cold: legs and body', s:60, c:'Turn it cold. Start at the feet and legs, then the body. Long slow breaths out and loose shoulders.'},
    {n:'Warm', s:30, c:'Back to warm. Breathe and let your heart rate settle.'},
    {n:'Cold: all over', s:60, c:'Cold again. Keep your breathing long and steady. Let the water hit your back and shoulders.'},
    {n:'Warm', s:30, c:'Warm again. Slow breaths.'},
    {n:'Cold: last one', s:60, c:'The last cold. Calm and steady, relax your face and hands.'},
    {n:'Finish', s:20, c:'Turn it off, dry off, and put warm clothes on.'}]},
  {id:'gun', name:'Massage gun', mins:10, blurb:'The big muscles of the legs, back, shoulders and arms, about 10 minutes.', ready:'Start on the lowest speed. Glide slowly and let the gun do the work, with no need to press hard.',
   benefits:['Loosens tight muscles and gives you more range of movement for a while.', 'Eases the feeling of soreness.', 'Warms the muscle and helps you relax after training.'],
   tips:['Glide about 2 to 3 cm a second, keep it moving, and pause briefly on a tight spot.', 'Keep it off bones, joints, the spine and the front of the neck, and off any injury.'],
   safety:'Stop if anything feels sharp or numb, and keep away from any new injury, swelling or bruise. Not medical advice.',
   moves:[
    {n:'Calves', s:40, both:true, c:'Leg out in front. Glide slowly from the ankle up to just below the knee. Stay off the bone and the back of the knee.'},
    {n:'Hamstrings', s:40, both:true, c:'Glide from just above the knee up to the glute, with light pressure.'},
    {n:'Quads', s:40, both:true, c:'Glide from the knee up the front and outer thigh. Keep clear of the kneecap and the hip bone.'},
    {n:'Glutes', s:40, both:true, c:'Slow circles over the big muscle at the back of the hip, not the base of the spine.'},
    {n:'Lats and ribs', s:30, both:true, c:'Reach the arm up. Glide down the side of the back from the armpit to the ribs. Stay off the spine.'},
    {n:'Upper back and traps', s:30, c:'Reach over the shoulder to the top of the back and the muscle between neck and shoulder. Not the spine or the neck.'},
    {n:'Shoulders', s:30, both:true, c:'Glide over the round of the shoulder muscle, front to back. Avoid the joint and the collarbone.'},
    {n:'Chest', s:30, both:true, c:'Glide across the big chest muscle, away from the breastbone.'},
    {n:'Forearms', s:30, both:true, c:'Glide from the wrist to the elbow on the meaty side. Gloves and wraps work these hard.'}]},
  {id:'roller', name:'Foam roller', mins:10, blurb:'Slow rolling on the legs, hips and back, about 10 minutes.', ready:'Roll slowly, about 2 to 3 cm a second. Stop on a tender spot for a moment and breathe.',
   benefits:['Releases tight muscles and improves your range of movement.', 'Eases soreness and gets the blood flowing.', 'Helps you find tight spots before they turn into injuries.'],
   tips:['Pause 20 to 30 seconds on a tender spot and breathe out. Do not rush over it.', 'Keep it off your lower back and your joints. Some discomfort is fine; sharp pain is not.'],
   safety:'Stop if you feel sharp pain, numbness or tingling, and do not roll over a new injury or a bruise. Not medical advice.',
   moves:[
    {n:'Calves', s:45, both:true, c:'Sit with the roller under your calf, hands behind you. Lift your hips and roll from ankle to knee. Cross the other leg over the top for more pressure.'},
    {n:'Hamstrings', s:45, both:true, c:'Roller under the back of your thigh. Lift your hips and roll from the knee to the glute.'},
    {n:'Quads', s:45, both:true, c:'Face down on your forearms, roller under the front of one thigh. Roll from the hip to just above the knee.'},
    {n:'Glutes', s:45, both:true, c:'Sit on the roller with one ankle crossed over the opposite knee. Lean toward the crossed-leg side and roll in small movements.'},
    {n:'Outer hip and thigh', s:30, both:true, c:'Lie on your side, roller under the outer hip. Roll slowly toward the knee, and go easy.'},
    {n:'Upper back', s:60, c:'Roller across your shoulder blades, arms crossed over your chest, hips up. Roll between the shoulder blades and the mid-back, not the lower back.'},
    {n:'Lats', s:30, both:true, c:'Lie on your side with your arm stretched overhead and the roller under your armpit area. Roll a few centimetres up and down.'},
    {n:'Inner thighs', s:30, both:true, c:'Face down, one knee out to the side, roller along the inside of the thigh. Roll slowly.'}]},
  {id:'stretch', name:'Stretching', mins:10, blurb:'Slow static stretches for the whole body, about 10 minutes.', ready:'Ease into each stretch until you feel a mild pull, never pain. Breathe out as you settle, and do not bounce.',
   benefits:['Keeps your hips, legs and shoulders loose so you move freely.', 'Brings your body down after a hard session.', 'Helps you relax and sleep.'],
   tips:['Best after training, when you are warm.', 'Hold still and breathe slowly. If the stretch fades, ease a little further.'],
   safety:'A mild pull is right. Back off if it hurts, tingles or goes numb. Not medical advice.',
   moves:[
    {n:'Hamstrings', s:30, both:true, c:'Heel up on a step or the floor, leg straight. Hinge from the hips with a long back until you feel it behind the thigh.'},
    {n:'Quads', s:30, both:true, c:'Stand holding something. Pull your heel to your glute, knees together, hips pushed forward.'},
    {n:'Calves', s:30, both:true, c:'Hands on a wall, one leg back with the heel down and the knee straight. Lean forward.'},
    {n:'Hip flexors', s:30, both:true, c:'Half kneeling. Tuck your tailbone under and push your hips forward until you feel the front of the back hip.'},
    {n:'Glutes', s:30, both:true, c:'Lie on your back. Cross one ankle over the opposite knee and pull the thigh toward your chest.'},
    {n:'Chest', s:30, both:true, c:'Forearm on a door frame with the elbow at shoulder height. Turn your body gently away.'},
    {n:'Shoulders', s:30, both:true, c:'Pull one arm across your chest with the other. Keep the shoulder down.'},
    {n:'Triceps', s:30, both:true, c:'Elbow overhead, hand down your back. Press the elbow back gently with the other hand.'},
    {n:'Lats and back', s:40, c:'Child\'s pose: knees wide, sit back toward your heels and reach your arms forward. Breathe into your back.'},
    {n:'Inner thighs', s:40, c:'Soles of your feet together and knees out. Sit tall and lean forward from the hips.'}]},
  {id:'mobility', name:'Mobility', mins:8, blurb:'Controlled movement for the hips, back, shoulders and ankles, about 8 minutes.', ready:'Move slowly and with control, and breathe. Go only as far as you can control. Smooth beats deep.',
   benefits:['More range in your hips, upper back, shoulders and ankles: better slipping, rolling, footwork and punch rotation.', 'Works as a cool-down, a warm-up, or on its own on a rest day.', 'Keeps your joints moving well so they stay healthy.'],
   tips:['Go slowly and breathe. It is not a test.', 'If one side is stiffer, give it a little extra time.'],
   safety:'Stay inside a range you control, and stop if a joint hurts or catches. Not medical advice.',
   moves:[
    {n:'Cat-cow', s:40, c:'On hands and knees. Round your back up, then drop it and look up. Move with your breath.'},
    {n:'Open books', s:30, both:true, c:'Lie on your side with your knees bent. Open the top arm across to the other side, following it with your eyes. Turn through your upper back.'},
    {n:'90/90 hip switches', s:45, c:'Sit with both knees bent at 90 degrees. Rotate your knees from one side to the other, using your hands as little as you can.'},
    {n:'Deep squat', s:45, c:'Sit down into a deep squat, feet turned out a little. Push your knees out with your elbows, keep your chest up, and shift gently side to side.'},
    {n:'Lunge and rotate', s:30, both:true, c:'Step into a long lunge. Put both hands inside the front foot, then turn the front-side arm up to the ceiling and back down.'},
    {n:'Ankle rocks', s:30, both:true, c:'Face a wall with your foot a few inches back. Drive your knee over your toes without lifting your heel.'},
    {n:'Shoulder circles', s:40, c:'Big slow arm circles, forwards then backwards. Keep your ribs down and go as big as is comfortable.'},
    {n:'Wall slides', s:40, c:'Back, hips and head against the wall, elbows bent at 90 degrees. Slide your arms up and down without arching your back.'},
    {n:'Leg swings', s:30, both:true, c:'Hold something. Swing the leg forwards and backwards, loose and controlled, a little higher each time.'}]}
];
// the steps of a session in order: each move once, or twice (left, then right) with a short switch between
const recSteps = ws => ws.moves.flatMap((m, i) => m.both
  ? [{m, i, side:'left', sec:m.s}, {switch:true, i}, {m, i, side:'right', sec:m.s}]
  : [{m, i, side:'', sec:m.s}]);
const recSeconds = ws => recSteps(ws).reduce((n, x) => n + (x.switch ? REC_SWITCH : x.sec), 0);
