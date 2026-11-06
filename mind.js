// Mental skills for boxing. Box breathing and reframing have their own screens; the rest are short read-throughs.
// To add a skill, add an entry to MIND. A reading skill has an intro, why it helps, steps to follow, something to try, and optionally
// a button to another skill (cta). To add a reframing card, add one to REFRAMES.
const MIND = [
  {id:'breath', kind:'breath', name:'Box breathing', blurb:'Breathe in, hold, breathe out, hold, all for the same count. Settle your nerves and sharpen your focus.'},
  {id:'reframe', kind:'reframe', name:'Cognitive reframing', blurb:'Turn the thoughts that hurt you in the ring into ones that help. Practise with real boxing moments.'},
  {id:'selftalk', kind:'read', name:'Self-talk and cue words', blurb:'Short, sharp words that lock in your technique and your mood when it gets hard.',
   intro:'What you say to yourself in a round changes how you feel and what you do. Cue words are short words you use to lock in a technique or a mood, like “jab,” “hands up,” “calm” or “next.”',
   why:'In a fight there is no time for long thoughts. One short word is quick to use, easy to remember when you are tired, and gives your mind something useful to do instead of worrying.',
   steps:['Pick two or three cue words for your plan. Make one about technique (“hands up,” “move,” “jab”) and one about your mood (“calm,” “strong,” “next”).',
          'Say them in your head, or quietly, on the breath out. Use them at the start of a round, when you are tired and after a mistake.',
          'Swap harsh talk for instructions. “That was terrible” becomes “hands up, go again.” Talk to yourself like a good coach would.'],
   tryIt:'In your next bag or pad round, use one cue word at every bell and one after every mistake. Notice how it feels to move on faster.'},
  {id:'visual', kind:'read', name:'Visualisation', blurb:'Rehearse a round in your mind, including the hard moments, so they feel familiar when they happen.',
   intro:'Visualisation is picturing yourself boxing, in detail, before you do it. Fighters use it to rehearse their plan, build confidence and get used to pressure.',
   why:'Your brain practises movements and decisions when you imagine them, and the ring feels more familiar when you step in. Rehearsing the tough moments as well as the good ones prepares you to stay calm in them.',
   steps:['Find somewhere quiet and take three slow breaths. Close your eyes if you like.',
          'See it through your own eyes: the ring, the lights, your opponent, your corner. Add sounds, how your gloves and feet feel, and your breathing.',
          'Rehearse a problem and your answer. He is pressuring you, you pivot off the ropes, take the centre and land your jab. See it going well, step by step.',
          'End with a strong finish: a good round, your hand raised, you calm and in control. Open your eyes slowly.'],
   tryIt:'Before your next session, spend five minutes rehearsing one situation three times in a row. Keep it realistic, with the hard moments in.'},
  {id:'reset', kind:'read', name:'Reset routine', blurb:'A quick routine to let go of the last exchange and get back to the next one.',
   intro:'Everyone gets hit, makes mistakes and has a bad round. A reset routine is a short, repeatable sequence that brings you back to the present, so one bad moment doesn’t become three.',
   why:'The most dangerous moment after a mistake is the next few seconds, when you are still thinking about it. A routine you have practised is automatic, so you don’t have to think.',
   steps:['Breathe. One slow breath out, and let your shoulders drop.',
          'Release. Shake out your arms or roll your shoulders, and let the last exchange go.',
          'Refocus. Say your cue word and pick the next simple thing: jab, move, hands up.'],
   tryIt:'Use it after every round of bag work, and every time you get tagged in sparring. In the corner between rounds, make the breath longer.', cta:'breath'},
  {id:'present', kind:'read', name:'Staying in the moment', blurb:'Fights are won one exchange at a time. Keep your attention on what is in front of you.',
   intro:'Thinking about the result, the crowd or the last mistake pulls your attention away from your opponent. Staying in the moment means putting all of it on the next exchange.',
   why:'You can only act on what is happening now. When your mind drifts to the past or the future, your reactions slow and you miss what your opponent is showing you.',
   steps:['Use the next-exchange rule. You do not need to win the fight right now, only the next ten seconds.',
          'Pick an outside focus: his shoulders, his feet, the gap between you. It is harder to worry about something while you are watching something.',
          'When your mind wanders, notice it, say “thinking” to yourself, and come back to your breath and your opponent. No frustration, just return.'],
   tryIt:'In one round of sparring or pad work, choose one outside focus, like his lead shoulder, and keep your eyes there. Count how many times you bring yourself back.'},
  {id:'helpless', kind:'read', name:'Learned helplessness after losing', blurb:'When past losses make you expect the next one, and how to stop a result from deciding your mindset.',
   intro:'Learned helplessness is what happens when you have been through outcomes you could not seem to change, and you start to believe nothing you do will matter. For a fighter it sounds like “here we go again,” “I always lose these” or “what’s the point?” It is a habit of thinking, not a fact about you.',
   why:'A loss is one result on one day. When the mind turns it into a rule (“I am a loser,” “it always goes this way,” “it’s out of my hands”), you stop trying things, hold back and wait for the result you expect. Then the old outcome seems to prove itself. Breaking the rule gets your effort and your decisions back.',
   steps:['Catch the story. Notice the words “always,” “never” and “I can’t.” Say it out loud: “That’s learned helplessness talking.”',
          'Separate the result from the cause. Ask what actually happened: a decision, a moment, a tired round, an opponent’s style. Specific causes can be fixed. “I’m just a loser” cannot.',
          'List what was in your control and what you would do differently. Keep it to two or three things, and train them.',
          'Collect proof that effort works. Count the rounds you improved in, the habits you built, the weight you made, the camp you finished. Evidence beats a feeling.',
          'Aim at the next exchange, not the verdict. Your job is to compete, execute and make good decisions. The result follows from that and is not something you need to predict.',
          'Talk to yourself like a coach would. “My past results don’t dictate my future. This fight is a new opportunity to show what I’ve learned.”'],
   tryIt:'Write down the sentence you say to yourself about losing, then rewrite it as something specific you can act on. Read the rewrite before your next session. If the old story keeps coming back, talk it through with your coach.', cta:'reframe'},
  {id:'narrative', kind:'read', name:'Fight-week narrative', blurb:'Read this every morning in fight week, to get ready without getting in your own way.',
   intro:'In fight week the mind turns on you: it is hard, it is uncomfortable, and the doubts are loud. This is a script to read each morning, out loud if you can. It is not about feeling confident every second. It is about knowing why you are here and what your job is.',
   why:'You do not have to believe every word the first time. Saying it each day makes it the story you keep coming back to, in place of the one that says you cannot do it. It takes the pressure off proving your worth, and puts your attention on preparation, your body and the fight itself.',
   steps:['I am not going into this fight to prove my worth. I’m going because I’m a boxer, I’ve put in the work and I want to compete.',
          'I don’t need to predict the outcome. I don’t need to be confident every second. I don’t need to be fearless.',
          'I need to trust my preparation, look after my body, stay present and enjoy the opportunity to do something not everyone is willing to do.',
          'I am not fighting my previous losses. I am not fighting my doubts. I am fighting this fight, on this day, against this opponent.',
          'I want to win, but I don’t need to be afraid of losing.',
          'Most importantly: I haven’t come this far to spend fight week convincing myself I can’t do it. My job now is to get ready, not get in my own way.'],
   tryIt:'Read it every morning this week, slowly, ideally out loud. When a doubt shows up during the day, practise the matching card in Cognitive reframing.', cta:'reframe'}
];

// Cognitive reframing: the thought a fighter might have, and a more useful way to see the same situation.
const REFRAMES = [
  {when:'Before a fight', thought:'I’m so nervous. Something must be wrong.', reframe:'My body is getting ready. Nerves mean this matters, and I can use that energy.', why:'Feeling nervous and feeling excited are physically almost the same. Calling it excitement or readiness, instead of fear, helps you use the energy.'},
  {when:'After getting hit', thought:'He just clipped me clean. I’m in trouble.', reframe:'It was one punch. I’m fine, I’ll reset, and now I know something about his timing.', why:'Treating one shot as one shot stops it growing into a whole story, and turns it into information.'},
  {when:'Facing a bigger fighter', thought:'He’s bigger than me. I can’t beat him.', reframe:'Size is one thing. I have my speed, my angles and a plan for this.', why:'It moves your attention from what you can’t change to what you can use.'},
  {when:'Late in a round', thought:'I’m so tired. I can’t keep going.', reframe:'Everyone is tired now. This is what my training is for. I only need the next ten seconds.', why:'Shrinking the task makes it doable, and reminding yourself of the training builds trust.'},
  {when:'Between rounds', thought:'I lost that round. This is going badly.', reframe:'That round is over. I can only win the next one. What is one thing I’ll change?', why:'It turns a judgement into a single, useful adjustment.'},
  {when:'After a mistake', thought:'I can’t believe I did that. I’m terrible.', reframe:'That’s information. I know what to fix, and I’ll fix it on the next exchange.', why:'Mistakes in fights are normal. Treating them as feedback keeps you thinking clearly.'},
  {when:'Facing a skilled opponent', thought:'He’s better than me.', reframe:'I don’t have to be better at everything. I just need to solve one problem at a time.', why:'It breaks something too big into small things you can act on.'},
  {when:'Before the bell', thought:'What if I lose?', reframe:'I can’t control the result, only my preparation and my choices. I’ll focus on the next exchange.', why:'Focusing on what you control lowers pressure and keeps your attention in the ring.'},
  {when:'Walking to the ring', thought:'Everyone is watching me. I can’t mess this up.', reframe:'They’re here to watch me do what I’ve trained for. My eyes stay on my opponent, one punch at a time.', why:'It turns pressure into purpose, and brings you back to the task.'},
  {when:'Struggling with his timing', thought:'I can’t figure him out.', reframe:'I haven’t found it yet. Every exchange gives me more to work with.', why:'“Yet” keeps you curious and learning instead of frustrated.'},
  {when:'Fear of getting hurt', thought:'What if I get hurt?', reframe:'Fear is normal. I’m prepared, I’m protecting myself, and I’ve trained for this.', why:'You can accept the fear without letting it make your decisions.'},
  {when:'In the corner, gassed', thought:'I’ve got nothing left.', reframe:'A minute is enough to reset. Slow breaths, one instruction from my corner, one thing to do.', why:'Recovery is a skill. A clear, small plan is better than panic.'},
  // the thoughts that come up when tired or doubting technique
  {when:'Late in a round, shoulders burning', thought:'My shoulders are tired. I want to stop throwing.', reframe:'Tired shoulders are what this round is for. I’ll throw short and relaxed, drop them between punches, and take the next ten seconds.', why:'Shoulders tire fastest when they are tense. Relaxing them between punches and shrinking the goal lets you keep working without burning out.'},
  {when:'When it gets hard', thought:'I’m just going to shell up, not get hurt and not win.', reframe:'Covering up is a tool, not my whole plan. I can cover for a second, then breathe, and answer with one punch.', why:'Defence that never answers invites more pressure. “Cover, then one shot” keeps you safe and still in the fight.'},
  {when:'Exhausted mid-round', thought:'I don’t want to punch anymore. I’m exhausted.', reframe:'I’m allowed to be exhausted and still throw. I’ll throw one, then one more, and let the rest of the round take care of itself.', why:'You do not need to want to punch. You need the next punch. Tiny commitments keep you moving when motivation is gone.'},
  {when:'Tired in combinations', thought:'I’m too tired to throw long combinations.', reframe:'I don’t need long ones. Two or three clean punches, then move or reset, is a real combination.', why:'Short, sharp combinations are effective and cost less energy. Quality at the end of a round beats quantity.'},
  {when:'Tired, guard dropping', thought:'I’m too tired to throw punches and keep my hands up.', reframe:'Hands come back after every punch, even if it’s only an inch. Punch, return, breathe. Just that.', why:'Cleaning up one habit, the return, is easier than doing everything at once, and it protects you when you are tired.'},
  {when:'Round after round', thought:'I don’t know how to go again and again. I can’t keep throwing in phase after phase.', reframe:'I don’t have to do every phase now. I do this one, rest, then do the next. Going again is a skill I’m building every session.', why:'Repeat effort comes from practising it, one burst at a time. Treating each phase as separate stops it feeling endless.'},
  {when:'Worried about stamina', thought:'I’m going to gas out. I don’t even extend my punches.', reframe:'I’ll throw the next punch long and relaxed. Extending properly costs less than flailing, and one good punch is the fix.', why:'Naming one technique cue gives your attention a job, and relaxed full-length punches are more efficient than tight, rushed ones.'},
  {when:'Doubting your power', thought:'My punches are weak. My head movement is bad.', reframe:'They’re not where I want them yet, and they’re improving. Today I’ll work on one: snap the punch, or move the head after it.', why:'“Weak” and “bad” are verdicts. Picking one thing to work on is a plan, and it is how punches and movement actually get better.'},
  {when:'Doubting your technique', thought:'My technique is rubbish. My breathing is horrible. It’s going to gas me out.', reframe:'My breathing is something I can fix. Out on every punch, long breath out in between. My technique is a work in progress, not a ruined fight.', why:'Breathing is the easiest thing in boxing to change, because you can do it right now. Fixing it protects your engine.'},
  {when:'Doubting your footwork', thought:'My footwork is crap and I can’t throw the right hand properly. I’m going to gas out.', reframe:'Small steps, then the right hand from the back foot, push and turn. I only need one good one, then the next.', why:'Footwork and the right hand are one chain: feet, hips, hand. A clear cue for the chain beats judging the result.'},
  {when:'Feeling unbalanced', thought:'My balance is terrible. My weight is always forward, never back and balanced.', reframe:'I feel it, so I can correct it. Hips under me, weight in the middle of both feet, then I’ll punch from there.', why:'Noticing the problem is the first part of fixing it. A simple balance cue, centred and then punch, is easier to use than a long list.'},
  {when:'Losing your base', thought:'My back foot keeps rising off the ground. I can’t box. I don’t rotate my hips.', reframe:'Back foot pivots, heel stays light, hips turn through the punch. It’s one fix at a time, and I’m already learning it.', why:'The back foot lifting is a sign of arm-only punches. Hips turning with the back foot fixes both, and it is a trainable habit, not a reason to quit.'},
  // fight week
  {when:'Fight week', thought:'This final week has been so hard.', reframe:'This is the final stretch. I don’t need to make it easy; I need to stay focused on what matters.', why:'Hard does not mean wrong. Dropping the demand for it to be easy frees up your attention for the things that count.'},
  {when:'Fight week', thought:'What’s the point of it?', reframe:'The point is to challenge myself, grow and experience what I’m capable of.', why:'Doubt asks for a reason. Giving it one you chose yourself puts you back in charge of why you are here.'},
  {when:'Fight week', thought:'I hate this. Why am I doing this?', reframe:'It’s uncomfortable because I’m doing something difficult. I chose this challenge for a reason.', why:'Discomfort is what difficult things feel like. It is not a sign that you made a mistake.'},
  {when:'Fight week', thought:'I’m going to lose.', reframe:'I don’t know that. I’m not going to lose a fight in my head before I’ve even fought it.', why:'A prediction is not a fact. Losing in your head first hands your opponent a win they have not earned.'},
  {when:'Fight week', thought:'I have to win.', reframe:'I want to win. But my job is to compete, execute and give myself a chance.', why:'“Have to” turns the fight into a threat. “Want to” keeps the wish and drops the pressure, and you can do something about competing and executing.'},
  {when:'Fight week', thought:'Will cutting weight take it out of me?', reframe:'I’ve put a lot into this. Now my priority is recovery, looking after my body and being physically ready.', why:'You cannot undo the cut. You can control how you eat, drink, sleep and rest from here, so put your attention there.'},
  {when:'Fight week', thought:'I’m not good enough.', reframe:'I’m still learning. I don’t need to be perfect to be competitive.', why:'“Not good enough” is a verdict on you. “Still learning” is a description of where you are, and leaves room to grow.'},
  {when:'After losing before', thought:'I’ve developed learned helplessness from losing.', reframe:'My past results don’t dictate my future. Every fight is a new opportunity to make different decisions and show what I’ve learned.', why:'Learned helplessness is a habit of expecting that nothing you do matters. This fight has a different opponent, a different day and a different you, so the old result is not a forecast.'}
];
const REFRAME_STEPS = ['Notice the thought. Say it out loud or in your head: “I can’t do this.”',
                       'Ask what is true and useful. What can I actually control right now?',
                       'Say the helpful version. Keep it short, believable and in your own words.'];

// Mental drills: a timed, guided session for each mental skill, so it is practised as a habit and not just read. A drill has a name, a blurb, a habit tip (when to do it)
// and its phases, each with a name (n), the seconds it lasts (s) and what to do (c); the voice reads c. "build" makes the phases fresh each time (a drill that picks cards).
// "id" is the MIND skill it belongs to. To add a drill, add an entry; the calendar and fight prep pick it up from this list.
const DRILL_TIP = 'Same time, same trigger, every day. Tie it to something you already do, like before training or after brushing your teeth, and add it to the calendar so it repeats.';
const DRILLS = [
  {id:'reframe', name:'Reframing drill', blurb:'Six real thoughts: see it, find your own reframe, then hear one.', habit:DRILL_TIP,
   build:() => { const pick = REFRAMES.slice().sort(() => Math.random() - .5).slice(0, 6);
     return [{n:'Get ready', s:8, c:'Sit tall. Take one slow breath. You will see a thought, then find a better way to see it.'}].concat(...pick.map((it, i) => [
       {n:`Thought ${i + 1} of 6`, s:12, c:`${it.when}. The thought: ${it.thought}`},
       {n:'Your reframe', s:14, c:'Say a more helpful version out loud, in your own words.'},
       {n:'A reframe to compare', s:14, c:`${it.reframe}`}])); }},
  {id:'selftalk', name:'Cue word drill', words:true, blurb:'Why cue words work, then your own two words used in three real fight moments: pressure, a mistake and being tired.', habit:DRILL_TIP,
   phases:[
    {n:'Why cue words work', s:48, c:'In a fight there is no time for long thoughts. When you are tired, or you have just been hit, your mind starts saying things like: I can’t do this, or I’m in trouble. That voice makes you tight, your breathing speeds up and your hands drop. A cue word gives your mind a short, useful job instead. It is easy to remember when you are exhausted, it fits into one breath, and it points you back at what to do next. They are not magic words. They are a tool to get you through the hard moments.'},
    {n:'Your technique word', s:24, c:'Your technique word tells your body what to do: hands up, jab, move, breathe out. Pick the one you forget first when you get tired. Yours is: {tech}. Say it out loud three times. {tech}. {tech}. {tech}.'},
    {n:'Your mood word', s:24, c:'Your mood word tells your mind how to feel: calm, strong, next, trust. Pick the one you need most when the pressure is on. Yours is: {mood}. Say it out loud three times. {mood}. {mood}. {mood}.'},
    {n:'Moment one: he is pressuring you', s:38, c:'Picture round two. He is walking you down and you are being pushed back toward the ropes. You notice the worried thought: I’m in trouble. That is the moment to use your words. Breathe out slowly and say {mood}. Feel your shoulders drop. Now say {tech}. The worry gets interrupted, your body knows its job, and you are back in the fight. Do it now. Breathe out. {mood}. {tech}.'},
    {n:'Moment two: you make a mistake', s:34, c:'You throw a flurry and miss everything, and he lands a counter. The harsh voice says: that was terrible. That voice costs you the next exchange. Swap it for an instruction, the way a good coach would. Say: {tech}, go again. Say it now. The mistake is over. Only the next punch matters.'},
    {n:'Moment three: you are tired', s:38, c:'It is the last thirty seconds of round three. Your legs are heavy and your shoulders are burning. The thought says: I can’t keep going. Do not argue with it. Put your word on the breath. Breathe out, {tech}. Breathe out, {mood}. Slow breaths calm your heart rate, and the word gives your mind something to do other than quit. Now do five breaths, with a word on each one.'},
    {n:'Five breaths with your words', s:30, c:'Breathe out, {tech}. Breathe in. Breathe out, {mood}. Keep going on your own.'},
    {n:'Lock it in', s:28, c:'Decide when you will use them. At every bell. Every time you get tagged. And whenever the voice says you can’t. Say your two words together one last time: {tech}. {mood}. Use them in your next session.'}]},
  {id:'visual', name:'Visualisation drill', blurb:'Rehearse a round in your head, the hard moment and your answer included.', habit:DRILL_TIP,
   phases:[
    {n:'Settle', s:30, c:'Sit somewhere quiet. Three slow breaths. Close your eyes if you like.'},
    {n:'Set the scene', s:40, c:'See the ring, the lights, your corner and your opponent. Add the sounds and how your gloves and feet feel.'},
    {n:'The first minute', s:45, c:'The bell goes. See yourself take the centre and land your first clean jab. Feel your breathing.'},
    {n:'The hard moment', s:45, c:'He pressures you onto the ropes. Stay calm. See yourself breathe out, and pivot off.'},
    {n:'Your answer', s:45, c:'Back in the centre, you land your jab and move. See it going well, step by step.'},
    {n:'The finish', s:30, c:'The last bell. You are calm and in control. Your hand is raised.'},
    {n:'Come back', s:15, c:'Take a slow breath and open your eyes. Remember how it felt.'}]},
  {id:'reset', name:'Reset routine drill', blurb:'Practise breathe, release, refocus five times so it is automatic after a mistake.', habit:DRILL_TIP,
   build:() => { const set = ['You just got caught by a clean jab.', 'You threw a flurry and missed everything.', 'The round ended badly and you are back in the corner.', 'You slipped and he landed anyway.', 'You are tired and it is the last round.'];
     return [{n:'Get ready', s:10, c:'Stand loose. A reset takes about twenty seconds. You will practise it five times.'}].concat(...set.map((s, i) => [
       {n:`Breathe ${i + 1} of 5`, s:8, c:`${s} One slow breath out. Let your shoulders drop.`},
       {n:'Release', s:8, c:'Shake out your arms and roll your shoulders. Let the last exchange go.'},
       {n:'Refocus', s:10, c:'Say your cue word. Pick the next simple thing: jab, move, hands up.'}])); }},
  {id:'present', name:'Stay in the moment drill', blurb:'Hold your attention on one outside focus and bring it back when it drifts.', habit:DRILL_TIP,
   phases:[
    {n:'The next ten seconds', s:25, c:'You do not have to win the fight. Only the next ten seconds. Breathe and say that to yourself.'},
    {n:'Focus: the shoulders', s:45, c:'Imagine your opponent in front of you. Keep your eyes on his lead shoulder. When your mind wanders, say thinking, and come back.'},
    {n:'Focus: the feet', s:45, c:'Now his feet. Watch where he steps. Say thinking each time your mind drifts, and return.'},
    {n:'Focus: the gap', s:45, c:'Now the distance between you. Is it closing or opening? Keep watching it.'},
    {n:'Past and future', s:35, c:'Let the last mistake and the result pop into your head, on purpose. Notice them. Say thinking, and come back to the shoulder.'},
    {n:'Breathe and choose', s:25, c:'One slow breath. Pick the outside focus you will use in your next round.'}]},
  {id:'helpless', name:'Learned helplessness drill', blurb:'Catch the story about losing, find what was in your control, and rewrite it.', habit:DRILL_TIP,
   phases:[
    {n:'Catch the story', s:40, c:'Say out loud the sentence you tell yourself about losing. Just say it, as it is.'},
    {n:'Spot the words', s:30, c:'Listen for always, never and I can not. Say: that is learned helplessness talking.'},
    {n:'What happened', s:45, c:'Name what actually happened in one loss. A decision, a tired round, his style. Specific causes can be fixed.'},
    {n:'In your control', s:45, c:'Name two or three things you would do differently. Make each one something you can train.'},
    {n:'Your proof', s:45, c:'Name three things that show your effort works. Rounds you improved in, habits you built, a camp you finished.'},
    {n:'Rewrite it', s:45, c:'Say the new sentence. For example: my past results do not decide this fight. I know what to work on.'},
    {n:'Say it like a coach', s:30, c:'Say your rewrite once more, slowly, in a calm and firm voice. Remember it for your next session.'}]},
  {id:'narrative', name:'Fight-week narrative drill', blurb:'Read the fight-week script out loud, one line at a time, as you would each morning.', habit:'Do it every morning in fight week, in the same place, before you look at your phone for anything else.',
   build:() => { const lines = MIND.find(m => m.id === 'narrative').steps;
     return [{n:'Get ready', s:10, c:'Stand or sit tall. Take a slow breath. Say each line out loud.'}].concat(lines.map((l, i) => ({n:`Line ${i + 1} of ${lines.length}`, s:28, c:l})))
       .concat([{n:'Finish', s:12, c:'Breathe out slowly. Your job today is to get ready, not to get in your own way.'}]); }}
];
const drillPhases = d => d.build ? d.build() : d.phases;
const drillSeconds = d => drillPhases(d).reduce((n, p) => n + p.s, 0);

// Shadow-boxing workouts: each mental skill also has a timed boxing session where its own cues are called out while you move, so you practise the skill in the ring and
// not just on a chair. A ring entry has the skill id, a name, and cues (said one every RING_GAP seconds in each round, in a shuffled order) and a line for each rest.
const RING_ROUNDS = 3, RING_SEC = 120, RING_REST = 30, RING_GAP = 20;
const ringPhases = r => {
  if(r.script){ const s = r.script, n = s.rounds.length, out = [{n:'What this is for', s:36, c:s.start}];
    s.rounds.forEach((rd, i) => { out.push({n:`Round ${i + 1} of ${n} · ${rd.theme}`, s:22, c:rd.intro}); rd.cues.forEach(c => out.push({n:`Round ${i + 1} of ${n} · shadow box`, s:RING_GAP, c})); if(rd.rest) out.push({n:'Rest', s:RING_REST, c:rd.rest}); });
    return out.concat([{n:'Finish', s:Math.ceil(s.end.split(/s+/).length / 2.4) + 2, c:s.end}]); }
  const out = [{n:'Get ready', s:10, c:'Gloves up. Shadow box. The cues start soon.'}], deck = r.cues.slice().sort(() => Math.random() - .5);
  for(let i = 1; i <= RING_ROUNDS; i++){
    for(let k = 0; k < RING_SEC / RING_GAP; k++) out.push({n:`Round ${i} of ${RING_ROUNDS} · shadow box`, s:RING_GAP, c:(k ? '' : `Round ${i}. `) + deck[(i * 7 + k) % deck.length]});
    if(i < RING_ROUNDS) out.push({n:'Rest', s:RING_REST, c:r.rest});
  }
  return out.concat([{n:'Finish', s:10, c:'Bell. Breathe out slowly. Well done.'}]); };
const RINGS = [
  {id:'reframe', name:'Reframing shadow boxing', blurb:'Three rounds of shadow boxing, talked through: tired shoulders, gassing out, then mistakes and weak punches, each thought turned around as it hits you.',
   script:{start:'This is shadow boxing with cognitive reframing. Reframing means changing how you see a moment so it helps you instead of hurting you. In a fight, the same moment can sound like, I’m done, or, this is what I trained for. Same moment, different thought, and the second one keeps your hands up. Each round we take a hard moment, hear the thought that tries to beat you, and turn it around. Gloves up.',
     end:'Bell. Breathe out slowly. Every one of those thoughts was a story, and you turned each one into something useful. Use the reframe when the thought shows up in your next session.',
     rounds:[
      {theme:'tired shoulders', intro:'Round one: tired shoulders. Your arms start to burn and the thought says, my shoulders are gone. Here is the reframe. Burning shoulders mean you are working, and everyone in the ring is feeling it. Keep your hands up for ten more seconds, then ten more.',
       cues:['The thought says your shoulders are done. The truth: they are working. Hands up.', 'Ten more seconds. That is all you need. Hands up.', 'Burning means you are doing the work. Keep them high.', 'Breathe out on the punch. Tension makes shoulders tire faster. Loosen and reset.', 'Your opponent is tired too. Hands up one more time.'],
       rest:'Your shoulders were burning and you kept going anyway. That is the reframe working: the feeling stayed, but it stopped being a reason to quit. Next round, the thought is, I’m gassing out.'},
      {theme:'gassing out', intro:'Round two: gassing out. The thought says, I can’t breathe, I’m finished. The reframe: breathing hard is normal in a fight, and slow breaths bring you back. You are not gassed, you are working. Breathe out long and go again.',
       cues:['The thought says you are finished. The truth: you are breathing hard, and that is normal. Breathe out long.', 'Slow your breath out. Your heart rate follows.', 'Move your feet. Staying active helps you recover better than stopping.', 'You are not gassed. You have more than you think. Go again.', 'One exchange at a time. Throw, move, breathe.'],
       rest:'Hard breathing is not the same as being finished. Next, the hardest thought: I’m making mistakes and my punches are weak.'},
      {theme:'mistakes and weak punches', intro:'Round three: mistakes and weak punches. The thought says, that was terrible, my punches do nothing. The reframe: a mistake is information. Your punches are enough when they are balanced and on time. Fix one thing on the next exchange.',
       cues:['You missed. The thought says terrible. Reframe it: that is information. Fix it next exchange.', 'Feet under you. Balanced punches land better than big ones.', 'Feel weak? Snap it back. Speed and timing do the work.', 'Back foot down. Push off the ball of it.', 'Do not shell up. Punch, then move. You are allowed to win this round.']}]}},
  {id:'selftalk', name:'Cue word shadow boxing', words:true, blurb:'Three rounds of shadow boxing talked through as fight moments, with your own technique word and mood word used in each.',
   script:{start:'This is shadow boxing with your cue words. They are there to help you in a fight when you are tired, under pressure, or after a mistake. They are not random words. Each round is a fight moment, and I will talk you through it. Your technique word is {tech}. Your mood word is {mood}. Move, throw, and use them exactly as I say. Gloves up.',
     end:'Bell. Breathe out slowly. These words are now yours. Use them at every bell, and every time the voice in your head says you can’t.',
     rounds:[
      {theme:'technique', intro:'Round one: technique. Every time you breathe out, throw and say {tech}. This ties your hands to your breath, so when you are tired your technique runs by itself.',
       cues:['Say {tech} on every breath out. Feel it set your rhythm.', '{tech}. Hands, feet and breath together.', 'Lost your rhythm? Say {tech} and start again.', '{tech}. This word is for when you are tired. Practise it now.', 'Keep moving. {tech}, and throw.'],
       rest:'Good. Notice the word kept your hands and your breathing together. Next round is your mood word, for when the pressure is on.'},
      {theme:'pressure', intro:'Round two: pressure. Imagine he is walking you down and you feel tight. That is when your mood word works. Breathe out and say {mood}, then pivot out and throw, {tech}.',
       cues:['He is on you. Breathe out. {mood}.', 'Feel your shoulders drop. {mood}. Now move.', 'Pivot off. {tech}. Throw your jab.', 'The pressure did not change. You did. {mood}.', 'Back in the centre. {mood}, {tech}.'],
       rest:'That is the point of the words. They did not remove the pressure, they gave you a way to stay calm in it. Next round you will be tired, and you will make mistakes.'},
      {theme:'tired and mistakes', intro:'Round three: you are tired and you make mistakes. Your shoulders burn. When the voice says, I can’t, do not argue. Put your words on the breath. If you miss, say {tech}, go again, not, that was terrible.',
       cues:['Heavy shoulders. Breathe out, {tech}.', 'You missed. Say {tech}, go again.', 'The voice says stop. Breathe out. {mood}.', 'Ten more seconds. {tech}. {mood}.', 'Finish the round with both words. {tech}. {mood}.']}]}},
  {id:'visual', name:'Visualisation shadow boxing', blurb:'Three rounds of shadow boxing talked through as a fight you see in your mind: the start, the hard moment, the finish.',
   script:{start:'This is shadow boxing with visualisation. Your brain practises movements and decisions when you imagine them, so the ring feels familiar when you step in. We will box and see the fight at the same time, including the hard moments, because rehearsing them is how you stay calm when they happen. Picture it as you move: the lights, the ropes, your opponent, your corner. Gloves up.',
     end:'Bell. Breathe out slowly. Your mind has now been through the start, the hard moment and the finish. Rehearse one of these for five minutes before every session.',
     rounds:[
      {theme:'the first minute', intro:'Round one: the bell. See the ring around you, the lights and the ropes, and your opponent across from you. Feel your gloves, your feet on the canvas and your breathing. Take the centre and land your first clean jab.',
       cues:['See him in front of you. Where are his hands? Where are his feet?', 'Take the centre of the ring. See yourself owning it.', 'Throw the jab. See it land clean. Feel your balance.', 'Hear your corner: hands up, jab. Use their voice.', 'Breathe out. Calm and ready. This feels familiar.'],
       rest:'Notice how familiar it felt. That is what visualising does: when the real moment comes, your mind has been there before. Next round, the hard part.'},
      {theme:'the hard moment', intro:'Round two: the hard moment. See him pressuring you onto the ropes. Do not skip this part. Rehearse staying calm. See yourself breathe out, pivot off the ropes and take the centre back.',
       cues:['He is on you. See your shoulders stay loose. Breathe out.', 'Back on the ropes. See yourself pivot out, calm and sharp.', 'Pivot off. Feel your feet turn. See the space open.', 'Back in the centre. See yourself land your jab and move.', 'See him slow down. Your answer is working.'],
       rest:'You just practised the moment most fighters fear, and in your mind you handled it. Next round you finish the fight.'},
      {theme:'the finish', intro:'Round three: the finish. You are tired and it is close. See yourself dig in, keep your hands up and throw clean punches in the last minute. See the last ten seconds, and see yourself finish strong.',
       cues:['Tired, but your hands stay up. See it. Feel it.', 'See the clock. Last minute. You still have your legs.', 'See yourself land the cleanest punches of the fight right now.', 'Ten seconds. See yourself empty the tank.', 'The bell. See your hand raised. Feel it.']}]}},
  {id:'reset', name:'Reset routine shadow boxing', blurb:'Three rounds of shadow boxing talked through: reset after being tagged, after your own mistake, and when you are tired.',
   script:{start:'This is shadow boxing with your reset routine. Everyone gets hit, makes mistakes and has bad moments. The dangerous part is the next few seconds, when your mind is still on the last exchange. A reset is three steps: breathe, release, refocus. Practised enough, it runs automatically, so one bad moment does not turn into three. Each round we practise it after a different problem. Gloves up.',
     end:'Bell. Breathe out slowly. Use the reset after every round and every time you get tagged. In the corner, make the breath longer.',
     rounds:[
      {theme:'after getting tagged', intro:'Round one: getting tagged. Imagine he lands a clean punch. Do not react. Breathe out slowly and drop your shoulders. Shake out your arms. Say your cue word, and pick the next simple thing: jab, move, hands up.',
       cues:['He just landed. Breathe out. Shoulders down.', 'Release it. Roll your shoulders. That punch is over.', 'Refocus. Say your cue word. Throw the jab.', 'Tagged again. Breathe, release, refocus. Same routine.', 'Notice how fast you came back. That is the skill.'],
       rest:'Breathe, release, refocus. The more you rehearse it, the faster it gets. Next round, the reset after a mistake you made yourself.'},
      {theme:'after your own mistake', intro:'Round two: your own mistakes. You throw a flurry and miss everything, and the harsh voice starts. The reset works here too. Breathe, release the miss, then refocus on the next simple punch.',
       cues:['You missed everything. Breathe out. Let it go.', 'Release. Shake out your hands. The miss is over.', 'Refocus. Hands up. Throw one clean jab.', 'You slipped and he still landed. Breathe. Release. Next.', 'Reset your feet. Hands up. Back in it.'],
       rest:'Notice you did not get angry or stuck. The routine got you back to the next punch. Next round is the hardest place to reset: when you are tired.'},
      {theme:'when tired', intro:'Round three: when you are tired. This is where fighters stop resetting and start spiralling. Keep it simple. One long breath out, loosen your hands, and one cue word. Reset every time it falls apart.',
       cues:['Tired and messy. One long breath out.', 'Loosen your hands. Drop your shoulders. Reset.', 'Cue word. Then the next punch. Nothing else.', 'It got ugly again. Breathe, release, refocus.', 'Last stretch. Reset after every exchange.']}]}},
  {id:'present', name:'Stay in the moment shadow boxing', blurb:'Three rounds of shadow boxing talked through: his shoulder, his feet, then practising coming back from distractions.',
   script:{start:'This is shadow boxing with staying in the moment. Fights are won one exchange at a time. When your mind drifts to the result, the crowd or the last mistake, your reactions slow and you miss what your opponent shows you. The fix is simple: put all your attention on something in front of you. Each round we use a different outside focus, and you bring your mind back when it wanders. Gloves up.',
     end:'Bell. Breathe out slowly. In a fight your mind will wander. Winning is not about stopping it, but about coming back fast. Pick your outside focus before the next round.',
     rounds:[
      {theme:'his shoulder', intro:'Round one: his lead shoulder. Imagine your opponent in front of you and keep your eyes on his lead shoulder. It tells you what he is about to do. When your mind wanders, say, thinking, and come back to the shoulder.',
       cues:['Eyes on the lead shoulder. What is it telling you?', 'Mind wandered? Say thinking. Come back to the shoulder.', 'Watch for the shoulder to move before the punch.', 'Breathe out. Eyes stay on the shoulder.', 'Notice how much quieter your mind is when your eyes are busy.'],
       rest:'You cannot worry about something while you are watching something. That is why an outside focus works. Next round, his feet.'},
      {theme:'his feet', intro:'Round two: his feet. Watch where he steps. His feet show his balance, his distance and his next move. Same rule. When your mind drifts to the past or the future, say, thinking, and return.',
       cues:['Watch his feet. Where is he stepping?', 'Is his weight forward or back? Watch the feet.', 'Mind drifted? Thinking. Back to his feet.', 'He steps in. You step off. Eyes on the feet.', 'Only the next ten seconds. Nothing else.'],
       rest:'You do not have to win the fight right now. Only the next ten seconds. Next round, we add the distractions.'},
      {theme:'distractions', intro:'Round three: distractions. Let the result, the crowd and the last mistake pop into your head on purpose. Notice them. Say, thinking, and bring your eyes back to his shoulder or the gap between you. Practise coming back.',
       cues:['What if I lose? Thinking. Back to the gap.', 'The crowd is loud. Thinking. Eyes on his shoulder.', 'That last mistake. Thinking. Next exchange.', 'Come back every time. No frustration, just return.', 'Count how many times you came back. That is the skill.']}]}},
  {id:'helpless', name:'Learned helplessness shadow boxing', blurb:'Three rounds of shadow boxing talked through: catch the story, what you control, and your proof that effort works.',
   script:{start:'This is shadow boxing for learned helplessness. It is the habit of believing nothing you do will change the result, often after a loss. It sounds like, here we go again, or, I always lose these. It is a habit of thinking, not a fact about you. Each round we take one of those thoughts and put your effort and your decisions back in your hands. Gloves up.',
     end:'Bell. Breathe out slowly. A loss is one result on one day. Write down your new sentence about it, specific and in your control, and read it before your next session.',
     rounds:[
      {theme:'catch the story', intro:'Round one: catch the story. Notice the words always and never. They turn one result into a rule. Say to yourself, that is learned helplessness talking. Then throw with intent, because your effort is the one thing you control.',
       cues:['Here we go again. That is a story, not a fact. Throw with intent.', 'Always and never are just words. Catch them. Throw the jab.', 'One loss is one day. It is not who you are. Move.', 'Effort is yours. Make this punch count.', 'Notice the story. Let it go. Go again.'],
       rest:'Catching the story is the first step. You do not have to believe it. Next round, what is actually in your control.'},
      {theme:'what you control', intro:'Round two: what you control. Not the judges, not the result, not your opponent. Your feet, your hands, your breathing and your decisions. Each exchange, make one good decision, then the next.',
       cues:['What can you control right now? Your feet. Move them.', 'Your hands. Keep them up.', 'Your breath. Breathe out and reset.', 'One good decision. Then the next.', 'Your effort. Throw with intent.'],
       rest:'The result is not yours to control. This round was. Next round, you collect proof that effort works.'},
      {theme:'your proof', intro:'Round three: your proof. Think of what shows effort works. Rounds you improved in, a camp you finished, weight you made, habits you built. Evidence beats a feeling. Box like someone who has put in the work, because you have.',
       cues:['You have done this training. That is real. Trust it.', 'Think of a round you improved in. Box like that.', 'You made it through camp. That effort works.', 'Compete. Execute. The result follows.', 'Talk to yourself like a coach. Hands up, keep moving.']}]}},
  {id:'narrative', name:'Fight-week narrative shadow boxing', blurb:'Three rounds of shadow boxing with the fight-week script said between your punches, a part at a time.',
   script:{start:'This is shadow boxing with your fight-week narrative. In fight week the mind turns on you. It is uncomfortable, and the doubts get loud. You do not have to feel confident every second. You only have to know why you are here and what your job is. Each round, say these lines out loud between your punches until they feel like your own. Gloves up.',
     end:'Bell. Breathe out slowly. Read the script each morning this week, slowly and out loud. When a doubt shows up, come back to the line that matters most.',
     rounds:[
      {theme:'why you are here', intro:'Round one: why you are here. I am not going into this fight to prove my worth. I am going because I am a boxer, I have put in the work, and I want to compete. Say it, and throw.',
       cues:['I am a boxer. I have put in the work.', 'I am not here to prove my worth. I am here to compete.', 'I want to compete. Say it as you throw.', 'I have put in the work. Trust it.', 'I am a boxer. Breathe out.'],
       rest:'Say that line again, quietly. It takes the pressure off proving yourself. Next round is about not needing to predict the outcome.'},
      {theme:'no need for certainty', intro:'Round two: you do not need to predict the outcome, be confident every second, or be fearless. You need to trust your preparation, look after your body, stay present and enjoy it.',
       cues:['I do not need to predict the outcome.', 'I do not need to be confident every second.', 'I do not need to be fearless. I need to be ready.', 'Trust your preparation. Stay present.', 'Enjoy this. Not everyone is willing to do it.'],
       rest:'You just let go of three things you never needed. Next round, the last piece: the past and your doubts.'},
      {theme:'not fighting the past', intro:'Round three: the past and your doubts. I am not fighting my previous losses. I am not fighting my doubts. I am fighting this fight, on this day, against this opponent.',
       cues:['I am not fighting my previous losses.', 'I am not fighting my doubts.', 'I am fighting this fight, on this day.', 'I want to win, but I do not need to be afraid of losing.', 'My job now is to get ready, not to get in my own way.']}]}}
];
RINGS.forEach(r => DRILLS.push({id:r.id, ring:true, words:r.words, name:r.name, blurb:r.blurb, habit:DRILL_TIP, build:() => ringPhases(r)}));
