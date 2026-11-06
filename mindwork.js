/* Mental drills: a timed, guided session for each mental skill (the list is DRILLS in mind.js). It counts each phase down, reads the cue aloud, and offers the save box at the end.
   Opened with openDrill(index), from a skill's screen, the calendar (a "Mental drill" session) or fight prep. */
(function(){
  let dr = null, voice = true, words = {tech:'Hands up', mood:'Calm'};
  try{ Object.assign(words, JSON.parse(localStorage.getItem('bfCueWords') || '{}')); }catch(e){}
  const fill = t => t.replace(/{(tech|mood)}/g, (_, k) => words[k]);
  const body = () => $('mdBody');
  const skill = d => MIND.find(m => m.id === d.id);

  function stop(){
    if(!dr) return;
    cancelAnimationFrame(dr.raf); dr = null; hush(); try{ wake?.release() }catch(e){}
  }
  window.drillStop = stop;

  function intro(i){
    const d = DRILLS[i], m = skill(d), mins = Math.round(drillSeconds(d) / 60);
    body().innerHTML = `<h1>${esc(d.name)}</h1><p class="sub">${esc(m.intro)}</p>
      <div class="read"><h2>The drill</h2><p>${esc(d.blurb)} ${d.ring ? `About ${mins} minutes: ${RING_ROUNDS} rounds of ${RING_SEC / 60} minutes with ${RING_REST} seconds rest. Shadow box the whole time. A cue is called out every ${RING_GAP} seconds, so you practise the skill while you move, with space to throw.` : `About ${mins} minutes, timed, with a voice reading each step. Do it out loud if you can.`}</p>
      <h2>Make it a habit</h2><p>${esc(d.habit)}</p></div>
      ${d.words ? `<h2>Your two words</h2><p class="sub">A technique word tells your body what to do (hands up, jab, move). A mood word tells your mind how to feel (calm, strong, next). Choose yours and the workout uses them all the way through.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="c-label">Technique word<input id="mdTech" maxlength="20" autocomplete="off" value="${esc(words.tech)}"></label><label class="c-label">Mood word<input id="mdMood" maxlength="20" autocomplete="off" value="${esc(words.mood)}"></label></div>` : ''}
      <h2>Voice</h2><div class="rest-opts two" id="mdVoice" role="radiogroup" aria-label="Voice">${[true, false].map(v => `<button class="round-opt" role="radio" data-v="${v}" aria-checked="${voice === v}"><strong>${v ? 'Voice reads it' : 'Silent'}</strong></button>`).join('')}</div>
      <div class="iq-actions" style="margin-top:22px"><button class="btn" id="mdStart">Start</button></div>`;
    $('mdVoice').onclick = e => { const b = e.target.closest('.round-opt'); if(!b) return; voice = b.dataset.v === 'true'; $('mdVoice').querySelectorAll('.round-opt').forEach(x => x.setAttribute('aria-checked', x === b)); };
    if(d.words){ const set = (id, k, def) => $(id).oninput = e => { words[k] = e.target.value.replace(/[<>&"]/g, '').trim().slice(0, 20) || def; try{ localStorage.setItem('bfCueWords', JSON.stringify(words)); }catch(x){} }; set('mdTech', 'tech', 'Hands up'); set('mdMood', 'mood', 'Calm'); }
    $('mdStart').onclick = () => begin(i);
  }

  function begin(i){
    const d = DRILLS[i], phases = drillPhases(d).map(p => ({...p, n:fill(p.n), c:fill(p.c)}));
    stop();
    dr = {i, d, phases, p:0, pe:0, acc:0, total:phases.reduce((n, p) => n + p.s, 0), paused:false, last:performance.now(), raf:0};
    keepAwake();
    try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); }catch(e){}
    body().innerHTML = `<div class="bx">
      <div class="eyebrow">${esc(d.name)}</div>
      <div class="iq-bar"><i id="mdBar" style="width:0"></i></div>
      <div class="iq-meta"><span id="mdCount"></span><span id="mdLeft"></span></div>
      <div class="md-phase" id="mdPhase" aria-live="off"></div>
      <div class="md-time" id="mdTime"></div>
      <p class="md-cue" id="mdCue"></p>
      <div class="iq-actions"><button class="btn ghost" id="mdPause">Pause</button><button class="btn ghost" id="mdSkip">Next step</button><button class="btn ghost" id="mdStop">Stop</button></div></div>`;
    $('mdPause').onclick = () => { if(!dr) return; dr.paused = !dr.paused; dr.last = performance.now(); $('mdPause').textContent = dr.paused ? 'Resume' : 'Pause'; if(dr.paused) hush(); else cue(); };
    $('mdSkip').onclick = () => { if(dr) next(); };
    $('mdStop').onclick = () => { stop(); intro(i); };
    enter(0);                                   // said inside the tap, so phones allow the voice for the rest of the session
    dr.raf = requestAnimationFrame(tick);
  }

  function cue(){ const p = dr.phases[dr.p]; tone(660, 0, .25, .07); if(voice) say(p.c, 0, 1); }
  function enter(k){
    dr.p = k; dr.pe = 0;
    const p = dr.phases[k];
    $('mdPhase').textContent = p.n; $('mdCue').textContent = p.c; $('mdCount').textContent = `Step ${k + 1} of ${dr.phases.length}`;
    cue();
  }
  function next(){ dr.acc += dr.phases[dr.p].s - dr.pe; dr.p + 1 < dr.phases.length ? enter(dr.p + 1) : finish(); }

  function tick(now){
    if(!dr) return;
    dr.raf = requestAnimationFrame(tick);
    if(!dr.paused){ const dt = Math.min(.5, (now - dr.last) / 1000); dr.pe += dt; dr.acc += dt; }
    dr.last = now;
    const p = dr.phases[dr.p];
    if(dr.pe >= p.s){ dr.acc -= dr.pe - p.s; dr.pe = p.s; next(); if(!dr) return; }
    $('mdTime').textContent = fmt(dr.phases[dr.p].s - dr.pe);
    $('mdBar').style.width = Math.min(100, dr.acc / dr.total * 100) + '%';
    $('mdLeft').textContent = fmt(dr.total - dr.acc) + ' left';
  }

  function finish(){
    const {i, d, total} = dr, mins = Math.max(1, Math.round(total / 60)), sid = offerSave({type:'mdrill', cfg:{md:i}, minutes:mins});
    cancelAnimationFrame(dr.raf); dr = null; try{ wake?.release() }catch(e){}
    say('Well done.');
    body().innerHTML = `<div class="done" style="padding-top:10px"><div class="eyebrow">${esc(d.name)}</div><div class="big">Well done</div>
      <p class="sub">${mins} minutes of ${esc(skill(d).name.toLowerCase())}. ${esc(d.habit)}</p>
      <div class="savebox" data-save-box="${sid}">${saveBoxHtml(sid)}</div>
      <div class="row"><button class="btn" id="mdAgain">Go again</button><button class="btn ghost" id="mdBack">Back</button></div></div>`;
    $('mdAgain').onclick = () => intro(i); $('mdBack').onclick = () => show('mind');
    window.scrollTo(0, 0);
  }

  window.openDrill = i => { i = Number.isInteger(+i) && +i >= 0 && +i < DRILLS.length ? +i : 0; enterVia(); stop(); intro(i); show('mdrill'); };
  window.drillFor = id => DRILLS.findIndex(d => d.id === id);
})();
