// POST /api/checkout  { plan: "monthly" | "yearly" }  -> { url }   (the subscribe page)
// GET  /api/checkout?plan=yearly                       -> straight to Stripe   (links on the home page)
// Starts a Stripe Checkout for the chosen plan with a 7-day free trial (card collected now, first charge after the trial).
import { stripe, json, origin, redirect, readToken, tokenFrom } from '../lib/access.mjs';

const TRIAL_DAYS = 7;

export default async (req) => {
  const link = req.method === 'GET';
  if (!link && req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const site = origin(req);
  let plan = 'yearly';
  if (link) {
    // already subscribed on this browser: no second checkout, just open the app
    const t = readToken(tokenFrom(req));
    if (t && t.exp > Date.now() / 1000) return redirect(`${site}/app.html`);
    plan = new URL(req.url).searchParams.get('plan') || 'yearly';
  } else {
    try { plan = (await req.json()).plan; } catch {}
  }
  const price = plan === 'monthly' ? process.env.PRICE_MONTHLY : plan === 'yearly' ? process.env.PRICE_YEARLY : null;
  if (!price) return link ? redirect(`${site}/subscribe.html`) : json({ error: 'Unknown plan' }, 400);
  try {
    const session = await stripe('POST', '/checkout/sessions', {
      ui_mode: 'hosted_page',
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      payment_method_collection: 'always',
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      submit_type: 'auto',
      integration_identifier: 'hosted_mobile_app_0002',
      origin_context: 'mobile_app',
      success_url: `${site}/api/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/subscribe.html?cancelled=1`,
    });
    return link ? redirect(session.url) : json({ url: session.url });
  } catch (e) {
    console.error('checkout', e);
    if (link) return redirect(`${site}/subscribe.html`);   // fall back to the plan page, which shows errors
    return json({ error: 'Could not start checkout. Please try again.' }, 502);
  }
};

export const config = { path: '/api/checkout' };
