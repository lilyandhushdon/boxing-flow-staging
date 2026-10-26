// Stage 4: the app in a real (phone-sized) browser. Fast checks that every screen opens and the main journeys work.
import { test, expect } from '@playwright/test';
import { open, visibleScreens, expectNoErrors } from './helpers.mjs';

const links = [
  ['dashboard', 'today'], ['explore', 'home'], ['boxing', 'modes'], ['strength', 'sc'], ['mind', 'mind'], ['calendar', 'cal'], ['camp', 'camp'], ['film', 'film'],
  ['nutrition', 'nutrition'], ['hr', 'hr'], ['coach', 'setup'], ['basic', 'plainSetup'], ['timer', 'plainSetup'], ['scenario', 'plainSetup'], ['output', 'plainSetup'],
  ['plyo', 'plainSetup'], ['shoulder', 'plainSetup'], ['treadmill', 'plainSetup'], ['recovery', 'plainSetup'], ['iq', 'iq'], ['breath', 'breath'], ['reframe', 'reframe'],
];

for (const [go, screen] of links) {
  test(`deep link ?go=${go} opens the ${screen} screen without errors`, async ({ page }) => {
    const errors = await open(page, `/app.html?go=${go}`);
    await expect.poll(() => visibleScreens(page)).toEqual([screen]);
    await expectNoErrors(errors, `?go=${go}`);
  });
}

test('the main screens do not scroll sideways on a phone', async ({ page }) => {
  await open(page, '/app.html');
  for (const s of ['today', 'home', 'modes', 'sc', 'mind', 'cal', 'camp', 'nutrition', 'film', 'hr']) {
    await page.evaluate((id) => window.show(id), s);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(wide, `${s} is ${wide}px wider than the screen`).toBeLessThanOrEqual(1);
  }
});

test('the dashboard shows every widget, the fight countdown, and the live channel only on request', async ({ page }) => {
  const errors = await open(page, '/app.html');
  for (const w of ['today', 'weight', 'camp', 'nutri', 'quick', 'live', 'film', 'minical', 'week', 'progress', 'suggest', 'explore']) await expect(page.locator(`[data-w="${w}"]`), `widget ${w}`).toBeVisible();
  await expect(page.locator('#tHead .streak:not(.weightb)')).toContainText(/days? (of camp left|to fight)/i);
  await expect(page.locator('#tHead .weightb')).toBeVisible();   // the weight badge beside the countdown
  await expect(page.locator('[data-w="camp"]')).toContainText('Base');
  await expect(page.locator('[data-w="film"]')).toContainText('Fight to study');
  await expect(page.locator('[data-w="nutri"]')).toContainText('Sign in to start');
  await expect(page.locator('[data-w="live"] iframe')).toHaveCount(0);   // nothing streams until it is asked for
  await page.locator('[data-live-on]').click();
  await expect(page.locator('[data-w="live"] iframe')).toHaveCount(1);
  await page.evaluate(() => window.show('modes'));
  await page.evaluate(() => window.show('today'));
  await expect(page.locator('[data-w="live"] iframe')).toHaveCount(0);   // leaving the dashboard stops it
  await expectNoErrors(errors);
});

test('the training camp starts by itself, can be changed, and remembers ticks', async ({ page }) => {
  const errors = await open(page, '/app.html?go=camp');
  await expect(page.locator('#campBody')).toContainText('starter 8-week camp');
  await expect(page.locator('#campBody .info-card')).toBeVisible();          // the explainer opens the first time...
  await page.locator('[data-info-close]').first().click();
  await expect(page.locator('#campBody .info-bar')).toBeVisible();           // ...then folds into one bar
  await page.locator('[data-change]').click(); await page.locator('[data-len="12"]').click(); await page.locator('#cApply').click();
  await expect(page.locator('#campBody')).toContainText('12 weeks');
  await page.locator('.ph.open .tk .ck').first().click();                    // tick a task
  await page.reload();
  await expect(page.locator('.ph.open .tk .ck.on').first()).toBeVisible();   // still ticked after a reload
  await expect(page.locator('#campBody .info-bar')).toBeVisible();          // and the explainer stays folded
  await expectNoErrors(errors);
});

test('film study: paste a link, pause to write a note, keep it, and study a fighter', async ({ page }) => {
  const errors = await open(page, '/app.html?go=film');
  await expect(page.locator('.fs-fighter')).toHaveCount(45);
  await page.locator('#fsUrl').fill('https://youtu.be/dQw4w9WgXcQ?t=90'); await page.locator('#fsForm button').click();
  await expect(page.locator('#fsTitle')).toHaveText('A very long YouTube title | FULL FIGHT');
  expect(await page.evaluate(() => window.__ytOpts.playerVars.start)).toBe(90);        // the start time in the link is used
  await page.evaluate(() => { __yt.time = 134; __yt.state = 2; __ytEvents.onStateChange({ data: 2 }); });   // the person pauses at 2:14
  await expect(page.locator('.fs-draft label')).toContainText('Note at 2:14');
  await page.locator('#fsText').fill('He drops his right hand after the jab'); await page.locator('[data-fs-save]').click();
  await expect(page.locator('.fs-note')).toContainText('He drops his right hand after the jab');
  await page.locator('#fsTake').fill('Watch the lead hand');
  await page.reload();
  await page.locator('[data-fs-open]').first().click();
  await expect(page.locator('.fs-note .fs-tx')).toHaveText('He drops his right hand after the jab');   // saved
  await expect(page.locator('#fsTake')).toHaveValue('Watch the lead hand');
  await page.locator('[data-fs-lib]').click();
  await page.locator('[data-fs-fighter="Terence Crawford"]').click();
  await page.locator('[data-fs-fight="0"]').click();
  await expect(page.locator('#fsTitle')).toHaveText('Terence Crawford vs Shawn Porter');
  expect(await page.evaluate(() => window.__ytOpts.videoId)).toBe('zKZSjHTt9lc');
  await expectNoErrors(errors);
});

test('nutrition asks for sign-in (password first), and the sign-in email request goes out', async ({ page }) => {
  const errors = await open(page, '/app.html?go=nutrition');
  await expect(page.locator('#nuPass')).toBeVisible();
  await expect(page.locator('#nutriBody')).toContainText('Create account');
  await page.locator('[data-nu-mode="link"]').click();
  await expect(page.locator('#nutriBody')).toContainText('Email me a sign-in link');
  await page.locator('#nuEmail').fill('boxer@example.com'); await page.locator('#nuSignIn button[type="submit"]').click();
  await expect(page.locator('#nutriBody')).toContainText('Check your inbox for boxer@example.com');
  expect(await page.evaluate(() => window.__otpEmail)).toBe('boxer@example.com');
  await expectNoErrors(errors);
});

test('a basic workout starts and the round timer runs', async ({ page }) => {
  const errors = await open(page, '/app.html?go=timer');
  await page.locator('#buildBtn').click();
  await expect.poll(() => visibleScreens(page)).toEqual(['timer']);
  await expect(page.locator('#rTime')).toHaveText(/^\d\d:\d\d$/);
  await expectNoErrors(errors);
});

test('a recovery session lists its benefits, starts, and calls the first move', async ({ page }) => {
  const errors = await open(page, '/app.html?go=recovery&rec=1');
  await expect(page.locator('#scenBrief')).toContainText('What it does for a boxer');
  await expect(page.locator('#scenBrief')).toContainText('Calves');
  await expect(page.locator('#summary')).toContainText('Massage gun');
  await page.locator('#buildBtn').click();
  await expect.poll(() => visibleScreens(page)).toEqual(['timer']);
  await expect(page.locator('#wTitle')).toHaveText('Massage gun');
  await expect(page.locator('#rTime')).toHaveText(/^\d\d:\d\d$|^\d$/);
  const names = await page.evaluate(() => steps.map((s) => s.name));
  expect(names.slice(0, 5)).toEqual(['Get ready', 'Calves · left', 'Switch sides', 'Calves · right', 'Hamstrings · left']);   // each side, then the switch between
  await page.locator('#nextBtn').click();
  await expect(page.locator('#nowName')).toHaveText('Calves · left');
  await expect(page.locator('#rCaption')).toHaveText('left side');
  await expectNoErrors(errors);
});

test('the calendar opens on a week and can show the month', async ({ page }) => {
  const errors = await open(page, '/app.html?go=calendar');
  await expect(page.locator('#cal h1')).toHaveText('Training calendar');
  await expect(page.locator('#cal [data-dropday]').first()).toBeVisible();
  await expectNoErrors(errors);
});

test('the landing page loads and its coach card opens the app', async ({ page }) => {
  const errors = await open(page, '/index.html');
  await expect(page).toHaveTitle(/Boxing Flow/);
  const href = await page.locator('a[href*="app.html?go="]').first().getAttribute('href');
  expect(href).toMatch(/app\.html\?go=/);
  await expectNoErrors(errors);
});
