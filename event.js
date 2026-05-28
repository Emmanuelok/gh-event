/* ============================================================
   Durbar — guest-facing event page.
   Two modes:
     • server  (?e=<slug>)  — loads the published event from the API;
                              RSVP / contribution POST to the server.
     • local   (no slug)    — "Preview as guest" from the studio;
                              reads/writes this browser's localStorage.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const D = window.DURBAR;
  const api = window.api;
  const KEY = 'durbar.studio.v2';
  const esc = D.esc, ghs = D.ghs;
  const gid = () => 'x' + Math.random().toString(36).slice(2, 9);

  const SLUG = new URLSearchParams(location.search).get('e');
  const mode = SLUG ? 'server' : 'local';
  const page = $('#page');
  let state = null;   // local mode: full studio state
  let ev = null;      // the event design (both modes)
  let collected = 0;

  const getCollected = () => mode === 'server' ? collected : (state.contributors || []).reduce((a, c) => a + (+c.paid || 0), 0);
  function render() {
    D.applyTheme(page, ev.theme);
    page.innerHTML = D.renderEventPage(ev, { collected: getCollected(), mode: 'guest' });
  }
  const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  function boot() {
    if (mode === 'server') {
      setServerBanner();
      api.getPublic(SLUG).then((res) => {
        ev = res.event || {}; ev.gallery = ev.gallery || []; collected = res.collected || 0;
        render();
      }).catch((e) => {
        page.innerHTML = '<div class="noev"><h3>Can\'t open this invite</h3><p>' + esc(e.message || 'This link may be wrong or the event was removed.') + '</p><p style="margin-top:10px"><a href="index.html">About Durbar →</a></p></div>';
      });
    } else {
      try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      if (!state || !state.event) {
        page.innerHTML = '<div class="noev"><h3>No event here yet</h3><p>This browser hasn\'t designed an event. <a href="studio.html">Open the Studio</a>, create one, then tap “Preview as guest”.</p></div>';
        $('#guestTop').style.display = 'none';
        return;
      }
      state.event.gallery = state.event.gallery || [];
      state.contributors = state.contributors || [];
      state.guests = state.guests || [];
      ev = state.event;
      render();
    }
  }
  function setServerBanner() {
    const n = $('#gtNote'), l = $('#gtLink');
    if (n) n.textContent = "You're invited 💚 — RSVP and send your gift below.";
    if (l) { l.textContent = 'Make your own on Durbar →'; l.setAttribute('href', 'index.html'); }
  }

  page.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]'); if (!a) return;
    if (a.dataset.action === 'rsvp') openRsvp();
    else if (a.dataset.action === 'contribute') openContribute();
  });

  /* ---- modal ---- */
  const modal = $('#modal'), body = $('#modalBody');
  const open = (html) => { body.innerHTML = html; modal.classList.add('open'); };
  const close = () => modal.classList.remove('open');
  $('#modalClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  const showErr = (id, msg) => { const er = $(id); er.textContent = msg; er.style.display = 'block'; };

  /* ---- RSVP ---- */
  function openRsvp() {
    let status = 'yes', party = ev.allowPlusOnes ? 2 : 1;
    open(`<h3>RSVP — ${esc(ev.title)}</h3>
      <p class="lead">Takes 20 seconds. No account needed.</p>
      <label>Your name</label><input id="rName" placeholder="e.g. Akosua Mensah" />
      <label>Will you join us?</label>
      <div class="seg" id="rSeg"><button class="on" data-v="yes">Yes 🎉</button><button data-v="maybe">Maybe</button><button data-v="no">Can't make it</button></div>
      ${ev.allowPlusOnes ? `<label>How many in your party?</label><div class="step" id="rStep"><button data-s="-1">−</button><span id="rParty">${party}</span><button data-s="1">+</button></div>` : ''}
      <label>Phone <span style="text-transform:none;font-weight:500">(so the host can reach you)</span></label><input id="rPhone" placeholder="024…" />
      <label>Note <span style="text-transform:none;font-weight:500">(optional)</span></label><input id="rNote" placeholder="Congratulations! 💍" />
      <div class="err" id="rErr" style="display:none"></div>
      <button class="go" id="rGo">Send RSVP</button>`);
    const seg = $('#rSeg');
    seg.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; status = b.dataset.v; Array.from(seg.children).forEach((x) => x.classList.toggle('on', x === b)); });
    const stp = $('#rStep');
    if (stp) stp.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (!b) return; party = Math.max(1, Math.min(20, party + (+b.dataset.s))); $('#rParty').textContent = party; });
    $('#rGo').addEventListener('click', () => {
      const name = $('#rName').value.trim(); if (!name) { $('#rName').focus(); return; }
      const payload = { name, phone: $('#rPhone').value.trim(), status, party: status === 'yes' ? party : 0, note: $('#rNote').value.trim() };
      const done = () => {
        open(`<div class="done"><div class="big">✅</div><h3>Thank you, ${esc(name.split(' ')[0])}!</h3><p>Your RSVP is in${status === 'yes' ? ` for ${payload.party}` : ''}. ${status === 'yes' ? 'The host will be in touch before the day.' : 'We\'ll miss you!'}</p></div>`);
        setTimeout(close, 2600);
      };
      if (mode === 'server') {
        $('#rGo').disabled = true;
        api.rsvp(SLUG, payload).then(done).catch((e) => { showErr('#rErr', e.message || 'Could not send — try again'); $('#rGo').disabled = false; });
      } else {
        state.guests.push({ id: gid(), name, phone: payload.phone, group: 'Guest (RSVP)', status, party: payload.party, note: payload.note, source: 'rsvp' });
        saveLocal(); done();
      }
    });
    $('#rName').focus();
  }

  /* ---- Contribute ---- */
  function openContribute() {
    const c = ev.contribution || {};
    open(`<h3>💛 ${esc(c.label || 'Contribute via MoMo')}</h3>
      <p class="lead">Send Mobile Money to the host, then confirm here so it's tracked.</p>
      <div class="momo-box">Send to <b>${esc(c.momo || '024 000 0000')}</b><br><span class="dim small">${esc(ev.title)} · MTN / Telecel / AT MoMo</span></div>
      <label>Your name</label><input id="dName" placeholder="e.g. Uncle Yaw" />
      <label>Amount sent (GHS)</label><input id="dAmt" type="number" placeholder="200" />
      <div class="err" id="dErr" style="display:none"></div>
      <button class="go gold" id="dGo">I've sent it ✓</button>`);
    $('#dGo').addEventListener('click', () => {
      const name = $('#dName').value.trim(); const amt = +$('#dAmt').value || 0;
      if (!name) { $('#dName').focus(); return; }
      if (amt <= 0) { $('#dAmt').focus(); return; }
      const done = () => {
        render();
        open(`<div class="done"><div class="big">🎉</div><h3>Medaase, ${esc(name.split(' ')[0])}!</h3><p>Your ${ghs(amt)} gift is recorded. A receipt would be sent by SMS in the live product.</p></div>`);
        setTimeout(close, 2800);
      };
      if (mode === 'server') {
        $('#dGo').disabled = true;
        api.contribute(SLUG, { name, amount: amt, method: 'momo' }).then((r) => { collected = r.collected; done(); }).catch((e) => { showErr('#dErr', e.message || 'Could not record — try again'); $('#dGo').disabled = false; });
      } else {
        state.contributors.push({ id: gid(), name, sub: 'Guest · MoMo', pledge: amt, paid: amt });
        saveLocal(); done();
      }
    });
    $('#dName').focus();
  }

  boot();
})();
