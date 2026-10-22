// Fight scenarios: one opponent style and one objective, with a coach talking the fighter through a whole fight.
// A scenario has five rounds, and each round is a stage of the fight with its own theme: the fighter starts by feeling the opponent
// out, then the plan sharpens, then it gets tough, then the fighter has to stay sharp when tired, then finish.
// Each round is five phases of one minute (a 3-minute round uses the three in `short`), and each phase has three short points,
// one given every 20 seconds, so there is only ever one thing to think about: the coach says it, the fighter does it, then the next.
// The coach reads out the round's `intro`, then only the points, each after a word of encouragement. The phase title is for the screen.
// Keep each point to about 20 words so it is finished before the next one. To add a scenario, add an entry in the same shape.
const SCENARIOS = [
  {name:'The pressure fighter', blurb:'A strong fighter who walks forward and wants your chest. Keep your range and win the ring.',
   opponent:'A strong, aggressive fighter who keeps walking forward, cuts off the ring and wants to get inside. He thrives when you stand still, back straight up or get trapped on the ropes.',
   mission:'Keep the fight at your range, control the centre, make him pay for walking forward, and show him he can’t bully you on the inside.',
   lesson:'Don’t just move away from pressure. Make the pressure fighter work to reach you, punish his approach, and take away his power to decide where the fight happens.',
   short:[0,1,4],
   rounds:[
    {theme:'Feeling him out', intro:'He is coming forward and testing you. Find your range and keep your back off the ropes.', phases:[
     ["Establish your range", [
      "Work off the jab and use lateral movement. Keep your punches long and straight, especially while you move back, so he runs onto them.",
      "Don't retreat in a straight line. After every jab or combination, step off to the side so he has to reset his feet.",
      "Make every step purposeful. You are not running, you are choosing where he has to go."]],
     ["Don't surrender the ring", [
      "Stop backing up on autopilot. If the ropes are close, turn off at an angle before you are trapped.",
      "If you reach the ropes, spin out and take a sharp turn back to the centre. The sharper the turn, the more territory you win.",
      "A check hook can buy you the exit. Throw it as you pivot, so his momentum carries him past you."]],
     ["Win the inside", [
      "He has got inside. Stay calm and compact. Defend first, then fire short, accurate shots.",
      "Most pressure fighters only like fighting going forward. Show him he can't have his way on the inside.",
      "Don't wrestle him. Use your hips and a pivot to turn him, and take the better position."]],
     ["Push him back", [
      "Time to discourage him. Cut off his advance with a jab or a short combination.",
      "Push him back and take ground, but only when you can stay balanced.",
      "If he keeps coming, turn off at an angle and leave. Don't stand in front of him."]],
     ["Take the centre", [
      "You are near the middle, and he is trying to herd you into a corner. Move diagonally or sideways to deny him a clean line.",
      "Pivot to change the angle, and race him back to the very centre of the ring.",
      "Finish with your guard up and your balance. Make him work to take the centre back."]]
    ]},
    {theme:'Beat his entry', intro:'He has your timing now and is cutting the ring faster. Stay one step ahead of him.', phases:[
     ["Read his entry", [
      "Watch his lead foot. When it steps, you move. Don't wait until he is on top of you.",
      "Meet his step with a jab, then move off to the side so he finds nothing.",
      "Make him reset every time. Each reset costs him energy and breaks his rhythm."]],
     ["Footwork first", [
      "Use small lateral steps before big ones. You want to stay balanced as he comes.",
      "Keep your feet apart and your weight even, so you can move either way.",
      "When he cuts left, go right. Never back up into the side he is closing."]],
     ["Long punches on the move", [
      "Throw your jab and straight right as you step back, so he runs onto them.",
      "Stay tall and long. If you lean away, you give him a target and lose your punches.",
      "Reset your guard after every shot, because he will answer."]],
     ["Take the angle", [
      "After a shot, pivot off the line instead of backing straight up.",
      "A small pivot takes you out of his path and leaves him facing the wrong way.",
      "From the new angle, throw a quick counter, then move again."]],
     ["Hold the middle", [
      "Whoever owns the centre owns the round. Step back toward it every time he pushes you out.",
      "Take sharp turns. A wide turn gives him ground.",
      "Finish the minute with the centre in your hands."]]
    ]},
    {theme:'Win the inside', intro:'He is getting inside more now and wants a close fight. Show him that does not work.', phases:[
     ["Stay compact", [
      "He is inside. Keep your elbows in, chin down and hands high. Make yourself small.",
      "Breathe out. Panic is what he is hoping for.",
      "Watch his shoulders. They tell you what is coming."]],
     ["Short shots", [
      "Fire short hooks and uppercuts the moment he steps in.",
      "Mix the body and the head so he can't guard both.",
      "Throw two or three, then turn. Don't stand there trading."]],
     ["Turn him", [
      "Don't wrestle. Use your hips and a pivot to turn him around.",
      "Whoever faces the open ring has the advantage. Make sure that is you.",
      "Once you have turned him, step away and reset your range."]],
     ["Make the inside unsafe", [
      "Every time he comes in, give him something to think about, like a short uppercut or a body shot.",
      "Pressure fighters hate being hit on the way in. Make him pay.",
      "If he stops rushing in, you have won this part."]],
     ["Escape the ropes", [
      "If you are on the ropes, don't cover up and wait. Pivot out as he steps in.",
      "Check hook, then spin off the ropes toward the centre.",
      "Get out sharp. The faster you turn, the more room you win."]]
    ]},
    {theme:'Stay sharp when tired', intro:'You are both tired now and the pressure is heavy. Stay disciplined. Hands up and keep moving.', phases:[
     ["Hands up", [
      "Tired fighters drop their hands first. Keep yours high.",
      "Keep your elbows in and your chin down.",
      "If your guard drops, that is the moment he will find you."]],
     ["Breathe and move", [
      "Breathe out with every punch. It keeps you relaxed.",
      "Take short steps, not big ones. Save your legs.",
      "Keep your feet moving, even when you feel heavy."]],
     ["Smart jabs", [
      "The jab costs the least energy and does the most. Use it a lot.",
      "Use it to stop him stepping in, not just to score.",
      "A good jab buys you a second to breathe."]],
     ["Stay calm under pressure", [
      "He wants to rush you. Slow down and pick your shots.",
      "Defend first, then counter. Don't throw back wildly.",
      "A calm fighter wins the late rounds."]],
     ["Hold your ground", [
      "When he pushes, turn. Don't back straight up.",
      "Take a step back toward the centre every time you can.",
      "Don't give back what you have won."]]
    ]},
    {theme:'Finish strong', intro:'Final round. He is desperate and pushing hard. Stay composed and take control of the fight.', phases:[
     ["Take the centre", [
      "Plant yourself in the middle. Make him work around you.",
      "Use the jab to hold him off and set the pace.",
      "Keep your balance. Don't chase him."]],
     ["Push him back", [
      "Now take ground. Step forward with the jab and a short combination.",
      "Push him back, then turn him off the line.",
      "Only go forward while you are balanced."]],
     ["Score and exit", [
      "When he overcommits, land clean and step out at an angle.",
      "Never stay in front of him after you punch.",
      "Clean punches win rounds."]],
     ["Show your best work", [
      "Use everything you have learned: the jab, the angles, the sharp turns.",
      "Make every punch count.",
      "Show him that you decide where this fight takes place."]],
     ["Finish clean", [
      "Hands up, balanced and composed.",
      "Don't get drawn into a brawl in the last seconds.",
      "Finish the round with the centre of the ring in your hands."]]
    ]}
   ]},
  {name:'The counterpuncher', blurb:'He waits for you to attack and punishes predictable entries. Never give him the same opening twice.',
   opponent:'A patient, sharp fighter who rarely leads. He waits for you to commit, slips or blocks your attack, and hits you on the way out.',
   mission:'Use feints, vary your rhythm, disguise your attacks and exit safely, so he never gets the same opening twice.',
   lesson:'A counterpuncher beats a predictable entry. Win by changing how, when and where you start, and always leave after you finish.',
   short:[0,1,4],
   rounds:[
    {theme:'Learn how he reacts', intro:'He is waiting for you to lead. Ask him questions and learn how he answers.', phases:[
     ["Ask with the jab", [
      "Throw a few jabs and watch how he answers: slip, parry, counter or step back.",
      "Don't commit to anything big yet. You are collecting information.",
      "Keep your guard tight, and stay out of range of his counter."]],
     ["Feint to draw him", [
      "Show a jab or a shoulder feint without throwing. A counterpuncher reacts to what he thinks is coming.",
      "See how he reacts: does he flinch, step back or throw?",
      "Make his reaction cheap, then be ready to take advantage of it."]],
     ["Change your rhythm", [
      "Stop being predictable. Pause, half-step, double up or break your own tempo.",
      "He is timing your pattern, so give him a different one every few seconds.",
      "Never the same rhythm twice."]],
     ["Disguise your attacks", [
      "Start your attacks differently: a body jab, a double jab, or a step in behind a feint.",
      "Keep your guard tight as you enter, so his counter has nothing to hit.",
      "Make every entry look different from the last."]],
     ["Exit after every attack", [
      "He does his best work as you finish. Throw two or three, then step off at an angle.",
      "Finish your combination with a pivot. It takes you off the line he is waiting on.",
      "Never admire your work, and never stand in front of him."]]
    ]},
    {theme:'Disguise and vary', intro:'You know how he reacts now. Hide your attacks and keep changing the picture.', phases:[
     ["Mix your openers", [
      "Open with something different each time: a jab, a body jab, a double jab.",
      "He is waiting for the same start. Don't give it to him.",
      "Watch which opener he reacts to least, and use it."]],
     ["Change the tempo", [
      "Throw one slowly and the next quickly. Break your own rhythm.",
      "Pause in the middle of your attack and then carry on.",
      "A changed tempo makes his timing wrong."]],
     ["Feint and go", [
      "Feint the jab, then throw it. Feint the body, then go upstairs.",
      "When he reacts to the feint, take that opening straight away.",
      "Be ready to leave as soon as you have landed."]],
     ["Enter covered", [
      "Keep your lead hand high as you step in.",
      "Step in behind your jab, not instead of it.",
      "If he counters, it should hit your guard, not your chin."]],
     ["Leave quickly", [
      "Hit, then go. Two shots is plenty.",
      "Exit on an angle so his counter goes where you were.",
      "Reset your guard before you think about your next move."]]
    ]},
    {theme:'Take his space', intro:'He is getting impatient waiting. Take away his room and make him start something.', phases:[
     ["Cut the ring", [
      "Step across to take his space. Don't chase, cut him off.",
      "Every step should leave him with less room to move.",
      "A counterpuncher with no room has to start something."]],
     ["Light pressure", [
      "Walk him down with the jab. Keep your guard up as you come.",
      "Take a small step at a time so you stay balanced.",
      "Make him feel you are always there."]],
     ["Beat his counter", [
      "When he starts something, expect it. Defend first.",
      "Then answer with a second shot as he finishes.",
      "He rarely expects the follow-up."]],
     ["Body first", [
      "Go to the body, where counters are slower.",
      "Then come back upstairs once his guard drops.",
      "Make him defend two places at once."]],
     ["Don't chase", [
      "If he runs, don't follow in a straight line.",
      "Cut the angle and wait for him to come to you.",
      "Stay patient. You are in control of the space."]]
    ]},
    {theme:'Break his timing', intro:'He is timing you better now. Keep changing your look so he can never settle.', phases:[
     ["Change your angle", [
      "Step off to the side before you throw.",
      "A different angle means a different counter, and he has to guess.",
      "Come back to the centre and do it from the other side."]],
     ["Two-shot attacks", [
      "Keep your attacks short: two shots and out.",
      "Long combinations give him time to read you.",
      "Mix the targets, head and body."]],
     ["Pivot out", [
      "Finish on a pivot. It takes you off the line he is waiting on.",
      "Turn him as you leave so he has to reset.",
      "Then come in again from a different place."]],
     ["Fake and wait", [
      "Show him something, then wait. Let him react first.",
      "If he counters your fake, you now know his timing.",
      "Use that. Step in just after his counter ends."]],
     ["Different openings", [
      "If he caught you with something, don't offer it again.",
      "Use a new entry each time.",
      "Keep him guessing."]]
    ]},
    {theme:'Never the same twice', intro:'Final round. Use everything you have learned and never repeat yourself.', phases:[
     ["Take the initiative", [
      "Be the one setting the pace. Start the exchanges.",
      "Mix feints, jabs and body shots.",
      "Make him respond to you."]],
     ["Use your best entries", [
      "Go back to the entries that worked best.",
      "But change the timing so he doesn't read them.",
      "Stay covered as you come in."]],
     ["Land and leave", [
      "Land a clean shot and exit at an angle.",
      "Don't stay in front of him.",
      "Clean and gone is how you beat a counterpuncher."]],
     ["Stay patient", [
      "Don't rush because the round is ending.",
      "Pick your moment and make it count.",
      "A rushed attack is exactly what he wants."]],
     ["Finish clean", [
      "Finish the round with a shot he didn't see coming.",
      "Keep your guard up as you leave.",
      "Show him he never got the same opening twice."]]
    ]}
   ]},
  {name:'The outfighter', blurb:'Longer reach and constant movement. Cut the ring, don\'t chase, and get in behind a safe attack.',
   opponent:'A tall, mobile fighter with a longer reach who keeps you at the end of his jab and moves away when you close in.',
   mission:'Cut off the ring instead of chasing, use feints to draw reactions, and enter behind a defensively sound attack.',
   lesson:'Against reach, the fight is won with footwork and entries, not speed. Close the gap safely and make the long fighter fight where he is uncomfortable.',
   short:[0,1,2],
   rounds:[
    {theme:'Respect his range', intro:'He is long and wants to pick at you from outside. Be patient and stay balanced.', phases:[
     ["Respect the range", [
      "He is longer and wants to pick at you from outside. Keep your hands up and shorten the ring with small, balanced steps.",
      "Don't lunge. That just walks you into his jab.",
      "Step with your own jab and take half a step each time. Small gains add up."]],
     ["Cut the ring", [
      "Following him just tires you out. Step across to cut his path so he runs out of room.",
      "Try to put him on the ropes with your feet, not your punches.",
      "When he runs for a corner, stop following and take away the exit."]],
     ["Get in behind the jab", [
      "Get inside behind a guarded jab. Arrive in range with your guard up.",
      "Show a feint to make him react, then take the space when he moves.",
      "Parry his jab and step in with the same movement. Counter before he pulls his hand back."]],
     ["Work the body", [
      "Long fighters protect the head from range. Go downstairs.",
      "A body jab or hook as you step in pulls his guard down and slows his movement.",
      "Then return to the head. Make him defend two places at once."]],
     ["Close him down", [
      "Once you are in, stay close. Short punches, and pivot off when he turns to run.",
      "If he escapes, reset, breathe and come again with a better entry than last time.",
      "Don't give the range back. Make him fight where he is uncomfortable."]]
    ]},
    {theme:'Cut the ring', intro:'He is moving more now. Stop following him and start taking away his space.', phases:[
     ["Take the middle", [
      "Own the centre of the ring. Make him circle around you.",
      "The one in the middle walks less, and the one on the edge walks more.",
      "Every time he gets to the edge, don't chase. Cut across."]],
     ["Step across", [
      "Step across to cut his path, not behind him.",
      "Make your steps small and balanced.",
      "Keep your hands up as you move."]],
     ["Use the ropes", [
      "When he is near the ropes, close the exits one at a time.",
      "Stand on his escape side. Make him choose.",
      "If he has to fight, he is no longer an outfighter."]],
     ["Jab and move in", [
      "Step in with the jab and take half a step with it.",
      "If he steps back, follow with the jab again.",
      "Never reach with the punch. Reach with the feet."]],
     ["Stay patient", [
      "You will not catch him in one go.",
      "Keep cutting the ring and gaining small amounts of space.",
      "Pressure builds. Be patient."]]
    ]},
    {theme:'Get inside', intro:'You have taken some of his space. Now get inside his reach safely.', phases:[
     ["Enter covered", [
      "Step in behind your guard, with the lead hand up.",
      "Don't leave your head out in front.",
      "Arrive in range ready to defend as well as attack."]],
     ["Parry and step", [
      "Parry his jab and step in with the same movement.",
      "Counter before he can pull his hand back.",
      "His long reach is your target when his hand is out."]],
     ["Feint and enter", [
      "Show a feint to freeze him, then step in.",
      "A good feint buys you a step.",
      "Take that step quickly, then stay close."]],
     ["Short punches inside", [
      "Once you are in, use short hooks and uppercuts.",
      "Long punches need room that he has taken away.",
      "Stay tight to his chest."]],
     ["Turn him", [
      "When he tries to push out, pivot and turn him.",
      "Don't let him reset the range.",
      "Stay close and keep working."]]
    ]},
    {theme:'Work the body', intro:'He is getting tired of being chased. Go downstairs and slow him down.', phases:[
     ["Body jab", [
      "Use the jab to the body as you step in.",
      "It pulls his guard down and slows his movement.",
      "Bend your knees to throw it. Keep your head up."]],
     ["Body hook", [
      "Step in with a lead hook to the ribs.",
      "A hard body shot takes the spring out of his legs.",
      "Then leave on an angle."]],
     ["Head and body", [
      "Mix head and body so he can't guard both.",
      "Go to the body, then come back upstairs.",
      "Keep him guessing."]],
     ["Cut off his escape", [
      "If he moves away, don't follow. Step across.",
      "Cut the ring and meet him at the other side.",
      "Make him fight where he is uncomfortable."]],
     ["Keep your balance", [
      "Don't lean in when you throw to the body.",
      "Keep your feet under you.",
      "Stay balanced so you can move after every shot."]]
    ]},
    {theme:'Close him down', intro:'Final round. He is tired of running. Close him down and finish strong.', phases:[
     ["Stay on him", [
      "Make every step count. Close him down.",
      "Don't give him room to reset.",
      "Stay close and keep your hands up."]],
     ["Short and sharp", [
      "Work with short punches, head and body.",
      "Move your feet to stay on him.",
      "Don't reach."]],
     ["Cut every exit", [
      "If he turns, turn with him.",
      "Take away the ropes, take away the corners.",
      "Make him fight."]],
     ["Land and move", [
      "Land clean and step out on an angle.",
      "Don't stay in front of his jab.",
      "Clean and out wins rounds."]],
     ["Finish strong", [
      "Keep the pressure on to the bell.",
      "Stay balanced, hands up.",
      "Make him fight in your range, not his."]]
    ]}
   ]},
  {name:'The aggressive brawler', blurb:'Heavy, wide punches and chaos. Stay compact, stay calm, and counter straight.',
   opponent:'A hard-hitting fighter who throws heavy, wide combinations and tries to turn the fight into a wild exchange.',
   mission:'Keep your defence compact, stay balanced, spot the openings and answer with accurate counters, instead of matching his recklessness.',
   lesson:'A brawler wants chaos. Stay calm, stay compact and let his big punches create the gaps, then counter straight and leave.',
   short:[0,1,4],
   rounds:[
    {theme:'Stay compact', intro:'He is swinging big and wide. Stay compact and stay calm.', phases:[
     ["Stay compact", [
      "He is swinging big and wide. Keep your hands high, elbows tight and chin down.",
      "Make yourself a small target. Watch his shoulders, not his hands.",
      "Don't swing back just because he is. Stay calm and choose each shot."]],
     ["Slip and counter", [
      "Wide punches take time to arrive. Step back or slip off the line and let it miss.",
      "See the gap it leaves down the middle.",
      "Fire a straight punch into it, short and accurate, then out. Straight beats curved."]],
     ["Use your angles", [
      "Don't back straight up. Step off to the side so his combinations hit air.",
      "Counter from the new angle.",
      "Control the distance. Step out as he starts and in as he finishes."]],
     ["Watch the pause", [
      "A brawler has to breathe after a flurry. Spot the pause and counter in it.",
      "If he gets inside, tie up his arms briefly, pivot and reset. Don't stand and trade.",
      "When he swings and misses, go to the body as you come out. It drains the power behind his punches."]],
     ["Finish clean", [
      "When he is frustrated and missing, pick your moments.",
      "Stay balanced and score clean. Don't get lured into a wild exchange.",
      "Accuracy wins. Finish the round calm and in control."]]
    ]},
    {theme:'Counter straight', intro:'He is throwing harder now. Let his big punches miss and answer straight down the middle.', phases:[
     ["Straight beats wide", [
      "A straight punch gets there before a hook does.",
      "Wait for his arm to go wide, then fire down the middle.",
      "Short and accurate. Not hard."]],
     ["Jab to disrupt", [
      "Use your jab to stop him starting his big punches.",
      "A jab in the face ruins his rhythm.",
      "Then step out of range."]],
     ["Slip and fire", [
      "Slip the big shot, then fire the straight right.",
      "Keep your head off the centre line when you counter.",
      "Reset your guard after every shot."]],
     ["Step out", [
      "After every counter, step out. Don't stay in front of him.",
      "Use a small pivot so he swings at air.",
      "He should always be a step behind you."]],
     ["Stay patient", [
      "Don't throw just to throw.",
      "Wait for the opening to come to you.",
      "One clean counter is worth ten rushed ones."]]
    ]},
    {theme:'Use your angles', intro:'He keeps coming in a straight line. Use your angles so he is always hitting air.', phases:[
     ["Step off the line", [
      "As he starts, step off to the side.",
      "His big punches will miss and his feet will be out of place.",
      "Don't back straight up. Back into nothing."]],
     ["Counter from the side", [
      "From the new angle, throw a short counter.",
      "He will be turned, with no guard on that side.",
      "Then move again."]],
     ["Pivot out", [
      "When he gets close, pivot out and leave.",
      "Don't stay and trade.",
      "A pivot costs him a whole punch."]],
     ["Control the range", [
      "Step out as he starts and step in as he finishes.",
      "Make his big punches land on nothing.",
      "Then punch while he is reset."]],
     ["Stay balanced", [
      "Don't lean when you counter.",
      "Keep your feet under you.",
      "You need to be ready to move again."]]
    ]},
    {theme:'Make him tired', intro:'He is breathing hard. His big punches are costing him. Keep making them miss.', phases:[
     ["Make him miss", [
      "Every missed punch costs him energy.",
      "Keep slipping and stepping out.",
      "Let him tire himself out."]],
     ["Body shots", [
      "When he swings and misses, go to the body as you come out.",
      "It drains the power behind his punches.",
      "Then leave before he answers."]],
     ["Watch the pause", [
      "He has to breathe. Spot the pause and use it.",
      "Land a clean shot and step out.",
      "Don't stay for the reply."]],
     ["Tie up and reset", [
      "If he gets inside, tie up his arms.",
      "Pivot and reset to the range you want.",
      "Don't stand and trade."]],
     ["Stay calm", [
      "He will be getting more desperate.",
      "Stay calm and keep your guard tight.",
      "A calm fighter wins when the other is tired."]]
    ]},
    {theme:'Finish clean', intro:'Final round. He is tired and desperate. Stay composed and finish clean.', phases:[
     ["Stay composed", [
      "He will throw everything. Stay calm.",
      "Keep your hands up and your elbows tight.",
      "Don't match his wildness."]],
     ["Pick your shots", [
      "Wait for the opening and fire straight.",
      "Make each punch count.",
      "Then step out."]],
     ["Use your angles", [
      "Keep moving off the line.",
      "Let his big punches hit air.",
      "Counter from the side."]],
     ["Don't join the brawl", [
      "If he gets close, tie up and reset.",
      "Don't get lured into a wild exchange.",
      "Accuracy wins the round."]],
     ["Finish in control", [
      "Finish the round calm and balanced.",
      "Keep your guard up to the bell.",
      "Show him that you stayed in control."]]
    ]}
   ]},
  {name:'The technical boxer', blurb:'Composed and disciplined, and he beats you to position. Win it with timing and patterns.',
   opponent:'A calm, disciplined fighter who controls position, doesn\'t waste punches and keeps beating you to the right spot.',
   mission:'Spot his patterns, disrupt his rhythm, use feints intelligently, and win exchanges through timing and position.',
   lesson:'Against a technical boxer you can\'t win by rushing. Find the habit, break the rhythm and win the exchange on timing and position, not volume.',
   short:[0,1,4],
   rounds:[
    {theme:'Study him', intro:'He is composed and controls position. Don\'t rush. Learn how he fights.', phases:[
     ["Study him", [
      "He is composed and controls position. Don't rush. Use the jab and watch his habits.",
      "Where do his hands go? How does he step? What does he do after his jab?",
      "Find one habit you can use and keep it in mind."]],
     ["Take away his tools", [
      "Disrupt his jab. Parry it, or jam it by touching his glove as he throws.",
      "Without his jab he loses his best tool for setting up everything else.",
      "Break his timing. Change speed, pause, and step in late."]],
     ["Feints and levels", [
      "Show a feint to see where his hands go, then throw the real shot somewhere else.",
      "Mix head and body so he can't set his guard in one place.",
      "A disciplined boxer reacts in a pattern. Use it."]],
     ["Win the position", [
      "Fight for the outside foot, take the angles and make him turn to you.",
      "Apply just enough pressure that he has to move. Put him on the back foot.",
      "Technical boxers like time and space. Give them neither."]],
     ["Win on timing", [
      "Don't get frustrated if he is slippery. Stay disciplined and keep your guard tight.",
      "Pick your moments. Land first and leave before he counters.",
      "Finish with the clean shot so the round is yours. Win on timing, not volume."]]
    ]},
    {theme:'Break his rhythm', intro:'You have seen his habits. Now use them and break his rhythm.', phases:[
     ["Use the habit", [
      "Go back to the habit you found. Test it again.",
      "If he does it again, you have found something real.",
      "Be ready to use it."]],
     ["Change speed", [
      "Slow down, then speed up.",
      "A technical boxer relies on timing, so ruin it.",
      "Never the same speed twice."]],
     ["Late entries", [
      "Step in a half-beat late.",
      "He will be waiting for you to arrive and will miss.",
      "Then punch while he is early."]],
     ["Jam his jab", [
      "Touch his glove as he throws the jab.",
      "Without a good jab he can't set anything up.",
      "Keep doing it until he stops throwing it."]],
     ["Stay disciplined", [
      "He will try to frustrate you.",
      "Don't rush. Keep your guard tight.",
      "A rushed attack is exactly what he wants."]]
    ]},
    {theme:'Win the position', intro:'He is getting to position first. Take it away from him.', phases:[
     ["Outside foot", [
      "Fight for the outside foot. It gives you the better angles.",
      "Step across so your lead foot is outside his.",
      "Now your punches have a clear line and his don't."]],
     ["Take the angle", [
      "Pivot off the line as you punch.",
      "Make him turn to find you.",
      "A turned boxer is a boxer out of position."]],
     ["Pressure him", [
      "Apply just enough pressure that he has to move.",
      "Put him on his back foot.",
      "Technical boxers like time and space. Give them neither."]],
     ["Cut the ring", [
      "Don't follow him, cut him off.",
      "Take away his exits one at a time.",
      "Make him fight in a smaller room."]],
     ["Hold the centre", [
      "Keep the middle of the ring.",
      "Make him work around you.",
      "The fighter in the centre controls the pace."]]
    ]},
    {theme:'Win on timing', intro:'You are both tired. This is where timing wins. Pick your moments and make them count.', phases:[
     ["Pick your moments", [
      "Don't throw just to throw.",
      "Wait for the moment he steps or reacts.",
      "Then land first."]],
     ["Land and leave", [
      "Land a clean shot and step out.",
      "Don't stay for his counter.",
      "Clean and gone."]],
     ["Counter his entry", [
      "When he steps in, meet him with a jab.",
      "Then pivot out so his counter has nothing to hit.",
      "Make him pay for every step."]],
     ["Feint and punch", [
      "Show a feint, see his reaction, and throw the real shot to the other place.",
      "He will react in the same way again.",
      "Use that."]],
     ["Stay sharp", [
      "Tired boxers drop their guard. Keep yours high.",
      "Breathe out as you punch.",
      "Stay disciplined to the end."]]
    ]},
    {theme:'Pull it together', intro:'Final round. Use everything you have learned and win it on timing, not volume.', phases:[
     ["Set the pace", [
      "Take the centre and set the pace.",
      "Use the jab to control the range.",
      "Make him react to you."]],
     ["Use what worked", [
      "Go back to what has worked best.",
      "Use your feints and your timing.",
      "Keep changing the picture so he can't settle."]],
     ["Win exchanges", [
      "Land first and leave.",
      "Win the exchange on timing, not power.",
      "One clean shot is worth five rushed ones."]],
     ["Stay in position", [
      "Keep the outside foot. Keep the angle.",
      "Don't let him take the position back.",
      "Hold the centre."]],
     ["Finish clean", [
      "Finish the round with a clean shot.",
      "Keep your guard up to the bell.",
      "Win it on timing, not volume."]]
    ]}
   ]}
];
// something said before each point after the first, so the fighter hears they are doing well, then the next thing to do
const SCEN_ENC = ['Good work.', 'Nice.', 'That’s it.', 'Good. Keep going.', 'Well done.', 'Looking sharp.', 'Stay with it.', 'Good job.', 'Strong.', 'Keep that up.'];
const SCEN_SEG = 60;   // every phase is one minute
const SCEN_OPTS = [{r:5,m:5},{r:3,m:5},{r:1,m:5},{r:5,m:3},{r:3,m:3},{r:1,m:3}];   // rounds x minutes; 5 minutes is five phases, 3 minutes is three
