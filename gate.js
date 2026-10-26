/* Sign-in gate: the app needs an account. Until someone is signed in, a sign-in screen covers everything (email and password, or a sign-in link by email; new accounts
   when the project allows them). A person who has signed in on this device before is let straight in while the sign-in service answers, so a slow or missing connection
   at the gym does not lock them out; the screen only appears if the service says they are signed out. The marker "gateOk" is not a "bf" key, so it is never synced.
   Owner mode on this computer (cloud.js) signs in by itself, so the gate never shows there. A test page can set window.BF_NO_GATE before the page loads to skip it.
   This is a proof of concept: it is a door for the app, not the lock for the data. The data's lock is the database rules (supabase/migrations). Loads after cloud.js. */
(() => {
  if(window.BF_NO_GATE) return;
  const C = window.bfCloud, root = document.documentElement, OK = 'gateOk';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const known = () => { try { return !!localStorage.getItem(OK); } catch(e){ return false; } };
  const mark = on => { try { on ? localStorage.setItem(OK, '1') : localStorage.removeItem(OK); } catch(e){} };
  const el = document.createElement('div'); el.id = 'gate'; el.hidden = true; document.body.appendChild(el);
  const S = {mode:'password', email:'', busy:false, err:'', notice:'', offline:false};

  function paint(){
    const link = S.mode === 'link', keepPw = (el.querySelector('#gPass') || {}).value || '';   // a failed try keeps what was typed, so Create account is one tap away
    el.innerHTML = `<div class="gate-box">
      <div class="gate-logo" aria-hidden="true"></div>
      <h1>Boxing Flow</h1>
      <p class="sub">${S.offline ? 'We can\'t reach the sign-in service. Check your connection and try again.' : 'Sign in to save your training and use it on any device.'}</p>
      ${S.err ? `<p class="t-note warn" role="alert">${esc(S.err)}</p>` : ''}${S.notice ? `<p class="t-note" role="status">${esc(S.notice)}</p>` : ''}
      <form id="gateForm" novalidate>
        <label class="c-label">Email<input id="gEmail" name="email" type="email" inputmode="email" autocomplete="username" required placeholder="you@example.com" value="${esc(S.email)}"></label>
        ${link ? '' : '<label class="c-label">Password<input id="gPass" name="password" type="password" autocomplete="current-password" minlength="10" required placeholder="at least 10 characters"></label>'}
        <div class="acts"><button class="btn" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'One moment…' : link ? 'Email me a sign-in link' : 'Sign in'}</button>
          ${link ? '' : '<button class="btn ghost" type="button" data-g-create ' + (S.busy ? 'disabled' : '') + '>Create account</button>'}</div>
      </form>
      <p class="t-note"><button class="linkbtn" type="button" data-g-mode>${link ? 'Use a password instead' : 'Email me a sign-in link instead'}</button></p>
      <p class="iq-note">Your training stays private to your account.</p></div>`;
    const pw = el.querySelector('#gPass'); if(pw && keepPw) pw.value = keepPw;
  }
  function open(on){
    el.hidden = !on; root.classList.toggle('gated', on); root.classList.remove('gate-wait');
    if(on){ paint(); const f = el.querySelector('#gEmail'); if(f && !S.email) setTimeout(() => { try { f.focus(); } catch(e){} }, 50); }
  }
  const failText = m => /invalid login/i.test(m) ? 'That email and password don\'t match. If you have not made an account yet, tap Create account.'
    : /already (been )?registered|already exists/i.test(m) ? 'That email already has an account. Tap Sign in.'
    : /signups? (are )?(not allowed|disabled)/i.test(m) ? 'New accounts are switched off right now. If you already have an account, sign in.'
    : /rate|limit|seconds/i.test(m) ? 'Too many tries just now. Wait a minute and try again.'
    : /confirm/i.test(m) ? 'Confirm your email first: tap the link in the email we sent you, then sign in.' : 'Couldn\'t do that: ' + m;
  async function submit(create){
    S.email = (el.querySelector('#gEmail').value || '').trim(); const pw = (el.querySelector('#gPass') || {}).value || '';
    if(!S.email){ S.err = 'Enter your email.'; return paint(); }
    if(S.mode === 'password' && pw.length < 10){ S.err = 'Use a password of at least 10 characters.'; return paint(); }
    try { await C.init(); } catch(e){ S.offline = true; S.err = ''; return paint(); }
    S.busy = true; S.err = S.notice = ''; S.offline = false; paint();
    let r;
    if(S.mode === 'link') r = await C.sb.auth.signInWithOtp({email:S.email, options:{emailRedirectTo:location.origin + '/app.html'}});
    else r = create ? await C.sb.auth.signUp({email:S.email, password:pw, options:{emailRedirectTo:location.origin + '/app.html'}}) : await C.sb.auth.signInWithPassword({email:S.email, password:pw});
    S.busy = false;
    if(r.error) S.err = failText(r.error.message || '');
    else if(S.mode === 'link') S.notice = 'Check your inbox for ' + S.email + '. Tap the link in the email and you will be signed in.';
    else if(create && !(r.data && r.data.session)) S.notice = 'Almost done: we emailed a confirmation link to ' + S.email + '. Tap it, then come back and sign in.';
    paint();   // when a session starts, the sign-in listener below takes over
  }
  el.addEventListener('submit', e => { e.preventDefault(); submit(false); });
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    if('gCreate' in b.dataset) submit(true);
    else if('gMode' in b.dataset){ S.mode = S.mode === 'link' ? 'password' : 'link'; S.err = S.notice = ''; S.email = (el.querySelector('#gEmail') || {}).value || S.email; paint(); }
  });
  C.onAuth((ev, user) => {
    if(user){ mark(true); open(false); }
    else if(ev === 'SIGNED_OUT'){ mark(false); S.err = S.notice = ''; open(true); }
  });
  C.init().then(() => { if(C.user){ mark(true); open(false); } else { mark(false); open(true); } })
    .catch(() => { if(known()) open(false); else { S.offline = true; open(true); } });   // can't reach the service: someone who has signed in here before still gets in
})();
