// Stage 1: the code and the repository are in good shape (no app needs to run for these).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execSync, spawnSync } from 'node:child_process';

export const root = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const rootJs = fs.readdirSync(root).filter((f) => f.endsWith('.js'));
const functions = fs.readdirSync(path.join(root, 'netlify/functions')).filter((f) => f.endsWith('.mjs')).map((f) => 'netlify/functions/' + f);

function trackedFiles() {
  try { return execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean); }
  catch { // not a git checkout: walk the folder instead
    const out = [], walk = (d) => { for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      if (['.git', 'node_modules', '.netlify'].includes(e.name)) continue;
      const p = path.posix.join(d, e.name); e.isDirectory() ? walk(p) : out.push(p); } };
    walk('.'); return out.map((p) => p.replace(/^\.\//, ''));
  }
}
const inlineScripts = (html) => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter((m) => !/\ssrc=/.test(m[1]) && !/type="(importmap|application\/json)"/.test(m[1]))
  .map((m, i) => ({ i, module: /type="module"/.test(m[1]), code: m[2] }));
const nodeCheck = (code, ext) => {
  const f = path.join(os.tmpdir(), `bf-check-${process.pid}-${Math.random().toString(36).slice(2)}.${ext}`);
  fs.writeFileSync(f, code); const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); fs.unlinkSync(f); return r;
};

test('every script file parses', () => {
  assert.ok(rootJs.length > 10, 'expected the app scripts to be found');
  for (const f of rootJs) assert.doesNotThrow(() => new vm.Script(read(f), { filename: f }), `${f} has a syntax error`);
});

test('every inline script in the pages parses', () => {
  for (const page of ['app.html', 'index.html', 'subscribe.html']) {
    for (const s of inlineScripts(read(page))) {
      const r = nodeCheck(s.code, s.module ? 'mjs' : 'js');
      assert.equal(r.status, 0, `inline script ${s.i} in ${page} has a syntax error:\n${r.stderr}`);
    }
  }
});

test('every Netlify function parses', () => {
  assert.ok(functions.includes('netlify/functions/foods.mjs'));
  for (const f of functions) { const r = spawnSync(process.execPath, ['--check', path.join(root, f)], { encoding: 'utf8' }); assert.equal(r.status, 0, `${f}:\n${r.stderr}`); }
});

test('pages have no duplicate element ids', () => {
  for (const page of ['app.html', 'index.html']) {
    const ids = [...read(page).matchAll(/\sid="([^"$]+)"/g)].map((m) => m[1]), seen = new Set(), dup = new Set();
    for (const id of ids) seen.has(id) ? dup.add(id) : seen.add(id);
    assert.deepEqual([...dup], [], `${page} repeats these ids: ${[...dup].join(', ')}`);
  }
});

test('app.html loads scripts that exist, in an order that works', () => {
  const src = [...read('app.html').matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  for (const s of src) assert.ok(fs.existsSync(path.join(root, s)), `app.html loads ${s} but it does not exist`);
  const before = (a, b) => assert.ok(src.indexOf(a) >= 0 && src.indexOf(b) >= 0 && src.indexOf(a) < src.indexOf(b), `${a} must load before ${b}`);
  before('supabase-config.js', 'cloud.js');
  before('cloud.js', 'iq-questions.js');   // the sync layer must see every save, so it loads first
  before('drag.js', 'calendar.js'); before('calendar.js', 'camp.js'); before('calendar.js', 'nutrition.js');
  before('cloud.js', 'nutrition.js'); before('fighters.js', 'film.js');
  for (const dep of ['calendar.js', 'camp.js', 'nutrition.js', 'film.js', 'drag.js']) before(dep, 'home.js');
});

test('every menu and landing page link goes somewhere the router knows', () => {
  const app = read('app.html');
  const sections = (app.match(/const sections=\{([^}]+)\}/) || [])[1] || '';
  const known = new Set([...sections.matchAll(/(\w+):/g)].map((m) => m[1]));
  const modes = (app.match(/\['coach','basic','timer','scenario'[^\]]*\]/) || [''])[0];
  for (const m of modes.matchAll(/'(\w+)'/g)) known.add(m[1]);
  assert.ok(known.size > 15, 'could not read the router in app.html');
  for (const m of app.matchAll(/data-go="(\w+)"/g)) assert.ok(known.has(m[1]), `the menu has data-go="${m[1]}" but route() does not handle it`);
  for (const m of read('index.html').matchAll(/app\.html\?go=(\w+)/g)) assert.ok(known.has(m[1]), `the landing page links to ?go=${m[1]} which route() does not handle`);
});

test('no secrets are committed', () => {
  const files = trackedFiles();
  assert.ok(!files.includes('.env'), '.env must never be committed');
  const skip = /\.(png|jpe?g|glb|fbx|mp3|wav|ico|webp|gif|woff2?)$/i;
  const patterns = [[/sk_(live|test)_[A-Za-z0-9]{10,}/, 'a Stripe secret key'], [/whsec_[A-Za-z0-9]{10,}/, 'a Stripe webhook secret'], [/sb_secret_[A-Za-z0-9_-]{10,}/, 'a Supabase secret key'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'], [/SUPABASE_(SERVICE_ROLE_KEY|DB_PASSWORD)\s*=\s*\S{8,}/, 'a Supabase secret setting']];
  for (const f of files) {
    if (skip.test(f) || !fs.existsSync(path.join(root, f))) continue;
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    for (const [re, what] of patterns) assert.ok(!re.test(t), `${f} contains ${what}`);
    for (const j of t.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || []) {
      let role; try { role = JSON.parse(Buffer.from(j.split('.')[1], 'base64url').toString()).role; } catch { continue; }
      assert.notEqual(role, 'service_role', `${f} contains a Supabase service_role key`);   // the anon (public) key is allowed
    }
  }
});

test('database migrations are ordered and every table is protected', () => {
  const dir = path.join(root, 'supabase/migrations'), files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(files.length >= 2);
  const stamps = files.map((f) => { assert.match(f, /^\d{14}_[a-z0-9_]+\.sql$/, `bad migration name ${f}`); return f.slice(0, 14); });
  assert.equal(new Set(stamps).size, stamps.length, 'two migrations share a timestamp');
  const sql = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  for (const [, t] of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)) {
    assert.match(sql, new RegExp(`alter table public\\.${t}\\s+enable row level security`, 'i'), `table ${t} has no row level security`);
    assert.match(sql, new RegExp(`create policy[^;]*on public\\.${t}\\b`, 'i'), `table ${t} has no policy`);
    assert.match(sql, new RegExp(`user_id[^,]*references auth\\.users`, 'i'));
  }
});

test('the documentation stays in step with the code', () => {
  const docs = read('docs/index.html'), ids = new Set([...docs.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of docs.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]), `docs link to #${m[1]} which does not exist`);
  // every key the app saves on the device must be listed in the docs
  const keys = new Set(), files = [...rootJs, 'app.html'];
  for (const f of files) {
    const t = read(f);
    for (const m of t.matchAll(/(?:KEY|LKEY|GKEY|OKEY|INFO_KEY|CACHE|META)\s*=\s*'(bf[\w-]*)'/g)) keys.add(m[1]);
    for (const m of t.matchAll(/localStorage\.(?:get|set|remove)Item\(\s*'(bf[\w-]*)'/g)) keys.add(m[1]);
  }
  assert.ok(keys.size >= 8, 'expected to find the saved keys in the code');
  for (const k of keys) assert.ok(docs.includes(`<code>${k}</code>`), `the code saves "${k}" but docs/index.html does not list it (section 6)`);
});

test('the live site refuses to serve private files', () => {
  // the whole folder is published, so netlify.toml must answer 404 for anything that is not part of the website (a deploy from this folder would upload .env too)
  const toml = read('netlify.toml');
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const p of ['/.env', '/docs/*', '/tests/*', '/supabase/*', '/netlify/*', '/.github/*']) {
    const block = new RegExp(`from = "${escape(p)}"\\s+to = "/404.html"\\s+status = 404\\s+force = true`);
    assert.match(toml, block, `netlify.toml must hide ${p} with a forced 404`);
  }
});
