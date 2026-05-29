/* ============================================================
   Durbar Intelligence — a real, dependency-free reasoning engine.
   Deterministic NLP + decision science that turns raw problem
   statements into structured frames, priorities, decisions,
   roadmaps and insights. (Pluggable: if window.DURBAR_LLM is set,
   richer generation can be layered on top — see Intel.assist.)
   ============================================================ */
window.Intel = (function () {
  'use strict';

  const STOP = new Set(('a,an,the,and,or,but,if,then,so,that,this,these,those,of,to,in,on,for,with,at,by,from,up,about,into,over,after,is,are,was,were,be,been,being,it,its,as,we,our,us,you,your,they,their,them,i,me,my,he,she,his,her,not,no,can,could,should,would,will,do,does,did,have,has,had,too,very,more,most,much,many,some,any,all,each,how,what,why,when,where,who,which,than,because,also,just,only,still,even,get,got,make,made,need,want,like,use,using,used').split(','));

  const DOMAINS = {
    health:     { label: 'Healthcare', kw: ['patient','clinic','hospital','health','doctor','nurse','medical','disease','treatment','care','appointment','pharmacy','diagnosis','triage'], stakeholders: ['Patients','Clinicians','Hospital admin','Ministry of Health','Insurers','Community health workers'], kpis: ['Wait time','Patient satisfaction','Readmission rate','Cost per visit','Coverage %','No-show rate'], risks: ['Regulatory approval','Data privacy (PHI)','Clinical adoption','Equity of access'] },
    education:  { label: 'Education', kw: ['student','school','teacher','learn','course','class','exam','curriculum','university','literacy','grade','tuition','enrol','scholarship'], stakeholders: ['Students','Teachers','Parents','School leaders','Ministry of Education','Employers'], kpis: ['Completion rate','Learning outcomes','Attendance','Cost per learner','Employment rate'], risks: ['Teacher buy-in','Connectivity','Funding continuity','Assessment validity'] },
    finance:    { label: 'Finance', kw: ['money','payment','loan','credit','bank','momo','wallet','fee','fund','invest','savings','transaction','revenue','cost','budget','price'], stakeholders: ['Customers','Agents','Banks','Regulator','Investors','Merchants'], kpis: ['CAC','LTV','Default rate','Transaction volume','Float','Margin'], risks: ['KYC/AML compliance','Fraud','Liquidity','Interchange/pricing'] },
    agriculture:{ label: 'Agriculture', kw: ['farm','farmer','crop','harvest','soil','seed','yield','market','produce','livestock','irrigation','weather','cocoa','maize'], stakeholders: ['Smallholder farmers','Aggregators','Off-takers','Input suppliers','Extension officers'], kpis: ['Yield per hectare','Post-harvest loss','Price realised','Input cost','Time to market'], risks: ['Weather/climate','Price volatility','Logistics','Trust with farmers'] },
    events:     { label: 'Events', kw: ['event','wedding','guest','rsvp','venue','party','ticket','vendor','funeral','ceremony','celebration','invite'], stakeholders: ['Hosts','Guests','Vendors','Committee','Sponsors'], kpis: ['Attendance','Contribution collected','Vendor balance','RSVP rate','NPS'], risks: ['Money reconciliation','No-shows','Vendor reliability','Weather'] },
    government: { label: 'Public sector', kw: ['citizen','government','public','policy','service','permit','tax','license','ministry','agency','district','council'], stakeholders: ['Citizens','Civil servants','Agency heads','Oversight bodies','Vendors'], kpis: ['Turnaround time','Cost to serve','Citizen satisfaction','Compliance rate','Leakage reduced'], risks: ['Procurement rules','Political cycles','Interoperability','Change resistance'] },
    retail:     { label: 'Commerce', kw: ['shop','store','customer','product','order','inventory','sale','delivery','market','price','retail','merchant','cart','catalog'], stakeholders: ['Shoppers','Merchants','Suppliers','Delivery riders','Marketplace ops'], kpis: ['Conversion','AOV','Repeat rate','Stockout rate','Delivery time'], risks: ['Logistics','Counterfeits','Working capital','Returns'] },
    technology: { label: 'Technology', kw: ['app','software','data','platform','system','api','user','model','automation','cloud','ai','algorithm','code','digital'], stakeholders: ['End users','Engineers','Product','Ops/SRE','Security','Leadership'], kpis: ['Activation','Retention','Latency','Uptime','Unit economics'], risks: ['Scalability','Security','Tech debt','Vendor lock-in'] },
    energy:     { label: 'Energy', kw: ['power','energy','solar','grid','electricity','battery','fuel','outage','meter','utility','renewable'], stakeholders: ['Households','Businesses','Utility','Regulator','Financiers'], kpis: ['Uptime','Cost per kWh','Connections','Collection rate','Carbon avoided'], risks: ['Capex intensity','Tariff regulation','Maintenance','Theft'] },
    nonprofit:  { label: 'Social impact', kw: ['community','impact','donor','beneficiary','program','aid','volunteer','ngo','grant','poverty','development'], stakeholders: ['Beneficiaries','Donors','Field staff','Partners','Communities'], kpis: ['Reach','Cost per beneficiary','Outcome change','Retention','Match funding'], risks: ['Funding dependency','Attribution','Sustainability','Safeguarding'] },
    generic:    { label: 'General', kw: [], stakeholders: ['Customers','Team','Leadership','Partners','Suppliers'], kpis: ['Adoption','Cost','Time saved','Satisfaction','Revenue'], risks: ['Adoption','Budget','Timeline','Dependencies'] },
  };

  const tokenize = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  function keywords(text, n = 6) {
    const f = {}; tokenize(text).forEach((w) => (f[w] = (f[w] || 0) + 1));
    return Object.keys(f).sort((a, b) => f[b] - f[a]).slice(0, n);
  }
  function detectDomain(text) {
    const toks = new Set(tokenize(text)); let best = 'generic', score = 0;
    for (const k in DOMAINS) {
      const s = DOMAINS[k].kw.reduce((a, w) => a + (toks.has(w) ? 1 : 0), 0);
      if (s > score) { score = s; best = k; }
    }
    return best;
  }
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const pick = (arr, i) => arr[i % arr.length];

  function frameProblem(text) {
    const domain = detectDomain(text);
    const D = DOMAINS[domain];
    const kw = keywords(text, 8);
    const subject = kw[0] || 'experience';
    const object = kw[1] || 'process';
    const benefit = D.kpis[0] ? D.kpis[0].toLowerCase() : 'outcomes';
    const sh = D.stakeholders;
    const hmw = [
      `How might we rethink ${subject} so ${sh[0].toLowerCase()} get a faster, simpler experience?`,
      `How might we remove the friction around ${object} to improve ${benefit}?`,
      `How might we use data to help ${sh[1] ? sh[1].toLowerCase() : 'the team'} make better decisions about ${subject}?`,
      `How might we make ${subject} feel personal and trustworthy for every ${sh[0].slice(0, -1).toLowerCase() || 'user'}?`,
      `How might we lower the cost of ${object} without hurting quality?`,
    ];
    const whys = ['Why does this problem happen?', 'Why is that the case?', 'Why hasn\'t it been solved?', 'Why does the current approach fall short?', 'Why now — what makes it urgent?'];
    const statement = `For ${sh[0].toLowerCase()}, ${cap(subject)} is painful today${object ? ' because of ' + object : ''}. Solving it well should move ${(D.kpis.slice(0, 2).join(' and ')).toLowerCase()} — and feel effortless to the people it serves.`;
    const assumptions = [
      `${sh[0]} actually want this changed (validate with 5 interviews).`,
      `The gain is large enough to justify the effort.`,
      `We can reach ${sh[0].toLowerCase()} affordably.`,
    ];
    return { domain, domainLabel: D.label, statement, hmw, whys, stakeholders: sh, kpis: D.kpis, risks: D.risks, keywords: kw, assumptions };
  }

  function prioritize(ideas) {
    const xs = ideas.map((i) => ({ ...i, impact: +i.impact || 5, effort: +i.effort || 5, confidence: +i.confidence || 5 }));
    xs.forEach((i) => { i.score = Math.round(((i.impact * i.confidence) / Math.max(1, i.effort)) * 10) / 10; });
    const med = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 5; };
    const mi = med(xs.map((i) => i.impact)), me = med(xs.map((i) => i.effort));
    xs.forEach((i) => { i.quadrant = i.impact >= mi ? (i.effort < me ? 'quick-win' : 'big-bet') : (i.effort < me ? 'fill-in' : 'avoid'); });
    const ranked = [...xs].sort((a, b) => b.score - a.score);
    return { ranked, medians: { impact: mi, effort: me }, quickWins: xs.filter((i) => i.quadrant === 'quick-win'), bigBets: xs.filter((i) => i.quadrant === 'big-bet') };
  }

  function decide(options, criteria, scores) {
    const totW = criteria.reduce((a, c) => a + (+c.weight || 0), 0) || 1;
    const rows = options.map((o) => {
      let total = 0; criteria.forEach((c) => { total += ((+(scores[o.id] && scores[o.id][c.id]) || 0) / 10) * (+c.weight || 0); });
      return { id: o.id, name: o.name, total: Math.round((total / totW) * 1000) / 10 }; // 0..100
    }).sort((a, b) => b.total - a.total);
    return { rows, winner: rows[0] };
  }

  const PHASES = ['Discovery', 'Design', 'Build', 'Pilot', 'Launch', 'Scale'];
  function roadmap(seed, domain) {
    const D = DOMAINS[domain] || DOMAINS.generic;
    const lib = {
      Discovery: ['Interview ' + D.stakeholders[0].toLowerCase(), 'Map the current journey', 'Size the opportunity', 'Define success metrics'],
      Design: ['Sketch 3 concepts', 'Prototype the top concept', 'Usability test with ' + D.stakeholders[0].toLowerCase(), 'Pricing / model design'],
      Build: ['Build the MVP', 'Set up data & analytics', 'Integrate payments / partners', 'Internal QA'],
      Pilot: ['Recruit pilot cohort', 'Run 4-week pilot', 'Measure ' + (D.kpis[0] || 'impact').toLowerCase(), 'Iterate on feedback'],
      Launch: ['Go-to-market plan', 'Train ' + D.stakeholders[1] ? 'partners' : 'team', 'Public launch', 'Support & monitoring'],
      Scale: ['Expand to new segments', 'Automate operations', 'Raise / reinvest', 'Track ' + (D.kpis[1] || 'growth').toLowerCase()],
    };
    let cursor = 0;
    return PHASES.map((ph, pi) => {
      const tasks = (lib[ph] || []).map((name, ti) => {
        const len = 1 + ((pi + ti) % 3);
        const t = { id: 'rt' + pi + ti, name, start: cursor, len, risk: (pi >= 2 && ti === 0) };
        cursor += 1; return t;
      });
      cursor += 1;
      return { phase: ph, tasks };
    });
  }

  function insights(p) {
    const out = [];
    const tasks = p.tasks || []; const done = tasks.filter((t) => t.col === 'done').length;
    const prog = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    if (tasks.length) out.push({ tone: prog >= 70 ? 'good' : prog >= 30 ? 'warn' : 'bad', title: `${prog}% of execution complete`, body: `${done} of ${tasks.length} tasks done. ${prog < 30 ? 'Momentum is low — pick 3 tasks to finish this week.' : prog < 70 ? 'Steady progress. Watch the review column for pile-ups.' : 'Strong finish in sight — line up the launch checklist.'}` });
    const ideas = p.ideas || [];
    if (ideas.length && !(p._prioritized)) out.push({ tone: 'warn', title: `${ideas.length} ideas, none prioritized`, body: 'Open Prioritize to plot impact vs effort and surface the quick wins.' });
    const risky = (p.roadmap || []).flatMap((ph) => ph.tasks).filter((t) => t.risk).length;
    if (risky) out.push({ tone: 'bad', title: `${risky} milestone risks flagged`, body: 'High-uncertainty milestones detected early in delivery — de-risk them with a spike or pilot first.' });
    const load = {};
    tasks.forEach((t) => { if (t.assignee) load[t.assignee] = (load[t.assignee] || 0) + 1; });
    const top = Object.keys(load).sort((a, b) => load[b] - load[a])[0];
    if (top && load[top] >= 4) out.push({ tone: 'warn', title: `${top} is carrying the load`, body: `${load[top]} active tasks on one person — rebalance to protect the timeline.` });
    if (!out.length) out.push({ tone: 'good', title: 'Workspace is healthy', body: 'Capture ideas, prioritize them, and turn the top one into a roadmap to get moving.' });
    return out;
  }

  function suggestNext(p) {
    if (!p.brainstorm || p.brainstorm.length < 3) return { label: 'Brainstorm the problem', view: 'brainstorm', why: 'Capture at least a few ideas on the canvas to get going.' };
    if (!p.ideas || !p.ideas.length) return { label: 'Prioritize your ideas', view: 'prioritize', why: 'Turn raw ideas into a ranked shortlist.' };
    if (!p.roadmap || !p.roadmap.length) return { label: 'Generate a roadmap', view: 'roadmap', why: 'Sequence the winning idea into phases and milestones.' };
    if (!p.tasks || !p.tasks.length) return { label: 'Start executing', view: 'execute', why: 'Break the plan into tasks on the board.' };
    return { label: 'Review insights', view: 'insights', why: 'See progress, risks and what to do next.' };
  }

  // Optional richer generation hook (kept deterministic unless a model is wired in).
  async function assist(kind, payload) {
    if (typeof window.DURBAR_LLM === 'function') { try { return await window.DURBAR_LLM(kind, payload); } catch (e) {} }
    if (kind === 'frame') return frameProblem(payload.text);
    return null;
  }

  return { DOMAINS, keywords, detectDomain, frameProblem, prioritize, decide, roadmap, insights, suggestNext, assist, PHASES };
})();
