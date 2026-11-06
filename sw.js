/* Boxing Flow service worker: lets the app install on a phone and open with no internet.
   Code (pages and scripts) is fetched from the network first so a new version is picked up whenever there is a connection, and falls back to the saved copy offline.
   Everything else (fonts, the 3D library, models, images) is saved the first time it is used and read from the saved copy after that.
   Audio is streamed in ranges, which cannot be saved, so music and crowd sound need a connection unless the browser already holds them. Bump VERSION to drop old copies. */
const VERSION = 'bf-v1', CORE = ["app.html", "index.html", "logo-512.png", "manifest.webmanifest", "abs.js", "builder.js", "burn.js", "calendar.js", "camp.js", "cloud.js", "drag.js", "fightday.js", "fighters.js", "figures.js", "film.js", "flow.js", "gate.js", "home.js", "hr.js", "iq-questions.js", "mind.js", "mindwork.js", "neck.js", "nutrition.js", "output.js", "peak.js", "plyo.js", "prep.js", "profile.js", "recovery.js", "run.js", "scenarios.js", "scoring.js", "shoulder.js", "supabase-config.js", "treadmill.js", "watercut.js", "weight.js"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if(r.method !== 'GET' || r.headers.has('range') || u.pathname.startsWith('/api/') || u.pathname.startsWith('/.netlify/') || /supabase\.co$/.test(u.hostname)) return;
  const code = r.mode === 'navigate' || (u.origin === location.origin && /\.(html|js|webmanifest)$|\/$/.test(u.pathname));
  const keep = res => { if(res && (res.ok || res.type === 'opaque')){ const c = res.clone(); caches.open(VERSION).then(x => x.put(r, c)).catch(() => {}); } return res; };
  if(code) e.respondWith(fetch(r).then(keep).catch(() => caches.match(r, {ignoreSearch:true}).then(m => m || (r.mode === 'navigate' ? caches.match('app.html') : Response.error()))));
  else e.respondWith(caches.match(r).then(m => m || fetch(r).then(keep)));
});
