// Plyometric workouts: bodyweight only, explosive moves in work and rest intervals. Each workout is one circuit; a round is the circuit once through.
// An exercise is [name, what to do (read out as it starts), a short cue (read out part-way through)].
// A workout with a `plan` builds each round from PLYO_LIB instead, one move for each category in the plan.
// To add a workout, add an entry: a name, a blurb for the list and its exercises (about eight make a good circuit).
const PLYO = [
  {name:'Full-body explosive power', blurb:'Box jumps, depth jumps, depth split jumps and explosive push-ups. Lower and upper body power.',
   exercises:[
    ["Box jumps", "Swing your arms and explode up onto the box. Land softly with bent knees, stand tall, then step down. Don't jump down.", "Soft landing. Reset every rep."],
    ["Explosive push-ups", "Lower with control, then push up so hard that your hands leave the floor. Land softly, reset and go again.", "Fast up. Hands leave the floor."],
    ["Depth jumps", "Step off the box, don't jump. The moment you land, explode straight up as high as you can. Spend as little time on the ground as possible.", "Land and go. Minimum ground time."],
    ["Depth split jumps", "Drop into a deep split squat with your back knee low. Explode up, switch legs in the air, and land back in the deep split.", "Deep, then explode. Switch in the air."],
    ["Clap push-ups", "Push up powerfully, clap, and catch yourself with soft elbows. Drop to your knees if you need to. Keep it explosive.", "Push hard. Catch soft."],
    ["Broad jumps", "Swing your arms and jump as far forward as you can. Land softly in a squat, hold it, then turn and go back.", "Stick the landing."],
    ["Tuck jumps", "Jump straight up and pull your knees toward your chest. Land softly, reset your feet and go again.", "Knees up, land quiet."],
    ["Lateral bounds", "Bound side to side off one leg, landing softly on the other with your knee bent. Swing your arms and stay low.", "Push off, stick, push off."]
   ]},
  {name:'Lower-body power', blurb:'A different set of jumps, bounds and hops every round, from a library of nearly a hundred. Build explosive legs for movement and punching power.',
   plan:['ankle','vertical','vertical','horizontal','horizontal','lateral','lateral','combo'],   // each round: a quick warm-up move, then jumps in every direction, ending with a combination
   exercises:[]},
  {name:'Upper-body power', blurb:'A different set of explosive push-ups, plank drills and hand work every round, from a library of 100. Build fast, powerful arms and shoulders.',
   safety:'Upper-body plyometrics put real stress on your wrists, elbows and shoulders. Start with basic explosive push-ups, use a stable, non-slip surface, and only move on to rotating, airborne and handstand moves when you have the strength and control for them.',
   plan:['uPlank','uBasic','uBasic','uVar','uVar','uVar','uPlank','uAdv'],   // each round: a plank drill to warm up, explosive push-ups, variations, and one advanced move last
   exercises:[]},
  {name:'Medicine ball power', blurb:'Rotational throws, chest passes, slams and overhead throws, a different set every round, from a library of 50. Needs a medicine ball and a solid wall.',
   needs:'A medicine ball light enough to throw fast (speed matters more than weight), and a solid wall to throw into. A slam ball is best for slams. Check the space behind and above you before every throw.',
   plan:['mbChest','mbChest','mbRot','mbRot','mbOver','mbSlam','mbSlam','mbReact'],   // each round: chest passes to warm up, then rotational throws, an overhead throw, slams, and a reactive full-body drill last
   exercises:[]},
  {name:'Fight conditioning', blurb:'Burpees, jump lunges, tuck jumps and fast feet. Explosive work that keeps your heart rate high.',
   exercises:[
    ["Burpees", "Drop down, kick back, jump your feet in and explode up with a jump. Keep moving and stay smooth.", "Chest down, explode up."],
    ["Explosive push-ups", "Lower with control, then push up so hard that your hands leave the floor. Land softly, reset and go again.", "Fast up. Hands leave the floor."],
    ["Tuck jumps", "Jump straight up and pull your knees toward your chest. Land softly, reset your feet and go again.", "Knees up, land quiet."],
    ["Mountain climbers", "In a strong plank, drive your knees to your chest as fast as you can. Keep your hips low and your hands under your shoulders.", "Fast feet. Hips low."],
    ["Jump lunges", "Drop into a lunge, then explode up and switch legs in the air. Land softly and flow into the next one.", "Switch in the air."],
    ["Star jumps", "Jump up, spreading your arms and legs wide like a star. Land softly and go again straight away.", "Reach big. Land soft."],
    ["Squat thrusts", "From standing, drop your hands down, kick your feet back, jump them in and stand up fast. Keep a quick rhythm.", "Quick feet. Stay tight."],
    ["Pogo jumps", "Stay tall and hop on the balls of your feet, with stiff ankles and short ground time. Think quick and bouncy.", "Light and springy."]
   ]}
];
// The lower-body workout draws each round from this library (see its plan), so no move repeats within a workout.
// Moves are [name, what to do (read out as it starts)]; the cue part-way through comes from PLYO_TIPS for the kind of move.
const PLYO_LIB = {
  // low-impact, quick ground contact: the way into each round
  ankle:[
    ["Pogo jumps", "Stay tall and bounce on the balls of your feet. Stiff ankles and short ground time."],
    ["Single-leg pogo jumps", "Bounce on one leg, tall and stiff through the ankle. Switch legs halfway."],
    ["Alternating ankle hops", "Hop from foot to foot, springing off your ankles. Soft knees and quick steps."],
    ["Double-leg forward-backward line hops", "Hop forward and back over a line with both feet. Quick and light, up on your toes."],
    ["Single-leg line hops", "Hop forward and back over a line on one leg. Stay tall and stable. Switch legs halfway."],
    ["High-knee running in place", "Run on the spot, driving your knees high. Stay on your toes and pump your arms."],
    ["Ankling hops", "Small, fast steps forward on your toes, with your feet landing under your hips. Quick and light."],
    ["Repeated vertical ankle bounces", "Tiny, fast jumps straight up, using only your ankles. Stay tall with short ground contact."],
    ["Single-leg forward line hops", "Hop forward along a line on one leg. Short, quick and balanced. Switch legs halfway."],
    ["Low squat pulse jumps", "Hold a low squat and pulse small jumps up and down. Chest up and keep the jumps quick."],
    ["Quick feet line hops", "Both feet, fast, hopping side to side over a line. Stay light and keep your hands up."],
    ["Forward-backward pogo jumps", "Pogo forward, then backward, along a short line. Stay tall and springy with stiff ankles."],
    ["Alternating single-leg line hops", "Hop over a line on one leg, then the other, switching each hop. Light and balanced."],
    ["Split-stance pogo jumps", "Hold a small split stance and bounce on the balls of your feet. Switch your stance halfway."],
    ["Repeated calf jumps", "Jump straight up using only your calves, knees nearly straight. Quick and springy."],
    ["Side-to-side ankle hops", "Hop side to side with small, quick ankle bounces. Keep your hips still and your feet light."]
  ],
  vertical:[
    ["Squat jumps", "Sit back into a squat, then explode straight up. Land softly and flow into the next one."],
    ["Countermovement jumps", "Dip down quickly, swing your arms and jump as high as you can. Land softly, reset and repeat."],
    ["Tuck jumps", "Jump straight up and pull your knees toward your chest. Land softly and go again."],
    ["Split squat jumps", "From a split squat, explode up and switch legs in the air. Land softly in the split."],
    ["Alternating jump lunges", "Drop into a lunge, spring up and switch legs in the air. Chest up and land soft."],
    ["Star jumps", "Jump up, spreading your arms and legs wide. Land softly and go again straight away."],
    ["180-degree squat jumps", "Jump and turn a half turn in the air, landing in a soft squat. Turn the other way next time."],
    ["360-degree jump turns", "Jump and spin a full turn, landing balanced in a soft squat. Spot a fixed point to stay oriented."],
    ["Repeated vertical jumps", "Jump straight up again and again, with a quick reset between each. Use your arms and land soft."],
    ["Jump squats with arm swing", "Swing your arms back as you squat, then drive them up as you explode. Land soft."],
    ["Seated vertical jumps", "Start seated on a low box or in a deep squat, then drive straight up into a jump. No swing, all legs."],
    ["Single-leg vertical jumps", "Jump straight up from one leg and land on the same leg. Balanced and soft. Switch halfway."],
    ["Alternating single-leg vertical jumps", "Jump up from one leg, land, then jump from the other. Control every landing."],
    ["Jump squats with pause", "Squat down and hold for a second, then explode up. No bounce, all power from the pause."],
    ["Continuous split jumps", "Keep switching legs in a split stance without stopping. Stay tall, land soft and keep the rhythm."],
    ["180-degree tuck jumps", "Jump, tuck your knees and turn a half turn in the air. Land soft and balanced."],
    ["Repeated maximal vertical jumps", "Jump as high as you can, every rep. Reset between each one so each is a full effort."],
    ["Kneeling jump to standing", "From kneeling, swing your arms and snap your feet under you, jumping to standing. Land soft."],
    ["Scissor jumps", "Jump and switch your legs like scissors. Land softly in a split stance and go again."]
  ],
  horizontal:[
    ["Standing broad jumps", "Swing your arms and jump as far forward as you can. Land softly in a squat."],
    ["Repeated broad jumps", "Jump forward again and again, landing soft and exploding straight into the next one."],
    ["Single-leg forward hops", "Hop forward on one leg, landing soft and stable. Switch legs halfway."],
    ["Alternating bounds", "Bound forward from one leg to the other, with long strides and big arm swings."],
    ["Triple broad jumps", "Three broad jumps in a row, each as far as you can. Land soft every time."],
    ["Forward squat jumps", "Squat and jump forward, landing in a squat each time. Drive off both feet."],
    ["Single-leg bounds", "Bound forward off one leg with a long stride, landing on the same leg. Balanced. Switch halfway."],
    ["Double-leg forward hops", "Small, quick hops forward with both feet. Stay on your toes and keep the rhythm."],
    ["Broad jump to stick landing", "Jump as far as you can, then hold the landing for two seconds. Balanced, knees soft."],
    ["Repeated maximal broad jumps", "Jump as far as you can every time, resetting between jumps so each is a full effort."],
    ["Frog jumps", "From a deep squat with your hands down, explode forward and up like a frog. Land soft in the squat."],
    ["Bunny hops", "Hop forward with both feet together, driving your knees up. Quick and light."],
    ["Forward hurdle-style hops without hurdles", "Hop forward as if clearing hurdles, with your knees high. Land soft and go again."],
    ["Backward squat jumps", "Squat, then jump backward and land soft. Check behind you first so you have space."],
    ["Backward broad jumps", "Swing your arms and jump backward as far as you can. Land soft and check behind you."],
    ["Backward single-leg hops", "Hop backward on one leg, landing soft. Check behind you. Switch legs halfway."],
    ["Curved running bounds", "Bound along a curve, one leg to the other, leaning slightly into the turn. Long, powerful strides."],
    ["Single-leg triple bounds", "Three bounds in a row on the same leg, as far as you can. Stick the last one."],
    ["Double-leg triple hops", "Three hops forward with both feet, each as far as you can. Land soft."],
    ["Alternating forward-backward bounds", "Bound forward off one leg, then backward off the other. Stay balanced and controlled."],
    ["Triple hops on one leg", "Three hops in a row on one leg. Stay tall and balanced. Switch legs."],
    ["Donkey kicks with explosive leg drive", "From hands and feet, kick your hips up and back with an explosive leg drive. Land with control."]
  ],
  lateral:[
    ["Skater jumps", "Bound side to side off one leg, landing softly on the other with your knee bent. Swing your arms."],
    ["Repeated lateral bounds", "Bound side to side again and again, landing soft and pushing off straight away."],
    ["Single-leg lateral hops", "Hop sideways on one leg, landing soft and balanced. Switch legs halfway."],
    ["Double-leg side-to-side hops", "Hop side to side with both feet together over a line. Quick, light and balanced."],
    ["Lateral squat jumps", "Squat, then jump sideways, landing in a squat. Push off both feet."],
    ["Diagonal bounds", "Bound diagonally forward off one leg, then the other. Land soft with a bent knee."],
    ["Forward-to-lateral jumps", "Jump forward, land, then jump straight to the side. Stick each landing."],
    ["Lateral hop to stick", "Hop sideways and hold the landing for two seconds. Balanced, knee soft."],
    ["Single-leg diagonal hops", "Hop diagonally on one leg, landing soft and stable. Switch legs halfway."],
    ["90-degree lateral jump turns", "Jump and turn a quarter turn, landing in a soft squat. Turn each way."],
    ["Lateral tuck jumps", "Jump sideways and tuck your knees as you go. Land soft and balanced."],
    ["Crossover bounds", "Bound sideways, crossing one leg behind the other as you land. Balanced and controlled."],
    ["Zigzag bounds", "Bound forward in a zigzag, pushing off each leg to change direction. Stay low and powerful."],
    ["Single-leg zigzag hops", "Hop forward in a zigzag on one leg. Stay balanced. Switch legs halfway."],
    ["Double-leg diagonal hops", "Hop diagonally forward with both feet, switching sides each time. Quick and controlled."],
    ["Alternating lateral skater hops", "Hop side to side, switching legs, with short, quick hops. Stay low."],
    ["Lateral pogo jumps", "Pogo side to side on stiff ankles, with tiny, quick bounces."],
    ["Single-leg lateral pogo jumps", "Pogo sideways on one leg with stiff ankles and quick bounces. Switch legs halfway."],
    ["Repeated lateral skater jumps", "Keep skating side to side, landing soft, with a big arm swing and a low body."],
    ["Diagonal single-leg bounds", "Bound diagonally forward on the same leg, and stick the last landing. Switch legs."]
  ],
  // two moves put together: the hardest in each round, so they come last
  combo:[
    ["Squat jump to broad jump", "A squat jump, land, and straight into a broad jump. Soft landings."],
    ["Broad jump to backward jump", "Broad jump forward, land, and jump straight backward. Check behind you first."],
    ["Tuck jump to squat jump", "A tuck jump, land, and straight into a squat jump."],
    ["Split jump to tuck jump", "A split squat jump, land, and straight into a tuck jump."],
    ["Alternating bounds into sprint starts", "Bound three times, then explode into a short sprint. Drive hard with your arms."],
    ["Skater jump to vertical jump", "A skater jump to the side, land, and straight into a vertical jump."],
    ["Single-leg hop to vertical jump", "One hop on one leg, land, and up into a two-footed jump."],
    ["Jump lunge to lateral bound", "A jump lunge, then bound sideways. Land soft and go again."],
    ["Broad jump to vertical jump", "A broad jump, land, then straight up into a vertical jump. Smooth and powerful."],
    ["Broad jump to tuck jump", "A broad jump, land, and straight into a tuck jump."],
    ["Squat jump to tuck jump", "A squat jump, land, and straight into a tuck jump."],
    ["Lateral bound to broad jump", "A lateral bound, land, then turn it into a broad jump forward."],
    ["Broad jump to skater jump", "A broad jump forward, land, then skate sideways."],
    ["Skater jump to tuck jump", "A skater jump, land, and straight into a tuck jump."],
    ["Split squat jump to broad jump", "A split squat jump, land, then drive into a broad jump."],
    ["Single-leg hop to broad jump", "A hop on one leg, land, then a two-footed broad jump."],
    ["Alternating bounds to vertical jump", "Bound three times, then explode straight up into a jump."],
    ["Tuck jump to 180-degree turn", "A tuck jump, land, then jump and turn a half turn. Land balanced."],
    ["Repeated jump lunges to sprint start", "Jump lunge three or four times, then drive out into a short sprint."],
    ["Jump squat to 180-degree turn", "A jump squat, land, then jump and turn a half turn. Land balanced."],
    ["Broad jump to 90-degree turn", "A broad jump, land, then jump and turn a quarter turn. Land balanced."],
    ["Single-leg hop to stick landing", "A hop on one leg, and hold the landing for two seconds. Balanced and still."],
    ["Continuous multidirectional jump sequence", "Jump forward, sideways, back and sideways in a pattern, with no stopping. Stay light and controlled."]
  ]
};
// what is said part-way through each kind of move
const PLYO_TIPS = {ankle:'Light and quick on the ground.', vertical:'Soft landing. Reset every rep.', horizontal:'Land soft. Stick it.', lateral:'Push off. Stick. Push off.', combo:'One move flows into the next.'};
// Upper-body moves, in the same library. Plank and crawl drills are the low-impact way into each round, then explosive push-ups from easiest
// to hardest. The airborne, turning and handstand moves are last in each round.
const PLYO_UPPER = {
  uPlank:[
    ["Explosive bear-plank hand hops", "In a bear plank with your knees just off the floor, hop your hands forward and back. Quick and light."],
    ["Explosive plank-to-push-up transitions", "From your forearms, push up to your hands and back down with power. Alternate the leading arm."],
    ["Fast plyometric plank hand switches", "In a plank, switch your hands in quick small hops, keeping your hips steady."],
    ["Explosive alternating arm extensions from plank", "In a plank, punch one arm forward fast, then switch. Keep your hips from rocking."],
    ["Plyometric side-plank switches", "Switch from one side plank to the other with an explosive push, keeping your body straight."],
    ["Explosive plank rotations", "From a plank, rotate into a side plank with a fast, powerful turn, then back. Alternate sides."],
    ["Explosive downward-dog shoulder drives", "From downward dog, drive your shoulders forward and up with power, then back. Keep your arms strong."],
    ["Explosive downward-dog push-ups", "From downward dog, dive down and push back up explosively. Keep it smooth."],
    ["Plyometric crab-to-plank transitions", "From a crab position, hop your hands and feet into a plank, then back. Quick and controlled."],
    ["Explosive crab reaches", "In a crab position, push up through your hands and reach one arm to the ceiling. Alternate."],
    ["Explosive crab shoulder taps", "In a crab position, tap one shoulder with the opposite hand, fast. Keep your hips high."],
    ["Explosive bear crawls with hand switches", "In a low bear crawl, switch your hands and feet quickly in place. Keep your back flat."],
    ["Fast lateral bear-crawl hand switches", "Bear crawl sideways with quick hand and foot switches. Stay low and flat."],
    ["Explosive leopard-crawl transitions", "Crawl low with fast hands and feet, then spring into the next step. Keep it smooth."],
    ["Explosive inchworm walkouts with push-ups", "Walk your hands out to a plank, do an explosive push-up, then walk back. Keep your core tight."],
    ["Explosive plank walkouts with push-ups", "From standing, walk out to a plank, do an explosive push-up, and walk back."],
    ["Burpee push-up pop-ups", "Burpee down, an explosive push-up, then pop up. Keep a steady rhythm."],
    ["Explosive burpee push-ups", "Burpee, then an explosive push-up with your hands leaving the floor, and jump up."]
  ],
  uBasic:[
    ["Clap push-ups", "Lower with control, push up hard enough to leave the floor, clap, and catch yourself with soft elbows."],
    ["Explosive push-ups", "Lower with control, then push up so hard your hands leave the floor. Land with soft elbows."],
    ["Air push-ups", "Push up powerfully so your hands leave the floor briefly, then catch yourself and lower straight into the next."],
    ["Explosive wide-grip push-ups", "Hands wider than your shoulders. Lower, then explode up so your hands leave the floor."],
    ["Explosive close-grip push-ups", "Hands close under your chest, elbows tucked. Lower, then explode up and catch softly."],
    ["Explosive diamond push-ups", "Hands together in a diamond under your chest. Lower, then explode up. Stop if your wrists complain."],
    ["Explosive staggered-hand push-ups", "One hand forward, one back. Lower, then explode up. Switch hands halfway."],
    ["Explosive incline push-ups", "Hands on a sturdy bench or step. Lower your chest, then explode up so your hands leave it."],
    ["Explosive kneeling push-ups", "From your knees, lower your chest and explode up so your hands leave the floor. Keep a straight line from knees to head."],
    ["Kneeling clap push-ups", "From your knees, push up hard, clap, and catch yourself with soft elbows."],
    ["Plyometric push-ups with hand release", "Lower until your chest touches the floor, lift your hands, then explode up. Reset every rep."],
    ["Explosive push-ups from the bottom position", "Start with your chest on the floor. No bounce, all power from a dead stop. Push up explosively."]
  ],
  uVar:[
    ["Alternating staggered explosive push-ups", "Explode up and switch your hand stagger in the air, so the other hand lands forward."],
    ["Explosive archer push-ups", "Wide hands. Lower toward one hand with the other arm straight, then explode up. Alternate sides."],
    ["Plyometric typewriter push-ups", "Lower, then shift side to side across the bottom, pushing off hard at each side."],
    ["Explosive offset push-ups", "One hand higher than the other. Explode up and keep your hips level. Swap hands halfway."],
    ["Side-to-side explosive push-ups", "Explode up and land with your hands shifted to one side, then the other. Stay controlled."],
    ["Explosive push-ups with lateral hand movement", "Explode up and move both hands a few inches sideways in the air. Land softly."],
    ["Explosive push-ups with forward hand movement", "Explode up and land your hands a little further forward. Walk them back and go again."],
    ["Explosive push-ups with backward hand movement", "Explode up and land your hands slightly back toward your chest. Stay controlled."],
    ["Explosive push-ups with feet elevated", "Feet on a step or bench. Lower with control, then explode up. Keep your hips from sagging."],
    ["Explosive decline push-ups", "Feet elevated on a sturdy step. Lower, then explode so your hands leave the floor."],
    ["Explosive pike push-ups", "Hips high in a pike. Lower your head toward the floor and explode up. Keep your weight over your hands."],
    ["Plyometric pike push-ups", "From a pike, push up so hard your hands leave the floor. Land soft with your hips high."],
    ["Explosive feet-elevated pike push-ups", "Feet on a sturdy step, hips high. Lower your head, then explode up. Keep your core tight."],
    ["Explosive wall pike push-ups", "Feet against a wall, hips high. Lower, then explode up. Keep your body controlled."],
    ["Explosive Hindu push-ups", "From a pike, swoop your chest down and forward, then drive up and back with power. Flow smoothly."],
    ["Explosive dive-bomber push-ups", "From a pike, dive your chest low and forward, then push up powerfully back to the pike."],
    ["Explosive pseudo-planche push-ups", "Hands by your hips, lean forward. Lower with control, then explode up. Go easy on your wrists."],
    ["Explosive forward-lean push-ups", "Lean your shoulders ahead of your hands. Lower with control, then explode up."],
    ["Push-up drop catches", "Push up so your hands leave the floor, and catch yourself low in the bottom position. Reset and repeat."],
    ["Explosive push-ups with alternating hand lifts", "Explode up and lift one hand higher off the floor than the other. Alternate."],
    ["Explosive push-ups with alternating shoulder taps", "Explode up, tap one shoulder in the air, and land softly. Alternate hands."],
    ["Explosive push-ups to shoulder-width hand placement", "Start with hands narrow, explode up and land them at shoulder width. Lower and go again."],
    ["Explosive push-ups from wide to narrow hand placement", "Start wide, explode up and land narrow. Reset and repeat."],
    ["Explosive push-ups from narrow to wide hand placement", "Start narrow, explode up and land wide. Stay controlled."],
    ["Continuous clap push-ups", "Clap push-ups back to back with no rest between. Keep a tight body and soft elbows."],
    ["Explosive T-push-ups", "After each explosive push-up, rotate and reach one arm to the ceiling. Alternate sides."],
    ["Explosive push-ups with a lateral rotation", "Explode up, turn your torso to one side in the air, and land softly. Alternate sides."],
    ["Explosive push-ups with alternating arm reach", "Explode up, reach one arm forward, and land softly. Alternate arms."],
    ["Explosive push-ups with alternating leg lift", "Explode up and lift one leg in the air. Land softly and alternate legs."],
    ["Explosive archer push-up switches", "An archer push-up, then switch sides with an explosive push through the middle."],
    ["Explosive uneven push-up switches", "One hand on a low step or book. Explode up and switch hands in the air."],
    ["Explosive fingertip push-ups", "On your fingertips, lower with control and explode up. Stop if your fingers or wrists hurt."],
    ["Explosive knuckle push-ups", "On your knuckles, wrists straight. Lower, then explode up. Use a soft mat."],
    ["Explosive wrist-release push-ups", "Lower, lift your wrists off the floor briefly, then explode up. Keep your arms strong."],
    ["Explosive hand-floating push-ups", "Push up hard and let your hands float off the floor. Land softly and go again."],
    ["Explosive hand-switch push-ups", "Explode up and switch which hand is in front, in the air. Land softly."],
    ["Explosive push-ups with alternating forward hand reach", "Explode up and reach one hand forward as you land. Alternate hands."],
    ["Explosive push-ups with alternating lateral hand reach", "Explode up and reach one hand to the side as you land. Alternate hands."],
    ["Explosive push-ups with a quick hand crossover", "Explode up and cross one hand over the other as you land. Land controlled."],
    ["Explosive push-ups with a quick hand uncross", "From a crossed-hands position, explode up and uncross your hands as you land."],
    ["Explosive push-ups with alternating hand rotation", "Explode up, turn your hands in or out as you land, and alternate."]
  ],
  uAdv:[
    ["Double-clap push-ups", "Push up high and clap twice before you land. Catch yourself with soft elbows."],
    ["Triple-clap push-ups", "Push up as high as you can, clap three times, and land soft. Only when you are strong enough."],
    ["Superman push-ups", "Push up so hard that your hands and feet leave the floor, arms reaching forward. Land soft."],
    ["Flying push-ups", "Push up and fly forward a little with your whole body, landing soft. Reset and repeat."],
    ["Explosive push-ups with a 90-degree body turn", "Explode up and turn your body a quarter turn in the air. Land soft and alternate directions."],
    ["Explosive push-ups with a 180-degree body turn", "Explode up and turn a half turn in the air, landing soft in a plank. Alternate directions."],
    ["Rotational clap push-ups", "Push up, rotate your body slightly, clap, and land softly. Alternate directions."],
    ["Behind-the-back clap push-ups", "Push up and clap behind your back before landing. Catch yourself with soft elbows."],
    ["Push-ups with a knee tuck in midair", "Push up and tuck one knee toward your chest in the air. Land soft and alternate knees."],
    ["Push-ups with a double knee tuck in midair", "Push up and tuck both knees in the air. Land soft and keep control."],
    ["Explosive handstand push-up progressions", "Against a wall in a pike, push up hard. Stay controlled and use the wall."],
    ["Wall-assisted handstand push-up rebounds", "Feet on the wall, lower with control, then rebound up. Keep your core tight."],
    ["Push-up depth drops to explosive push-ups", "Drop your hands from small raised blocks, land, and explode straight up. Land soft."],
    ["Wall handstand shoulder taps", "In a wall handstand, tap one shoulder with the opposite hand. Stay controlled."],
    ["Explosive wall handstand shoulder shifts", "In a wall handstand, shift your weight from one hand to the other, quickly and carefully."],
    ["Wall-assisted handstand hop drills", "Facing the wall in a handstand, make small hops with your hands. Stay close to the wall."],
    ["Wall handstand push-off drills", "From a wall handstand, push your shoulders up tall, then lower and repeat with control."],
    ["Explosive pike-to-handstand weight shifts", "From a pike, shift your weight over your hands and kick up to the wall. Stay controlled."],
    ["Burpee clap push-ups", "A burpee, then an explosive clap push-up, then jump up. Keep your body tight."],
    ["Explosive push-ups with a quarter-turn landing", "Explode up and land with your hands turned a quarter turn. Alternate directions."],
    ["Explosive push-ups with a half-turn landing", "Explode up and land with your hands turned a half turn. Alternate directions."],
    ["Single-arm-assisted explosive push-ups", "One hand on the floor, the other on a raised surface. Explode up. Switch sides halfway."],
    ["Alternating single-arm explosive push-ups", "Explode up and push mostly with one arm, then the other. Alternate carefully."],
    ["Explosive one-arm push-up progressions", "Feet wide, one hand behind your back or on your hip. Lower and explode up. Switch arms."],
    ["Plyometric push-ups with double hand lift", "Push up so hard that you lift both hands high off the floor. Land soft."],
    ["Explosive push-ups with a lateral hop", "Explode up and hop sideways with your hands and feet. Land soft."],
    ["Explosive push-ups with a forward hop", "Explode up and hop forward with your hands and feet. Land soft."],
    ["Explosive push-ups with a backward hop", "Explode up and hop backward with your hands and feet. Check behind you."],
    ["Continuous multidirectional plyometric push-ups", "Explosive push-ups in different directions, forward, back and sideways, flowing continuously. Stay controlled."]
  ]
};
Object.assign(PLYO_LIB, PLYO_UPPER);
Object.assign(PLYO_TIPS, {uPlank:'Fast hands. Steady hips.', uBasic:'Fast up. Land with soft elbows.', uVar:'Stay tight. Control the landing.', uAdv:'Not ready for this one? Do an explosive push-up instead.'});
// Medicine ball moves, in the same library: throws into a wall and slams, from the feet and hips, the way a punch is thrown.
const PLYO_MB = {
  mbRot:[
    ["Rotational medicine ball wall throw", "Stand side-on to the wall. Rotate from your hips and throw the ball hard into the wall. Catch and repeat."],
    ["Split-stance rotational throw", "In a split stance, load your back hip, then rotate and throw the ball into the wall. Switch sides halfway."],
    ["Step-in rotational throw", "Step in toward the wall, then rotate and throw from your hips. Catch it and reset."],
    ["Pivot-and-throw", "Pivot on your lead foot, turn your hips and throw the ball into the wall. Stay balanced."],
    ["Rear-hip rotational throw", "Load your rear hip, then drive it through and throw. Think of throwing a cross."],
    ["Lead-hip rotational throw", "Load your lead hip and rotate through to throw. Think of a lead hook."],
    ["Boxing-stance rotational throw", "From your boxing stance, rotate from the feet and hips and throw. Keep your head still."],
    ["Shuffle-to-rotational throw", "Shuffle a step toward the wall, then plant and throw with a hard hip rotation."],
    ["Lateral-step rotational throw", "Step sideways, plant, then rotate and throw into the wall. Keep your weight balanced."],
    ["Alternating rotational wall throws", "Throw to the wall from one side, catch, and throw from the other side. Quick and powerful."]
  ],
  mbChest:[
    ["Explosive chest pass", "Hold the ball at your chest, then push it out hard to the wall. Catch and repeat."],
    ["Step-in chest pass", "Step forward as you push the ball out, putting your whole body behind it."],
    ["Split-stance chest pass", "In a split stance, push the ball out with your arms and hips together. Switch your stance halfway."],
    ["Boxing-stance forward chest pass", "From your boxing stance, push the ball straight out like a cross. Drive off the back foot."],
    ["Kneeling chest pass", "From your knees, push the ball out hard, keeping your body straight. Catch and reset."],
    ["Half-kneeling chest pass", "One knee down, one foot forward. Push the ball out hard. Switch legs halfway."],
    ["Squat-to-chest pass", "Squat down, then drive up and push the ball out in one smooth movement."],
    ["Forward shuffle into chest pass", "Shuffle forward, plant, and push the ball out hard. Stay balanced and quick."],
    ["Reactive catch-and-throw chest pass", "Catch the ball off the wall, absorb it, and throw it straight back out. Quick and sharp."],
    ["Alternating-stance chest pass", "Throw a chest pass, switch your stance, and throw again. Stay quick and balanced."]
  ],
  mbSlam:[
    ["Overhead medicine ball slam", "Reach up tall, then slam the ball into the floor as hard as you can. Pick it up and repeat."],
    ["Rotational medicine ball slam", "Lift the ball to one side, then rotate and slam it down on the other. Alternate sides."],
    ["Side-to-side alternating slams", "Slam the ball down on one side, then the other. Quick, powerful and balanced."],
    ["Diagonal overhead slam", "Lift the ball high to one side and slam it diagonally down across your body."],
    ["High-to-low rotational slam", "From high over one shoulder, rotate and slam it low to the opposite side."],
    ["Boxing-stance rotational slam", "In your boxing stance, rotate through your hips and slam the ball down hard."],
    ["Split-stance overhead slam", "In a split stance, slam the ball down with your whole body behind it. Switch your stance halfway."],
    ["Step-in overhead slam", "Step forward as you slam the ball down, driving your body into it."],
    ["Lateral-step slam", "Step sideways, plant, and slam the ball down hard. Reset and go again."],
    ["Slam-to-sprawl combination", "Slam the ball, then drop into a sprawl and get back up fast. Keep it quick."]
  ],
  mbOver:[
    ["Overhead forward wall throw", "Reach back overhead, then throw the ball forward into the wall using your whole body."],
    ["Overhead backward throw", "Squat, then throw the ball backward over your head, driving up through your legs. Check the space behind you first."],
    ["Low-to-high diagonal throw", "Start low by one hip, then drive up and across and throw the ball high to the wall."],
    ["High-to-low diagonal throw", "Start high over one shoulder, then drive down and across and throw it to the wall."],
    ["Explosive overhead throw from boxing stance", "From your boxing stance, take the ball overhead and throw it forward explosively."],
    ["Squat-to-overhead throw", "Squat down, then explode up and throw the ball overhead. Use your legs."],
    ["Jump-to-overhead throw", "Jump up and throw the ball overhead at the top of your jump. Land softly."],
    ["Rotational overhead throw", "Take the ball overhead to one side, rotate and throw it hard. Alternate sides."],
    ["Step-and-throw overhead pass", "Step forward and throw the ball overhead, driving through your whole body."],
    ["Alternating diagonal wall throws", "Throw diagonally to the wall from one side, then the other. Quick, powerful and controlled."]
  ],
  mbReact:[
    ["Lateral medicine ball wall throw", "Stand side-on and throw the ball into the wall with your hips and arms. Catch and repeat."],
    ["Lateral bound into rotational throw", "Bound sideways, land, and go straight into a rotational throw. Stay balanced."],
    ["Pivot into chest pass", "Pivot your feet, then drive the ball out with a chest pass."],
    ["Medicine ball catch into rotational throw", "Catch the ball off the wall, absorb it, and go straight into a rotational throw."],
    ["Medicine ball catch into overhead slam", "Catch the ball, lift it up, and slam it down in one fast movement."],
    ["Shuffle-pivot-throw combination", "Shuffle, pivot and throw, all in one flow. Plant before each throw."],
    ["Forward hop into chest pass", "Hop forward, land, and push the ball out hard from the landing."],
    ["Medicine ball slam into explosive chest pass", "Slam the ball, pick it up fast, and push out an explosive chest pass."],
    ["Boxing footwork into reactive throw", "Move with your boxing footwork, then throw the ball hard off a sharp stop. Stay balanced."],
    ["Two-step entry into rotational wall throw", "Take two quick steps in, plant, then rotate and throw into the wall."]
  ]
};
Object.assign(PLYO_LIB, PLYO_MB);
Object.assign(PLYO_TIPS, {mbRot:'Turn from the hips. Throw through the wall.', mbChest:'Push through your whole body.', mbSlam:'Reach tall, then slam it hard.', mbOver:'Legs first, then the arms.', mbReact:'Catch, absorb and go.'});
// each option: rounds of the circuit, seconds working, seconds resting after each exercise
const PLYO_OPTS = [{r:2,w:30,rs:30},{r:3,w:30,rs:30},{r:3,w:20,rs:40},{r:4,w:20,rs:40},{r:3,w:40,rs:20}];
const PLYO_BRIEF = [
  ['Before you start', 'Warm up for at least five minutes first: easy jogging, leg swings and a few light jumps. Cold muscles and plyometrics don\'t mix.'],
  ['What you need', 'Nothing but a sturdy box or step for box jumps and depth jumps. No box? Do tuck jumps instead. Use a flat, non-slip surface.'],
  ['How to do them', 'Land softly with bent knees, and stay on the balls of your feet. Fast and sharp beats long and tired. Stop a move when your form goes, and rest. Too advanced? Swap it for an easier one, like a squat jump or an explosive push-up.']
];
