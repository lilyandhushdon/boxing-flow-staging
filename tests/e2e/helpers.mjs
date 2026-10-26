// Shared helpers: stand-ins for everything outside the site, and a page opener that fails the test on any uncaught error.
import { expect } from '@playwright/test';

// a YouTube player that can be steered from the test: window.__yt.{time,state} and window.__ytEvents
const YT_STUB = `
window.__yt = {time:0, state:-1, destroyed:0};
window.YT = {Player:function(el, opts){
  window.__ytOpts = opts; window.__ytEvents = opts.events;
  document.getElementById(el).innerHTML = '<iframe title="stand-in player" src="about:blank"></iframe>';
  this.getCurrentTime = () => __yt.time; this.getPlayerState = () => __yt.state; this.getVideoData = () => ({title:'A very long YouTube title | FULL FIGHT'});
  this.playVideo = () => { __yt.state = 1; }; this.seekTo = t => { __yt.time = t; }; this.destroy = () => { __yt.destroyed++; };
  setTimeout(() => opts.events.onReady({}), 20);
}};
if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();`;

// Supabase with nobody signed in
const SUPABASE_STUB = `
window.supabase = {createClient: () => ({
  auth: {onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}), getSession: async () => ({data:{session:null}}),
    signInWithOtp: async ({email}) => { window.__otpEmail = email; return {error:null}; }, verifyOtp: async () => ({error:{message:'bad code'}}), signOut: async () => {}, signInWithPassword: async () => ({error:{message:'Invalid login credentials'}}), signUp: async () => ({data:{session:null}, error:null})},
  from: () => { throw new Error('not signed in'); }
})};`;

// the automated WebKit build has no Web Audio (real iPhones do), so the engine gets a harmless stand-in there
const AUDIO_STUB = 'if(!window.AudioContext && !window.webkitAudioContext){ const any = () => new Proxy(function(){}, {get:(t, k) => k === "currentTime" ? 0 : k === "state" ? "running" : k === "sampleRate" ? 44100 : any(), apply:() => any(), construct:() => any(), set:() => true}); window.AudioContext = function(){ return any(); }; }';

export async function standIns(page, { gate = false } = {}) {
  const errors = [];
  await page.addInitScript(AUDIO_STUB);
  if (!gate) await page.addInitScript('window.BF_NO_GATE = true;');   // the sign-in gate has its own test; everywhere else the app is opened signed in
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/^https?:\/\/(?!localhost)/, (route) => {
    const url = route.request().url();
    if (url.includes('youtube.com/iframe_api')) return route.fulfill({ contentType: 'text/javascript', body: YT_STUB });
    if (url.includes('@supabase/supabase-js')) return route.fulfill({ contentType: 'text/javascript', body: SUPABASE_STUB });
    return route.abort();   // fonts, three.js, thumbnails, the live channel, real APIs
  });
  return errors;
}

export async function open(page, path, opts) {
  const errors = await standIns(page, opts);
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  return errors;
}

export const visibleScreens = (page) => page.evaluate(() => [...document.querySelectorAll('section[id]')].filter((e) => !e.hidden && e.offsetParent !== null).map((e) => e.id));
export async function expectNoErrors(errors, what = 'the page') { expect(errors, `${what} threw errors:\n${errors.join('\n')}`).toEqual([]); }
