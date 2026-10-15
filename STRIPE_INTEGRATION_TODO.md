# Stripe Integration TODO

Boxing Flow already had a Stripe Checkout integration (hosted Checkout, subscriptions with a 7-day free trial). Only the parameters of the existing Checkout Session call were updated to match the Checkout Studio configuration. No new files, routes or dependencies were added.

## Values to Replace

None. The `sample_only` parameters already use real values, so they were kept as they were:

**Files containing these values:**
- [netlify/functions/checkout.mjs](netlify/functions/checkout.mjs)

| Field | Current Value | Notes |
|-------|--------------|-------|
| mode | `subscription` | Correct for the monthly/yearly plans. |
| success_url | `${site}/api/welcome?session_id={CHECKOUT_SESSION_ID}` | Real page; confirms the subscription and sets the access cookie. |
| cancel_url | `${site}/subscribe.html?cancelled=1` | Real page. |
| line_items[].price | `PRICE_MONTHLY` / `PRICE_YEARLY` env vars | Set these in Netlify to your real `price_...` IDs (see Setup). |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [netlify/functions/checkout.mjs](netlify/functions/checkout.mjs)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` (was `true`) |
| payment_method_collection | `always` |
| submit_type | `auto` |
| integration_identifier | `hosted_mobile_app_0002` |
| origin_context | `mobile_app` |

## Check before going live

- [ ] **`ui_mode` and API version.** This project doesn't use the Stripe SDK. It calls the REST API with `fetch` in [netlify/lib/access.mjs](netlify/lib/access.mjs) and sends no `Stripe-Version` header, so requests use your account's default API version (Developers → API version in the Dashboard). `hosted_page` is the value newer API versions expect; older versions (the ones that go with SDKs below 21.0.0) expect `hosted`. If test checkouts fail with an error about `ui_mode`, change it to `hosted` in [netlify/functions/checkout.mjs](netlify/functions/checkout.mjs).
- [ ] **Promotion codes are now off.** Checkout Studio set `allow_promotion_codes` to `false`, so customers can no longer enter promo codes. The README line "Promotion codes you create in Stripe can be entered at checkout" is now out of date. Set it back to `true` if you still want codes.
- [ ] **The 7-day trial was kept.** `subscription_data.trial_period_days` isn't part of the Checkout Studio configuration, but it was kept on purpose: `subscribe.html`, `index.html` and the README all promise a free week, and removing it would charge customers straight away. Change `TRIAL_DAYS` in [netlify/functions/checkout.mjs](netlify/functions/checkout.mjs) if you want a different length.
- [ ] **Run one test checkout** (below) to confirm Stripe accepts the new parameters (`submit_type`, `integration_identifier` and `origin_context` in particular) with subscription mode on your account.

## Setup

Environment variables (Netlify → Site configuration → Environment variables). Netlify functions read these on the server only, so none of them need a `VITE_` prefix (the project doesn't use Vite):

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) / `sk_live_...` (live) from https://dashboard.stripe.com/test/apikeys |
| `PRICE_MONTHLY` | Monthly recurring price ID (`price_...`) |
| `PRICE_YEARLY` | Yearly recurring price ID (`price_...`) |
| `ACCESS_SECRET` | Long random string (40+ characters) used to sign access cookies |

Dependencies: none. The code calls the Stripe REST API with `fetch`, so there's no package to install. Redeploy after you change any variable.

## Project structure

No new files were created apart from this one. The relevant existing files are:

```
subscribe.html                      plan picker → POST /api/checkout
netlify/functions/checkout.mjs      creates the Checkout Session (updated)
netlify/functions/welcome.mjs       success_url: verifies session, sets access cookie
netlify/functions/restore.mjs       restore access on a new device
netlify/functions/refresh.mjs       re-checks the subscription every 7 days
netlify/functions/portal.mjs        Stripe customer portal
netlify/edge-functions/gate.mjs     guards app.html
netlify/lib/access.mjs              Stripe REST helper + signed cookie
```

## How it works

1. The visitor picks a plan on `subscribe.html`, which sends a POST to `/api/checkout`.
2. `checkout.mjs` creates a hosted Checkout Session and returns `session.url`; the browser redirects to Stripe.
3. The customer enters a card (collected now, first charge after the 7-day trial).
4. Stripe redirects to `/api/welcome?session_id=...`, which confirms the subscription and sets the signed `bf_access` cookie.
5. `gate.mjs` lets them into `app.html`; `/api/refresh` re-checks with Stripe every 7 days.

## Testing

Use Test mode in the Stripe Dashboard with `sk_test_` keys and test price IDs.

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

Use any future expiry date, any CVC and any postcode. More cards: https://docs.stripe.com/testing

## Next steps

- **Products and prices:** change them in the Stripe Dashboard, then update `PRICE_MONTHLY`/`PRICE_YEARLY` and the price text in `subscribe.html` and `index.html`.
- **Fulfillment:** access is granted in `/api/welcome` and re-verified by `/api/refresh`. For instant reactions to cancellations or failed payments, consider adding a webhook for `customer.subscription.updated`/`deleted` (none exists today).
- **Order tracking:** subscriptions and invoices are visible in the Stripe Dashboard; customers manage theirs through the customer portal.
- **Go live:** repeat the setup with live keys and live price IDs, then redeploy.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
