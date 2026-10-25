# Boxing Flow

Boxing round timer and coach.

- `index.html`: home page (free to everyone, with the live preview and pricing)
- `app.html`: the app (dashboard, workouts, calendar, training camp, nutrition, film study, heart rate). Open to anyone while payments are paused (see Payments below)
- `docs/index.html`: **the full project documentation**: architecture, every feature, the data and sync, services, how to run and deploy, the testing plan and the roadmap. Start there. Keep it updated with each change
- `cloud.js`, `nutrition.js`, `film.js`, `home.js` and the other `.js` files: the app's features, one file each (see the repository map in the docs)
- `supabase/`: the database (migrations) and sign-in settings; `netlify/functions/foods.mjs`: the food search
- `subscribe.html`: the paywall: monthly or yearly plan, 7-day free trial
- `netlify/`: the payment code that runs on Netlify (Stripe checkout, access checks)
- `models/`: the 3D coaches (`coach.glb`, black and gold; `coach-her.glb`, black and gold, picked with the coach button in interactive mode; `coach-lite.glb`, a lighter copy for the landing page preview) and their moves (Mixamo, all orthodox)
- `music/` and `crowd/`: audio the app plays

## What the coach shows (single source of truth)

Two tables in `app.html` decide everything, and nothing else picks files:

1. **The drill list (`FOCUS`)**: every drill lists its own moves, in order, plus an optional speed. Example: `['Jab, Jab, Cross', '...', ['jab','jab','cross']]`.
2. **The move library (`MOVE_LIBRARY`)**: every move names the one file that shows it (below).

To change a drill, edit its moves in the drill list. To change how a move looks, edit its file in the move library. Nothing is ever mirrored (a mirrored clip would be southpaw).

| Move | File in `models/` |
|---|---|
| Stance between moves | `stance.fbx` |
| Jab | `jab.fbx` |
| Cross (straight right) | `cross-straight-right.fbx` |
| Lead hook (the 3) | `hook-lead.fbx` |
| Lead uppercut | `uppercut-lead.fbx` |
| Rear hook | `body-hook-rear.fbx` (no rear head-hook file yet) |
| Rear uppercut | `body-uppercut-rear.fbx` (no rear head-uppercut file yet) |
| Jab to the body | `jab.fbx`, knees bent so it lands low |
| Cross to the body | `cross-straight-right.fbx`, knees bent |
| Lead hook to the body | `body-hook-lead.fbx` |
| Rear hook to the body | `body-hook-rear.fbx` |
| Uppercut to the body | `body-uppercut-rear.fbx` |
| 1-2 | `combo-1-2.fbx` (whole) |
| 1-2-1-2 | `combo-1-2-1-2.fbx` (whole) |
| Body jab-cross | `body-jab-cross.fbx` (whole) |
| Slip left | `slip-left.fbx` |
| Step back / step out / pull back | `step-back.fbx` |
| Pivot | `pivot-right.fbx` |
| Switch | `pivot-left.fbx` |
| Slip right, roll, high guard, catch, parry, lateral shuffle, squat | built in code (no file) |

## Publish on GitHub Pages

1. Upload everything in this folder to the root of a GitHub repository.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repository-name>/`.

3D coach animations from Mixamo. Music: "No Turning Back" by BearStockMusic, "Not My First Rodeo" by 331music, "Gym Music" by Gr0za. Crowd sound by u_xg7ssi08yr.


## Payments (Stripe + Netlify)

> **Paused since 16 Oct 2026.** The paywall (the edge gate, pricing and sign-up buttons) was removed so the app is open while more features are built. The code below is still in the repo; commit `1f140a1` has the whole working paywall. The notes that follow describe how it worked and how to switch it back on.

Visitors get the home page and live preview for free. Opening the app needs a subscription: NZ$9.99 a month or NZ$69.99 a year, each with a 7-day free trial (card taken at sign-up, first charge when the trial ends).

How it works:

1. `subscribe.html` sends the chosen plan to `/api/checkout`, which opens Stripe Checkout.
2. After paying, Stripe sends them to `/api/welcome`, which confirms the subscription with Stripe and gives the browser a signed access cookie.
3. `netlify/edge-functions/gate.mjs` checks that cookie before `app.html` is sent. No cookie, a fake one, or a cancelled subscription goes to the subscribe page. The cookie is re-checked with Stripe every 7 days (`/api/refresh`), so cancelled subscriptions stop working within a week of ending.
4. On a new phone or browser, subscribers use "Already subscribed?" on the subscribe page: their email plus the last four digits of their card (`/api/restore`).
5. "Manage subscription" in the app opens Stripe's customer portal (`/api/portal`) to change plan, update the card or cancel.

### Set it up (about 30 minutes)

Do everything in Stripe's **Test mode** first (the toggle at the top of the Stripe dashboard), then repeat steps 2 to 4 in live mode when you're ready to take real money.

1. **Create a Stripe account** at stripe.com with your New Zealand business and bank details.
2. **Create the product.** Product catalogue → Add product → name it "Boxing Flow". Add two recurring prices in NZD: NZ$9.99 monthly and NZ$69.99 yearly. Copy each price's ID (it starts with `price_`).
3. **Turn on the customer portal.** Settings → Billing → Customer portal → allow customers to cancel, switch plans and update payment methods → Save.
4. **Copy your secret key.** Developers → API keys → Secret key (starts with `sk_test_` in test mode, `sk_live_` in live mode).
5. **Put the site on Netlify.** Push this folder to a GitHub repository, then in Netlify: Add new site → Import an existing project → GitHub → pick the repository. Leave the build command empty and the publish directory as `.` (netlify.toml sets this).
6. **Add the settings.** In Netlify: Site configuration → Environment variables → add:
   - `STRIPE_SECRET_KEY`: the secret key from step 4
   - `PRICE_MONTHLY`: the monthly price ID
   - `PRICE_YEARLY`: the yearly price ID
   - `ACCESS_SECRET`: any long random string (40+ characters). It signs the access cookies; keep it private.
   Then Deploys → Trigger deploy.
7. **Test it.** Open your Netlify address, click Start your free week, and pay with Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). You should land in the app. Try "Manage subscription", cancel, and check the subscribe page comes back once the cancellation takes effect.
8. **Go live.** In Stripe, switch off Test mode, repeat steps 2 to 4 for live, put the live key and live price IDs into Netlify, and redeploy.

### Changing prices

The amounts charged are the Stripe prices. The amounts shown are text in `subscribe.html` and the Pricing section of `index.html`; update both if you change prices in Stripe.

### Good to know

- Never put the secret key in any page or commit it to GitHub. It only lives in Netlify's environment variables.
- The 7-day trial length is `TRIAL_DAYS` in `netlify/functions/checkout.mjs`.
- Promotion codes you create in Stripe can be entered at checkout.
- Before going live, Stripe will ask for your business details, and your site should show terms and a refund policy.
