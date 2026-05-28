/* ============================================================
   Durbar prototype — vanilla JS, no dependencies (low-data).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const ghs = (n) => 'GHS ' + Math.round(n).toLocaleString('en-GH');

  /* ---------- top-level view navigation ---------- */
  const views = $$('.view');
  const navLinks = $$('.mainnav a');

  function showView(id) {
    if (!id) return;
    let found = false;
    views.forEach((v) => {
      const on = v.id === id;
      v.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#mainnav') && $('#mainnav').classList.remove('open');
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  // Any element with data-nav navigates (nav links, hero CTAs, footer, etc.)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-nav]');
    if (t) {
      e.preventDefault();
      showView(t.dataset.nav);
    }
  });

  // mobile menu
  const navToggle = $('#navtoggle');
  if (navToggle) navToggle.addEventListener('click', () => $('#mainnav').classList.toggle('open'));

  // open correct view from hash on load
  const initial = (location.hash || '#overview').replace('#', '');
  showView($('#' + initial) ? initial : 'overview');

  /* ---------- product prototype tabs ---------- */
  const ptabs = $$('.ptab');
  const screens = $$('.screen');
  ptabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const s = tab.dataset.screen;
      ptabs.forEach((b) => b.classList.toggle('active', b === tab));
      screens.forEach((sc) => sc.classList.toggle('active', sc.dataset.screen === s));
    });
  });

  /* ---------- strategy section switcher ---------- */
  const stratNav = $('#stratNav');
  if (stratNav) {
    const accs = $$('.acc');
    $$('button', stratNav).forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.acc;
        $$('button', stratNav).forEach((b) => b.classList.toggle('active', b === btn));
        accs.forEach((p) => p.classList.toggle('active', p.dataset.acc === a));
      });
    });
  }

  /* ---------- RSVP demo ---------- */
  const seg = $('#rsvpSeg');
  if (seg) {
    $$('.seg-b', seg).forEach((b) =>
      b.addEventListener('click', () => $$('.seg-b', seg).forEach((x) => x.classList.toggle('active', x === b)))
    );
  }
  let party = 2;
  const partyN = $('#partyN');
  $$('.stepper button').forEach((b) =>
    b.addEventListener('click', () => {
      party = Math.max(1, Math.min(20, party + parseInt(b.dataset.step, 10)));
      if (partyN) partyN.textContent = party;
    })
  );
  const rsvpSubmit = $('#rsvpSubmit');
  if (rsvpSubmit)
    rsvpSubmit.addEventListener('click', () => {
      const done = $('#rsvpDone');
      $('#rsvpParty').textContent = party;
      done.classList.add('show');
      rsvpSubmit.textContent = 'RSVP sent ✓';
    });

  /* ---------- AI assistant chips ---------- */
  const aiReplies = {
    invite:
      "📨 Draft: “You are warmly invited to the marriage celebration of Ama & Kwame on Sat 14 Dec at Golden Tulip, Kumasi. Your presence will bless us. Kindly RSVP here: [link]. Dress: royal green & gold. — With love, the families.”",
    reminder:
      "🔔 Draft: “Hello! Just a gentle reminder — Ama & Kwame’s wedding is in 5 days (Sat, 9am). Please confirm if you’re coming so we cater well: [RSVP link]. Akpe / Medaase! 💛”",
    vendor:
      "❓ Ask your caterer: 1) Price per plate & minimum? 2) What’s the menu & do you cover serving staff? 3) Deposit & cancellation terms? 4) Can you handle 350 guests? 5) Do you provide a written contract & receipt?",
    status:
      "📋 Status: 312 of 480 RSVP’d yes · GHS 8,800 of 11,800 collected · GHS 6,700 owed to 3 vendors · checklist 72%. ⚠️ This week: chase 105 pending RSVPs and 2 unpaid pledges; caterer balance due in 6 days.",
  };
  const chat = $('#aiChat');
  $$('.chip').forEach((c) =>
    c.addEventListener('click', () => {
      const txt = aiReplies[c.dataset.ai];
      if (!txt || !chat) return;
      const u = document.createElement('div');
      u.className = 'msg user';
      u.textContent = c.textContent.replace(/^[^\w]+/, '');
      const b = document.createElement('div');
      b.className = 'msg bot' + (c.dataset.ai === 'status' ? ' risk' : '');
      b.textContent = txt;
      chat.appendChild(u);
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    })
  );

  /* ---------- Contribution & committee ledger (the wedge) ---------- */
  const contributors = [
    { name: 'Auntie Akosua', sub: 'Committee', pledge: 2000, paid: 2000 },
    { name: 'Sister Ama', sub: 'Diaspora · UK', pledge: 3000, paid: 3000 },
    { name: 'Bro. Kofi', sub: 'Committee', pledge: 1500, paid: 500 },
    { name: 'Uncle Yaw', sub: 'Family', pledge: 1000, paid: 0 },
    { name: 'Mensah Chapel Group', sub: 'Church group', pledge: 2500, paid: 1500 },
    { name: 'Friends WhatsApp pool', sub: 'Friends', pledge: 1800, paid: 1800 },
  ];
  const vendors = [
    { name: 'Maa Adwoa Kitchen', cat: '🍲 Caterer', total: 5000, paid: 2500, due: 'due in 6 days' },
    { name: 'Royal Events', cat: '🎀 Decorator', total: 3000, paid: 1500, due: 'due in 12 days' },
    { name: 'Kojo Studios', cat: '📷 Photographer', total: 2500, paid: 1000, due: 'due in 9 days' },
    { name: 'Golden Tulip', cat: '🏛️ Venue', total: 4000, paid: 4000, due: 'paid' },
    { name: 'MC Yaw', cat: '🎤 MC', total: 1200, paid: 0, due: 'due in 3 days' },
  ];

  const cList = $('#contribList');
  const vList = $('#vendorList');
  const riskBox = $('#ledgerRisk');
  let momoCount = 0;
  const momoNames = ['Kwabena O.', 'Adwoa S.', 'Yaw B.', 'Efua M.', 'Kojo A.', 'Abena T.', 'Kofi D.'];

  function payState(c) {
    if (c.paid >= c.pledge) return ['pill-paid', 'Paid'];
    if (c.paid > 0) return ['pill-part', 'Part-paid'];
    return ['pill-none', 'Pledged'];
  }

  function render() {
    if (!cList) return;
    // contributors
    cList.innerHTML = contributors
      .map((c, i) => {
        const [cls, label] = payState(c);
        return (
          '<div class="lrow' + (c.paid >= c.pledge ? ' paid' : '') + '" data-i="' + i + '">' +
          '<div><div class="nm">' + c.name + '</div><div class="sub">' + c.sub + '</div>' +
          '<span class="pill-s ' + cls + '">' + label + '</span></div>' +
          '<div class="amt">' + ghs(c.paid) + ' <span class="sub">/ ' + ghs(c.pledge) + '</span></div>' +
          '</div>'
        );
      })
      .join('');
    $$('.lrow', cList).forEach((row) =>
      row.addEventListener('click', () => {
        const c = contributors[+row.dataset.i];
        if (c.paid >= c.pledge) c.paid = c._orig != null ? c._orig : 0;
        else { if (c._orig == null) c._orig = c.paid; c.paid = c.pledge; }
        render();
      })
    );
    // vendors
    vList.innerHTML = vendors
      .map((v) => {
        const bal = v.total - v.paid;
        return (
          '<div class="lrow vend">' +
          '<div><div class="nm">' + v.cat + ' ' + v.name + '</div>' +
          '<div class="sub">' + (bal <= 0 ? 'Fully paid' : 'Balance ' + ghs(bal) + ' · ' + v.due) + '</div></div>' +
          '<div class="amt">' + ghs(v.paid) + ' <span class="sub">/ ' + ghs(v.total) + '</span></div>' +
          '</div>'
        );
      })
      .join('');

    // totals
    const pledged = contributors.reduce((s, c) => s + c.pledge, 0);
    const collected = contributors.reduce((s, c) => s + c.paid, 0);
    const toCollect = Math.max(0, pledged - collected);
    const vTotal = vendors.reduce((s, v) => s + v.total, 0);
    const vPaid = vendors.reduce((s, v) => s + v.paid, 0);
    const vDue = vTotal - vPaid;
    const cashNow = collected - vPaid; // real balance in hand
    const projected = pledged - vTotal; // after all pledges collected & all vendors paid

    $('#kPledged').textContent = ghs(pledged);
    $('#kCollected').textContent = ghs(collected);
    $('#kOutstanding').textContent = ghs(toCollect);
    $('#kVendorDue').textContent = ghs(vDue);
    const bal = $('#kBalance');
    bal.textContent = (cashNow < 0 ? '-' : '') + ghs(Math.abs(cashNow));

    // AI risk message
    const nUnpaid = contributors.filter((c) => c.paid < c.pledge).length;
    let html;
    if (projected < 0) {
      if (toCollect > 0) {
        html =
          '🤖 <b>AI risk — money gap.</b> Even after collecting the <b>' + ghs(toCollect) +
          '</b> still pledged, you’ll be <b>' + ghs(Math.abs(projected)) + ' short</b> of the ' + ghs(vTotal) +
          ' total vendor cost. Chase the ' + nUnpaid + ' unfulfilled pledge(s) now, and trim decor or raise more. ' +
          'Cash in hand right now is <b>' + (cashNow < 0 ? '-' : '') + ghs(Math.abs(cashNow)) +
          '</b>; the caterer balance (GHS 2,500) is due in 6 days.';
      } else {
        html =
          '🤖 <b>AI risk — structural shortfall.</b> All pledges are in (<b>' + ghs(collected) +
          '</b>), but it’s still <b>' + ghs(Math.abs(projected)) + ' short</b> of the ' + ghs(vTotal) +
          ' vendor cost. You can’t collect your way out — cut scope or raise new contributions. Outstanding vendor balances: <b>' +
          ghs(vDue) + '</b>.';
      }
      riskBox.className = 'ai-risk';
    } else {
      html =
        '🤖 <b>AI — you’re covered.</b> Pledges of <b>' + ghs(pledged) + '</b> now exceed the ' + ghs(vTotal) +
        ' vendor cost by <b>' + ghs(projected) + '</b>. Keep chasing the ' + ghs(toCollect) +
        ' still outstanding so cash is ready for the ' + ghs(vDue) + ' in vendor balances. Nicely done. 🎉';
      riskBox.className = 'ai-risk ok';
    }
    riskBox.innerHTML = html;
  }

  const momoBtn = $('#recordMomo');
  if (momoBtn)
    momoBtn.addEventListener('click', () => {
      const amt = [200, 300, 400, 500, 600, 800][Math.floor(Math.random() * 6)];
      const nm = momoNames[momoCount % momoNames.length];
      momoCount++;
      contributors.push({ name: nm, sub: 'Guest · MoMo', pledge: amt, paid: amt });
      render();
      const box = $('#contribList');
      if (box) box.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

  render();
})();
