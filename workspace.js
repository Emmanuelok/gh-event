/* ============================================================
   Durbar Studio — Innovation OS  ·  application
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const ce = (t, cls) => { const e = document.createElement(t); if (cls) e.className = cls; return e; };
  const uid = () => 'x' + Math.random().toString(36).slice(2, 9);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const KEY = 'durbar.os.v1';

  const ACCENTS = [
    { acc: '#34d399', acc2: '#10b981', ink: '#03281d' }, { acc: '#f6c453', acc2: '#f59e0b', ink: '#3a2a05' },
    { acc: '#60a5fa', acc2: '#3b82f6', ink: '#06214d' }, { acc: '#a78bfa', acc2: '#8b5cf6', ink: '#1e1147' },
    { acc: '#f472b6', acc2: '#ec4899', ink: '#3d0726' }, { acc: '#2dd4bf', acc2: '#0ea5a4', ink: '#04302e' },
  ];
  const NOTE_COLORS = ['#ffe17a', '#a7f3d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#ddd6fe'];
  const AV_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'];
  const COLS = [{ id: 'backlog', n: 'Backlog' }, { id: 'doing', n: 'In progress' }, { id: 'review', n: 'Review' }, { id: 'done', n: 'Done' }];

  const INSTITUTIONS = [
    { e: '🏥', label: 'Health', domain: 'health' }, { e: '🎓', label: 'Education', domain: 'education' },
    { e: '🏦', label: 'Finance', domain: 'finance' }, { e: '🌾', label: 'Agriculture', domain: 'agriculture' },
    { e: '🏛️', label: 'Public / NGO', domain: 'government' }, { e: '💻', label: 'Tech / Startup', domain: 'technology' },
    { e: '🛍️', label: 'Commerce', domain: 'retail' }, { e: '🎉', label: 'Events', domain: 'events' },
  ];
  const SEED_PROBLEM = {
    health: 'Patients wait too long at the clinic and many miss their appointments.',
    education: 'Students fall behind because teachers can’t see who needs help in time.',
    finance: 'Small merchants can’t access working-capital loans quickly enough.',
    agriculture: 'Smallholder farmers lose income to post-harvest spoilage and low prices.',
    government: 'Citizens spend hours in queues to renew permits and licenses.',
    technology: 'New users sign up but drop off before they reach the aha moment.',
    retail: 'Shoppers abandon their carts because delivery is slow and unpredictable.',
    events: 'Committee-planned events struggle to reconcile pledges, MoMo and vendor costs.',
  };

  const NAV = [
    { grp: 'Workspace' }, { id: 'home', ic: '🏠', label: 'Home' },
    { grp: 'Pipeline' },
    { id: 'frame', ic: '🧭', label: 'Frame' }, { id: 'brainstorm', ic: '💡', label: 'Brainstorm' },
    { id: 'prioritize', ic: '🎯', label: 'Prioritize' }, { id: 'decide', ic: '⚖️', label: 'Decide' },
    { id: 'roadmap', ic: '🗺️', label: 'Roadmap' }, { id: 'execute', ic: '🛠️', label: 'Execute' },
    { id: 'insights', ic: '📊', label: 'Insights' },
    { grp: 'Resources' },
    { id: 'research', ic: '🔬', label: 'Research' }, { id: 'market', ic: '🛒', label: 'Marketplace' },
    { id: 'team', ic: '👥', label: 'Team' }, { id: 'settings', ic: '⚙️', label: 'Settings' },
  ];
  const PIPE = [['frame', 'Frame'], ['brainstorm', 'Ideate'], ['prioritize', 'Prioritize'], ['decide', 'Decide'], ['roadmap', 'Plan'], ['execute', 'Build'], ['insights', 'Measure']];

  /* ---------------- state ---------------- */
  let state;
  function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  const proj = () => state.projects.find((p) => p.id === state.current) || state.projects[0];

  function seedProject(name, domain, owner) {
    const problem = SEED_PROBLEM[domain] || SEED_PROBLEM.technology;
    const f = Intel.frameProblem(problem);
    const color = ACCENTS[Math.floor(Math.random() * ACCENTS.length)].acc;
    const notes = [problem].concat(f.hmw.slice(0, 4)).concat(['What would “10x better” look like?']).map((t, i) => ({
      id: uid(), text: t, x: 28 + (i % 3) * 230, y: 24 + Math.floor(i / 3) * 165, color: NOTE_COLORS[i % NOTE_COLORS.length], votes: Math.floor(Math.random() * 4),
    }));
    const ideaTitles = [
      'Self-service via WhatsApp', 'Smart reminders & queueing', 'Data dashboard for staff',
      'Partner / agent network', 'Tiered pricing model', 'Mobile-first redesign',
    ];
    const ideas = ideaTitles.map((t, i) => ({ id: uid(), title: t, impact: clamp(4 + ((i * 3) % 6), 2, 9), effort: clamp(3 + ((i * 2) % 7), 2, 9), confidence: clamp(5 + ((i * 4) % 5), 3, 9) }));
    const members = [owner, { name: 'Akua Boateng', role: 'Design lead', color: AV_COLORS[1] }, { name: 'Yaw Mensah', role: 'Engineer', color: AV_COLORS[2] }, { name: 'Nana Asare', role: 'Ops', color: AV_COLORS[3] }];
    const tcols = ['backlog', 'backlog', 'doing', 'doing', 'review', 'done'];
    const tasks = ['Interview 5 ' + f.stakeholders[0].toLowerCase(), 'Map current journey', 'Prototype top concept', 'Set up analytics', 'Pricing model draft', 'Define success metrics']
      .map((t, i) => ({ id: uid(), title: t, col: tcols[i], assignee: members[i % members.length].name, prio: ['high', 'med', 'low'][i % 3] }));
    return {
      id: uid(), name, domain, color, problem, frame: f, stage: 'discovery',
      goal: 'Move ' + (f.kpis.slice(0, 2).join(' & ')).toLowerCase(),
      members, brainstorm: notes, ideas,
      decision: { options: ideas.slice(0, 3).map((i) => ({ id: i.id, name: i.title })), criteria: [{ id: 'c1', name: 'Impact', weight: 5 }, { id: 'c2', name: 'Feasibility', weight: 3 }, { id: 'c3', name: 'Cost', weight: 2 }], scores: {} },
      roadmap: [], tasks, research: [{ id: uid(), title: 'Market scan', note: f.statement, source: 'Durbar Intelligence' }], _prioritized: true,
    };
  }

  /* ---------------- onboarding ---------------- */
  function onboard() {
    let sel = { domain: 'technology', accent: 0 };
    const m = $('#modal'), b = $('#modalBody');
    b.innerHTML = `<h2>Welcome to Durbar Studio 👋</h2>
      <p class="lead">A workspace that takes you from a raw problem to full-scale production — and adapts to you. Let’s set it up in 15 seconds.</p>
      <label>What should we call you?</label><input class="field" id="obName" placeholder="e.g. Ama Owusu" />
      <label>Your role</label><input class="field" id="obRole" placeholder="e.g. Innovation lead" />
      <label>Where do you work?</label>
      <div class="opt-grid" id="obInst">${INSTITUTIONS.map((x, i) => `<div class="opt${i === 5 ? ' on' : ''}" data-d="${x.domain}"><span class="e">${x.e}</span>${x.label}</div>`).join('')}</div>
      <label>Pick your accent</label>
      <div class="accent-row" id="obAcc">${ACCENTS.map((a, i) => `<div class="acc-pick${i === 0 ? ' on' : ''}" data-i="${i}" style="background:linear-gradient(135deg,${a.acc},${a.acc2})"></div>`).join('')}</div>
      <button class="btn pri" id="obGo" style="width:100%;margin-top:22px;justify-content:center">Enter the Studio →</button>`;
    m.classList.add('open');
    $('#obInst').onclick = (e) => { const o = e.target.closest('[data-d]'); if (!o) return; $$('#obInst .opt').forEach((x) => x.classList.remove('on')); o.classList.add('on'); sel.domain = o.dataset.d; };
    $('#obAcc').onclick = (e) => { const o = e.target.closest('[data-i]'); if (!o) return; $$('#obAcc .acc-pick').forEach((x) => x.classList.remove('on')); o.classList.add('on'); sel.accent = +o.dataset.i; applyAccent(ACCENTS[sel.accent]); };
    $('#obGo').onclick = () => {
      const name = ($('#obName').value.trim()) || 'Founder';
      const role = ($('#obRole').value.trim()) || 'Innovation lead';
      const inst = INSTITUTIONS.find((x) => x.domain === sel.domain);
      const owner = { name, role, color: AV_COLORS[0] };
      const p = seedProject(inst.label + ' transformation', sel.domain, owner);
      state = { user: { name, role, institution: inst.label, domain: sel.domain, accent: sel.accent, theme: 'dark', onboarded: true }, projects: [p], current: p.id, view: 'home' };
      applyAccent(ACCENTS[sel.accent]); save(); m.classList.remove('open'); boot(); confetti();
      toast('Welcome, ' + name.split(' ')[0] + ' — your studio is ready ✨');
    };
  }

  /* ---------------- theme / accent ---------------- */
  function applyAccent(a) { const r = document.documentElement.style; r.setProperty('--acc', a.acc); r.setProperty('--acc2', a.acc2); r.setProperty('--acc-ink', a.ink); }
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); const tb = $('#themeBtn'); if (tb) tb.textContent = t === 'light' ? '☀️' : '🌙'; }

  /* ---------------- shell ---------------- */
  function renderShell() {
    const u = state.user, p = proj();
    $('#projSwitch').innerHTML = `<button id="psBtn"><span class="dot" style="background:${p.color}"></span><span class="nm">${esc(p.name)}</span><span class="chev">▾</span></button>
      <div class="proj-menu" id="psMenu">${state.projects.map((x) => `<div class="item" data-p="${x.id}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</div>`).join('')}<div class="item new" data-new="1">＋ New project</div></div>`;
    $('#psBtn').onclick = () => $('#psMenu').classList.toggle('open');
    $('#psMenu').onclick = (e) => {
      const it = e.target.closest('[data-p]'); const nw = e.target.closest('[data-new]');
      if (it) { state.current = it.dataset.p; save(); boot(); }
      if (nw) newProject();
    };
    $('#nav').innerHTML = NAV.map((n) => n.grp ? `<div class="grp">${n.grp}</div>`
      : `<button class="nav-i${state.view === n.id ? ' active' : ''}" data-v="${n.id}"><span class="ic">${n.ic}</span><span>${n.label}</span>${navCount(n.id) ? `<span class="ct">${navCount(n.id)}</span>` : ''}</button>`).join('');
    $('#nav').onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) go(b.dataset.v); };
    const init = (u.name[0] || 'U').toUpperCase();
    $('#userChip').innerHTML = `<div class="avatar" style="background:${AV_COLORS[0]}">${init}</div><div><div class="nm">${esc(u.name)}</div><div class="rl">${esc(u.role)}</div></div>`;
    $('#userChip').onclick = () => go('settings');
  }
  function navCount(id) { const p = proj(); if (id === 'brainstorm') return p.brainstorm.length; if (id === 'execute') return p.tasks.filter((t) => t.col !== 'done').length; if (id === 'prioritize') return p.ideas.length; return 0; }
  function renderTop() {
    const labels = {}; NAV.forEach((n) => { if (n.id) labels[n.id] = n.label; });
    $('#topTitle').textContent = labels[state.view] || 'Home';
    $('#topSub').textContent = proj().name + ' · ' + state.user.institution;
    const idx = PIPE.findIndex((s) => s[0] === state.view);
    $('#stepper').innerHTML = PIPE.map((s, i) => `<span class="st${s[0] === state.view ? ' on' : (idx > -1 && i < idx ? ' done' : '')}">${s[1]}</span>`).join('<span style="color:var(--ink-3)">›</span>');
  }
  function go(v) { state.view = v; save(); renderShell(); renderTop(); renderView(); }

  /* ---------------- views ---------------- */
  function renderView() {
    const v = $('#view'); const p = proj();
    ({ home: vHome, frame: vFrame, brainstorm: vBrainstorm, prioritize: vPrioritize, decide: vDecide, roadmap: vRoadmap, execute: vExecute, insights: vInsights, research: vResearch, market: vMarket, team: vTeam, settings: vSettings }[state.view] || vHome)(v, p);
  }

  function vHome(v, p) {
    const u = state.user; const sg = Intel.suggestNext(p);
    const done = p.tasks.filter((t) => t.col === 'done').length;
    const prog = p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0;
    const hour = new Date().getHours(); const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    v.innerHTML = `
      <div class="hero">
        <div class="ey">${esc(u.institution)} workspace</div>
        <h1>${greet}, ${esc(u.name.split(' ')[0])}.</h1>
        <p>Your studio is tuned for <b>${esc(Intel.DOMAINS[u.domain].label.toLowerCase())}</b>. Pick up where you left off, or start something new — from a raw problem all the way to production.</p>
        <div class="row"><button class="btn pri" data-go="frame">🧭 Frame a new problem</button><button class="btn" data-go="brainstorm">💡 Open the canvas</button><button class="btn ghost" id="homeNew">＋ New project</button></div>
        <div class="statbar">
          <div class="stat"><div class="v" data-count="${p.brainstorm.length}">0</div><div class="l">Ideas captured</div></div>
          <div class="stat"><div class="v" data-count="${p.ideas.length}">0</div><div class="l">In prioritization</div></div>
          <div class="stat"><div class="v"><span data-count="${prog}">0</span><span class="u">%</span></div><div class="l">Execution complete</div></div>
          <div class="stat"><div class="v" data-count="${p.members.length}">0</div><div class="l">Team members</div></div>
        </div>
      </div>
      <div class="suggest" style="margin:18px 0" data-go="${sg.view}"><div class="ic">✨</div><div><b>Suggested next: ${esc(sg.label)}</b><div class="why">${esc(sg.why)}</div></div><div class="spacer"></div><button class="btn sm pri" data-go="${sg.view}">Go →</button></div>
      <div class="vhead" style="margin-top:8px"><h2>Your projects</h2><div class="spacer"></div><button class="btn sm" id="homeNew2">＋ New project</button></div>
      <div class="pcards">${state.projects.map((x) => projCard(x)).join('')}</div>`;
    v.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => go(el.dataset.go)));
    v.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', () => { state.current = el.dataset.open; save(); boot(); }));
    $('#homeNew').onclick = $('#homeNew2').onclick = newProject;
    requestAnimationFrame(() => $$('[data-count]', v).forEach(countUp));
  }
  function projCard(x) {
    const done = x.tasks.filter((t) => t.col === 'done').length; const prog = x.tasks.length ? Math.round(done / x.tasks.length * 100) : 0;
    return `<div class="pcard" data-open="${x.id}"><div class="bar" style="background:linear-gradient(90deg,${x.color},${x.color}55)"></div>
      <h3>${esc(x.name)}</h3><div class="goal">${esc(x.goal || '')}</div>
      <div class="meta"><div class="mini-prog"><span style="width:${prog}%"></span></div><span class="muted" style="font-size:12px">${prog}%</span></div>
      <div class="meta"><div class="faces">${x.members.slice(0, 4).map((mm) => `<div class="avatar" style="background:${mm.color || '#10b981'}">${esc((mm.name[0] || '?').toUpperCase())}</div>`).join('')}</div><span class="tag">${esc(Intel.DOMAINS[x.domain].label)}</span></div></div>`;
  }

  function vFrame(v, p) {
    v.innerHTML = `<div class="vhead"><div><h2>🧭 Frame the problem</h2><p>State the problem in plain words. The intelligence engine reframes it into a sharp brief, How-Might-We prompts, stakeholders and the metrics that matter.</p></div></div>
      <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
        <div class="card"><label style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);font-weight:700">The problem, in your words</label>
          <textarea class="field" id="frInput" style="margin-top:8px;min-height:150px">${esc(p.problem || '')}</textarea>
          <button class="btn pri" id="frGo" style="margin-top:12px">✨ Reframe with intelligence</button>
          <span class="muted" style="font-size:12px;margin-left:10px">detects domain · suggests stakeholders & KPIs</span>
        </div>
        <div class="assistant"><div class="hd"><div class="orb"></div><div><b>Durbar Intelligence</b><div class="muted" style="font-size:12px">structured problem frame</div></div></div><div id="frOut"></div></div>
      </div>`;
    const draw = (f) => {
      $('#frOut').innerHTML = `<div class="frame-out">
        <div class="frame-block"><h5>Detected domain</h5><span class="tag good">${esc(f.domainLabel)}</span> <span class="muted" style="font-size:12px">keywords: ${f.keywords.slice(0, 5).map(esc).join(', ')}</span></div>
        <div class="frame-block"><h5>Sharper problem statement</h5><div style="font-size:14px;line-height:1.5">${esc(f.statement)}</div></div>
        <div class="frame-block"><h5>How might we…</h5><ul>${f.hmw.slice(0, 4).map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>
        <div class="frame-block"><h5>Stakeholders</h5><div class="chip-row">${f.stakeholders.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>
        <div class="frame-block"><h5>Metrics that matter</h5><div class="chip-row">${f.kpis.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div></div>
        <div class="frame-block"><h5>Watch-outs</h5><div class="chip-row">${f.risks.map((k) => `<span class="chip">⚠ ${esc(k)}</span>`).join('')}</div></div>
        <button class="btn pri" id="frSeed">💡 Send How-Might-We to the canvas</button></div>`;
      $('#frSeed').onclick = () => {
        f.hmw.slice(0, 4).forEach((h, i) => p.brainstorm.push({ id: uid(), text: h, x: 30 + (i % 3) * 230, y: 30 + Math.floor(i / 3) * 165, color: NOTE_COLORS[i % NOTE_COLORS.length], votes: 0 }));
        save(); toast('Added to the brainstorm canvas'); go('brainstorm');
      };
    };
    if (p.frame) draw(p.frame);
    $('#frGo').onclick = () => { p.problem = $('#frInput').value; p.frame = Intel.frameProblem(p.problem); p.domain = p.frame.domain; save(); draw(p.frame); toast('Reframed ✦'); renderTop(); };
  }

  function vBrainstorm(v, p) {
    let color = NOTE_COLORS[0];
    v.innerHTML = `<div class="vhead"><div><h2>💡 Brainstorm</h2><p>Drag to arrange. Double-click a note to edit. Upvote the best. Then synthesize into ranked ideas.</p></div></div>
      <div class="cbar"><button class="btn pri" id="addNote">＋ Add note</button>
        <div class="swatches" id="sw">${NOTE_COLORS.map((c, i) => `<div class="swatch${i === 0 ? ' on' : ''}" data-c="${c}" style="background:${c}"></div>`).join('')}</div>
        <div class="spacer"></div><span class="muted" style="font-size:12px">${p.brainstorm.length} notes</span>
        <button class="btn" id="synth">✨ Synthesize → ideas</button></div>
      <div class="canvas-wrap" id="canvas"></div>`;
    $('#sw').onclick = (e) => { const s = e.target.closest('[data-c]'); if (!s) return; $$('#sw .swatch').forEach((x) => x.classList.remove('on')); s.classList.add('on'); color = s.dataset.c; };
    const cv = $('#canvas');
    const drawNotes = () => {
      cv.innerHTML = p.brainstorm.map((n) => `<div class="note" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;background:${n.color}">
        <div class="txt" contenteditable="true">${esc(n.text)}</div>
        <div class="nb"><span class="vote" data-vote="${n.id}">▲ ${n.votes || 0}</span><span class="del" data-del="${n.id}">✕</span></div></div>`).join('');
      $$('.note', cv).forEach((el) => {
        const n = p.brainstorm.find((x) => x.id === el.dataset.id);
        dragXY(el, cv, (x, y) => { n.x = clamp(x - 84, 0, cv.clientWidth - 168); n.y = clamp(y - 20, 0, cv.clientHeight - 96); el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }, save);
        $('.txt', el).addEventListener('blur', (e) => { n.text = e.target.textContent.trim(); save(); });
      });
    };
    cv.addEventListener('click', (e) => {
      const vt = e.target.closest('[data-vote]'); const dl = e.target.closest('[data-del]');
      if (vt) { const n = p.brainstorm.find((x) => x.id === vt.dataset.vote); n.votes = (n.votes || 0) + 1; vt.textContent = '▲ ' + n.votes; save(); }
      if (dl) { p.brainstorm = p.brainstorm.filter((x) => x.id !== dl.dataset.del); save(); drawNotes(); renderShell(); }
    });
    $('#addNote').onclick = () => { p.brainstorm.push({ id: uid(), text: 'New idea…', x: 40 + Math.random() * 220, y: 30 + Math.random() * 160, color, votes: 0 }); save(); drawNotes(); renderShell(); };
    $('#synth').onclick = () => {
      const top = [...p.brainstorm].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
      top.forEach((n, i) => { if (!p.ideas.find((x) => x.title === n.text)) p.ideas.push({ id: uid(), title: n.text.slice(0, 60), impact: 5 + (i % 4), effort: 4 + (i % 5), confidence: 5 + (i % 4) }); });
      p._prioritized = false; save(); toast('Synthesized ' + top.length + ' ideas → Prioritize'); go('prioritize');
    };
    requestAnimationFrame(drawNotes);
  }

  function vPrioritize(v, p) {
    const draw = () => {
      const pr = Intel.prioritize(p.ideas);
      const mx = $('#mx');
      mx.querySelectorAll('.dot').forEach((d) => d.remove());
      p.ideas.forEach((it, i) => {
        const d = ce('div', 'dot'); d.dataset.id = it.id; d.textContent = i + 1;
        d.style.background = `linear-gradient(135deg, var(--acc), var(--acc2))`;
        const place = () => { d.style.left = (it.effort * 10) + '%'; d.style.top = ((10 - it.impact) * 10) + '%'; };
        place(); d.innerHTML = (i + 1) + `<span class="lbl">${esc(it.title)}</span>`;
        mx.appendChild(d);
        dragXY(d, mx, (x, y, r) => { it.effort = clamp(Math.round(x / r.width * 10), 0, 10); it.impact = clamp(10 - Math.round(y / r.height * 10), 0, 10); place(); }, () => { save(); rank(); });
      });
      rank();
    };
    const rank = () => {
      const pr = Intel.prioritize(p.ideas);
      $('#rankList').innerHTML = pr.ranked.map((it, i) => {
        const idx = p.ideas.findIndex((x) => x.id === it.id) + 1;
        const q = { 'quick-win': ['Quick win', 'good'], 'big-bet': ['Big bet', 'warn'], 'fill-in': ['Fill-in', ''], 'avoid': ['Reconsider', 'bad'] }[it.quadrant];
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><b style="width:18px;color:var(--acc)">${idx}</b><div style="flex:1"><div style="font-size:13.5px;font-weight:600">${esc(it.title)}</div><span class="tag ${q[1]}">${q[0]}</span> <span class="muted" style="font-size:11px">score ${it.score}</span></div></div>`;
      }).join('') || '<div class="muted">No ideas yet — add some.</div>';
    };
    v.innerHTML = `<div class="vhead"><div><h2>🎯 Prioritize</h2><p>Drag each idea by <b>impact</b> (up) and <b>effort</b> (right). The engine ranks them and flags quick wins vs big bets.</p></div><div class="spacer"></div><button class="btn sm" id="addIdea">＋ Add idea</button></div>
      <div class="matrix-area"><div class="matrix" id="mx">
        <div class="ax h"></div><div class="ax v"></div>
        <div class="ql tl">Quick wins</div><div class="ql tr">Big bets</div><div class="ql bl">Fill-ins</div><div class="ql br">Reconsider</div>
        <div class="axis-x">Effort →</div><div class="axis-y">Impact →</div></div>
        <div><div class="card"><h4 style="margin:0 0 6px">Ranked shortlist</h4><div id="rankList"></div><button class="btn pri sm" id="toDecide" style="margin-top:14px;width:100%;justify-content:center">Take top 3 to Decide →</button></div></div></div>`;
    $('#addIdea').onclick = () => { const t = prompt('New idea:'); if (t) { p.ideas.push({ id: uid(), title: t, impact: 5, effort: 5, confidence: 5 }); save(); draw(); renderShell(); } };
    $('#toDecide').onclick = () => { const pr = Intel.prioritize(p.ideas); p.decision.options = pr.ranked.slice(0, 3).map((i) => ({ id: i.id, name: i.title })); save(); go('decide'); };
    requestAnimationFrame(draw);
  }

  function vDecide(v, p) {
    const d = p.decision;
    const draw = () => {
      const res = Intel.decide(d.options, d.criteria, d.scores);
      $('#decBody').innerHTML = `<table class="tbl"><thead><tr><th>Option</th>${d.criteria.map((c) => `<th>${esc(c.name)}<br><span class="muted" style="font-weight:500">w:${c.weight}</span></th>`).join('')}<th>Score</th></tr></thead>
        <tbody>${d.options.map((o) => `<tr><td><b>${esc(o.name)}</b></td>${d.criteria.map((c) => `<td><input class="score-in" type="number" min="0" max="10" value="${(d.scores[o.id] && d.scores[o.id][c.id]) || 0}" data-o="${o.id}" data-c="${c.id}"></td>`).join('')}<td><b>${(res.rows.find((r) => r.id === o.id) || {}).total || 0}</b></td></tr>`).join('')}</tbody></table>`;
      $('#decRank').innerHTML = res.rows.map((r, i) => `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${i === 0 ? '🏆 ' : ''}${esc(r.name)}</span><span class="muted">${r.total}</span></div><div class="rankbar" style="width:${Math.max(8, r.total)}%">${r.total}</div></div>`).join('');
      $$('.score-in', $('#decBody')).forEach((inp) => inp.onchange = () => { const o = inp.dataset.o, c = inp.dataset.c; d.scores[o] = d.scores[o] || {}; d.scores[o][c] = clamp(+inp.value || 0, 0, 10); save(); draw(); });
    };
    v.innerHTML = `<div class="vhead"><div><h2>⚖️ Decide</h2><p>Weighted decision matrix. Score each option against criteria (0–10); weights tune what matters. The winner updates live.</p></div><div class="spacer"></div><button class="btn sm" id="addCrit">＋ Criterion</button></div>
      <div class="grid" style="grid-template-columns:1.6fr 1fr;align-items:start"><div class="card" id="decBody"></div><div class="card"><h4 style="margin:0 0 8px">Live ranking</h4><div id="decRank"></div></div></div>`;
    $('#addCrit').onclick = () => { const n = prompt('Criterion name:'); if (n) { d.criteria.push({ id: uid(), name: n, weight: 3 }); save(); draw(); } };
    draw();
  }

  function vRoadmap(v, p) {
    v.innerHTML = `<div class="vhead"><div><h2>🗺️ Roadmap</h2><p>Auto-sequenced phases and milestones, tuned to your domain. Risky milestones are flagged early.</p></div><div class="spacer"></div><button class="btn pri sm" id="genR">✨ Generate from winning idea</button></div><div id="rmBody"></div>`;
    const draw = () => {
      if (!p.roadmap.length) { $('#rmBody').innerHTML = `<div class="card" style="text-align:center;padding:46px"><div style="font-size:40px">🗺️</div><p class="muted">No roadmap yet. Generate one from your prioritized idea.</p><button class="btn pri" id="genR2">✨ Generate roadmap</button></div>`; $('#genR2').onclick = gen; return; }
      const maxT = Math.max(...p.roadmap.flatMap((ph) => ph.tasks.map((t) => t.start + t.len)), 1);
      $('#rmBody').innerHTML = `<div class="gantt">${p.roadmap.map((ph) => `<div class="grow"><div class="ph"><span style="width:8px;height:8px;border-radius:50%;background:var(--acc)"></span>${esc(ph.phase)}</div><div class="track">${ph.tasks.map((t, i) => `<div class="gbar${t.risk ? ' risk' : ''}" style="left:${t.start / maxT * 100}%;width:${t.len / maxT * 100}%;top:${6 + i * 0}px">${esc(t.name)}</div>`).join('')}</div></div>`).join('')}</div>
        <p class="muted" style="font-size:12px;margin-top:10px">⚠ = high-uncertainty milestone — de-risk with a spike or pilot first.</p>`;
    };
    const gen = () => { p.roadmap = Intel.roadmap(p.ideas[0] && p.ideas[0].title, p.domain); save(); draw(); toast('Roadmap generated'); confetti(); renderTop(); };
    $('#genR').onclick = gen; draw();
  }

  function vExecute(v, p) {
    v.innerHTML = `<div class="vhead"><div><h2>🛠️ Execute</h2><p>Drag cards across the board. Move to <b>Done</b> to log progress.</p></div><div class="spacer"></div><button class="btn sm" id="seedR">⤵ Seed tasks from roadmap</button></div><div class="board" id="board"></div>`;
    const draw = () => {
      $('#board').innerHTML = COLS.map((c) => `<div class="col" data-col="${c.id}"><h4>${c.n}<span class="ct">${p.tasks.filter((t) => t.col === c.id).length}</span></h4><div class="cards">${p.tasks.filter((t) => t.col === c.id).map((t) => kcard(t)).join('')}</div><div class="add-card" data-add="${c.id}">＋ Add card</div></div>`).join('');
      $$('.kcard', $('#board')).forEach((el) => {
        el.addEventListener('dragstart', () => { el.classList.add('drag'); window.__drag = el.dataset.id; });
        el.addEventListener('dragend', () => el.classList.remove('drag'));
      });
      $$('.col', $('#board')).forEach((col) => {
        col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
        col.addEventListener('dragleave', () => col.classList.remove('over'));
        col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('over'); const t = p.tasks.find((x) => x.id === window.__drag); if (t) { const was = t.col; t.col = col.dataset.col; save(); draw(); renderShell(); if (t.col === 'done' && was !== 'done') confetti(); } });
      });
      $$('[data-add]', $('#board')).forEach((b) => b.onclick = () => { const t = prompt('Task:'); if (t) { p.tasks.push({ id: uid(), title: t, col: b.dataset.add, assignee: state.user.name, prio: 'med' }); save(); draw(); renderShell(); } });
    };
    $('#seedR').onclick = () => { if (!p.roadmap.length) { toast('Generate a roadmap first'); return; } p.roadmap.flatMap((ph) => ph.tasks).slice(0, 8).forEach((t) => { if (!p.tasks.find((x) => x.title === t.name)) p.tasks.push({ id: uid(), title: t.name, col: 'backlog', assignee: p.members[Math.floor(Math.random() * p.members.length)].name, prio: 'med' }); }); save(); draw(); renderShell(); toast('Seeded tasks from roadmap'); };
    draw();
  }
  function kcard(t) {
    const pc = { high: 'var(--bad)', med: 'var(--warn)', low: 'var(--good)' }[t.prio] || 'var(--ink-3)';
    const m = (proj().members.find((x) => x.name === t.assignee)) || {};
    return `<div class="kcard" draggable="true" data-id="${t.id}"><div class="t">${esc(t.title)}</div><div class="ft"><span class="prio" style="background:${pc}"></span><span class="muted" style="font-size:11px">${esc(t.prio)}</span><div class="spacer" style="flex:1"></div><div class="avatar" style="width:22px;height:22px;font-size:10px;background:${m.color || '#64748b'}">${esc((t.assignee || '?')[0].toUpperCase())}</div></div></div>`;
  }

  function vInsights(v, p) {
    const done = p.tasks.filter((t) => t.col === 'done').length; const prog = p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0;
    const ins = Intel.insights(p);
    const colCounts = COLS.map((c) => p.tasks.filter((t) => t.col === c.id).length);
    const donut = donutGradient(colCounts, ['#64748b', 'var(--info)', 'var(--warn)', 'var(--good)']);
    v.innerHTML = `<div class="vhead"><div><h2>📊 Insights</h2><p>Live read on momentum, risk and what to do next — generated from your workspace.</p></div></div>
      <div class="tiles" style="margin-bottom:16px">
        ${tile('Execution', prog + '%', 'good')}${tile('Ideas', p.ideas.length, '')}${tile('Open tasks', p.tasks.filter((t) => t.col !== 'done').length, 'warn')}${tile('Milestones', p.roadmap.flatMap((x) => x.tasks).length, '')}${tile('Team', p.members.length, '')}
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
        <div class="card chart-card"><h4>Where the work sits</h4><div style="display:flex;gap:20px;align-items:center"><div style="width:130px;height:130px;border-radius:50%;background:${donut};position:relative"><div style="position:absolute;inset:18px;background:var(--bg1);border-radius:50%;display:grid;place-items:center"><b style="font-size:22px">${p.tasks.length}</b></div></div><div>${COLS.map((c, i) => `<div style="display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px"><span style="width:10px;height:10px;border-radius:3px;background:${['#64748b', 'var(--info)', 'var(--warn)', 'var(--good)'][i]}"></span>${c.n} <b style="margin-left:auto">${colCounts[i]}</b></div>`).join('')}</div></div></div>
        <div class="assistant"><div class="hd"><div class="orb"></div><b>What the engine sees</b></div>${ins.map((x) => `<div class="insight ${x.tone}" style="margin-bottom:10px"><span class="pip"></span><div><b>${esc(x.title)}</b><p>${esc(x.body)}</p></div></div>`).join('')}</div>
      </div>`;
    requestAnimationFrame(() => $$('[data-count]', v).forEach(countUp));
  }
  const tile = (l, v, tone) => `<div class="card" style="padding:16px"><div class="muted" style="font-size:12px">${l}</div><div style="font-size:26px;font-weight:800" class="${tone ? 'tag-' + tone : ''}"><span data-count="${parseInt(v) || 0}">0</span>${String(v).includes('%') ? '%' : ''}</div></div>`;

  function vResearch(v, p) {
    v.innerHTML = `<div class="vhead"><div><h2>🔬 Research & data</h2><p>Capture evidence, interview notes and sources. Everything stays linked to this project.</p></div><div class="spacer"></div><button class="btn sm" id="addR">＋ Add note</button></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))" id="rGrid"></div>`;
    const draw = () => $('#rGrid').innerHTML = p.research.map((r) => `<div class="card"><div style="display:flex;justify-content:space-between"><b>${esc(r.title)}</b><span class="del" data-del="${r.id}" style="cursor:pointer;color:var(--ink-3)">✕</span></div><p class="muted" style="font-size:13px;margin:8px 0">${esc(r.note)}</p><span class="tag">${esc(r.source || 'note')}</span></div>`).join('') || '<div class="muted">No notes yet.</div>';
    $('#addR').onclick = () => { const t = prompt('Title:'); if (!t) return; const n = prompt('Note:') || ''; p.research.push({ id: uid(), title: t, note: n, source: 'You' }); save(); draw(); };
    $('#rGrid').onclick = (e) => { const d = e.target.closest('[data-del]'); if (d) { p.research = p.research.filter((x) => x.id !== d.dataset.del); save(); draw(); } };
    draw();
  }

  const MARKET = [
    { e: '🎨', n: 'Kwesi Design Co.', cat: 'Design', t: 'experts', d: 'Brand, UX and pitch decks for African product teams.', r: 4.9 },
    { e: '💳', n: 'Paystack', cat: 'Payments', t: 'tools', d: 'Accept MoMo & cards across Ghana and Nigeria.', r: 4.8 },
    { e: '📊', n: 'InsightLab', cat: 'Research', t: 'experts', d: 'Field research & data collection at scale.', r: 4.7 },
    { e: '⚖️', n: 'LexAfrica', cat: 'Legal', t: 'experts', d: 'Company setup, contracts and compliance.', r: 4.6 },
    { e: '🧩', n: 'Lean Canvas Pack', cat: 'Template', t: 'templates', d: 'Battle-tested canvases for problem→solution fit.', r: 4.9 },
    { e: '☁️', n: 'Render', cat: 'Infra', t: 'tools', d: 'Deploy your backend with a managed database.', r: 4.7 },
    { e: '📣', n: 'Adwoa Growth', cat: 'Marketing', t: 'experts', d: 'Go-to-market and performance campaigns.', r: 4.8 },
    { e: '🤝', n: 'Impact Grants DB', cat: 'Funding', t: 'templates', d: 'Curated grants & investors for your sector.', r: 4.5 },
  ];
  function vMarket(v, p) {
    let f = 'all';
    const draw = () => $('#mGrid').innerHTML = MARKET.filter((m) => f === 'all' || m.t === f).map((m) => `<div class="mcard"><div class="top"><div class="logo2" style="background:color-mix(in srgb,var(--acc) 18%,transparent)">${m.e}</div><div><h3>${esc(m.n)}</h3><div class="cat">${esc(m.cat)}</div></div></div><div class="desc">${esc(m.d)}</div><div class="foot"><span class="rate">★ ${m.r}</span><button class="btn sm pri" data-add="${esc(m.n)}">Add to project</button></div></div>`).join('');
    v.innerHTML = `<div class="vhead"><div><h2>🛒 Marketplace</h2><p>Plug experts, tools, templates and funding straight into your project.</p></div></div>
      <div class="filters" id="filt">${[['all', 'All'], ['experts', 'Experts'], ['tools', 'Tools'], ['templates', 'Templates']].map((x, i) => `<div class="fchip${i === 0 ? ' on' : ''}" data-f="${x[0]}">${x[1]}</div>`).join('')}</div>
      <div class="mcards" id="mGrid"></div>`;
    $('#filt').onclick = (e) => { const c = e.target.closest('[data-f]'); if (!c) return; f = c.dataset.f; $$('#filt .fchip').forEach((x) => x.classList.toggle('on', x === c)); draw(); };
    $('#mGrid').onclick = (e) => { const a = e.target.closest('[data-add]'); if (a) { p.research.push({ id: uid(), title: a.dataset.add, note: 'Added from marketplace.', source: 'Marketplace' }); save(); toast(a.dataset.add + ' added to Research'); } };
    draw();
  }

  function vTeam(v, p) {
    v.innerHTML = `<div class="vhead"><div><h2>👥 Team</h2><p>Who’s building this. Roles power workload insights.</p></div><div class="spacer"></div><button class="btn sm" id="addM">＋ Add member</button></div>
      <div class="pcards" id="tGrid"></div>`;
    const draw = () => $('#tGrid').innerHTML = p.members.map((m, i) => `<div class="card" style="display:flex;align-items:center;gap:14px"><div class="avatar" style="width:46px;height:46px;font-size:18px;background:${m.color || AV_COLORS[i % AV_COLORS.length]}">${esc((m.name[0] || '?').toUpperCase())}</div><div style="flex:1"><b>${esc(m.name)}</b><div class="muted" style="font-size:13px">${esc(m.role || 'Member')}</div></div><span class="tag">${p.tasks.filter((t) => t.assignee === m.name && t.col !== 'done').length} active</span></div>`).join('');
    $('#addM').onclick = () => { const n = prompt('Name:'); if (!n) return; const r = prompt('Role:') || 'Member'; p.members.push({ name: n, role: r, color: AV_COLORS[p.members.length % AV_COLORS.length] }); save(); draw(); renderShell(); };
    draw();
  }

  function vSettings(v) {
    const u = state.user;
    v.innerHTML = `<div class="vhead"><div><h2>⚙️ Settings</h2><p>Make the studio yours.</p></div></div>
      <div class="card" style="max-width:560px">
        <label style="font-size:11px;text-transform:uppercase;color:var(--ink-3);font-weight:700">Name</label><input class="field" id="seName" value="${esc(u.name)}" style="margin:6px 0 14px">
        <label style="font-size:11px;text-transform:uppercase;color:var(--ink-3);font-weight:700">Role</label><input class="field" id="seRole" value="${esc(u.role)}" style="margin:6px 0 14px">
        <label style="font-size:11px;text-transform:uppercase;color:var(--ink-3);font-weight:700">Accent</label>
        <div class="accent-row" id="seAcc" style="margin:8px 0 16px">${ACCENTS.map((a, i) => `<div class="acc-pick${i === u.accent ? ' on' : ''}" data-i="${i}" style="background:linear-gradient(135deg,${a.acc},${a.acc2})"></div>`).join('')}</div>
        <label style="font-size:11px;text-transform:uppercase;color:var(--ink-3);font-weight:700">Theme</label>
        <div style="display:flex;gap:8px;margin:8px 0 18px"><button class="btn sm" data-th="dark">🌙 Dark</button><button class="btn sm" data-th="light">☀️ Light</button></div>
        <button class="btn pri" id="seSave">Save</button> <button class="btn ghost" id="seReset">Reset everything</button>
      </div>`;
    $('#seAcc').onclick = (e) => { const o = e.target.closest('[data-i]'); if (!o) return; u.accent = +o.dataset.i; applyAccent(ACCENTS[u.accent]); $$('#seAcc .acc-pick').forEach((x) => x.classList.toggle('on', x === o)); save(); };
    $$('[data-th]', v).forEach((b) => b.onclick = () => { u.theme = b.dataset.th; applyTheme(u.theme); save(); });
    $('#seSave').onclick = () => { u.name = $('#seName').value.trim() || u.name; u.role = $('#seRole').value.trim() || u.role; save(); renderShell(); toast('Saved'); };
    $('#seReset').onclick = () => { if (confirm('Erase all local data and restart onboarding?')) { localStorage.removeItem(KEY); location.reload(); } };
  }

  function newProject() {
    $('#psMenu') && $('#psMenu').classList.remove('open');
    const m = $('#modal'), b = $('#modalBody'); let dom = state.user.domain;
    b.innerHTML = `<h2>New project</h2><p class="lead">Name it and pick a domain — we’ll pre-load a tuned starting point.</p>
      <label>Project name</label><input class="field" id="npName" placeholder="e.g. Clinic wait-time initiative" />
      <label>Domain</label><div class="opt-grid" id="npDom">${INSTITUTIONS.map((x) => `<div class="opt${x.domain === dom ? ' on' : ''}" data-d="${x.domain}"><span class="e">${x.e}</span>${x.label}</div>`).join('')}</div>
      <div style="display:flex;gap:10px;margin-top:20px"><button class="btn pri" id="npGo" style="flex:1;justify-content:center">Create</button><button class="btn ghost" id="npX">Cancel</button></div>`;
    m.classList.add('open');
    $('#npDom').onclick = (e) => { const o = e.target.closest('[data-d]'); if (!o) return; dom = o.dataset.d; $$('#npDom .opt').forEach((x) => x.classList.remove('on')); o.classList.add('on'); };
    $('#npX').onclick = () => m.classList.remove('open');
    $('#npGo').onclick = () => { const nm = $('#npName').value.trim() || 'Untitled project'; const owner = { name: state.user.name, role: state.user.role, color: AV_COLORS[0] }; const np = seedProject(nm, dom, owner); state.projects.unshift(np); state.current = np.id; state.view = 'home'; save(); m.classList.remove('open'); boot(); toast('Project created'); };
  }

  /* ---------------- command palette ---------------- */
  let cmds = [], cmdSel = 0;
  function buildCmds() {
    cmds = [];
    NAV.filter((n) => n.id).forEach((n) => cmds.push({ g: 'Go to', ic: n.ic, label: n.label, run: () => go(n.id) }));
    cmds.push({ g: 'Action', ic: '✨', label: 'Frame a problem', run: () => go('frame') });
    cmds.push({ g: 'Action', ic: '💡', label: 'Add brainstorm note', run: () => { proj().brainstorm.push({ id: uid(), text: 'New idea…', x: 60, y: 60, color: NOTE_COLORS[0], votes: 0 }); save(); go('brainstorm'); } });
    cmds.push({ g: 'Action', ic: '🗺️', label: 'Generate roadmap', run: () => { const p = proj(); p.roadmap = Intel.roadmap(p.ideas[0] && p.ideas[0].title, p.domain); save(); go('roadmap'); confetti(); } });
    cmds.push({ g: 'Action', ic: '＋', label: 'New project', run: newProject });
    cmds.push({ g: 'Action', ic: '🌓', label: 'Toggle theme', run: () => { state.user.theme = state.user.theme === 'light' ? 'dark' : 'light'; applyTheme(state.user.theme); save(); } });
    state.projects.forEach((p) => cmds.push({ g: 'Switch project', ic: '📁', label: p.name, run: () => { state.current = p.id; save(); boot(); } }));
  }
  function openCmd() { buildCmds(); $('#cmdk').classList.add('open'); $('#cmdkInput').value = ''; cmdSel = 0; drawCmd(''); $('#cmdkInput').focus(); }
  function closeCmd() { $('#cmdk').classList.remove('open'); }
  function filtered(q) { q = q.toLowerCase(); return cmds.filter((c) => c.label.toLowerCase().includes(q) || c.g.toLowerCase().includes(q)); }
  function drawCmd(q) {
    const list = filtered(q); cmdSel = clamp(cmdSel, 0, Math.max(0, list.length - 1));
    let html = '', lastG = '';
    list.forEach((c, i) => { if (c.g !== lastG) { html += `<div class="grp">${c.g}</div>`; lastG = c.g; } html += `<div class="res${i === cmdSel ? ' sel' : ''}" data-i="${i}"><span class="ic">${c.ic}</span>${esc(c.label)}<span class="hint">↵</span></div>`; });
    $('#cmdkResults').innerHTML = html || '<div class="grp">No matches</div>';
    $('#cmdkResults').querySelectorAll('.res').forEach((el) => el.onclick = () => { list[+el.dataset.i].run(); closeCmd(); });
  }

  /* ---------------- viz / fx ---------------- */
  function countUp(el) { const to = +el.dataset.count || 0; const t0 = performance.now(), dur = 700; const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  function donutGradient(vals, colors) { const tot = vals.reduce((a, b) => a + b, 0) || 1; let acc = 0; const segs = vals.map((v, i) => { const a = acc / tot * 360, b = (acc + v) / tot * 360; acc += v; return `${colors[i]} ${a}deg ${b}deg`; }); return `conic-gradient(${segs.join(',')})`; }
  function dragXY(el, container, onMove, onEnd) {
    el.addEventListener('pointerdown', (e) => {
      if (e.target.isContentEditable || e.target.closest('.del,.vote')) return;
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} el.classList.add('drag');
      const move = (ev) => { const r = container.getBoundingClientRect(); onMove(ev.clientX - r.left, ev.clientY - r.top, r); };
      const up = () => { el.classList.remove('drag'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); onEnd && onEnd(); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
  }
  let toastT;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function confetti() {
    const c = $('#confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#34d399', '#f6c453', '#60a5fa', '#f472b6', '#a78bfa'];
    const P = Array.from({ length: 130 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 4, c: cols[Math.floor(Math.random() * cols.length)], s: 4 + Math.random() * 6, r: Math.random() * 6 }));
    let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); P.forEach((p) => { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 110) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height); })();
  }

  /* ---------------- boot ---------------- */
  function boot() { renderShell(); renderTop(); renderView(); }
  function init() {
    state = load();
    $('#cmdkBtn').onclick = openCmd;
    $('#themeBtn').onclick = () => { state.user.theme = state.user.theme === 'light' ? 'dark' : 'light'; applyTheme(state.user.theme); save(); };
    $('#cmdk').addEventListener('click', (e) => { if (e.target.id === 'cmdk') closeCmd(); });
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('open'); });
    $('#cmdkInput').addEventListener('input', (e) => { cmdSel = 0; drawCmd(e.target.value); });
    $('#cmdkInput').addEventListener('keydown', (e) => {
      const list = filtered($('#cmdkInput').value);
      if (e.key === 'ArrowDown') { cmdSel = clamp(cmdSel + 1, 0, list.length - 1); drawCmd($('#cmdkInput').value); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { cmdSel = clamp(cmdSel - 1, 0, list.length - 1); drawCmd($('#cmdkInput').value); e.preventDefault(); }
      else if (e.key === 'Enter') { if (list[cmdSel]) { list[cmdSel].run(); closeCmd(); } }
      else if (e.key === 'Escape') closeCmd();
    });
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('#projSwitch')) { const m = $('#psMenu'); if (m) m.classList.remove('open'); } });

    if (!state || !state.user || !state.user.onboarded) { onboard(); }
    else { applyAccent(ACCENTS[state.user.accent] || ACCENTS[0]); applyTheme(state.user.theme || 'dark'); state.view = state.view || 'home'; boot(); }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
