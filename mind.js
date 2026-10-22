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
   tryIt:'In one round of sparring or pad work, choose one outside focus, like his lead shoulder, and keep your eyes there. Count how many times you bring yourself back.'}
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
  {when:'In the corner, gassed', thought:'I’ve got nothing left.', reframe:'A minute is enough to reset. Slow breaths, one instruction from my corner, one thing to do.', why:'Recovery is a skill. A clear, small plan is better than panic.'}
];
const REFRAME_STEPS = ['Notice the thought. Say it out loud or in your head: “I can’t do this.”',
                       'Ask what is true and useful. What can I actually control right now?',
                       'Say the helpful version. Keep it short, believable and in your own words.'];
