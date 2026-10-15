// The gate in front of the workout app. Runs on Netlify's edge before app.html is sent.
//   good, unexpired access cookie  -> the app
//   good cookie, older than 7 days -> /api/refresh (checks the subscription with Stripe, then back to the app)
//   anything else                  -> the subscribe page
// The cookie format matches netlify/lib/access.mjs: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
const enc = new TextEncoder();
const fromB64u = s => {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
};

async function readToken(t, secret) {
  if (!t || !secret || !t.includes('.')) return null;
  const [p, s] = t.split('.');
  try {
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, fromB64u(s), enc.encode(p)))) return null;
    return JSON.parse(new TextDecoder().decode(fromB64u(p)));
  } catch { return null; }
}

export default async (request, context) => {
  const url = new URL(request.url);
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)bf_access=([^;]+)/);
  const secret = globalThis.Netlify?.env?.get('ACCESS_SECRET');
  if (m) {
    const t = await readToken(decodeURIComponent(m[1]), secret);
    if (t && t.exp > Date.now() / 1000) return context.next();
    if (t) return Response.redirect(new URL('/api/refresh?to=' + encodeURIComponent(url.pathname), url), 302);
  }
  return Response.redirect(new URL('/subscribe.html', url), 302);
};

export const config = { path: ['/app.html', '/app'] };
