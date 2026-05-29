/* ============================================================
   Durbar Studio — cloud layer: accounts, multi-event switcher,
   publish, live sync, link-response moderation, password reset.
   Hooks into studio.js via window.__studio (get / load / blank /
   setRemote / onSave) and exposes window.__cloud for delete ops.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const api = window.api;
  let me = null, eventId = null, slug = null, pendingPublish = false, syncT = null, authMode = 'login';
  let events = [], rsvps = [], contribs = [];

  const chip = (text, cls) => { const c = $('#cloudChip'); if (c) { c.textContent = text; c.className = 'cloud-chip' + (cls ? ' ' + cls : ''); } };
  const publishLabel = (t) => { const b = $('#btnPublish'); if (b) b.textContent = t; };
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m) => { const t = $('#toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); } };
  const pushRemote = () => { if (window.__studio) window.__studio.setRemote(rsvps, contribs); };

  function setLoggedIn(u) { me = u; const b = $('#btnAccount'); if (b) b.textContent = '👤 ' + (u.name || u.email.split('@')[0]); chip('☁️ Synced', 'on'); }
  function setLoggedOut() { me = null; eventId = null; slug = null; events = []; rsvps = []; contribs = []; const b = $('#btnAccount'); if (b) b.textContent = 'Sign in'; chip('● Local only'); publishLabel('🔗 Publish'); populateEvents(); }

  async function refresh() {
    try { const r = await api.me(); if (r.user) { setLoggedIn(r.user); await loadMine(); } else setLoggedOut(); }
    catch (e) { setLoggedOut(); }
  }
  async function loadMine() {
    try {
      const r = await api.myEvents(); events = r.events || [];
      populateEvents();
      if (events.length) await openEvent(events[0].id);
    } catch (e) {}
  }
  async function openEvent(id) {
    const full = await api.getEvent(id);
    eventId = full.event.id; slug = full.event.slug;
    rsvps = full.rsvps || []; contribs = full.contributions || [];
    if (window.__studio) { window.__studio.load(full.event.state); window.__studio.setRemote(rsvps, contribs); }
    chip('☁️ Synced', 'on'); publishLabel('🔗 Share link'); syncSwitcher();
  }

  /* ---- multi-event switcher ---- */
  function populateEvents() {
    const sel = $('#evPick'); if (!sel) return;
    if (!me) { sel.innerHTML = '<option>Ama &amp; Kwame · White Wedding</option>'; sel.disabled = true; return; }
    sel.disabled = false;
    sel.innerHTML = events.map((e) => `<option value="${e.id}">${escapeHtml(e.title || 'Untitled')}</option>`).join('') + '<option value="__new__">＋ New event</option>';
    syncSwitcher();
    sel.onchange = async () => {
      if (sel.value === '__new__') return newEvent();
      if (+sel.value !== eventId) { try { await openEvent(+sel.value); } catch (e) { syncSwitcher(); } }
    };
  }
  function syncSwitcher() { const sel = $('#evPick'); if (sel && eventId) sel.value = String(eventId); }
  async function newEvent() {
    try {
      const blank = window.__studio ? window.__studio.blank() : { event: { title: 'New event' } };
      const r = await api.createEvent(blank);
      const list = await api.myEvents(); events = list.events || [];
      populateEvents();
      await openEvent(r.event.id);
      toast('New event created');
    } catch (e) { syncSwitcher(); }
  }

  /* ---- live sync on edit ---- */
  function scheduleSync(state) {
    if (!me || !eventId) return;
    chip('☁️ Saving…', 'sync');
    clearTimeout(syncT);
    syncT = setTimeout(async () => {
      try {
        await api.saveEvent(eventId, state);
        chip('☁️ Synced', 'on');
        const ev = events.find((e) => e.id === eventId); const t = state.event && state.event.title;
        if (ev && t && ev.title !== t) { ev.title = t; populateEvents(); }
      } catch (e) { chip('⚠️ Sync failed', 'sync'); }
    }, 800);
  }

  /* ---- moderation: remove link responses ---- */
  window.__cloud = {
    deleteGuest: async (id) => { if (!eventId) return; try { await api.del('/api/events/' + eventId + '/guests/' + id); rsvps = rsvps.filter((r) => r.id !== id); pushRemote(); toast('Response removed'); } catch (e) {} },
    deleteContribution: async (id) => { if (!eventId) return; try { await api.del('/api/events/' + eventId + '/contributions/' + id); contribs = contribs.filter((c) => c.id !== id); pushRemote(); toast('Contribution removed'); } catch (e) {} },
    getLink: () => (slug ? location.origin + '/event.html?e=' + slug : ''),
  };

  /* ---- modal ---- */
  const modal = $('#authModal'), body = $('#authBody');
  const open = (html) => { body.innerHTML = html; modal.classList.add('open'); };
  const close = () => modal.classList.remove('open');

  function authForm() {
    const signup = authMode === 'signup';
    open(`<h3>${signup ? 'Create your account' : 'Welcome back'}</h3>
      <p class="lead">${signup ? 'Start designing and sharing real event pages.' : 'Sign in to sync your event and share a live link.'}</p>
      ${signup ? '<label>Your name</label><input id="auName" placeholder="Ama Mensah" autocomplete="name" />' : ''}
      <label>Email</label><input id="auEmail" type="email" placeholder="you@example.com" autocomplete="email" />
      <label>Password</label><input id="auPass" type="password" placeholder="At least 6 characters" autocomplete="${signup ? 'new-password' : 'current-password'}" />
      <div class="err" id="auErr"></div>
      <button class="go" id="auGo">${signup ? 'Create account' : 'Sign in'}</button>
      <div class="alt">${signup ? 'Already have an account? <a id="auSwitch">Sign in</a>' : 'New here? <a id="auSwitch">Create an account</a> · <a id="auForgot">Forgot password?</a>'}</div>`);
    $('#auSwitch').addEventListener('click', () => { authMode = signup ? 'login' : 'signup'; authForm(); });
    if ($('#auForgot')) $('#auForgot').addEventListener('click', resetRequest);
    $('#auGo').addEventListener('click', submitAuth);
    $('#auPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAuth(); });
    (signup ? $('#auName') : $('#auEmail')).focus();
  }
  async function submitAuth() {
    const email = $('#auEmail').value.trim(), pass = $('#auPass').value;
    const name = ($('#auName') && $('#auName').value.trim()) || '';
    const err = $('#auErr'); err.classList.remove('show');
    try {
      const r = authMode === 'signup' ? await api.signup(email, pass, name) : await api.login(email, pass);
      setLoggedIn(r.user); await loadMine(); close();
      if (pendingPublish) { pendingPublish = false; publish(); }
    } catch (e) { err.textContent = e.message || 'Something went wrong'; err.classList.add('show'); }
  }

  function resetRequest() {
    open(`<h3>Reset your password</h3><p class="lead">Enter your email and we'll send a reset code.</p>
      <label>Email</label><input id="rqEmail" type="email" placeholder="you@example.com" />
      <div class="err" id="rqErr"></div>
      <button class="go" id="rqGo">Send reset code</button>
      <div class="alt"><a id="rqBack">Back to sign in</a></div>`);
    $('#rqBack').addEventListener('click', () => { authMode = 'login'; authForm(); });
    $('#rqGo').addEventListener('click', async () => {
      try { const r = await api.requestReset($('#rqEmail').value.trim()); resetComplete(r.devResetToken); }
      catch (e) { const er = $('#rqErr'); er.textContent = e.message; er.classList.add('show'); }
    });
    $('#rqEmail').focus();
  }
  function resetComplete(devToken) {
    open(`<h3>Enter reset code</h3><p class="lead">Check your email for the code${devToken ? ' (dev mode: prefilled)' : ''}, then set a new password.</p>
      <label>Reset code</label><input id="rcToken" value="${devToken || ''}" placeholder="paste the code from your email" />
      <label>New password</label><input id="rcPass" type="password" placeholder="At least 6 characters" />
      <div class="err" id="rcErr"></div>
      <button class="go" id="rcGo">Set new password</button>`);
    $('#rcGo').addEventListener('click', async () => {
      try { await api.reset($('#rcToken').value.trim(), $('#rcPass').value); authMode = 'login'; authForm(); toast('Password reset — sign in'); }
      catch (e) { const er = $('#rcErr'); er.textContent = e.message; er.classList.add('show'); }
    });
    ($('#rcPass')).focus();
  }

  function accountSheet() {
    open(`<h3>Your account</h3><p class="lead">${escapeHtml(me.email)}${me.verified ? '' : ' · <span style="color:#c8851f">unverified</span>'}</p>
      <p class="dim small" style="margin-bottom:14px">Your event syncs automatically while you edit. Share the public link so guests can RSVP and contribute — their responses appear in <b>Guests</b> &amp; <b>Money</b>, where you can remove any you don't want.</p>
      <button class="go" id="auLogout" style="background:#9b2c2c">Sign out</button>`);
    $('#auLogout').addEventListener('click', async () => { try { await api.logout(); } catch (e) {} setLoggedOut(); close(); });
  }

  async function publish() {
    if (!me) { pendingPublish = true; authMode = 'signup'; authForm(); return; }
    const state = window.__studio ? window.__studio.get() : null;
    if (!state) return;
    try {
      if (!eventId) { const r = await api.createEvent(state); eventId = r.event.id; slug = r.event.slug; const l = await api.myEvents(); events = l.events || []; populateEvents(); }
      else { await api.saveEvent(eventId, state); }
      chip('☁️ Synced', 'on'); publishLabel('🔗 Share link'); shareSheet();
    } catch (e) { open('<h3>Could not publish</h3><p class="lead">' + escapeHtml(e.message || 'Please try again.') + '</p>'); }
  }
  function shareSheet() {
    if (window.__studio && window.__studio.confetti) window.__studio.confetti();
    const link = location.origin + '/event.html?e=' + slug;
    open(`<h3>🎉 Your event is live</h3>
      <p class="lead">Share this link on WhatsApp, SMS or anywhere. Guests open it, RSVP and contribute — no app, no login.</p>
      <label>Public invite link</label>
      <div class="share-link"><input id="shLink" readonly value="${escapeHtml(link)}" /><button class="go" style="width:auto;margin:0;padding:11px 16px" id="shCopy">Copy</button></div>
      <div class="copied" id="shCopied">Copied to clipboard ✓</div>
      <div class="alt"><a href="${escapeHtml(link)}" target="_blank">Open the guest page →</a></div>`);
    const inp = $('#shLink');
    $('#shCopy').addEventListener('click', async () => {
      inp.select();
      try { await navigator.clipboard.writeText(link); } catch (e) { try { document.execCommand('copy'); } catch (e2) {} }
      $('#shCopied').classList.add('show');
    });
  }

  function init() {
    if (!$('#authModal')) return;
    $('#authClose').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    $('#btnAccount').addEventListener('click', () => { if (me) accountSheet(); else { authMode = 'login'; authForm(); } });
    $('#btnPublish').addEventListener('click', publish);
    if (window.__studio) window.__studio.onSave = scheduleSync;
    refresh();
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
