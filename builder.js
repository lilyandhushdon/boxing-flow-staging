/* Build a workout: chain blocks from any section (boxing, strength and conditioning) into one session. A block is one of the ways to train, with its own choices, exactly as
   the calendar stores them: { type, cfg }. The session plays the blocks one after another on the usual timer screen; when a block ends the next one starts, and the
   workout is done when the last one ends. Each block is logged as its own session. This file loads after calendar.js and uses its WAYS, defaults, label and params,
   and the main script's mode, start, finish, show and applyParams. */
(function(){
  const KEY = 'bfBuild';
  const GROUPS = [['Boxing', ['coach','basic','timer','scenario','output']], ['Strength & conditioning', ['plyo','peak','shoulder','treadmill','abs','neck','flow','run']], ['Recovery', ['recovery']]];
  const cal = () => window.bfCal;
  const way = id => cal().WAYS.find(w => w.id === id);
  let list = []; try{ list = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(b => b && way(b.type)); }catch(e){}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} };
  // a block is one round: these modes are cut down to their first round when they play. Treadmill, abdominals, running and recovery have no rounds, so one block is the whole workout.
  const ROUNDED = ['coach','basic','timer','scenario','output','plyo','shoulder'];
  // the choice of "rounds x minutes" becomes just how long the round is, so the options are the distinct lengths (each value is the first option with that length)
  const lens = {opt:() => OPTIONS, sopt:() => SCEN_OPTS, oopt:() => OUT_OPTS, shopt:c => SHOULDER[+c.shd || 0].opts || SHOULDER_OPTS, popt:() => PLYO_OPTS};
  function lengthField(f, cfg){
    const L = lens[f.k]; if(!L) return f;
    const all = L(cfg), key = o => f.k === 'popt' ? `${o.w} sec on, ${o.rs} sec off` : `${o.m}-minute round`, seen = new Map();
    all.forEach((o, j) => { if(!seen.has(key(o))) seen.set(key(o), j); });
    const cur = key(all[Math.min(+cfg[f.k] || 0, all.length - 1)]);
    return {k:f.k, l:f.k === 'popt' ? 'Timing' : 'Round length', o:[...seen.keys()], vals:[...seen.values()], sel:[...seen.keys()].indexOf(cur)};
  }
  const BREAK_SEC = 60;   // rest between blocks
  const chain = {on:false, i:0, mins:0, n:0, blocks:[], single:false, oneRound:true};
  Object.defineProperty(window, 'bfInChain', {get:() => chain.on});   // burn.js: a built workout counts its calories as one

  const X = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function blockHtml(b, i){
    const w = way(b.type), fields = w.fields(b.cfg).map(f => f.o ? lengthField(f, b.cfg) : f);
    return `<div class="bw-block" data-i="${i}">
      <div class="bw-head"><b>${i + 1}. ${esc(w.name)}${ROUNDED.includes(b.type) ? ' <em>· 1 round</em>' : ''}</b>
        <span><button data-up="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>&uarr;</button><button data-down="${i}" aria-label="Move down" ${i === list.length - 1 ? 'disabled' : ''}>&darr;</button><button data-del="${i}" aria-label="Remove ${esc(w.name)}">${X}</button></span></div>`
      + fields.map(f => f.multi
        ? `<label>${f.l}</label><div class="bw-chips">${FOCUS.map(x => `<button type="button" data-chip="${x.id}" data-i="${i}" aria-pressed="${(b.cfg.focus || []).includes(x.id)}">${x.name}</button>`).join('')}</div>`
        : `<label>${f.l}<select data-f="${f.k}" data-i="${i}">${f.o.map((o, j) => `<option value="${f.vals ? f.vals[j] : j}" ${(f.vals ? f.sel : +b.cfg[f.k] || 0) === j ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`).join('')
      + '</div>';
  }
  window.renderBuild = function(){
    $('bwList').innerHTML = list.length ? list.map(blockHtml).join('')
      : '<p class="bw-empty">Nothing here yet. Add a block from boxing or strength and conditioning below, and add as many as you like, in any order.</p>';
    $('bwAdd').innerHTML = GROUPS.map(([name, ids]) => `<div class="bw-grp">${name}</div><div class="bw-picks">${ids.map(id => `<button data-add="${id}">+ ${esc(way(id).name)}</button>`).join('')}</div>`).join('');
    $('bwStart').disabled = !list.length; $('bwClear').hidden = !list.length;
    $('bwSummary').textContent = list.length ? `${list.length} block${list.length > 1 ? 's' : ''}, one after another with no menu in between.` : '';
  };
  $('build').addEventListener('click', e => {
    const t = e.target.closest('button'); if(!t) return;
    const d = t.dataset;
    if(d.add){ const c = cal().defaults(d.add); list.push({type:d.add, cfg:c}); }
    else if(d.up != null){ const i = +d.up; if(i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
    else if(d.down != null){ const i = +d.down; if(i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
    else if(d.del != null) list.splice(+d.del, 1);
    else if(d.chip){ const b = list[+d.i], s = new Set(b.cfg.focus || []); s.has(d.chip) ? s.delete(d.chip) : s.add(d.chip); b.cfg.focus = [...s]; t.setAttribute('aria-pressed', s.has(d.chip)); save(); return; }
    else return;
    save(); renderBuild();
  });
  $('build').addEventListener('change', e => {
    const t = e.target; if(!t.dataset.f) return;
    const b = list[+t.dataset.i]; b.cfg[t.dataset.f] = +t.value;
    if(t.dataset.f === 'shd') b.cfg.shopt = 0;   // the shoulder workouts each have their own round options
    save(); if(t.dataset.f === 'shd') renderBuild();
  });
  $('bwClear').onclick = () => { list = []; save(); renderBuild(); };

  /* ---------- playing it ---------- */
  function runBlock(i){
    const b = chain.blocks[i];
    chain.i = i;
    applyParams(cal().params({type:b.type, cfg:b.cfg}));
    if(b.type === 'coach'){ if(!b.cfg.focus || !b.cfg.focus.length) state.focus = state.focus.size ? state.focus : new Set(['jab']); want3D(); }
    mode = b.type; state.label = '';
    start();
    if(chain.oneRound && ROUNDED.includes(b.type)){
      steps = steps.filter(x => x.type === 'ready' || (x.round === 1 && x.type !== 'rest'));   // one round, then straight on
      rounds = 1; $('pips').innerHTML = '<div class="pip"><i></i></div>'; listKey = ''; renderList(true);
    }
    if(i > 0 && steps[0] && steps[0].type === 'ready'){   // a break between blocks: the get-ready step runs long, and its last five seconds still count down
      const nm = way(b.type).name;
      Object.assign(steps[0], {dur:BREAK_SEC, name:'Break', cue:`Breathe and shake out. Next up, block ${i + 1} of ${chain.n}: ${nm}.`});
      listKey = ''; renderList(true); say(`Break. Next up, ${nm}.`, 600);
    }
    $('wTitle').textContent = `Block ${i + 1} of ${chain.n} · ${$('wTitle').textContent}`;
  }
  // play a list of blocks one after another. oneRound: each block is cut to a single round (the builder). single: the whole thing is logged and ticked off as one workout (a merged calendar workout).
  function run(blocks, o){
    if(!blocks || !blocks.length) return;
    o = o || {};
    window.bfBurn?.reset();
    chain.blocks = JSON.parse(JSON.stringify(blocks)); chain.n = chain.blocks.length; chain.mins = 0; chain.on = true; chain.single = !!o.single; chain.oneRound = o.oneRound !== false;
    runBlock(0);
  }
  $('bwStart').onclick = () => run(list, {oneRound:true, single:true});   // one workout, saved (and put on the calendar) once at the end
  window.bfBuild = {run, chainable:id => GROUPS.some(g => g[1].includes(id))};
  window.bfSaveOverride = () => chain.on && chain.single ? {type:'build', cfg:{blocks:chain.blocks}, minutes:chain.mins} : null;   // app.html's offerSave: one logged session for a merged workout
  // wrap the end of a workout: a block that isn't the last one logs itself and hands over to the next
  const endOne = finish;
  finish = function(){
    if(!chain.on) return endOne();
    const mins = Math.round(steps.reduce((n, s) => n + s.dur, 0) / 60);
    chain.mins += mins;   // the steps include the break before this block
    if(chain.i < chain.n - 1){
      if(!chain.single) window.sessionDone?.({type:mode, minutes:mins});
      running = false; cancelAnimationFrame(raf); try{ wake?.release(); }catch(e){} bgStop(); bell();
      runBlock(chain.i + 1);
      return;
    }
    const n = chain.n, total = chain.mins;
    endOne();
    chain.on = false;
    $('doneStats').innerHTML = `<div>${n}<span>Blocks</span></div><div>${total}<span>Minutes</span></div>`;
  };
  // leaving by any route other than the timer or the done screen ends the chain, so it can't carry on by surprise
  const showOne = show;
  show = function(id){ if(chain.on && id !== 'timer' && id !== 'done') chain.on = false; return showOne(id); };
  const exitOne = $('exitBtn').onclick;
  $('exitBtn').onclick = function(e){ const was = chain.on; exitOne.call(this, e); if(was) show('build'); };
  if(!$('build').hidden) renderBuild();   // opened straight from a link, before this file loaded
})();
