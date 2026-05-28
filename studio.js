/* ============================================================
   Durbar Studio — live event design studio (client-side app)
   State persists in localStorage. No backend, no dependencies.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const ce = (t, cls) => { const e = document.createElement(t); if (cls) e.className = cls; return e; };
  const ghs = (n) => 'GHS ' + Math.round(+n || 0).toLocaleString('en-GH');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- catalogues ---------- */
  const THEMES = {
    'green-gold': { primary: '#0b6e4f', accent: '#e8a33d' },
    'burgundy':   { primary: '#7b1e3b', accent: '#d4af37' },
    'royal':      { primary: '#1b3a8f', accent: '#c9a227' },
    'rose':       { primary: '#a83258', accent: '#f0b8c8' },
    'charcoal':   { primary: '#33312e', accent: '#b8902f' },
    'emerald':    { primary: '#0f766e', accent: '#f59e0b' },
  };
  const TEMPLATES = {
    'white-wedding': { ribbon: 'White Wedding', theme: 'green-gold', sub: 'are getting married', dress: 'Royal green & gold', gift: 'Send a gift via MoMo' },
    'traditional':   { ribbon: 'Traditional Marriage', theme: 'burgundy', sub: 'invite you to our knocking & engagement', dress: 'Rich kente & cloth', gift: 'Support the celebration' },
    'birthday':      { ribbon: 'Birthday', theme: 'rose', sub: "let's celebrate!", dress: 'Smart & colourful', gift: 'Gift via MoMo' },
    'naming':        { ribbon: 'Naming Ceremony', theme: 'emerald', sub: 'welcome our new blessing', dress: 'White & gold', gift: 'Bless the baby' },
    'funeral':       { ribbon: 'Celebration of Life', theme: 'charcoal', sub: 'in loving memory', dress: 'Black & red / white', gift: 'Donate / contribute' },
    'church':        { ribbon: 'Church Event', theme: 'royal', sub: 'come worship with us', dress: 'Modest & smart', gift: 'Give an offering' },
    'corporate':     { ribbon: 'Corporate Event', theme: 'royal', sub: 'you are invited', dress: 'Corporate / formal', gift: 'Sponsor / register' },
    'party':         { ribbon: 'Private Party', theme: 'emerald', sub: 'come have a good time', dress: 'Come as you slay', gift: 'Chip in via MoMo' },
  };
  const TPL_LABEL = { 'white-wedding': 'White Wedding', traditional: 'Traditional', birthday: 'Birthday', naming: 'Naming', funeral: 'Memorial', church: 'Church', corporate: 'Corporate', party: 'Party' };
  const CITIES = ['Accra', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale', 'Tema', 'Koforidua', 'Sunyani', 'Ho', 'Wa', 'Bolgatanga', 'Sekondi', 'Techiman', 'Obuasi'];
  const GROUPS = ['Family', 'Friends', 'VIP', 'Church', 'School', 'Work', 'Team', 'Committee'];
  const STATUSES = ['yes', 'maybe', 'no', 'pending'];

  /* ---------- default state ---------- */
  function seed() {
    return {
      event: {
        template: 'white-wedding', theme: 'green-gold',
        title: 'Ama & Kwame', subtitle: 'are getting married',
        date: '2026-12-14T15:00', venue: 'Golden Tulip', city: 'Kumasi',
        address: 'Rama Road, Adum, Kumasi',
        story: 'Two families, one celebration. Join us as we say "I do" — surrounded by love, kente and joy. Your presence is the greatest gift.',
        dressCode: 'Royal green & gold', mapNote: 'Parking available at the rear gate.',
        schedule: [
          { time: '09:00', label: 'Traditional rites — Manhyia' },
          { time: '12:30', label: 'Church blessing — Cathedral' },
          { time: '15:00', label: 'Reception — Golden Tulip' },
        ],
        rsvpDeadline: '2026-12-01', allowPlusOnes: true,
        contribution: { enabled: true, label: 'Send a gift via MoMo', momo: '024 000 0000', goal: 20000 },
      },
      guests: [
        { id: g(), name: 'Auntie Akosua', phone: '024 111 2222', group: 'Family', status: 'yes', party: 2, note: 'VIP table' },
        { id: g(), name: 'Bro. Kofi Mensah', phone: '020 333 4444', group: 'Committee', status: 'yes', party: 1, note: '' },
        { id: g(), name: 'Ama Serwaa', phone: '055 555 6666', group: 'Friends', status: 'maybe', party: 2, note: '' },
        { id: g(), name: 'Mr. & Mrs. Boateng', phone: '027 777 8888', group: 'Family', status: 'pending', party: 2, note: '' },
        { id: g(), name: 'Mensah Chapel Choir', phone: '—', group: 'Church', status: 'yes', party: 12, note: 'Performing' },
      ],
      contributors: [
        { id: g(), name: 'Auntie Akosua', sub: 'Committee', pledge: 2000, paid: 2000 },
        { id: g(), name: 'Sister Ama (UK)', sub: 'Diaspora', pledge: 3000, paid: 3000 },
        { id: g(), name: 'Bro. Kofi', sub: 'Committee', pledge: 1500, paid: 500 },
        { id: g(), name: 'Uncle Yaw', sub: 'Family', pledge: 1000, paid: 0 },
        { id: g(), name: 'Friends pool', sub: 'Friends', pledge: 1800, paid: 1800 },
      ],
      vendors: [
        { id: g(), name: 'Maa Adwoa Kitchen', cat: 'Caterer', total: 5000, paid: 2500 },
        { id: g(), name: 'Royal Events', cat: 'Decorator', total: 3000, paid: 1500 },
        { id: g(), name: 'Kojo Studios', cat: 'Photographer', total: 2500, paid: 1000 },
        { id: g(), name: 'Golden Tulip', cat: 'Venue', total: 4000, paid: 4000 },
      ],
    };
  }
  function g() { return 'x' + Math.random().toString(36).slice(2, 9); }

  /* ---------- persistence ---------- */
  const KEY = 'durbar.studio.v2';
  let state;
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {}
    return seed();
  }
  let saveT;
  function save(flash) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    const s = $('#saveState');
    if (s) { s.textContent = 'All changes saved'; s.classList.add('saved'); }
    if (flash) toast('Saved ✓');
    clearTimeout(saveT);
  }
  function touched() { const s = $('#saveState'); if (s) { s.textContent = 'Saving…'; s.classList.remove('saved'); } clearTimeout(saveT); saveT = setTimeout(save, 500); }

  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); }

  /* ---------- countdown ---------- */
  function countdown(dt) {
    const d = new Date(dt); if (isNaN(d)) return 'Set a date';
    const diff = d - new Date();
    if (diff <= 0) return 'Today / past';
    const days = Math.floor(diff / 864e5), hrs = Math.floor((diff % 864e5) / 36e5);
    return days + ' days · ' + hrs + ' hrs to go';
  }
  function niceDate(dt) {
    const d = new Date(dt); if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  /* ============================================================
     LIVE PREVIEW (the heart of the studio)
     ============================================================ */
  function renderPreview() {
    const e = state.event;
    const th = THEMES[e.theme] || THEMES['green-gold'];
    const wrap = $('#pvWrap');
    wrap.style.setProperty('--t-primary', th.primary);
    wrap.style.setProperty('--t-accent', th.accent);
    const tpl = TEMPLATES[e.template] || {};
    const sched = (e.schedule || []).filter((s) => s.time || s.label)
      .map((s) => `<li><b>${esc(s.time)}</b><span>${esc(s.label)}</span></li>`).join('');
    const collected = state.contributors.reduce((a, c) => a + (+c.paid || 0), 0);
    const goal = +e.contribution.goal || 0;
    const pct = goal ? Math.min(100, Math.round((collected / goal) * 100)) : 0;

    wrap.innerHTML = `<div class="evpage">
      <div class="ev-cover">
        <span class="ev-ribbon">${esc(tpl.ribbon || 'Event')}</span>
        <div class="ev-title">${esc(e.title || 'Your event title')}</div>
        <div class="ev-sub">${esc(e.subtitle || '')}</div>
        <div class="ev-when">${niceDate(e.date)}</div>
      </div>
      <div class="ev-count">⏳ ${countdown(e.date)}</div>
      ${e.story ? `<div class="ev-sec"><h5>About</h5><p>${esc(e.story)}</p></div>` : ''}
      <div class="ev-sec"><h5>📍 Venue</h5><p><b>${esc(e.venue || 'Venue')}</b><br>${esc(e.address || '')}${e.city ? ', ' + esc(e.city) : ''}${e.mapNote ? '<br><span style="color:#8b938c">' + esc(e.mapNote) + '</span>' : ''}</p></div>
      ${sched ? `<div class="ev-sec"><h5>🕐 Order of the day</h5><ul class="ev-tl">${sched}</ul></div>` : ''}
      ${e.dressCode ? `<div class="ev-sec"><h5>👗 Dress code</h5><p>${esc(e.dressCode)}</p></div>` : ''}
      <div class="ev-actions">
        <div class="ev-btn pri">✋ RSVP${e.allowPlusOnes ? ' (+guests welcome)' : ''} — no app needed</div>
        ${e.contribution.enabled ? `<div class="ev-btn acc">💛 ${esc(e.contribution.label || 'Contribute via MoMo')}</div>` : ''}
        <div class="ev-btn ghost">📷 View gallery</div>
      </div>
      ${e.contribution.enabled && goal ? `<div class="ev-goal"><small>${ghs(collected)} of ${ghs(goal)} contributed</small><div class="gbar"><span style="width:${pct}%"></span></div></div>` : ''}
      <div class="ev-foot">Hosted with 💚 on Durbar · ${e.rsvpDeadline ? 'RSVP by ' + new Date(e.rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Private event'}</div>
    </div>`;
  }

  /* ============================================================
     EDITOR
     ============================================================ */
  function buildEditor() {
    const e = state.event;
    // collapsible sections
    $$('.ed-head').forEach((h) => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));

    // templates
    const tg = $('#tplGrid');
    tg.innerHTML = Object.keys(TEMPLATES).map((k) => {
      const t = TEMPLATES[k]; const th = THEMES[t.theme];
      return `<button class="tpl ${k === e.template ? 'sel' : ''}" data-tpl="${k}"><span class="nm"><span class="dot" style="background:${th.primary}"></span>${TPL_LABEL[k]}</span></button>`;
    }).join('');
    tg.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tpl]'); if (!b) return;
      const k = b.dataset.tpl, t = TEMPLATES[k];
      e.template = k; e.theme = t.theme; e.subtitle = t.sub; e.dressCode = t.dress;
      e.contribution.label = t.gift;
      $$('.tpl', tg).forEach((x) => x.classList.toggle('sel', x.dataset.tpl === k));
      syncFields(); renderSwatches(); renderPreview(); touched(); toast(TPL_LABEL[k] + ' template applied');
    });

    // theme swatches
    renderSwatches();
    $('#swGrid').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-th]'); if (!b) return;
      e.theme = b.dataset.th; renderSwatches(); renderPreview(); touched();
    });

    // city select
    $('#fCity').innerHTML = CITIES.map((c) => `<option ${c === e.city ? 'selected' : ''}>${c}</option>`).join('');

    // simple text/textarea/checkbox binds
    $$('[data-bind]').forEach((el) => {
      const evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
      el.addEventListener(evt, () => {
        const path = el.dataset.bind.split('.');
        let o = state.event; for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
        o[path[path.length - 1]] = el.type === 'checkbox' ? el.checked : el.value;
        renderPreview(); touched();
      });
    });

    buildSchedule();
    syncFields();
  }
  function renderSwatches() {
    $('#swGrid').innerHTML = Object.keys(THEMES).map((k) =>
      `<div class="sw ${k === state.event.theme ? 'sel' : ''}" data-th="${k}" title="${k}" style="background:linear-gradient(135deg,${THEMES[k].primary},${THEMES[k].accent})"></div>`).join('');
  }
  function syncFields() {
    const e = state.event;
    const set = (sel, v) => { const el = $(sel); if (el) { if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v; } };
    set('#fTitle', e.title); set('#fSub', e.subtitle); set('#fDate', e.date);
    set('#fVenue', e.venue); set('#fCity', e.city); set('#fAddress', e.address);
    set('#fStory', e.story); set('#fDress', e.dressCode); set('#fMapNote', e.mapNote);
    set('#fRsvp', e.rsvpDeadline); set('#fPlus', e.allowPlusOnes);
    set('#fContribOn', e.contribution.enabled); set('#fContribLabel', e.contribution.label);
    set('#fMomo', e.contribution.momo); set('#fGoal', e.contribution.goal);
  }
  function buildSchedule() {
    const box = $('#schList'); const e = state.event;
    box.innerHTML = '';
    e.schedule.forEach((s, i) => {
      const row = ce('div', 'sch-row');
      row.innerHTML = `<input type="text" value="${esc(s.time)}" placeholder="09:00" data-si="${i}" data-sk="time">
        <input type="text" value="${esc(s.label)}" placeholder="Activity" data-si="${i}" data-sk="label">
        <button class="mini-x" data-del="${i}">✕</button>`;
      box.appendChild(row);
    });
    box.oninput = (ev) => { const t = ev.target; if (t.dataset.si != null) { e.schedule[+t.dataset.si][t.dataset.sk] = t.value; renderPreview(); touched(); } };
    box.onclick = (ev) => { const d = ev.target.closest('[data-del]'); if (d) { e.schedule.splice(+d.dataset.del, 1); buildSchedule(); renderPreview(); touched(); } };
  }
  function addSchedule() { state.event.schedule.push({ time: '', label: '' }); buildSchedule(); touched(); }

  /* ============================================================
     GUESTS
     ============================================================ */
  function renderGuests() {
    const list = state.guests;
    const gc = $('#gCount'); if (gc) gc.textContent = list.length;
    const heads = list.reduce((a, x) => a + (x.status === 'yes' ? (+x.party || 1) : 0), 0);
    const by = (s) => list.filter((x) => x.status === s).length;
    $('#gKpis').innerHTML =
      kpi('Invited', list.length, '') +
      kpi('Coming', by('yes'), heads + ' heads', 'good') +
      kpi('Maybe / pending', by('maybe') + by('pending'), 'to chase', 'warn') +
      kpi("Can't make it", by('no'), '', 'bad');

    const rows = list.length ? list.map((x) => `<tr>
      <td><b>${esc(x.name)}</b><br><span style="color:#8b938c;font-size:12px">${esc(x.phone || '')}</span></td>
      <td><span class="tag grp">${esc(x.group)}</span></td>
      <td><span class="tag ${x.status}">${x.status}</span></td>
      <td>${esc(x.party)}</td>
      <td style="color:#8b938c">${esc(x.note || '')}</td>
      <td style="text-align:right"><button class="x-btn" data-delg="${x.id}">✕</button></td>
    </tr>`).join('') : `<tr><td colspan="6"><div class="empty">No guests yet — add your first above.</div></td></tr>`;
    $('#gBody').innerHTML = rows;
    $('#gGroup').innerHTML = GROUPS.map((x) => `<option>${x}</option>`).join('');
    $('#gStatus').innerHTML = STATUSES.map((x) => `<option value="${x}">${x}</option>`).join('');
  }
  function addGuest() {
    const name = $('#gName').value.trim(); if (!name) { toast('Enter a name'); return; }
    state.guests.push({ id: g(), name, phone: $('#gPhone').value.trim(), group: $('#gGroup').value, status: $('#gStatus').value, party: Math.max(1, +$('#gParty').value || 1), note: '' });
    $('#gName').value = ''; $('#gPhone').value = ''; $('#gParty').value = 1;
    renderGuests(); renderDash(); save(true);
  }

  /* ============================================================
     MONEY (contribution & committee ledger)
     ============================================================ */
  function totals() {
    const pledged = state.contributors.reduce((a, c) => a + (+c.pledge || 0), 0);
    const collected = state.contributors.reduce((a, c) => a + (+c.paid || 0), 0);
    const vTotal = state.vendors.reduce((a, v) => a + (+v.total || 0), 0);
    const vPaid = state.vendors.reduce((a, v) => a + (+v.paid || 0), 0);
    return { pledged, collected, toCollect: Math.max(0, pledged - collected), vTotal, vPaid, vDue: vTotal - vPaid, cash: collected - vPaid, projected: pledged - vTotal };
  }
  function renderMoney() {
    const t = totals();
    $('#mKpis').innerHTML =
      kpi('Pledged', ghs(t.pledged)) +
      kpi('Collected', ghs(t.collected), '', 'good') +
      kpi('To collect', ghs(t.toCollect), '', 'warn') +
      kpi('Owed to vendors', ghs(t.vDue), '', 'bad');

    $('#cBody').innerHTML = state.contributors.map((c) => {
      const st = c.paid >= c.pledge ? 'yes' : (c.paid > 0 ? 'maybe' : 'pending');
      const lbl = c.paid >= c.pledge ? 'paid' : (c.paid > 0 ? 'part' : 'pledged');
      return `<tr>
        <td><b>${esc(c.name)}</b><br><span style="color:#8b938c;font-size:12px">${esc(c.sub)}</span></td>
        <td>${ghs(c.paid)} <span style="color:#8b938c">/ ${ghs(c.pledge)}</span></td>
        <td><span class="tag ${st}">${lbl}</span></td>
        <td style="text-align:right">
          ${c.paid < c.pledge ? `<button class="btn btn-sm" data-payc="${c.id}">Mark paid</button> ` : ''}
          <button class="x-btn" data-delc="${c.id}">✕</button></td></tr>`;
    }).join('');

    $('#vBody').innerHTML = state.vendors.map((v) => {
      const bal = (+v.total || 0) - (+v.paid || 0);
      return `<tr><td><b>${esc(v.name)}</b><br><span style="color:#8b938c;font-size:12px">${esc(v.cat)}</span></td>
        <td>${ghs(v.paid)} <span style="color:#8b938c">/ ${ghs(v.total)}</span></td>
        <td>${bal <= 0 ? '<span class="tag yes">paid</span>' : '<span class="tag bad">' + ghs(bal) + ' due</span>'}</td>
        <td style="text-align:right"><button class="x-btn" data-delv="${v.id}">✕</button></td></tr>`;
    }).join('');

    renderLedgerAI(t);
  }
  function renderLedgerAI(t) {
    const box = $('#ledgerAI'); if (!box) return;
    const nUnpaid = state.contributors.filter((c) => c.paid < c.pledge).length;
    if (t.projected < 0) {
      box.className = 'ai-note';
      box.innerHTML = t.toCollect > 0
        ? `🤖 <b>Money gap.</b> Even after collecting the ${ghs(t.toCollect)} still pledged, you'll be <b>${ghs(-t.projected)} short</b> of the ${ghs(t.vTotal)} vendor cost. Chase the ${nUnpaid} unfulfilled pledge(s) and trim scope. Cash in hand now: <b>${t.cash < 0 ? '-' : ''}${ghs(Math.abs(t.cash))}</b>.`
        : `🤖 <b>Structural shortfall.</b> All pledges are in, but it's still <b>${ghs(-t.projected)} short</b> of the ${ghs(t.vTotal)} vendor cost. Raise more or cut scope. Outstanding vendor balances: <b>${ghs(t.vDue)}</b>.`;
    } else {
      box.className = 'ai-note ok';
      box.innerHTML = `🤖 <b>You're covered.</b> Pledges of ${ghs(t.pledged)} exceed the ${ghs(t.vTotal)} vendor cost by <b>${ghs(t.projected)}</b>. Keep chasing the ${ghs(t.toCollect)} outstanding so cash is ready for the ${ghs(t.vDue)} in balances. 🎉`;
    }
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDash() {
    const e = state.event, t = totals();
    const heads = state.guests.reduce((a, x) => a + (x.status === 'yes' ? (+x.party || 1) : 0), 0);
    const yes = state.guests.filter((x) => x.status === 'yes').length;
    const pending = state.guests.filter((x) => x.status === 'pending' || x.status === 'maybe').length;
    $('#dashHero').innerHTML = `<h2>${esc(e.title || 'Your event')}</h2>
      <div class="meta">${esc(TEMPLATES[e.template].ribbon)} · ${niceDate(e.date)} · ${esc(e.venue)}, ${esc(e.city)}</div>
      <span class="cd">⏳ ${countdown(e.date)}</span>`;
    $('#dKpis').innerHTML =
      kpi('RSVP yes', yes, heads + ' heads', 'good') +
      kpi('Collected', ghs(t.collected), 'of ' + ghs(t.pledged) + ' pledged') +
      kpi('Vendor balance', ghs(t.vDue), state.vendors.length + ' vendors', 'bad') +
      kpi('To chase', pending, 'maybe / pending', 'warn');
    renderLedgerAIInto('#dashAI', t);
    $('#dGuests').innerHTML = miniGuests();
    $('#dMoney').innerHTML = miniMoney(t);
  }
  function renderLedgerAIInto(sel, t) {
    const box = $(sel); if (!box) return;
    const tmp = ce('div'); const save = $('#ledgerAI');
    // reuse logic
    const nUnpaid = state.contributors.filter((c) => c.paid < c.pledge).length;
    if (t.projected < 0) {
      box.className = 'ai-note';
      box.innerHTML = t.toCollect > 0
        ? `🤖 <b>Heads up:</b> projected <b>${ghs(-t.projected)} short</b> of vendor costs. Chase ${nUnpaid} pledge(s); caterer-type balances loom.`
        : `🤖 <b>Shortfall:</b> pledges are in but still <b>${ghs(-t.projected)} under</b> vendor cost. Raise more or cut scope.`;
    } else { box.className = 'ai-note ok'; box.innerHTML = `🤖 <b>On track:</b> pledges cover vendor costs with ${ghs(t.projected)} to spare. Chase ${ghs(t.toCollect)} still outstanding.`; }
  }
  function miniGuests() {
    const top = state.guests.slice(0, 5).map((x) => `<tr><td><b>${esc(x.name)}</b></td><td><span class="tag ${x.status}">${x.status}</span></td><td style="text-align:right">${esc(x.party)}</td></tr>`).join('');
    return `<table class="tbl"><thead><tr><th>Guest</th><th>RSVP</th><th style="text-align:right">Party</th></tr></thead><tbody>${top || '<tr><td>No guests</td></tr>'}</tbody></table>`;
  }
  function miniMoney(t) {
    return `<table class="tbl"><tbody>
      <tr><td>Pledged</td><td style="text-align:right"><b>${ghs(t.pledged)}</b></td></tr>
      <tr><td>Collected</td><td style="text-align:right;color:#0b6e4f"><b>${ghs(t.collected)}</b></td></tr>
      <tr><td>Still to collect</td><td style="text-align:right;color:#c8851f"><b>${ghs(t.toCollect)}</b></td></tr>
      <tr><td>Owed to vendors</td><td style="text-align:right;color:#c0392b"><b>${ghs(t.vDue)}</b></td></tr>
      <tr><td>Cash in hand</td><td style="text-align:right"><b>${t.cash < 0 ? '-' : ''}${ghs(Math.abs(t.cash))}</b></td></tr>
    </tbody></table>`;
  }
  function kpi(lab, val, sub, cls) {
    return `<div class="kpi ${cls || ''}"><div class="lab">${lab}</div><div class="val">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  }

  /* ============================================================
     WIRING
     ============================================================ */
  function switchTab(name) {
    $$('.nav-i').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    if (name === 'guests') renderGuests();
    if (name === 'money') renderMoney();
    if (name === 'dashboard') renderDash();
    if (name === 'design') renderPreview();
  }

  function init() {
    state = load();
    // nav
    $$('.nav-i').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    // device toggle
    $$('#pvToggle button').forEach((b) => b.addEventListener('click', () => {
      $$('#pvToggle button').forEach((x) => x.classList.toggle('on', x === b));
      $('#pvWrap').className = 'pv-wrap ' + b.dataset.dev;
    }));
    // editor
    buildEditor();
    $('#schAdd').addEventListener('click', addSchedule);
    // guests
    $('#gAdd').addEventListener('click', addGuest);
    $('#gName').addEventListener('keydown', (e) => { if (e.key === 'Enter') addGuest(); });
    $('#gBody').addEventListener('click', (e) => { const d = e.target.closest('[data-delg]'); if (d) { state.guests = state.guests.filter((x) => x.id !== d.dataset.delg); renderGuests(); renderDash(); save(true); } });
    // money
    $('#cAdd').addEventListener('click', () => {
      const n = $('#cName').value.trim(); if (!n) { toast('Enter a name'); return; }
      state.contributors.push({ id: g(), name: n, sub: $('#cSub').value || 'Guest', pledge: +$('#cPledge').value || 0, paid: +$('#cPaid').value || 0 });
      $('#cName').value = ''; $('#cPledge').value = ''; $('#cPaid').value = '';
      renderMoney(); renderDash(); save(true);
    });
    $('#vAdd').addEventListener('click', () => {
      const n = $('#vName').value.trim(); if (!n) { toast('Enter a vendor'); return; }
      state.vendors.push({ id: g(), name: n, cat: $('#vCat').value || 'Vendor', total: +$('#vTotal').value || 0, paid: +$('#vPaid').value || 0 });
      $('#vName').value = ''; $('#vTotal').value = ''; $('#vPaid').value = '';
      renderMoney(); renderDash(); save(true);
    });
    $('#cBody').addEventListener('click', (e) => {
      const pay = e.target.closest('[data-payc]'); const del = e.target.closest('[data-delc]');
      if (pay) { const c = state.contributors.find((x) => x.id === pay.dataset.payc); if (c) c.paid = c.pledge; renderMoney(); renderDash(); save(true); }
      if (del) { state.contributors = state.contributors.filter((x) => x.id !== del.dataset.delc); renderMoney(); renderDash(); save(true); }
    });
    $('#vBody').addEventListener('click', (e) => { const d = e.target.closest('[data-delv]'); if (d) { state.vendors = state.vendors.filter((x) => x.id !== d.dataset.delv); renderMoney(); renderDash(); save(true); } });
    // toolbar
    $('#btnSave').addEventListener('click', () => save(true));
    $('#btnReset').addEventListener('click', () => { if (confirm('Reset the studio to the sample event? Your changes will be cleared.')) { state = seed(); save(); buildEditor(); renderPreview(); switchTab('design'); toast('Reset to sample'); } });

    const gc = $('#gCount'); if (gc) gc.textContent = state.guests.length;
    renderPreview();
    save(); // mark saved baseline
  }

  document.addEventListener('DOMContentLoaded', init);
})();
