// GET /api/portal
// Opens Stripe's customer portal, where subscribers change plan, update their card, see invoices or cancel.
import { stripe, readToken, tokenFrom, redirect, origin } from '../lib/access.mjs';

export default async (req) => {
  const site = origin(req);
  const t = readToken(tokenFrom(req));
  if (!t) return redirect(`${site}/subscribe.html`);
  try {
    const p = await stripe('POST', '/billing_portal/sessions', { customer: t.c, return_url: `${site}/app.html` });
    return redirect(p.url);
  } catch (e) {
    console.error('portal', e);
    return redirect(`${site}/app.html?portal=unavailable`);
  }
};

export const config = { path: '/api/portal' };
