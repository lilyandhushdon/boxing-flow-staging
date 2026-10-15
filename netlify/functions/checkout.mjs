// POST /api/checkout  { plan: "monthly" | "yearly" }
// Starts a Stripe Checkout for the chosen plan with a 7-day free trial (card collected now, first charge after the trial).
import { stripe, json, origin } from '../lib/access.mjs';

const TRIAL_DAYS = 7;

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  let plan = 'yearly';
  try { plan = (await req.json()).plan; } catch {}
  const price = plan === 'monthly' ? process.env.PRICE_MONTHLY : plan === 'yearly' ? process.env.PRICE_YEARLY : null;
  if (!price) return json({ error: 'Unknown plan' }, 400);
  const site = origin(req);
  try {
    const session = await stripe('POST', '/checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      payment_method_collection: 'always',
      allow_promotion_codes: 'true',
      billing_address_collection: 'auto',
      success_url: `${site}/api/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/subscribe.html?cancelled=1`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout', e);
    return json({ error: 'Could not start checkout. Please try again.' }, 502);
  }
};

export const config = { path: '/api/checkout' };
