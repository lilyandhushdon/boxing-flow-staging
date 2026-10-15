// GET /api/welcome?session_id=...
// Where Stripe sends people after checkout. Confirms the subscription with Stripe, gives them the access cookie,
// and takes them into the app.
import { stripe, makeToken, setCookie, redirect, origin, OK_STATUS } from '../lib/access.mjs';

export default async (req) => {
  const site = origin(req);
  const id = new URL(req.url).searchParams.get('session_id');
  if (!id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return redirect(`${site}/subscribe.html`);
  try {
    const s = await stripe('GET', `/checkout/sessions/${id}`, { expand: ['subscription'] });
    const sub = s.subscription;
    if (s.status === 'complete' && sub && OK_STATUS.has(sub.status)) {
      return redirect(`${site}/app.html?welcome=1`, setCookie(makeToken(s.customer, sub.id)));
    }
  } catch (e) { console.error('welcome', e); }
  return redirect(`${site}/subscribe.html?problem=1`);
};

export const config = { path: '/api/welcome' };
