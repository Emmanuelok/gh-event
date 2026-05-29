/* ============================================================
   Durbar Studio — live event design studio (client-side app)
   State persists in localStorage. Uses window.DURBAR (shared-event.js)
   so the live preview matches the guest page exactly.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const ce = (t, cls) => { const e = document.createElement(t); if (cls) e.className = cls; return e; };
  const D = window.DURBAR;
  const THEMES = D.THEMES, TEMPLATES = D.TEMPLATES, TPL_LABEL = D.TPL_LABEL, FONTS = D.FONTS;
  const ghs = D.ghs, esc = D.esc, niceDate = D.niceDate, countdown = D.countdown;

  const CITIES = ['Accra', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale', 'Tema', 'Koforidua', 'Sunyani', 'Ho', 'Wa', 'Bolgatanga', 'Sekondi', 'Techiman', 'Obuasi'];
  const GROUPS = ['Family', 'Friends', 'VIP', 'Church', 'School', 'Work', 'Team', 'Committee'];
  const STATUSES = ['yes', 'maybe', 'no', 'pending'];
  function g() { return 'x' + Math.random().toString(36).slice(2, 9); }

  /* ---------- default state ---------- */
  function seed() {
    return {
      event: {
        template: 'white-wedding', theme: 'green-gold',
        title: 'Ama & Kwame', subtitle: 'are getting married',
        hosts: 'With the blessing of the Mensah & Osei families', hashtag: 'AmaWedsKwame',
        date: '2026-12-14T15:00', venue: 'Golden Tulip', city: 'Kumasi',
        address: 'Rama Road, Adum, Kumasi', mapUrl: '', mapNote: 'Parking available at the rear gate.',
        story: 'Two families, one celebration. Join us as we say "I do" — surrounded by love, kente and joy. Your presence is the greatest gift.',
        dressCode: 'Royal green & gold', displayFont: 'serif', fontPair: 'classic',
        cover: '', gallery: [],
        schedule: [
          { time: '09:00', label: 'Traditional rites — Manhyia' },
          { time: '12:30', label: 'Church blessing — Cathedral' },
          { time: '15:00', label: 'Reception — Golden Tulip' },
        ],
        travel: [
          { title: 'Golden Tulip Kumasi', detail: 'Our recommended hotel — mention “Ama & Kwame” for the group rate.', url: '' },
          { title: 'Parking & getting there', detail: 'Free parking at the rear gate; overflow along Rama Road.', url: '' },
        ],
        faq: [
          { q: 'Can I bring the children?', a: 'We adore them! Little ones are welcome at the daytime events; the evening reception is adults-only.' },
          { q: 'What should I wear?', a: 'Royal green & gold — kente accents are warmly welcome.' },
          { q: 'How do I send a gift?', a: 'Tap “Send a gift via MoMo” on this page; it is recorded for the couple instantly.' },
        ],
        rsvpDeadline: '2026-12-01', allowPlusOnes: true,
        contribution: { enabled: true, label: 'Send a gift via MoMo', momo: '024 000 0000', goal: 20000 },
        registry: {
          enabled: true, heading: 'Registry & funds',
          note: 'Your presence is the greatest gift — but if you wish to bless us further:',
          funds: [
            { id: g(), icon: '🏝️', title: 'Honeymoon fund', desc: 'Help us toward our dream getaway.', goal: 8000 },
            { id: g(), icon: '🏠', title: 'Our first home', desc: 'Towards setting up our new home together.', goal: 12000 },
          ],
        },
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
      invites: defaultInvites(),
    };
  }
  function blankState() {
    const s = seed();
    Object.assign(s.event, { title: 'New event', subtitle: '', hosts: '', hashtag: '', story: '', cover: '', gallery: [], travel: [], faq: [], registry: { enabled: false, heading: 'Registry & funds', note: '', funds: [] }, dressCode: '', mapNote: '', mapUrl: '', schedule: [{ time: '', label: '' }] });
    s.event.date = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 16);
    s.guests = []; s.contributors = []; s.vendors = [];
    return s;
  }

  /* ---------- persistence ---------- */
  const KEY = 'durbar.studio.v2';
  let state;
  function load() { try { const r = localStorage.getItem(KEY); if (r) return migrate(JSON.parse(r)); } catch (e) {} return seed(); }
  function migrate(s) { // ensure new fields exist on older saves — never inject demo content
    const base = seed().event;
    base.travel = []; base.faq = []; base.fontPair = '';
    base.registry = { enabled: false, heading: 'Registry & funds', note: '', funds: [] };
    s.event = Object.assign({}, base, s.event);
    s.event.gallery = Array.isArray(s.event.gallery) ? s.event.gallery : [];
    s.event.travel = Array.isArray(s.event.travel) ? s.event.travel : [];
    s.event.faq = Array.isArray(s.event.faq) ? s.event.faq : [];
    if (!s.event.registry || typeof s.event.registry !== 'object') s.event.registry = { enabled: false, heading: 'Registry & funds', note: '', funds: [] };
    if (!Array.isArray(s.event.registry.funds)) s.event.registry.funds = [];
    if (!s.event.fontPair) s.event.fontPair = (THEMES[s.event.theme] || {}).font || 'classic';
    s.invites = Object.assign(defaultInvites(), s.invites || {});
    return s;
  }
  let saveT;
  let remoteRsvps = [], remoteContribs = []; // responses captured via the shared link (display-only)
  function save(flash) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('⚠️ Browser storage full — remove a photo'); return; }
    const s = $('#saveState'); if (s) { s.textContent = 'All changes saved'; s.classList.add('saved'); }
    if (flash) toast('Saved ✓');
    if (window.__studio && window.__studio.onSave) { try { window.__studio.onSave(state); } catch (e) {} }
    clearTimeout(saveT);
  }
  function touched() { const s = $('#saveState'); if (s) { s.textContent = 'Saving…'; s.classList.remove('saved'); } clearTimeout(saveT); saveT = setTimeout(save, 500); }
  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }

  /* ---------- image downscale ---------- */
  function readImage(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const sc = Math.min(1, maxW / img.width);
          const c = ce('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ============================================================
     LIVE PREVIEW (shared renderer)
     ============================================================ */
  function renderPreview() {
    const wrap = $('#pvWrap');
    D.applyTheme(wrap, state.event.theme, state.event.fontPair);
    const collected = state.contributors.reduce((a, c) => a + (+c.paid || 0), 0);
    const fundTotals = {};
    state.contributors.forEach((c) => { if (c.fund) fundTotals[c.fund] = (fundTotals[c.fund] || 0) + (+c.paid || 0); });
    remoteContribs.forEach((c) => { if (c.fund) fundTotals[c.fund] = (fundTotals[c.fund] || 0) + (+c.amount || 0); });
    wrap.innerHTML = D.renderEventPage(state.event, { collected: collected, fundTotals: fundTotals, mode: 'preview' });
  }

  /* ============================================================
     EDITOR
     ============================================================ */
  function buildEditor() {
    const e = state.event;
    $$('.ed-head').forEach((h) => h.onclick = () => h.parentElement.classList.toggle('open'));

    // templates
    const tg = $('#tplGrid');
    tg.innerHTML = Object.keys(TEMPLATES).map((k) => {
      const th = THEMES[TEMPLATES[k].theme];
      return `<button class="tpl ${k === e.template ? 'sel' : ''}" data-tpl="${k}"><span class="nm"><span class="dot" style="background:${th.primary}"></span>${TPL_LABEL[k]}</span></button>`;
    }).join('');
    tg.onclick = (ev) => {
      const b = ev.target.closest('[data-tpl]'); if (!b) return;
      const k = b.dataset.tpl, t = TEMPLATES[k];
      e.template = k; e.theme = t.theme; e.subtitle = t.sub; e.dressCode = t.dress; e.contribution.label = t.gift;
      e.fontPair = (THEMES[t.theme] || {}).font || 'classic';
      $$('.tpl', tg).forEach((x) => x.classList.toggle('sel', x.dataset.tpl === k));
      syncFields(); renderSwatches(); renderPreview(); touched(); toast(TPL_LABEL[k] + ' template applied');
    };

    renderSwatches();
    $('#swGrid').onclick = (ev) => { const b = ev.target.closest('[data-th]'); if (!b) return; e.theme = b.dataset.th; renderSwatches(); renderPreview(); touched(); };

    $('#fCity').innerHTML = CITIES.map((c) => `<option ${c === e.city ? 'selected' : ''}>${c}</option>`).join('');
    $('#fFont').innerHTML = Object.keys(FONTS).map((k) => `<option value="${k}">${FONTS[k].label}</option>`).join('');

    // generic binds
    $$('[data-bind]').forEach((el) => {
      const evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
      el.oninput = el.onchange = null;
      el.addEventListener(evt, () => {
        const path = el.dataset.bind.split('.');
        let o = state.event; for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
        o[path[path.length - 1]] = el.type === 'checkbox' ? el.checked : el.value;
        renderPreview(); touched();
      });
    });

    // cover upload
    $('#fCoverFile').addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try { e.cover = await readImage(f, 1280, 0.72); renderCover(); renderPreview(); save(true); }
      catch (x) { toast('Could not read image'); }
      ev.target.value = '';
    });
    $('#fCoverRemove').addEventListener('click', () => { e.cover = ''; renderCover(); renderPreview(); save(true); });

    // gallery upload
    $('#fGalleryFile').addEventListener('change', async (ev) => {
      const files = Array.from(ev.target.files).slice(0, 8 - e.gallery.length);
      for (const f of files) { try { e.gallery.push(await readImage(f, 520, 0.7)); } catch (x) {} }
      renderGallery(); renderPreview(); save(true);
      ev.target.value = '';
    });
    $('#galleryStrip').addEventListener('click', (ev) => {
      const d = ev.target.closest('[data-delpic]'); if (d) { e.gallery.splice(+d.dataset.delpic, 1); renderGallery(); renderPreview(); save(true); }
    });

    buildSchedule();
    buildTravel();
    buildFaq();
    buildRegistry();
    renderCover();
    renderGallery();
    syncFields();
  }
  function renderSwatches() {
    $('#swGrid').innerHTML = Object.keys(THEMES).map((k) => {
      const th = THEMES[k], fp = FONTS[th.font] || FONTS.classic;
      return `<button type="button" class="thm ${k === state.event.theme ? 'sel' : ''}" data-th="${k}" title="${themeLabel(k)}">
        <span class="thm-pv" style="background:linear-gradient(135deg,${th.primary},${th.accent})"><span class="thm-aa" style="font-family:${fp.display.replace(/"/g, "'")}">Aa</span></span>
        <span class="thm-nm">${themeLabel(k)}</span></button>`;
    }).join('');
  }
  function renderCover() {
    const e = state.event;
    $('#coverThumb').style.backgroundImage = e.cover ? `url('${e.cover}')` : 'none';
    $('#coverThumb').classList.toggle('empty', !e.cover);
    $('#fCoverRemove').style.display = e.cover ? '' : 'none';
  }
  function renderGallery() {
    const e = state.event;
    $('#galleryStrip').innerHTML = e.gallery.length
      ? e.gallery.map((src, i) => `<div class="gthumb" style="background-image:url('${src}')"><button class="gdel" data-delpic="${i}">✕</button></div>`).join('')
      : '<div class="g-empty">No photos yet — add up to 8.</div>';
    $('#galCount').textContent = e.gallery.length + '/8';
  }
  function syncFields() {
    const e = state.event;
    const set = (sel, v) => { const el = $(sel); if (el) { if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v; } };
    set('#fTitle', e.title); set('#fSub', e.subtitle); set('#fHosts', e.hosts); set('#fHashtag', e.hashtag);
    set('#fDate', e.date); set('#fVenue', e.venue); set('#fCity', e.city); set('#fAddress', e.address);
    set('#fStory', e.story); set('#fDress', e.dressCode); set('#fMapNote', e.mapNote); set('#fMapUrl', e.mapUrl);
    set('#fFont', e.fontPair); set('#fRsvp', e.rsvpDeadline); set('#fPlus', e.allowPlusOnes);
    set('#fContribOn', e.contribution.enabled); set('#fContribLabel', e.contribution.label);
    set('#fMomo', e.contribution.momo); set('#fGoal', e.contribution.goal);
    const r = e.registry || {};
    set('#fRegOn', r.enabled); set('#fRegHeading', r.heading); set('#fRegNote', r.note);
  }
  function buildSchedule() {
    const box = $('#schList'); const e = state.event; box.innerHTML = '';
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
  function buildTravel() {
    const box = $('#travList'), e = state.event; box.innerHTML = '';
    (e.travel || []).forEach((it, i) => {
      const row = ce('div', 'stack-row');
      row.innerHTML = `<div class="sr-main">
        <input type="text" value="${esc(it.title)}" placeholder="Place / topic (e.g. Golden Tulip Hotel)" data-ti="${i}" data-tk="title">
        <input type="text" value="${esc(it.detail)}" placeholder="Detail — rate, distance, note" data-ti="${i}" data-tk="detail">
        <input type="text" value="${esc(it.url || '')}" placeholder="Link (optional) — maps, booking…" data-ti="${i}" data-tk="url"></div>
        <button class="mini-x" data-travdel="${i}" title="Remove">✕</button>`;
      box.appendChild(row);
    });
    const c = $('#travCount'); if (c) c.textContent = (e.travel || []).length ? e.travel.length + ' added' : '';
    box.oninput = (ev) => { const t = ev.target; if (t.dataset.ti != null) { e.travel[+t.dataset.ti][t.dataset.tk] = t.value; renderPreview(); touched(); } };
    box.onclick = (ev) => { const d = ev.target.closest('[data-travdel]'); if (d) { e.travel.splice(+d.dataset.travdel, 1); buildTravel(); renderPreview(); touched(); } };
  }
  function addTravel() { const e = state.event; e.travel = e.travel || []; e.travel.push({ title: '', detail: '', url: '' }); buildTravel(); touched(); }
  function buildFaq() {
    const box = $('#faqList'), e = state.event; box.innerHTML = '';
    (e.faq || []).forEach((it, i) => {
      const row = ce('div', 'stack-row');
      row.innerHTML = `<div class="sr-main">
        <input type="text" value="${esc(it.q)}" placeholder="Question (e.g. Can I bring my kids?)" data-fi="${i}" data-fk="q">
        <textarea placeholder="Answer" data-fi="${i}" data-fk="a">${esc(it.a)}</textarea></div>
        <button class="mini-x" data-faqdel="${i}" title="Remove">✕</button>`;
      box.appendChild(row);
    });
    const c = $('#faqCount'); if (c) c.textContent = (e.faq || []).length ? e.faq.length + ' added' : '';
    box.oninput = (ev) => { const t = ev.target; if (t.dataset.fi != null) { e.faq[+t.dataset.fi][t.dataset.fk] = t.value; renderPreview(); touched(); } };
    box.onclick = (ev) => { const d = ev.target.closest('[data-faqdel]'); if (d) { e.faq.splice(+d.dataset.faqdel, 1); buildFaq(); renderPreview(); touched(); } };
  }
  function addFaq() { const e = state.event; e.faq = e.faq || []; e.faq.push({ q: '', a: '' }); buildFaq(); touched(); }
  function fundTitle(id) { if (!id) return ''; const f = ((state.event.registry && state.event.registry.funds) || []).find((x) => x.id === id); return f ? f.title : ''; }
  function buildRegistry() {
    const box = $('#regList'), e = state.event; const funds = (e.registry && e.registry.funds) || [];
    box.innerHTML = '';
    funds.forEach((f, i) => {
      const row = ce('div', 'stack-row fund-row');
      row.innerHTML = `<div class="sr-main">
        <div class="fund-top"><input class="fund-ic" type="text" value="${esc(f.icon || '🎁')}" maxlength="2" data-ri="${i}" data-rk="icon" aria-label="Icon">
          <input type="text" value="${esc(f.title)}" placeholder="Fund name (e.g. Honeymoon fund)" data-ri="${i}" data-rk="title"></div>
        <input type="text" value="${esc(f.desc || '')}" placeholder="Short description (optional)" data-ri="${i}" data-rk="desc">
        <input type="number" value="${f.goal || ''}" placeholder="Goal in GHS (optional)" data-ri="${i}" data-rk="goal"></div>
        <button class="mini-x" data-regdel="${i}" title="Remove">✕</button>`;
      box.appendChild(row);
    });
    const c = $('#regCount'); if (c) c.textContent = funds.length ? funds.length + (funds.length > 1 ? ' funds' : ' fund') : '';
    box.oninput = (ev) => { const t = ev.target; if (t.dataset.ri != null) { const f = e.registry.funds[+t.dataset.ri]; f[t.dataset.rk] = t.dataset.rk === 'goal' ? (+t.value || 0) : t.value; renderPreview(); touched(); } };
    box.onclick = (ev) => { const d = ev.target.closest('[data-regdel]'); if (d) { e.registry.funds.splice(+d.dataset.regdel, 1); buildRegistry(); renderPreview(); touched(); } };
  }
  function addFund() {
    const e = state.event; e.registry = e.registry || { enabled: true, heading: 'Registry & funds', note: '', funds: [] };
    e.registry.enabled = true; e.registry.funds = e.registry.funds || [];
    e.registry.funds.push({ id: g(), icon: '🎁', title: '', desc: '', goal: 0 });
    buildRegistry(); syncFields(); renderPreview(); touched();
  }

  /* ============================================================
     GUESTS
     ============================================================ */
  // Link-captured responses are merged in for display only (kept out of saved state)
  function mapRsvp(r) { return { id: 'r' + r.id, sid: r.id, name: r.name, phone: r.phone || '', group: r.source === 'host' ? 'added' : 'via link', status: r.status, party: +r.party || 0, note: r.note || '', _remote: true }; }
  function mapContrib(c) { const ft = fundTitle(c.fund); return { id: 'c' + c.id, sid: c.id, name: c.name, sub: 'via link · ' + (c.method || 'momo') + (ft ? ' → ' + ft : ''), pledge: +c.amount || 0, paid: +c.amount || 0, fund: c.fund || '', _remote: true }; }
  function allGuests() { return state.guests.concat(remoteRsvps.map(mapRsvp)); }
  function allContribs() { return state.contributors.concat(remoteContribs.map(mapContrib)); }
  function downloadCSV(filename, rows) {
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const blob = new Blob([rows.map((r) => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = ce('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  }
  function exportGuests() {
    const rows = [['Name', 'Phone', 'Group', 'RSVP', 'Party', 'Note']];
    allGuests().forEach((x) => rows.push([x.name, x.phone, x.group, x.status, x.party, x.note]));
    downloadCSV('durbar-guests.csv', rows); toast('Guest list exported');
  }
  function exportMoney() {
    const rows = [['Name', 'Detail', 'Pledged', 'Paid']];
    allContribs().forEach((c) => rows.push([c.name, c.sub, c.pledge, c.paid]));
    rows.push(['', '', '', '']);
    state.vendors.forEach((v) => rows.push([v.name, v.cat + ' (vendor cost)', v.total, v.paid]));
    downloadCSV('durbar-money.csv', rows); toast('Ledger exported');
  }
  function renderGuests() {
    const list = allGuests();
    const gc = $('#gCount'); if (gc) gc.textContent = list.length;
    const heads = list.reduce((a, x) => a + (x.status === 'yes' ? (+x.party || 1) : 0), 0);
    const by = (s) => list.filter((x) => x.status === s).length;
    $('#gKpis').innerHTML = kpi('Invited', list.length, '') + kpi('Coming', by('yes'), heads + ' heads', 'good') +
      kpi('Maybe / pending', by('maybe') + by('pending'), 'to chase', 'warn') + kpi("Can't make it", by('no'), '', 'bad');
    animKpis('#gKpis');
    $('#gBody').innerHTML = list.length ? list.map((x) => `<tr>
      <td><b>${esc(x.name)}</b><br><span class="dim">${esc(x.phone || '')}</span></td>
      <td><span class="tag grp">${esc(x.group)}</span></td>
      <td><span class="tag ${x.status}">${x.status}</span></td>
      <td>${esc(x.party)}</td><td class="dim">${esc(x.note || '')}</td>
      <td style="text-align:right">${x._remote ? `<button class="x-btn" data-delsrv="${x.sid}" title="Remove this response">✕</button>` : `<button class="x-btn" data-delg="${x.id}">✕</button>`}</td></tr>`).join('')
      : `<tr><td colspan="6"><div class="empty">No guests yet — add your first above, or share the page and let them RSVP.</div></td></tr>`;
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
     MONEY
     ============================================================ */
  function totals() {
    const cs = allContribs();
    const pledged = cs.reduce((a, c) => a + (+c.pledge || 0), 0);
    const collected = cs.reduce((a, c) => a + (+c.paid || 0), 0);
    const vTotal = state.vendors.reduce((a, v) => a + (+v.total || 0), 0);
    const vPaid = state.vendors.reduce((a, v) => a + (+v.paid || 0), 0);
    return { pledged, collected, toCollect: Math.max(0, pledged - collected), vTotal, vPaid, vDue: vTotal - vPaid, cash: collected - vPaid, projected: pledged - vTotal };
  }
  function renderMoney() {
    const t = totals();
    $('#mKpis').innerHTML = kpi('Pledged', ghs(t.pledged)) + kpi('Collected', ghs(t.collected), '', 'good') +
      kpi('To collect', ghs(t.toCollect), '', 'warn') + kpi('Owed to vendors', ghs(t.vDue), '', 'bad');
    animKpis('#mKpis');
    $('#cBody').innerHTML = allContribs().map((c) => {
      const st = c.paid >= c.pledge ? 'yes' : (c.paid > 0 ? 'maybe' : 'pending');
      const lbl = c.paid >= c.pledge ? 'paid' : (c.paid > 0 ? 'part' : 'pledged');
      const act = c._remote ? `<button class="x-btn" data-delsrvc="${c.sid}" title="Remove this contribution">✕</button>`
        : `${c.paid < c.pledge ? `<button class="btn btn-sm" data-payc="${c.id}">Mark paid</button> ` : ''}<button class="x-btn" data-delc="${c.id}">✕</button>`;
      return `<tr><td><b>${esc(c.name)}</b><br><span class="dim">${esc(c.sub)}</span></td>
        <td>${ghs(c.paid)} <span class="dim">/ ${ghs(c.pledge)}</span></td>
        <td><span class="tag ${st}">${lbl}</span></td>
        <td style="text-align:right">${act}</td></tr>`;
    }).join('');
    $('#vBody').innerHTML = state.vendors.map((v) => {
      const bal = (+v.total || 0) - (+v.paid || 0);
      return `<tr><td><b>${esc(v.name)}</b><br><span class="dim">${esc(v.cat)}</span></td>
        <td>${ghs(v.paid)} <span class="dim">/ ${ghs(v.total)}</span></td>
        <td>${bal <= 0 ? '<span class="tag yes">paid</span>' : '<span class="tag bad">' + ghs(bal) + ' due</span>'}</td>
        <td style="text-align:right"><button class="x-btn" data-delv="${v.id}">✕</button></td></tr>`;
    }).join('');
    aiInto('#ledgerAI', t, true);
  }
  function aiInto(sel, t, full) {
    const box = $(sel); if (!box) return;
    const nUnpaid = state.contributors.filter((c) => c.paid < c.pledge).length;
    if (t.projected < 0) {
      box.className = 'ai-note';
      box.innerHTML = t.toCollect > 0
        ? `🤖 <b>Money gap.</b> Even after collecting the ${ghs(t.toCollect)} still pledged, you'll be <b>${ghs(-t.projected)} short</b> of the ${ghs(t.vTotal)} vendor cost. Chase the ${nUnpaid} unfulfilled pledge(s)${full ? ' and trim scope' : ''}. Cash in hand now: <b>${t.cash < 0 ? '-' : ''}${ghs(Math.abs(t.cash))}</b>.`
        : `🤖 <b>Structural shortfall.</b> All pledges are in, but it's still <b>${ghs(-t.projected)} short</b> of the ${ghs(t.vTotal)} vendor cost. Raise more or cut scope. Outstanding vendor balances: <b>${ghs(t.vDue)}</b>.`;
    } else {
      box.className = 'ai-note ok';
      box.innerHTML = `🤖 <b>You're covered.</b> Pledges of ${ghs(t.pledged)} exceed the ${ghs(t.vTotal)} vendor cost by <b>${ghs(t.projected)}</b>. Keep chasing the ${ghs(t.toCollect)} outstanding. 🎉`;
    }
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDash() {
    const e = state.event, t = totals();
    const gs = allGuests();
    const heads = gs.reduce((a, x) => a + (x.status === 'yes' ? (+x.party || 1) : 0), 0);
    const yes = gs.filter((x) => x.status === 'yes').length;
    const pending = gs.filter((x) => x.status === 'pending' || x.status === 'maybe').length;
    $('#dashHero').innerHTML = `<h2>${esc(e.title || 'Your event')}</h2>
      <div class="meta">${esc(TEMPLATES[e.template].ribbon)} · ${niceDate(e.date)} · ${esc(e.venue)}, ${esc(e.city)}</div>
      <span class="cd">⏳ ${countdown(e.date)}</span>`;
    $('#dKpis').innerHTML = kpi('RSVP yes', yes, heads + ' heads', 'good') + kpi('Collected', ghs(t.collected), 'of ' + ghs(t.pledged) + ' pledged') +
      kpi('Vendor balance', ghs(t.vDue), state.vendors.length + ' vendors', 'bad') + kpi('To chase', pending, 'maybe / pending', 'warn');
    animKpis('#dKpis');
    aiInto('#dashAI', t, false);
    $('#dGuests').innerHTML = `<table class="tbl"><thead><tr><th>Guest</th><th>RSVP</th><th style="text-align:right">Party</th></tr></thead><tbody>${gs.slice(0, 6).map((x) => `<tr><td><b>${esc(x.name)}</b></td><td><span class="tag ${x.status}">${x.status}</span></td><td style="text-align:right">${esc(x.party)}</td></tr>`).join('') || '<tr><td>No guests</td></tr>'}</tbody></table>`;
    $('#dMoney').innerHTML = `<table class="tbl"><tbody>
      <tr><td>Pledged</td><td class="r"><b>${ghs(t.pledged)}</b></td></tr>
      <tr><td>Collected</td><td class="r" style="color:#0b6e4f"><b>${ghs(t.collected)}</b></td></tr>
      <tr><td>Still to collect</td><td class="r" style="color:#c8851f"><b>${ghs(t.toCollect)}</b></td></tr>
      <tr><td>Owed to vendors</td><td class="r" style="color:#c0392b"><b>${ghs(t.vDue)}</b></td></tr>
      <tr><td>Cash in hand</td><td class="r"><b>${t.cash < 0 ? '-' : ''}${ghs(Math.abs(t.cash))}</b></td></tr></tbody></table>`;
  }
  function kpi(lab, val, sub, cls) { return `<div class="kpi ${cls || ''}"><div class="lab">${lab}</div><div class="val">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`; }

  /* ============================================================
     CRAFT — count-ups, confetti, ⌘K command palette
     (harvested from the Studio OS, re-skinned warm)
     ============================================================ */
  function countUp(el) {
    const txt = el.textContent, m = txt.match(/-?[\d,]+(?:\.\d+)?/);
    if (!m) return;
    const target = +m[0].replace(/,/g, ''); if (!isFinite(target) || target === 0) return;
    const pre = txt.slice(0, m.index), suf = txt.slice(m.index + m[0].length);
    el.classList.add('cu');
    const t0 = performance.now(), dur = 600;
    requestAnimationFrame(function step(t) {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
      el.textContent = pre + v.toLocaleString('en-GH') + suf;
      if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
    });
  }
  function animKpis(sel) { requestAnimationFrame(() => $$(sel + ' .val').forEach(countUp)); }

  function confetti() {
    const c = $('#confetti'); if (!c || !c.getContext) return;
    const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#0b6e4f', '#e8a33d', '#c0392b', '#10916a', '#f4b400'];
    const P = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 13, vy: Math.random() * -13 - 4, c: cols[(Math.random() * cols.length) | 0], s: 4 + Math.random() * 6, r: Math.random() * 6 }));
    let f = 0;
    (function loop() {
      x.clearRect(0, 0, c.width, c.height);
      P.forEach((p) => { p.vy += .42; p.x += p.vx; p.y += p.vy; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); });
      if (++f < 110) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height);
    })();
  }

  const themeLabel = (k) => String(k).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' & ');
  let cmds = [], cmdSel = 0;
  function buildCmds() {
    cmds = [];
    [['dashboard', '📊', 'Dashboard'], ['design', '🎨', 'Design event'], ['guests', '👥', 'Guests & RSVP'], ['invite', '✉️', 'Invite guests'], ['money', '💛', 'Money & ledger']]
      .forEach(([id, ic, label]) => cmds.push({ g: 'Go to', ic, label, run: () => switchTab(id) }));
    const click = (id) => { const b = $(id); if (b) b.click(); };
    cmds.push({ g: 'Action', ic: '🔗', label: 'Publish / get share link', run: () => click('#btnPublish') });
    cmds.push({ g: 'Action', ic: '👁', label: 'Preview as guest', run: () => click('#btnGuest') });
    cmds.push({ g: 'Action', ic: '💾', label: 'Save now', run: () => click('#btnSave') });
    cmds.push({ g: 'Action', ic: '➕', label: 'Add a guest', run: () => { switchTab('guests'); setTimeout(() => { const n = $('#gName'); if (n) n.focus(); }, 70); } });
    Object.keys(THEMES).forEach((k) => cmds.push({ g: 'Switch theme', ic: '🎨', label: themeLabel(k), run: () => { state.event.theme = k; renderSwatches(); renderPreview(); touched(); switchTab('design'); toast(themeLabel(k) + ' theme applied'); } }));
  }
  function openCmd() { const k = $('#cmdk'); if (!k) return; buildCmds(); k.classList.add('open'); $('#cmdkInput').value = ''; cmdSel = 0; drawCmd(''); $('#cmdkInput').focus(); }
  function closeCmd() { const k = $('#cmdk'); if (k) k.classList.remove('open'); }
  function filteredCmds(q) { q = (q || '').toLowerCase().trim(); return q ? cmds.filter((c) => (c.label + ' ' + c.g).toLowerCase().includes(q)) : cmds; }
  function drawCmd(q) {
    const list = filteredCmds(q); cmdSel = Math.max(0, Math.min(cmdSel, list.length - 1));
    let html = '', lg = '';
    list.forEach((c, i) => { if (c.g !== lg) { html += `<div class="cg">${c.g}</div>`; lg = c.g; } html += `<div class="res${i === cmdSel ? ' sel' : ''}" data-i="${i}"><span class="ic">${c.ic}</span>${esc(c.label)}<span class="hint">↵</span></div>`; });
    $('#cmdkResults').innerHTML = html || '<div class="cg">No matches</div>';
    $$('#cmdkResults .res').forEach((el) => el.onclick = () => { const c = filteredCmds($('#cmdkInput').value)[+el.dataset.i]; if (c) { c.run(); closeCmd(); } });
  }

  /* ============================================================
     INVITE — WhatsApp / SMS / copy invitations (no paid API)
     ============================================================ */
  function defaultInvites() {
    return {
      active: 'invitation',
      invitation: "You're warmly invited to {event}! 🎉\n\n🗓️ {date}\n📍 {venue}\n\nKindly RSVP and see all the details here:\n{link}\n\nWe can't wait to celebrate with you. 💚",
      reminder: "Hello {name}! 💛 A gentle reminder that {event} is almost here — {date} at {venue}.\n\nPlease RSVP if you haven't yet so we can plan well:\n{link}\n\nAkpe / Medaase!",
      thanks: "Medaase, {name}! 🙏 Thank you for celebrating {event} with us — it meant the world to have you there. 💚",
    };
  }
  function waPhone(p) {
    let d = String(p || '').replace(/\D/g, ''); if (!d) return '';
    if (d.startsWith('233')) return d;
    if (d.startsWith('0')) return '233' + d.slice(1);
    return d.length <= 9 ? '233' + d : d;
  }
  function shareLink() { return (window.__cloud && window.__cloud.getLink && window.__cloud.getLink()) || ''; }
  function fillTemplate(tpl, g) {
    const e = state.event, link = shareLink() || '[publish your event to get the link]';
    return String(tpl || '')
      .replace(/\{name\}/g, g ? (g.name || '').split(' ')[0] : 'there')
      .replace(/\{event\}/g, e.title || 'our event')
      .replace(/\{date\}/g, niceDate(e.date))
      .replace(/\{venue\}/g, [e.venue, e.city].filter(Boolean).join(', ') || 'the venue')
      .replace(/\{link\}/g, link);
  }
  function renderInvite() {
    const root = $('#inviteRoot'); if (!root) return;
    const inv = state.invites || (state.invites = defaultInvites());
    const active = inv.active || 'invitation';
    const link = shareLink();
    const TPLS = [['invitation', '✉️ Invitation'], ['reminder', '🔔 Reminder'], ['thanks', '🙏 Thank-you']];
    root.innerHTML = `
      <div class="tab-h"><h2>✉️ Invitations &amp; messaging</h2><span class="pill-tip">WhatsApp-first · no app needed</span></div>
      <p class="sub">Write once, send personally. Durbar drops each guest's name and your event details into a WhatsApp, SMS or copyable message — with a link they tap to RSVP.</p>
      <div class="kpis" id="invKpis"></div>
      <div class="two">
        <div class="panel">
          <h3>1 · Your share link</h3>
          ${link
        ? `<p class="dim small">Anyone with this link opens your event, RSVPs and contributes — no app, no login.</p>
               <div class="share-link"><input id="invLink" readonly value="${esc(link)}"><button class="btn btn-pri" id="invCopyLink">Copy</button></div>
               <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-gold" id="invShareWa">📲 Share to WhatsApp</button><a class="btn" href="${esc(link)}" target="_blank">Open page →</a></div>`
        : `<p class="dim small">Publish your event to mint a public link you can send to guests.</p><button class="btn btn-pri" id="invPublish">🔗 Publish now</button>`}
        </div>
        <div class="panel">
          <h3>2 · Your message</h3>
          <div class="inv-tabs" id="invTabs">${TPLS.map(([k, l]) => `<button data-tpl="${k}" class="${k === active ? 'on' : ''}">${l}</button>`).join('')}</div>
          <textarea id="invMsg" class="inv-msg">${esc(inv[active] || '')}</textarea>
          <div class="merge-hint">Auto-filled tags: <code>{name}</code> <code>{event}</code> <code>{date}</code> <code>{venue}</code> <code>{link}</code></div>
        </div>
      </div>
      <div class="panel">
        <div class="ph"><h3>3 · Send to your guests</h3><span class="dim small">Sending or copying marks a guest “invited”.</span></div>
        <table class="tbl"><thead><tr><th>Guest</th><th>RSVP</th><th>Reach out</th><th>Invited</th></tr></thead><tbody id="invBody"></tbody></table>
      </div>`;
    $('#invTabs').onclick = (e) => { const b = e.target.closest('[data-tpl]'); if (!b) return; inv.active = b.dataset.tpl; save(); renderInvite(); };
    const ta = $('#invMsg'); if (ta) ta.addEventListener('input', () => { inv[inv.active || 'invitation'] = ta.value; touched(); });
    const cl = $('#invCopyLink'); if (cl) cl.onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => toast('Link copied')).catch(() => {}); };
    const sw = $('#invShareWa'); if (sw) sw.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(fillTemplate(inv[active], null)), '_blank');
    const pb = $('#invPublish'); if (pb) pb.onclick = () => $('#btnPublish').click();
    renderInviteList();
    renderInviteKpis();
  }
  function renderInviteKpis() {
    const box = $('#invKpis'); if (!box) return;
    const gs = state.guests || [];
    const invited = gs.filter((g) => g.invited).length;
    const responded = gs.filter((g) => ['yes', 'no', 'maybe'].includes(g.status)).length;
    box.innerHTML = kpi('Guests', gs.length) + kpi('Invited', invited, '', invited ? 'good' : '') +
      kpi('Responded', responded, '', 'good') + kpi('Yet to invite', Math.max(0, gs.length - invited), '', 'warn');
    animKpis('#invKpis');
  }
  function renderInviteList() {
    const body = $('#invBody'); if (!body) return;
    const gs = (state.guests || []).slice().sort((a, b) => (a.invited ? 1 : 0) - (b.invited ? 1 : 0));
    body.innerHTML = gs.length ? gs.map((g) => {
      const ph = (g.phone || '').replace(/\D/g, '');
      return `<tr>
        <td><b>${esc(g.name)}</b><br><span class="dim">${esc(g.phone || 'no phone')}${g.group ? ' · ' + esc(g.group) : ''}</span></td>
        <td><span class="tag ${g.status}">${esc(g.status)}</span></td>
        <td class="inv-acts">
          <button class="btn btn-sm" data-iact="wa" data-id="${g.id}">WhatsApp</button>
          ${ph ? `<button class="btn btn-sm" data-iact="sms" data-id="${g.id}">SMS</button>` : ''}
          <button class="btn btn-sm" data-iact="copy" data-id="${g.id}">Copy</button></td>
        <td><label class="inv-check"><input type="checkbox" data-iact="toggle" data-id="${g.id}" ${g.invited ? 'checked' : ''}></label></td>
      </tr>`;
    }).join('') : `<tr><td colspan="4"><div class="empty">No guests yet — add them in the <b>Guests</b> tab, then invite them here.</div></td></tr>`;
    body.onclick = (e) => {
      const b = e.target.closest('[data-iact]'); if (!b) return;
      const g = state.guests.find((x) => x.id === b.dataset.id); if (!g) return;
      const act = b.dataset.iact, msg = $('#invMsg') ? $('#invMsg').value : '';
      if (act === 'toggle') { g.invited = e.target.checked; save(); renderInviteKpis(); return; }
      const text = fillTemplate(msg, g);
      if (act === 'wa') { const p = waPhone(g.phone); window.open(p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
      else if (act === 'sms') { window.open(`sms:${(g.phone || '').replace(/\s+/g, '')}?&body=${encodeURIComponent(text)}`); }
      else if (act === 'copy') { if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Invite copied')).catch(() => toast('Copy failed')); }
      if (!g.invited) { g.invited = true; save(); const cb = body.querySelector(`[data-iact="toggle"][data-id="${g.id}"]`); if (cb) cb.checked = true; renderInviteKpis(); }
    };
  }

  /* ============================================================
     WIRING
     ============================================================ */
  function switchTab(name) {
    $$('.nav-i').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    if (name === 'guests') renderGuests();
    if (name === 'invite') renderInvite();
    if (name === 'money') renderMoney();
    if (name === 'dashboard') renderDash();
    if (name === 'design') renderPreview();
  }

  function init() {
    state = load();
    $$('.nav-i').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    $$('#pvToggle button').forEach((b) => b.addEventListener('click', () => {
      $$('#pvToggle button').forEach((x) => x.classList.toggle('on', x === b));
      $('#pvWrap').className = 'pv-wrap ' + b.dataset.dev;
    }));
    buildEditor();
    $('#schAdd').addEventListener('click', addSchedule);
    $('#travAdd').addEventListener('click', addTravel);
    $('#faqAdd').addEventListener('click', addFaq);
    $('#regAdd').addEventListener('click', addFund);
    // section-nav anchors inside the live preview scroll within the frame
    $('#pvWrap').addEventListener('click', (e) => {
      const a = e.target.closest('.ev-nav a[href^="#ev-"]'); if (!a) return;
      e.preventDefault(); const t = $('#pvWrap').querySelector(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    $('#btnGuest').addEventListener('click', () => { save(); window.open('event.html', '_blank'); });
    const ge = $('#gExport'); if (ge) ge.addEventListener('click', exportGuests);
    const me2 = $('#mExport'); if (me2) me2.addEventListener('click', exportMoney);

    $('#gAdd').addEventListener('click', addGuest);
    $('#gName').addEventListener('keydown', (e) => { if (e.key === 'Enter') addGuest(); });
    $('#gBody').addEventListener('click', (e) => {
      const d = e.target.closest('[data-delg]'); if (d) { state.guests = state.guests.filter((x) => x.id !== d.dataset.delg); renderGuests(); renderDash(); save(true); return; }
      const s = e.target.closest('[data-delsrv]'); if (s && window.__cloud && window.__cloud.deleteGuest) window.__cloud.deleteGuest(+s.dataset.delsrv);
    });

    $('#cAdd').addEventListener('click', () => {
      const n = $('#cName').value.trim(); if (!n) { toast('Enter a name'); return; }
      state.contributors.push({ id: g(), name: n, sub: $('#cSub').value || 'Guest', pledge: +$('#cPledge').value || 0, paid: +$('#cPaid').value || 0 });
      $('#cName').value = ''; $('#cPledge').value = ''; $('#cPaid').value = ''; renderMoney(); renderDash(); save(true);
    });
    $('#vAdd').addEventListener('click', () => {
      const n = $('#vName').value.trim(); if (!n) { toast('Enter a vendor'); return; }
      state.vendors.push({ id: g(), name: n, cat: $('#vCat').value || 'Vendor', total: +$('#vTotal').value || 0, paid: +$('#vPaid').value || 0 });
      $('#vName').value = ''; $('#vTotal').value = ''; $('#vPaid').value = ''; renderMoney(); renderDash(); save(true);
    });
    $('#cBody').addEventListener('click', (e) => {
      const pay = e.target.closest('[data-payc]'); const del = e.target.closest('[data-delc]'); const ds = e.target.closest('[data-delsrvc]');
      if (pay) { const c = state.contributors.find((x) => x.id === pay.dataset.payc); if (c) c.paid = c.pledge; renderMoney(); renderDash(); save(true); }
      if (del) { state.contributors = state.contributors.filter((x) => x.id !== del.dataset.delc); renderMoney(); renderDash(); save(true); }
      if (ds && window.__cloud && window.__cloud.deleteContribution) window.__cloud.deleteContribution(+ds.dataset.delsrvc);
    });
    $('#vBody').addEventListener('click', (e) => { const d = e.target.closest('[data-delv]'); if (d) { state.vendors = state.vendors.filter((x) => x.id !== d.dataset.delv); renderMoney(); renderDash(); save(true); } });

    $('#btnSave').addEventListener('click', () => save(true));
    $('#btnReset').addEventListener('click', () => { if (confirm('Reset the studio to the sample event? Your changes will be cleared.')) { state = seed(); save(); buildEditor(); renderPreview(); switchTab('design'); toast('Reset to sample'); } });

    window.__studio = {
      get: () => state,
      load: (s) => { state = migrate(s); buildEditor(); renderPreview(); switchTab('design'); },
      blank: () => blankState(),
      setRemote: (rsvps, contribs) => {
        remoteRsvps = rsvps || []; remoteContribs = contribs || [];
        const gc2 = $('#gCount'); if (gc2) gc2.textContent = allGuests().length;
        renderDash();
        const active = $('.nav-i.active');
        if (active && active.dataset.tab === 'guests') renderGuests();
        if (active && active.dataset.tab === 'money') renderMoney();
      },
      onSave: null,
      confetti,
    };

    // ⌘K command palette
    const cmdkBtn = $('#cmdkBtn'); if (cmdkBtn) cmdkBtn.addEventListener('click', openCmd);
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); } });
    const cmdk = $('#cmdk');
    if (cmdk) {
      cmdk.addEventListener('click', (e) => { if (e.target === cmdk) closeCmd(); });
      const ci = $('#cmdkInput');
      ci.addEventListener('input', () => { cmdSel = 0; drawCmd(ci.value); });
      ci.addEventListener('keydown', (e) => {
        const list = filteredCmds(ci.value);
        if (e.key === 'ArrowDown') { cmdSel = Math.min(cmdSel + 1, list.length - 1); drawCmd(ci.value); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { cmdSel = Math.max(cmdSel - 1, 0); drawCmd(ci.value); e.preventDefault(); }
        else if (e.key === 'Enter') { if (list[cmdSel]) { list[cmdSel].run(); closeCmd(); } }
        else if (e.key === 'Escape') closeCmd();
      });
    }

    const gc = $('#gCount'); if (gc) gc.textContent = state.guests.length;
    renderPreview();
    save();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
