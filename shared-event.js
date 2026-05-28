/* ============================================================
   Durbar — shared event-page renderer
   Used by BOTH the studio live-preview and the guest page,
   so what you design is exactly what guests see.
   ============================================================ */
window.DURBAR = (function () {
  'use strict';

  const THEMES = {
    'green-gold': { primary: '#0b6e4f', accent: '#e8a33d' },
    'burgundy':   { primary: '#7b1e3b', accent: '#d4af37' },
    'royal':      { primary: '#1b3a8f', accent: '#c9a227' },
    'rose':       { primary: '#a83258', accent: '#f0b8c8' },
    'charcoal':   { primary: '#33312e', accent: '#b8902f' },
    'emerald':    { primary: '#0f766e', accent: '#f59e0b' },
    'sunset':     { primary: '#c2410c', accent: '#f6c453' },
    'plum':       { primary: '#6b2d5c', accent: '#e8a33d' },
    'ocean':      { primary: '#0e7490', accent: '#fbbf24' },
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

  function applyTheme(el, key) {
    const th = THEMES[key] || THEMES['green-gold'];
    el.style.setProperty('--t-primary', th.primary);
    el.style.setProperty('--t-accent', th.accent);
  }

  function renderEventPage(e, ctx) {
    ctx = ctx || {};
    const tpl = TEMPLATES[e.template] || {};
    const titleFont = e.displayFont === 'sans' ? "font-family:var(--sans)" : "font-family:var(--serif)";
    const sched = (e.schedule || []).filter((s) => s.time || s.label)
      .map((s) => `<li><b>${esc(s.time)}</b><span>${esc(s.label)}</span></li>`).join('');
    const gallery = (e.gallery || []);
    const goal = +(e.contribution && e.contribution.goal) || 0;
    const collected = +ctx.collected || 0;
    const pct = goal ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
    const coverStyle = e.cover
      ? `background-image:linear-gradient(rgba(10,28,20,.5),rgba(10,28,20,.72)),url('${e.cover}');background-size:cover;background-position:center;`
      : '';
    const mapHref = e.mapUrl ? esc(e.mapUrl)
      : 'https://maps.google.com/?q=' + encodeURIComponent([e.venue, e.address, e.city, 'Ghana'].filter(Boolean).join(', '));

    return `<div class="evpage">
      <div class="ev-cover" style="${coverStyle}">
        <span class="ev-ribbon">${esc(tpl.ribbon || 'Event')}</span>
        <div class="ev-title" style="${titleFont}">${esc(e.title || 'Your event title')}</div>
        <div class="ev-sub">${esc(e.subtitle || '')}</div>
        ${e.hosts ? `<div class="ev-hosts">${esc(e.hosts)}</div>` : ''}
        <div class="ev-when">${niceDate(e.date)}</div>
        ${e.hashtag ? `<div class="ev-hash">#${esc(String(e.hashtag).replace(/^#/, ''))}</div>` : ''}
      </div>
      <div class="ev-count">⏳ ${countdown(e.date)}</div>
      ${e.story ? `<div class="ev-sec"><h5>About</h5><p>${esc(e.story)}</p></div>` : ''}
      <div class="ev-sec"><h5>📍 Venue</h5><p><b>${esc(e.venue || 'Venue')}</b><br>${esc(e.address || '')}${e.city ? ', ' + esc(e.city) : ''}${e.mapNote ? '<br><span class="ev-dim">' + esc(e.mapNote) + '</span>' : ''}<br><a class="ev-maplink" href="${mapHref}" target="_blank" rel="noopener">Open in Maps →</a></p></div>
      ${sched ? `<div class="ev-sec"><h5>🕐 Order of the day</h5><ul class="ev-tl">${sched}</ul></div>` : ''}
      ${e.dressCode ? `<div class="ev-sec"><h5>👗 Dress code</h5><p>${esc(e.dressCode)}</p></div>` : ''}
      ${gallery.length ? `<div class="ev-sec"><h5>📷 Gallery</h5><div class="ev-gallery">${gallery.map((g) => `<div class="ev-thumb" style="background-image:url('${g}')"></div>`).join('')}</div></div>` : ''}
      <div class="ev-actions">
        <div class="ev-btn pri" data-action="rsvp">✋ RSVP${e.allowPlusOnes ? ' (+guests welcome)' : ''}${ctx.mode === 'guest' ? '' : ' — no app needed'}</div>
        ${(e.contribution && e.contribution.enabled) ? `<div class="ev-btn acc" data-action="contribute">💛 ${esc(e.contribution.label || 'Contribute via MoMo')}</div>` : ''}
        ${gallery.length ? '' : '<div class="ev-btn ghost" data-action="gallery">📷 Gallery coming soon</div>'}
      </div>
      ${(e.contribution && e.contribution.enabled && goal) ? `<div class="ev-goal"><small>${ghs(collected)} of ${ghs(goal)} contributed</small><div class="gbar"><span style="width:${pct}%"></span></div></div>` : ''}
      <div class="ev-foot">Hosted with 💚 on Durbar · ${e.rsvpDeadline ? 'RSVP by ' + new Date(e.rsvpDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Private event'}</div>
    </div>`;
  }

  return { THEMES, TEMPLATES, TPL_LABEL, esc, ghs, niceDate, countdown, applyTheme, renderEventPage };
})();
