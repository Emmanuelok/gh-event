/* ============================================================
   Durbar — shared event-page renderer
   Used by BOTH the studio live-preview and the guest page,
   so what you design is exactly what guests see.
   The event page is a real, multi-section mini-website:
   hero · countdown · section nav · story · schedule · venue ·
   travel & stay · FAQ · gallery · RSVP/contribute · goal.
   ============================================================ */
window.DURBAR = (function () {
  'use strict';

  // Curated font pairings — system fonts only (no external CDNs),
  // honouring the low-data principle. Each theme picks a default.
  const FONTS = {
    classic:   { label: 'Classic serif', display: 'Georgia, "Times New Roman", serif', body: 'var(--sans)' },
    romantic:  { label: 'Romantic',      display: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif', body: 'Georgia, "Times New Roman", serif' },
    editorial: { label: 'Editorial',     display: '"Iowan Old Style", "Palatino Linotype", Georgia, serif', body: 'var(--sans)' },
    modern:    { label: 'Modern sans',   display: 'var(--sans)', body: 'var(--sans)' },
    statement: { label: 'Bold statement', display: '"Helvetica Neue", Arial, sans-serif', body: 'var(--sans)' },
  };

  const THEMES = {
    'green-gold': { primary: '#0b6e4f', accent: '#e8a33d', font: 'classic' },
    'burgundy':   { primary: '#7b1e3b', accent: '#d4af37', font: 'romantic' },
    'royal':      { primary: '#1b3a8f', accent: '#c9a227', font: 'editorial' },
    'rose':       { primary: '#a83258', accent: '#f0b8c8', font: 'romantic' },
    'charcoal':   { primary: '#33312e', accent: '#b8902f', font: 'editorial' },
    'emerald':    { primary: '#0f766e', accent: '#f59e0b', font: 'classic' },
    'sunset':     { primary: '#c2410c', accent: '#f6c453', font: 'statement' },
    'plum':       { primary: '#6b2d5c', accent: '#e8a33d', font: 'romantic' },
    'ocean':      { primary: '#0e7490', accent: '#fbbf24', font: 'modern' },
    'midnight':   { primary: '#172554', accent: '#cbb26b', font: 'editorial' },
    'sage':       { primary: '#52796f', accent: '#e9c46a', font: 'classic' },
    'terracotta': { primary: '#9c4221', accent: '#e8b04b', font: 'romantic' },
  };
  const TEMPLATES = {
    'white-wedding': { ribbon: 'White Wedding', theme: 'green-gold', sub: 'are getting married', dress: 'Royal green & gold', gift: 'Send a gift via MoMo' },
    'traditional':   { ribbon: 'Traditional Marriage', theme: 'burgundy', sub: 'invite you to our knocking & engagement', dress: 'Rich kente & cloth', gift: 'Support the celebration' },
    'engagement':    { ribbon: 'Engagement', theme: 'rose', sub: "we're engaged!", dress: 'Smart chic', gift: 'Gift via MoMo' },
    'birthday':      { ribbon: 'Birthday', theme: 'sunset', sub: "let's celebrate!", dress: 'Smart & colourful', gift: 'Gift via MoMo' },
    'naming':        { ribbon: 'Naming Ceremony', theme: 'emerald', sub: 'welcome our new blessing', dress: 'White & gold', gift: 'Bless the baby' },
    'anniversary':   { ribbon: 'Anniversary', theme: 'plum', sub: 'celebrating the years', dress: 'Elegant', gift: 'Gift via MoMo' },
    'funeral':       { ribbon: 'Celebration of Life', theme: 'charcoal', sub: 'in loving memory', dress: 'Black & red / white', gift: 'Donate / contribute' },
    'church':        { ribbon: 'Church Event', theme: 'royal', sub: 'come worship with us', dress: 'Modest & smart', gift: 'Give an offering' },
    'school':        { ribbon: 'School Event', theme: 'ocean', sub: 'you are invited', dress: 'As advised', gift: 'Pay / contribute' },
    'corporate':     { ribbon: 'Corporate Event', theme: 'royal', sub: 'you are invited', dress: 'Corporate / formal', gift: 'Sponsor / register' },
    'party':         { ribbon: 'Private Party', theme: 'emerald', sub: 'come have a good time', dress: 'Come as you slay', gift: 'Chip in via MoMo' },
  };
  const TPL_LABEL = {
    'white-wedding': 'White Wedding', traditional: 'Traditional', engagement: 'Engagement', birthday: 'Birthday',
    naming: 'Naming', anniversary: 'Anniversary', funeral: 'Memorial', church: 'Church', school: 'School',
    corporate: 'Corporate', party: 'Party',
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ghs = (n) => 'GHS ' + Math.round(+n || 0).toLocaleString('en-GH');
  function niceDate(dt) {
    const d = new Date(dt); if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function countdown(dt) {
    const d = new Date(dt); if (isNaN(d)) return 'Set a date';
    const diff = d - new Date(); if (diff <= 0) return 'Happening now / past';
    const days = Math.floor(diff / 864e5), hrs = Math.floor((diff % 864e5) / 36e5);
    return days + ' days · ' + hrs + ' hrs to go';
  }
  // Elegant monogram from a title, e.g. "Ama & Kwame" -> "A&K", "Yaw's 60th" -> "Y6".
  function monogram(title) {
    const t = String(title || '').trim(); if (!t) return '';
    const parts = t.split(/\s*(?:&|\+|\band\b)\s*/i).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + '&' + parts[1][0]).toUpperCase();
    const words = t.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  function applyTheme(el, key, fontPair) {
    const th = THEMES[key] || THEMES['green-gold'];
    el.style.setProperty('--t-primary', th.primary);
    el.style.setProperty('--t-accent', th.accent);
    const fp = FONTS[fontPair] || FONTS[th.font] || FONTS.classic;
    el.style.setProperty('--t-display', fp.display);
    el.style.setProperty('--t-body', fp.body);
  }

  function renderEventPage(e, ctx) {
    ctx = ctx || {};
    const tpl = TEMPLATES[e.template] || {};
    const sched = (e.schedule || []).filter((s) => s.time || s.label)
      .map((s) => `<li><b>${esc(s.time)}</b><span>${esc(s.label)}</span></li>`).join('');
    const gallery = (e.gallery || []);
    const travel = (e.travel || []).filter((t) => t.title || t.detail);
    const faq = (e.faq || []).filter((f) => f.q || f.a);
    const reg = e.registry || {};
    const funds = (reg.enabled && Array.isArray(reg.funds)) ? reg.funds.filter((f) => f.title) : [];
    const fundTotals = ctx.fundTotals || {};
    const goal = +(e.contribution && e.contribution.goal) || 0;
    const collected = +ctx.collected || 0;
    const pct = goal ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
    const coverStyle = e.cover
      ? `background-image:linear-gradient(rgba(10,28,20,.46),rgba(10,28,20,.72)),url('${e.cover}');background-size:cover;background-position:center;`
      : '';
    const mapHref = e.mapUrl ? esc(e.mapUrl)
      : 'https://maps.google.com/?q=' + encodeURIComponent([e.venue, e.address, e.city, 'Ghana'].filter(Boolean).join(', '));
    const wantMono = ['white-wedding', 'traditional', 'engagement', 'anniversary'].includes(e.template);
    const mono = wantMono ? monogram(e.title) : '';

    // section nav built from the sections that actually exist
    const navItems = [];
    if (e.story) navItems.push(['ev-story', 'Story']);
    if (sched) navItems.push(['ev-schedule', 'Schedule']);
    navItems.push(['ev-venue', 'Venue']);
    if (travel.length) navItems.push(['ev-travel', 'Travel']);
    if (faq.length) navItems.push(['ev-faq', 'FAQ']);
    if (funds.length) navItems.push(['ev-registry', 'Registry']);
    if (gallery.length) navItems.push(['ev-gallery', 'Gallery']);
    navItems.push(['ev-rsvp', 'RSVP']);
    const nav = navItems.length > 3
      ? `<nav class="ev-nav">${navItems.map(([id, lb]) => `<a href="#${id}">${lb}</a>`).join('')}</nav>` : '';

    return `<div class="evpage">
      <div class="ev-cover${e.cover ? ' has-photo' : ''}" style="${coverStyle}">
        <span class="ev-ribbon">${esc(tpl.ribbon || 'Event')}</span>
        ${mono ? `<div class="ev-mono">${esc(mono)}</div>` : ''}
        <div class="ev-title">${esc(e.title || 'Your event title')}</div>
        <div class="ev-sub">${esc(e.subtitle || '')}</div>
        ${e.hosts ? `<div class="ev-hosts">${esc(e.hosts)}</div>` : ''}
        <div class="ev-when">${niceDate(e.date)}</div>
        ${e.hashtag ? `<div class="ev-hash">#${esc(String(e.hashtag).replace(/^#/, ''))}</div>` : ''}
      </div>
      <div class="ev-count">⏳ ${countdown(e.date)}</div>
      ${nav}
      ${e.story ? `<div class="ev-sec" id="ev-story"><h5>About</h5><p>${esc(e.story)}</p></div>` : ''}
      ${sched ? `<div class="ev-sec" id="ev-schedule"><h5>🕐 Order of the day</h5><ul class="ev-tl">${sched}</ul></div>` : ''}
      <div class="ev-sec" id="ev-venue"><h5>📍 Venue</h5><p><b>${esc(e.venue || 'Venue')}</b><br>${esc(e.address || '')}${e.city ? ', ' + esc(e.city) : ''}${e.mapNote ? '<br><span class="ev-dim">' + esc(e.mapNote) + '</span>' : ''}<br><a class="ev-maplink" href="${mapHref}" target="_blank" rel="noopener">Open in Maps →</a></p></div>
      ${travel.length ? `<div class="ev-sec" id="ev-travel"><h5>✈️ Travel &amp; stay</h5><div class="ev-travel">${travel.map((t) => `<div class="ti"><b>${esc(t.title)}</b>${t.detail ? `<p>${esc(t.detail)}</p>` : ''}${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">More →</a>` : ''}</div>`).join('')}</div></div>` : ''}
      ${faq.length ? `<div class="ev-sec" id="ev-faq"><h5>❓ Good to know</h5><div class="ev-faq">${faq.map((f) => `<details><summary>${esc(f.q || 'Question')}</summary><div class="fa">${esc(f.a || '')}</div></details>`).join('')}</div></div>` : ''}
      ${funds.length ? `<div class="ev-sec" id="ev-registry"><h5>🎁 ${esc(reg.heading || 'Registry & funds')}</h5>${reg.note ? `<p style="margin-bottom:11px">${esc(reg.note)}</p>` : ''}<div class="ev-funds">${funds.map((f) => {
        const got = +fundTotals[f.id] || 0, fg = +f.goal || 0, fpc = fg ? Math.min(100, Math.round(got / fg * 100)) : 0;
        return `<div class="ev-fund"><div class="ef-h"><span class="ef-ic">${esc(f.icon || '🎁')}</span><b>${esc(f.title)}</b></div>${f.desc ? `<p>${esc(f.desc)}</p>` : ''}${fg ? `<div class="ef-bar"><span style="width:${fpc}%"></span></div><small>${ghs(got)} of ${ghs(fg)}</small>` : ''}<div class="ev-btn acc ef-btn" data-action="gift" data-fund="${esc(f.id)}">💛 Gift to this</div></div>`;
      }).join('')}</div></div>` : ''}
      ${e.dressCode ? `<div class="ev-sec"><h5>👗 Dress code</h5><p>${esc(e.dressCode)}</p></div>` : ''}
      ${gallery.length ? `<div class="ev-sec" id="ev-gallery"><h5>📷 Gallery</h5><div class="ev-gallery">${gallery.map((g) => `<div class="ev-thumb" style="background-image:url('${g}')"></div>`).join('')}</div></div>` : ''}
      <div class="ev-actions" id="ev-rsvp">
        <div class="ev-btn pri" data-action="rsvp">✋ RSVP${e.allowPlusOnes ? ' (+guests welcome)' : ''}${ctx.mode === 'guest' ? '' : ' — no app needed'}</div>
        ${(e.contribution && e.contribution.enabled) ? `<div class="ev-btn acc" data-action="contribute">💛 ${esc(e.contribution.label || 'Contribute via MoMo')}</div>` : ''}
        ${gallery.length ? '' : '<div class="ev-btn ghost" data-action="gallery">📷 Gallery coming soon</div>'}
      </div>
      ${(e.contribution && e.contribution.enabled && goal) ? `<div class="ev-goal"><small>${ghs(collected)} of ${ghs(goal)} contributed</small><div class="gbar"><span style="width:${pct}%"></span></div></div>` : ''}
      <div class="ev-foot">Hosted with 💚 on Durbar · ${e.rsvpDeadline ? 'RSVP by ' + new Date(e.rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Private event'}</div>
    </div>`;
  }

  return { THEMES, TEMPLATES, TPL_LABEL, FONTS, esc, ghs, niceDate, countdown, monogram, applyTheme, renderEventPage };
})();
