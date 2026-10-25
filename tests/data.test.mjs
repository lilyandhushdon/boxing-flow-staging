// Stage 2a: the content data (quiz, scenarios, workouts, fighters) is complete and well formed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
// run a data file the way a browser would and return the named values it defines
const load = (file, names) => vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8') + `\n;({${names.join(',')}})`, { window: {} });
const text = (s) => typeof s === 'string' && s.trim().length > 0;

test('Boxing IQ: every question is complete', () => {
  const { IQ } = load('iq-questions.js', ['IQ']);
  assert.ok(IQ.length >= 12);
  const ids = new Set();
  for (const t of IQ) {
    assert.ok(text(t.id) && text(t.name) && text(t.desc), 'topic needs id, name and description'); assert.ok(!ids.has(t.id), `duplicate topic ${t.id}`); ids.add(t.id);
    assert.ok(t.q.length >= 4, `${t.name} has too few questions`);
    for (const [q, options, answer, why, difficulty] of t.q) {
      assert.ok(text(q), `${t.name}: a question is empty`);
      assert.equal(options.length, 4, `${t.name}: "${q.slice(0, 40)}..." needs 4 options`);
      assert.ok(options.every(text), `${t.name}: an option is empty`);
      assert.equal(new Set(options).size, 4, `${t.name}: two options are identical in "${q.slice(0, 40)}..."`);
      assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 4, `${t.name}: the answer index is out of range`);
      assert.ok(text(why), `${t.name}: "${q.slice(0, 40)}..." has no explanation`);
      assert.ok(['beginner', 'intermediate', 'advanced'].includes(difficulty), `${t.name}: "${q.slice(0, 40)}..." has the difficulty "${difficulty}"`);
    }
  }
});

test('Fight scenarios: every round has five phases of three coaching points', () => {
  const { SCENARIOS, SCEN_ENC, SCEN_OPTS } = load('scenarios.js', ['SCENARIOS', 'SCEN_ENC', 'SCEN_OPTS']);
  assert.ok(SCENARIOS.length >= 5);
  for (const s of SCENARIOS) {
    for (const k of ['name', 'blurb', 'opponent', 'mission', 'lesson']) assert.ok(text(s[k]), `${s.name}: missing ${k}`);
    assert.equal(s.rounds.length, 5, `${s.name} needs 5 rounds`);
    s.rounds.forEach((r, i) => {
      assert.ok(text(r.theme) && text(r.intro), `${s.name} round ${i + 1}: needs a theme and an intro`);
      assert.equal(r.phases.length, 5, `${s.name} round ${i + 1} needs 5 one-minute phases`);
      r.phases.forEach(([title, points], j) => { assert.ok(text(title), `${s.name} r${i + 1} p${j + 1}: no title`); assert.equal(points.length, 3, `${s.name} r${i + 1} p${j + 1}: needs 3 points`); assert.ok(points.every(text)); });
    });
  }
  assert.ok(SCEN_ENC.length >= 5 && SCEN_ENC.every(text));
  assert.ok(SCEN_OPTS.every((o) => o.r > 0 && o.m > 0));
});

test('Output rounds, plyometrics, shoulder conditioning and mental skills are complete', () => {
  const { OUTPUT, OUT_OPTS } = load('output.js', ['OUTPUT', 'OUT_OPTS']);
  assert.ok(OUTPUT.length >= 7 && OUTPUT.every((o) => o.punches > 0 && text(o.name)));
  assert.ok(OUT_OPTS.every((o) => o.r > 0 && o.m > 0));
  const { PLYO, PLYO_OPTS, PLYO_LIB } = load('plyo.js', ['PLYO', 'PLYO_OPTS', 'PLYO_LIB']);
  assert.ok(PLYO.length >= 4);
  for (const w of PLYO) {
    assert.ok(text(w.name) && text(w.blurb));
    // a workout lists its own exercises, or a plan: one named move library per round (a different set each round)
    if (w.plan && w.plan.length) { assert.ok(w.plan.length >= 4, `${w.name}: the plan is too short`); for (const key of w.plan) assert.ok(PLYO_LIB[key] && PLYO_LIB[key].length >= 3, `${w.name}: the plan uses the library "${key}" which is missing or too small`); }
    else { assert.ok(w.exercises.length >= 4, `${w.name} has too few exercises`); for (const e of w.exercises) assert.ok(e.length >= 2 && text(e[0]) && text(e[1])); }
  }
  for (const [key, moves] of Object.entries(PLYO_LIB)) for (const m of moves) assert.ok(text(m[0]) && text(m[1]), `library ${key} has an incomplete move`);
  assert.ok(PLYO_OPTS.every((o) => o.r > 0 && o.w > 0 && o.rs >= 0));
  const { SHOULDER, SHOULDER_OPTS } = load('shoulder.js', ['SHOULDER', 'SHOULDER_OPTS']);
  assert.ok(SHOULDER.length >= 2);
  for (const w of SHOULDER) {
    assert.ok(text(w.name) && text(w.blurb), 'a shoulder workout needs a name and a description');
    if (w.rounds) { assert.equal(w.rounds.length, 8, `${w.name} should have 8 rounds`); for (const r of w.rounds) assert.ok(text(r.name) && r.points.length >= 1 && r.points.every(text), `${w.name}: a round is incomplete`); }
    else assert.ok(w.moves.length > 0, `${w.name} has no moves`);
  }
  assert.ok(SHOULDER_OPTS.every((o) => o.r > 0 && o.m > 0));
  const { MIND, REFRAMES } = load('mind.js', ['MIND', 'REFRAMES']);
  assert.equal(new Set(MIND.map((m) => m.id)).size, MIND.length, 'duplicate mental skill ids');
  assert.ok(MIND.every((m) => text(m.id) && text(m.name) && text(m.blurb)));
  assert.ok(REFRAMES.length >= 6);
});

test('Film study fighters: every fight is a real-looking video from an official channel', () => {
  const w = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'fighters.js'), 'utf8'), { window: w });
  const list = w.FILM_FIGHTERS, official = new Set(['Top Rank Boxing', 'DAZN Boxing', 'Matchroom Boxing', 'Premier Boxing Champions', 'Golden Boy Boxing', 'Sky Sports Boxing', 'Ring Magazine', 'BOXXER']);
  assert.ok(list.length >= 40, 'the list should have at least 40 fighters');
  assert.equal(new Set(list.map((f) => f.name)).size, list.length, 'a fighter is listed twice');
  for (const f of list) {
    assert.ok(text(f.name)); assert.ok(f.fights.length >= 3, `${f.name} has fewer than 3 fights`);
    const ids = new Set();
    for (const [opponent, id, channel] of f.fights) {
      assert.ok(text(opponent), `${f.name}: a fight has no opponent`);
      assert.match(id, /^[\w-]{11}$/, `${f.name} vs ${opponent}: "${id}" is not a YouTube video id`);
      assert.ok(official.has(channel), `${f.name} vs ${opponent}: "${channel}" is not an approved official channel`);
      assert.ok(!ids.has(id), `${f.name}: the same video is listed twice (${id})`); ids.add(id);
    }
  }
});
