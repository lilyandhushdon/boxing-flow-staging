// Fight scenarios: one opponent style, one objective, and a coaching tip every 30 seconds for the whole round.
// To add one, add an entry: its name, a short blurb for the list, who the opponent is, the mission, the key lesson shown after the bell,
// and its phases. Each phase is [title, what to do (read out at the start of the 30 seconds), short coach's cue (read out near the end)].
// Keep the middle one to about 45 words so it is finished before the cue. Six phases fill a 3-minute round.
const SCENARIOS = [
  {name:'The pressure fighter', blurb:'A strong fighter who walks forward and wants your chest. Keep your range and win the ring.',
   opponent:'A strong, aggressive fighter who keeps walking forward, cuts off the ring and wants to get inside. He thrives when you stand still, back straight up or get trapped on the ropes.',
   mission:'Keep the fight at your range, control the centre, make him pay for walking forward, and show him he can’t bully you on the inside.',
   lesson:'Don’t just move away from pressure. Make the pressure fighter work to reach you, punish his approach, and take away his power to decide where the fight happens.',
   phases:[
    ["Establish your range", "He is coming forward hard. Work off the jab and use lateral movement. Keep your punches long and straight, especially while you move back, so he runs onto them. Don't retreat in a straight line.", "Touch him with the jab, move off the line, make him reset."],
    ["Don't surrender the ring", "You are drifting toward the ropes. Stop backing up on autopilot. Turn off at an angle before you are trapped. A check hook can buy you the exit when the timing is right. Do everything you can to keep your back off the ropes.", "Turn before the ropes take your options."],
    ["Sharp turn to the centre", "If you reach the ropes, spin out and take a sharp turn back to the centre. The sharper the turn, the more territory you win. A wide, lazy turn leaves you behind the centre with little room. Race him back to the middle.", "Sharp turn. Take the territory. Win the centre."],
    ["Win the inside", "He has got inside. Stay calm and compact. Defend first, then fire short, accurate shots. Most pressure fighters only like fighting going forward, so show him he can't have his way on the inside.", "Stay balanced. Make your shots count."],
    ["Push him back", "Time to discourage him. Cut off his advance with a jab or a short combination, then push him back and take ground when you can stay balanced. If he keeps coming, turn off at an angle and leave.", "Make him pay for walking forward."],
    ["Take control", "Now decide where the fight happens. Mix the jab, movement and counters. If he overcommits, score and step out at an angle. Finish with your guard up, your balance, and the centre of the ring in your hands.", "You are deciding where this fight takes place."]
   ]},
  {name:'The counterpuncher', blurb:'He waits for you to attack and punishes predictable entries. Never give him the same opening twice.',
   opponent:'A patient, sharp fighter who rarely leads. He waits for you to commit, slips or blocks your attack, and hits you on the way out.',
   mission:'Use feints, vary your rhythm, disguise your attacks and exit safely, so he never gets the same opening twice.',
   lesson:'A counterpuncher beats a predictable entry. Win by changing how, when and where you start, and always leave after you finish.',
   phases:[
    ["Ask questions with the jab", "He is waiting for you to lead. Throw a few jabs and watch how he answers. Does he slip, parry, counter or step back? Learn his reaction before you commit to anything big.", "Ask with the jab. Watch the answer."],
    ["Feint to draw him", "Show him a jab or a shoulder feint without throwing and see what he does. A counterpuncher reacts to what he thinks is coming. Make his reaction cheap, then be ready to take advantage of it.", "Make him react to nothing."],
    ["Change your rhythm", "Stop being predictable. Pause, half-step, double up or break your own tempo. He is timing your pattern, so give him a different one every few seconds.", "Never the same rhythm twice."],
    ["Disguise your attacks", "Start your attacks differently: a body jab, a double jab, or a step in behind a feint. Keep your guard tight as you enter so his counter has nothing to hit.", "Enter covered. Enter different."],
    ["Exit after every attack", "A counterpuncher does his best work as you finish. Throw two or three, then step off at an angle or pivot out. Never admire your work or stand in front of him.", "Hit and be gone before he replies."],
    ["Never the same opening twice", "If he caught you with something earlier, don't give him that opening again. Mix your targets and entries, take the initiative, and land one he didn't see coming.", "Don't give him the same opening twice."]
   ]},
  {name:'The outfighter', blurb:'Longer reach and constant movement. Cut the ring, don\'t chase, and get in behind a safe attack.',
   opponent:'A tall, mobile fighter with a longer reach who keeps you at the end of his jab and moves away when you close in.',
   mission:'Cut off the ring instead of chasing, use feints to draw reactions, and enter behind a defensively sound attack.',
   lesson:'Against reach, the fight is won with footwork and entries, not speed. Close the gap safely and make the long fighter fight where he is uncomfortable.',
   phases:[
    ["Respect the range", "He is longer and wants to pick at you from the outside. Keep your hands up and shorten the ring with small, balanced steps. Don't lunge, because that just walks you into his jab.", "Small steps. Hands up. No lunging."],
    ["Cut the ring, don't chase", "Following him just tires you out. Step across to cut his path so he runs out of room. Try to put him on the ropes with your feet, not your punches.", "Cut off the exits. Don't chase."],
    ["Slip in behind the jab", "Get inside behind a guarded jab. Step in with your own jab, or parry his and step with it. The aim is to arrive in range with your guard up, not to throw from outside.", "Arrive covered."],
    ["Feint to draw reactions", "Use feints to make him react. Show a jab, see if he pulls back or throws, and take the space when he moves. Make his jab pay a price.", "Draw the jab, take the space."],
    ["Go to the body", "Long fighters protect the head from range. Go downstairs. A body jab or hook as you step in pulls his guard down and slows his movement.", "Go to the body to slow him down."],
    ["Make the range yours", "Once you are in, stay close. Short punches, pivot off when he turns to run, and cut him off again. If he escapes, reset and come again. Don't give the range back.", "Stay on him. Don't give the range back."]
   ]},
  {name:'The aggressive brawler', blurb:'Heavy, wide punches and chaos. Stay compact, stay calm, and counter straight.',
   opponent:'A hard-hitting fighter who throws heavy, wide combinations and tries to turn the fight into a wild exchange.',
   mission:'Keep your defence compact, stay balanced, spot the openings and answer with accurate counters, instead of matching his recklessness.',
   lesson:'A brawler wants chaos. Stay calm, stay compact and let his big punches create the gaps, then counter straight and leave.',
   phases:[
    ["Stay compact", "He is swinging big and wide. Keep your hands high, elbows tight and chin down. Make yourself a small target and watch his shoulders, not his hands.", "Small, tight, watch the shoulders."],
    ["Don't match the wildness", "Don't swing back just because he is. Stay balanced, plant your feet only when you are set, and choose each shot. Ignore the noise.", "Stay calm. Don't trade."],
    ["Slip the big shots", "Wide punches take time to arrive. Step back or slip off the line, let it miss, and see the gap it leaves down the middle.", "Let it miss. See the gap."],
    ["Counter straight", "Fire straight punches down the middle while his arms are wide. Short, accurate, then out. A straight punch beats a curved one to the target.", "Straight down the middle, then out."],
    ["Use angles", "Don't back straight up. Step off to the side so his big combinations hit air, and counter from the new angle.", "Move off the line, not back."],
    ["Finish clean", "When he is frustrated and missing, pick your moments. Stay balanced, score clean and don't get lured into a wild exchange at the bell.", "Accuracy wins. Don't join the brawl."]
   ]},
  {name:'The technical boxer', blurb:'Composed and disciplined, and he beats you to position. Win it with timing and patterns.',
   opponent:'A calm, disciplined fighter who controls position, doesn\'t waste punches and keeps beating you to the right spot.',
   mission:'Spot his patterns, disrupt his rhythm, use feints intelligently, and win exchanges through timing and position.',
   lesson:'Against a technical boxer you can\'t win by rushing. Find the habit, break the rhythm and win the exchange on timing and position, not volume.',
   phases:[
    ["Study him", "He is composed and controls position. Don't rush. Use the jab and watch his habits: where his hands go, how he steps and what he does after his jab.", "Watch. Don't rush."],
    ["Spot the pattern", "Look for repeats: the same entry, the same counter, the same reaction. Find one habit you can use and keep it in mind.", "Find one habit you can use."],
    ["Disrupt his rhythm", "Break his timing. Change speed, pause, step in late and change the beat so he can't settle into a groove.", "Break his beat."],
    ["Use feints smartly", "Show a feint to see where his hands go, then throw the real shot to a different place. A disciplined boxer reacts in a pattern, so use it.", "Feint to find where his hands go."],
    ["Win the position battle", "He wants to get to position first. Fight for the outside foot, take the angles and make him turn to you.", "Win the feet. Win the angle."],
    ["Win on timing", "Pick your moments. Land first, leave before he counters, and finish with the clean shot so the round is yours.", "Win it on timing, not volume."]
   ]}
];
const SCEN_OPTS = [{r:1,m:3},{r:2,m:3},{r:3,m:3}];   // rounds x minutes; a 3-minute round is exactly six phases
