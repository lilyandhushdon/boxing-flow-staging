// Checks that every video in the film study fighter list still allows embedding, using YouTube's own oEmbed check
// (200 = fine; 401 = embedding switched off; 404 = removed or private). Run weekly by .github/workflows/embeds.yml, or by hand: node check-embeds.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const w = {};
vm.runInNewContext(fs.readFileSync(path.resolve(import.meta.dirname, '../fighters.js'), 'utf8'), { window: w });
const fights = w.FILM_FIGHTERS.flatMap((f) => f.fights.map(([opponent, id, channel]) => ({ who: `${f.name} vs ${opponent}`, id, channel })));
const unique = [...new Map(fights.map((f) => [f.id, f])).values()];
console.log(`Checking ${unique.length} videos (${fights.length} fights, ${w.FILM_FIGHTERS.length} fighters)...`);

async function check(v, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`, { signal: AbortSignal.timeout(15000) });
      if (r.status === 200 || r.status === 401 || r.status === 404) return r.status;   // a real answer
      if (i === tries) return r.status;
    } catch (e) { if (i === tries) return 'network error: ' + e.message; }
    await new Promise((res) => setTimeout(res, 1500 * i));
  }
}

const bad = [], queue = [...unique];
await Promise.all(Array.from({ length: 6 }, async () => { for (let v; (v = queue.shift());) { const s = await check(v); if (s !== 200) bad.push({ ...v, status: s }); } }));

if (!bad.length) { console.log('All videos still allow embedding.'); process.exit(0); }
console.error(`\n${bad.length} video(s) can no longer be used. Remove or replace these lines in fighters.js:\n`);
for (const b of bad) {
  const all = fights.filter((f) => f.id === b.id).map((f) => f.who).join('; ');
  console.error(`  ${b.id}  [${b.status === 401 ? 'embedding turned off' : b.status === 404 ? 'removed or private' : b.status}]  ${all}  (${b.channel})`);
}
process.exit(1);
