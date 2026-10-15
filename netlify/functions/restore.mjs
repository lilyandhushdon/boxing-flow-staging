// POST /api/restore  { email, last4 }
// For subscribers on a new phone or browser: the email they paid with plus the last four digits of the card
// on their subscription. If both match a running subscription, they get the access cookie on this device.
import { stripe, makeToken, setCookie, json, OK_STATUS } from '../lib/access.mjs';

const pause = ms => new Promise(r => setTimeout(r, ms));

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  let email = '', last4 = '';
  try { ({ email = '', last4 = '' } = await req.json()); } catch {}
  email = String(email).trim().toLowerCase(); last4 = String(last4).replace(/\D/g, '');
  const fail = async () => { await pause(900); return json({ error: "We couldn't find a subscription with that email and card." }, 404); };   // slow down guessing
  if (!/^\S+@\S+\.\S+$/.test(email) || last4.length !== 4) return fail();
  try {
    const customers = await stripe('GET', '/customers', { email, limit: 10 });
    for (const c of customers.data) {
      const subs = await stripe('GET', '/subscriptions', { customer: c.id, status: 'all', limit: 10 });
      const sub = subs.data.find(s => OK_STATUS.has(s.status));
      if (!sub) continue;
      const cards = await stripe('GET', `/customers/${c.id}/payment_methods`, { type: 'card', limit: 10 });
      if (cards.data.some(pm => pm.card && pm.card.last4 === last4)) {
        return json({ ok: true }, 200, setCookie(makeToken(c.id, sub.id)));
      }
    }
  } catch (e) {
    console.error('restore', e);
    return json({ error: 'Something went wrong. Please try again.' }, 502);
  }
  return fail();
};

export const config = { path: '/api/restore' };
