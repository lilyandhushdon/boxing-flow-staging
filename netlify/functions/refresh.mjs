// GET /api/refresh?to=/app.html
// The access cookie lasts 7 days. When it runs out, the gate sends the visitor here: if their subscription is
// still running they get a fresh cookie and carry on; if it has ended they go to the subscribe page.
import { stripe, readToken, tokenFrom, makeToken, setCookie, clearCookie, redirect, origin, safePath, OK_STATUS } from '../lib/access.mjs';

export default async (req) => {
  const site = origin(req);
  const to = safePath(new URL(req.url).searchParams.get('to'));
  const t = readToken(tokenFrom(req));
  if (!t) return redirect(`${site}/subscribe.html`, clearCookie());
  try {
    const sub = await stripe('GET', `/subscriptions/${t.s}`);
    if (OK_STATUS.has(sub.status)) return redirect(site + to, setCookie(makeToken(t.c, sub.id)));
    return redirect(`${site}/subscribe.html?ended=1`, clearCookie());
  } catch (e) {
    console.error('refresh', e);
    return redirect(`${site}/subscribe.html?problem=1`);
  }
};

export const config = { path: '/api/refresh' };
