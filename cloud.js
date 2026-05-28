/* ============================================================
   Durbar Studio — cloud layer: accounts, publish, live sync.
   Hooks into studio.js via window.__studio (get / load / setRemote / onSave).
   ============================================================ */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const api = window.api;
  let me = null, eventId = null, slug = null, pendingPublish = false, syncT = null, authMode = 'login';

  function chip(text, cls) { const c = $('#cloudChip'); if (c) { c.textContent = text; c.className = 'cloud-chip' + (cls ? ' ' + cls : ''); } }
  function publishLabel(t) { const b = $('#btnPublish'); if (b) b.textContent = t; }

  function setLoggedIn(u) { me = u; const b = $('#btnAccount'); if (b) b.textContent = '👤 ' + (u.name || u.email.split('@')[0]); chip('☁️ Synced', 'on'); }
  function setLoggedOut() { me = null; eventId = null; slug = null; const b = $('#btnAccount'); if (b) b.textContent = 'Sign in'; chip('● Local only'); publishLabel('🔗 Publish'); }

  async function refresh() {
    try { const r = await api.me(); if (r.user) { setLoggedIn(r.user); await loadMine(); } else setLoggedOut(); }
    catch (e) { setLoggedOut(); }
  }
  async function loadMine() {
    try {
      const { events } = await api.myEvents();
      if (events && events.length) {
        const full = await api.getEvent(events[0].id);
        eventId = full.event.id; slug = full.event.slug;
        if (window.__studio) { window.__studio.load(full.event.state); window.__studio.setRemote(full.rsvps, full.contributions); }
        chip('☁️ Synced', 'on'); publishLabel('🔗 Share link');
      }
    } catch (e) {}
  }

  function scheduleSync(state) {
    if (!me || !eventId) return; // only published events sync
    chip('☁️ Saving…', 'sync');
    clearTimeout(syncT);
    syncT = setTimeout(async () => {
      try { await api.saveEvent(eventId, state); chip('☁️ Synced', 'on'); }
      catch (e) { chip('⚠️ Sync failed', 'sync'); }
    }, 800);
  }

  /* ---- modal ---- */
  const modal = $('#authModal'), body = $('#authBody');
  function open(html) { body.innerHTML = html; modal.classList.add('open'); }
  function close() { modal.classList.remove('open'); }

  function authForm() {
    const signup = authMode === 'signup';
    open(`<h3>${signup ? 'Create your account' : 'Welcome back'}</h3>
      <p class="lead">${signup ? 'Start designing and sharing real event pages.' : 'Sign in to sync your event and share a live link.'}</p>
      ${signup ? '<label>Your name</label><input id="auName" placeholder="Ama Mensah" autocomplete="name" />' : ''}
      <label>Email</label><input id="auEmail" type="email" placeholder="you@example.com" autocomplete="email" />
      <label>Password</label><input id="auPass" type="password" placeholder="At least 6 characters" autocomplete="${signup ? 'new-password' : 'current-password'}" />
      <div class="err" id="auErr"></div>
      <button class="go" id="auGo">${signup ? 'Create account' : 'Sign in'}</button>
      <div class="alt">${signup ? 'Already have an account? <a id="auSwitch">Sign in</a>' : 'New here? <a id="auSwitch">Create an account</a>'}</div>`);
    $('#auSwitch').addEventListener('click', () => { authMode = signup ? 'login' : 'signup'; authForm(); });
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

  function accountSheet() {
    open(`<h3>Your account</h3><p class="lead">${me.email}</p>
      <p class="dim small" style="margin-bottom:14px">Your event syncs automatically while you edit. Share the public link so guests can RSVP and contribute — their responses appear in <b>Guests</b> &amp; <b>Money</b>.</p>
      <button class="go" id="auLogout" style="background:#9b2c2c">Sign out</button>`);
    $('#auLogout').addEventListener('click', async () => { try { await api.logout(); } catch (e) {} setLoggedOut(); close(); });
  }

  async function publish() {
    if (!me) { pendingPublish = true; authMode = 'signup'; authForm(); return; }
    const state = window.__studio ? window.__studio.get() : null;
    if (!state) return;
    try {
      if (!eventId) { const r = await api.createEvent(state); eventId = r.event.id; slug = r.event.slug; }
      else { await api.saveEvent(eventId, state); }
      chip('☁️ Synced', 'on'); publishLabel('🔗 Share link');
      shareSheet();
    } catch (e) { open('<h3>Could not publish</h3><p class="lead">' + (e.message || 'Please try again.') + '</p>'); }
  }
  function shareSheet() {
    const link = location.origin + '/event.html?e=' + slug;
    open(`<h3>🎉 Your event is live</h3>
      <p class="lead">Share this link on WhatsApp, SMS or anywhere. Guests open it, RSVP and contribute — no app, no login.</p>
      <label>Public invite link</label>
      <div class="share-link"><input id="shLink" readonly value="${link}" /><button class="go" style="width:auto;margin:0;padding:11px 16px" id="shCopy">Copy</button></div>
      <div class="copied" id="shCopied">Copied to clipboard ✓</div>
      <div class="alt"><a href="${link}" target="_blank">Open the guest page →</a></div>`);
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
