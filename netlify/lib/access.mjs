// Shared by the Netlify functions: talking to Stripe, and the signed access cookie.
//
// The cookie holds { c: Stripe customer id, s: subscription id, exp: seconds } signed with ACCESS_SECRET,
// so nobody can make one without the secret. It is good for 7 days; after that the gate sends the visitor
// through /api/refresh, which asks Stripe whether the subscription is still running and signs a new one.
// The edge function (netlify/edge-functions/gate.mjs) checks the same format with Web Crypto.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'bf_access';
export const TOKEN_DAYS = 7;
export const OK_STATUS = new Set(['trialing', 'active', 'past_due']);   // past_due: Stripe is still retrying the card

const env = k => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing environment variable ${k}`);
  return v;
};

// ---- Stripe REST API, no library needed ----
export async function stripe(method, path, params) {
  let url = 'https://api.stripe.com/v1' + path, body;
  if (params) {
    const q = new URLSearchParams(); flatten(params, '', q);
    if (method === 'GET') url += '?' + q; else body = q;
  }
  const r = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + env('STRIPE_SECRET_KEY'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Stripe error ${r.status}`);
  return j;
}
function flatten(o, prefix, q) {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? flatten(x, `${key}[${i}]`, q) : q.append(`${key}[${i}]`, String(x))));
    else if (typeof v === 'object') flatten(v, key, q);
    else q.append(key, String(v));
  }
}

// ---- the signed access token ----
const sign = p => createHmac('sha256', env('ACCESS_SECRET')).update(p).digest('base64url');
export function makeToken(customer, subscription) {
  const p = Buffer.from(JSON.stringify({ c: customer, s: subscription, exp: Math.floor(Date.now() / 1000) + TOKEN_DAYS * 86400 })).toString('base64url');
  return p + '.' + sign(p);
}
// returns the payload if the signature is good (expired or not), otherwise null
export function readToken(t) {
  if (!t || typeof t !== 'string' || !t.includes('.')) return null;
  const [p, s] = t.split('.');
  const want = Buffer.from(sign(p)), got = Buffer.from(s || '');
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
}
export function tokenFrom(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
export const setCookie = token => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export const origin = req => new URL(req.url).origin;
export const redirect = (to, cookie) => {
  const h = new Headers({ Location: to, 'Cache-Control': 'no-store' });
  if (cookie) h.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers: h });
};
export const json = (data, status = 200, cookie) => {
  const h = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  if (cookie) h.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers: h });
};
// only send people back to pages on this site
export const safePath = p => (typeof p === 'string' && /^\/[A-Za-z0-9_\-./]*$/.test(p) && !p.startsWith('//') ? p : '/app.html');
