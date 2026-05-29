// ============================================================
//  Durbar — API + static server (Node built-in http, zero deps)
// ============================================================
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import * as db from './db.js';
import * as paystack from './paystack.js';
import { sendMail } from './mailer.js';
import {
  hashPassword, verifyPassword, signToken, verifyToken,
  parseCookies, sessionCookie, clearCookie, COOKIE_NAME,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const MAX_BODY = 8 * 1024 * 1024;
const PROD = process.env.NODE_ENV === 'production';
const DEV_TOKENS = process.env.DURBAR_DEV_TOKENS === '1'; // expose verify/reset links in responses (dev only)
const BASE_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const token = () => randomBytes(24).toString('hex');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.map': 'application/json',
};
const CSP = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; " +
  "script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': CSP,
  ...(PROD ? { 'Strict-Transport-Security': 'max-age=15552000; includeSubDomains' } : {}),
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...SECURITY, ...headers });
  res.end(body);
};
const json = (res, status, obj, headers = {}) =>
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', ...headers });

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readBody(req) {
  const raw = await readRaw(req);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString()); } catch { throw new Error('bad json'); }
}

const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
const currentUser = (req) => { const d = verifyToken(parseCookies(req)[COOKIE_NAME]); return d && d.uid ? db.getUserById(d.uid) : null; };

function originOk(req) {
  const o = req.headers.origin; if (!o) return true; // curl / same-origin navigations omit Origin
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

// ---- simple in-memory rate limiter ----
const buckets = new Map();
function bump(key, max, windowMs) {
  const t = Date.now(); let b = buckets.get(key);
  if (!b || t > b.reset) { b = { count: 0, reset: t + windowMs }; buckets.set(key, b); }
  b.count++;
  return b.count <= max ? 0 : Math.ceil((b.reset - t) / 1000);
}
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (t > b.reset) buckets.delete(k); }, 5 * 60 * 1000).unref();

const slugify = (s) => String(s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event';
function uniqueSlug(title) {
  const base = slugify(title);
  for (let i = 0; i < 8; i++) { const s = base + '-' + Math.random().toString(36).slice(2, 6); if (!db.slugExists(s)) return s; }
  return base + '-' + Date.now().toString(36);
}
const clamp = (s, n) => String(s == null ? '' : s).slice(0, n);
// Build a safe meta JSON ({answers, partyNames}) for an RSVP — bounded in size.
function buildRsvpMeta(answers, partyNames) {
  const out = {};
  if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
    const a = {};
    Object.keys(answers).slice(0, 20).forEach((k) => {
      const v = answers[k], key = clamp(k, 40);
      if (Array.isArray(v)) a[key] = v.slice(0, 20).map((x) => clamp(x, 80));
      else if (v != null && v !== '') a[key] = clamp(v, 280);
    });
    if (Object.keys(a).length) out.answers = a;
  }
  if (Array.isArray(partyNames)) {
    const pn = partyNames.slice(0, 20).map((x) => clamp(x, 80)).filter(Boolean);
    if (pn.length) out.partyNames = pn;
  }
  const s = JSON.stringify(out);
  return s === '{}' ? '' : s.slice(0, 4000);
}
const publicView = (event) => {
  const fundTotals = {}; db.sumContributionsByFund(event.id).forEach((r) => { fundTotals[r.fund] = r.total; });
  return { slug: event.slug, event: JSON.parse(event.data_json).event || {}, collected: db.sumContributions(event.id), fundTotals, paystack: paystack.isConfigured() };
};

async function serveStatic(req, res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, 'Not found');
  const body = await readFile(file);
  send(res, 200, body, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const p = url.pathname, m = req.method;
  try {
    if (!p.startsWith('/api/')) return void await serveStatic(req, res, p);

    // ---------- Paystack webhook (cross-origin; verified by signature) ----------
    if (p === '/api/webhooks/paystack' && m === 'POST') {
      const raw = await readRaw(req);
      if (!paystack.verifySignature(raw, req.headers['x-paystack-signature'])) return json(res, 401, { error: 'bad signature' });
      let ev = {}; try { ev = JSON.parse(raw.toString()); } catch {}
      if (ev.event === 'charge.success' && ev.data && ev.data.reference) db.setContributionStatusByRef(ev.data.reference, 'paid');
      return json(res, 200, { ok: true });
    }

    // ---------- guards on mutations ----------
    const mutating = m === 'POST' || m === 'PUT' || m === 'DELETE';
    if (mutating && !originOk(req)) return json(res, 403, { error: 'cross-origin request blocked' });

    const ip = clientIp(req);
    const sensitive = m === 'POST' && (p === '/api/auth/login' || p === '/api/auth/signup' || p === '/api/auth/request-reset' || p === '/api/auth/reset');
    const isPublicPost = /^\/api\/public\//.test(p) && mutating;
    if (mutating) {
      const cat = sensitive ? ['auth', 12, 60000] : isPublicPost ? ['pub', 30, 60000] : ['gen', 200, 60000];
      const retry = bump(cat[0] + ':' + ip, cat[1], cat[2]);
      if (retry) return json(res, 429, { error: 'Too many requests — slow down a moment.' }, { 'Retry-After': String(retry) });
    }

    // ---------- AUTH ----------
    if (p === '/api/auth/signup' && m === 'POST') {
      const { email, password, name } = await readBody(req);
      if (!email || !/.+@.+\..+/.test(email)) return json(res, 400, { error: 'Enter a valid email' });
      if (!password || String(password).length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });
      if (db.getUserByEmail(email)) return json(res, 409, { error: 'That email already has an account — try signing in' });
      const vt = token();
      const user = db.createUser(email, hashPassword(password), clamp(name, 80), vt);
      const verifyUrl = `${BASE_URL}/api/auth/verify?token=${vt}`;
      sendMail({ to: user.email, subject: 'Confirm your Durbar account', text: `Welcome to Durbar!\nConfirm your email:\n${verifyUrl}` }).catch(() => {});
      return json(res, 200, { user, ...(DEV_TOKENS ? { devVerifyUrl: verifyUrl } : {}) }, { 'Set-Cookie': sessionCookie(signToken({ uid: user.id })) });
    }
    if (p === '/api/auth/login' && m === 'POST') {
      const { email, password } = await readBody(req);
      const row = db.getUserByEmail(email || '');
      if (!row || !verifyPassword(password, row.pass_hash)) return json(res, 401, { error: 'Wrong email or password' });
      return json(res, 200, { user: db.getUserById(row.id) }, { 'Set-Cookie': sessionCookie(signToken({ uid: row.id })) });
    }
    if (p === '/api/auth/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
    if (p === '/api/auth/me' && m === 'GET') return json(res, 200, { user: currentUser(req) });
    if (p === '/api/auth/verify' && m === 'GET') {
      const ok = db.verifyUserByToken(url.searchParams.get('token') || '');
      return send(res, ok ? 302 : 400, ok ? '' : 'Invalid or expired link', ok ? { Location: '/studio.html?verified=1' } : { 'Content-Type': 'text/plain' });
    }
    if (p === '/api/auth/request-reset' && m === 'POST') {
      const { email } = await readBody(req);
      const row = db.getUserByEmail(email || '');
      if (row) {
        const rt = token(); db.setResetToken(row.id, rt, Date.now() + 60 * 60 * 1000);
        sendMail({ to: row.email, subject: 'Reset your Durbar password', text: `Use this code to reset your password (valid 1 hour):\n\n${rt}` }).catch(() => {});
        if (DEV_TOKENS) return json(res, 200, { ok: true, devResetToken: rt });
      }
      return json(res, 200, { ok: true }); // never reveal whether the email exists
    }
    if (p === '/api/auth/reset' && m === 'POST') {
      const { token: rt, password } = await readBody(req);
      if (!password || String(password).length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });
      const row = db.getUserByResetToken(rt || '');
      if (!row) return json(res, 400, { error: 'Invalid or expired reset code' });
      db.updatePassword(row.id, hashPassword(password));
      return json(res, 200, { ok: true });
    }

    // ---------- PUBLIC ----------
    let mm;
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)$/)) && m === 'GET') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      return json(res, 200, publicView(ev));
    }
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)\/rsvp$/)) && m === 'POST') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      const b = await readBody(req);
      if (!b.name || !String(b.name).trim()) return json(res, 400, { error: 'Name is required' });
      const r = db.addRsvp(ev.id, { name: clamp(b.name, 80).trim(), phone: clamp(b.phone, 30), status: ['yes', 'maybe', 'no'].includes(b.status) ? b.status : 'yes', party: Math.max(0, Math.min(50, +b.party || 1)), note: clamp(b.note, 280), source: 'link', meta: buildRsvpMeta(b.answers, b.partyNames) });
      return json(res, 200, { ok: true, rsvp: r });
    }
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)\/contribute$/)) && m === 'POST') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      const b = await readBody(req);
      const amount = Math.round((+b.amount || 0) * 100) / 100;
      if (!b.name || !String(b.name).trim()) return json(res, 400, { error: 'Name is required' });
      if (amount <= 0) return json(res, 400, { error: 'Enter an amount' });
      db.addContribution(ev.id, { name: clamp(b.name, 80).trim(), amount, method: clamp(b.method, 20) || 'momo', fund: clamp(b.fund, 40), status: 'recorded' });
      const fundTotals = {}; db.sumContributionsByFund(ev.id).forEach((r) => { fundTotals[r.fund] = r.total; });
      return json(res, 200, { ok: true, collected: db.sumContributions(ev.id), fundTotals });
    }
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)\/pay\/init$/)) && m === 'POST') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      const b = await readBody(req);
      const amount = Math.round((+b.amount || 0) * 100) / 100;
      if (!b.name || amount <= 0) return json(res, 400, { error: 'Name and amount required' });
      if (!paystack.isConfigured()) return json(res, 200, { mock: true }); // client uses record-and-track flow
      const ref = 'dbr_' + ev.id + '_' + token().slice(0, 16);
      db.addContribution(ev.id, { name: clamp(b.name, 80).trim(), email: clamp(b.email, 120), amount, method: 'paystack', ref, fund: clamp(b.fund, 40), status: 'pending' });
      try {
        const tx = await paystack.initTransaction({ email: b.email || 'guest@durbar.app', amount, reference: ref, metadata: { event: ev.slug, name: b.name }, callbackUrl: `${BASE_URL}/event.html?e=${ev.slug}&paid=1` });
        return json(res, 200, { authorization_url: tx.authorization_url, reference: ref });
      } catch (e) { db.setContributionStatusByRef(ref, 'failed'); return json(res, 502, { error: 'Payment init failed: ' + e.message }); }
    }

    // ---------- EVENTS (owner) ----------
    const user = currentUser(req);
    if (p === '/api/events' && m === 'GET') { if (!user) return json(res, 401, { error: 'Sign in first' }); return json(res, 200, { events: db.getEventsByOwner(user.id) }); }
    if (p === '/api/events' && m === 'POST') {
      if (!user) return json(res, 401, { error: 'Sign in first' });
      const { state } = await readBody(req);
      if (!state || !state.event) return json(res, 400, { error: 'Missing event data' });
      const title = clamp(state.event.title || 'Untitled event', 120);
      const ev = db.createEvent(user.id, uniqueSlug(title), title, JSON.stringify(state));
      return json(res, 200, { event: { id: ev.id, slug: ev.slug, title: ev.title } });
    }
    if ((mm = p.match(/^\/api\/events\/(\d+)(\/.*)?$/))) {
      if (!user) return json(res, 401, { error: 'Sign in first' });
      const ev = db.getEventById(+mm[1]);
      if (!ev || ev.owner_id !== user.id) return json(res, 404, { error: 'Event not found' });
      const sub = mm[2] || '';

      if (sub === '' && m === 'GET') return json(res, 200, { event: { id: ev.id, slug: ev.slug, title: ev.title, state: JSON.parse(ev.data_json) }, rsvps: db.getRsvps(ev.id), contributions: db.getContributions(ev.id) });
      if (sub === '' && m === 'PUT') { const { state } = await readBody(req); if (!state || !state.event) return json(res, 400, { error: 'Missing event data' }); db.updateEvent(ev.id, clamp(state.event.title || ev.title, 120), JSON.stringify(state)); return json(res, 200, { ok: true }); }
      if (sub === '' && m === 'DELETE') { db.deleteEvent(ev.id); return json(res, 200, { ok: true }); }

      if (sub === '/guests' && m === 'POST') {
        const b = await readBody(req);
        if (!b.name || !String(b.name).trim()) return json(res, 400, { error: 'Name is required' });
        const r = db.addRsvp(ev.id, { name: clamp(b.name, 80).trim(), phone: clamp(b.phone, 30), status: ['yes', 'maybe', 'no', 'pending'].includes(b.status) ? b.status : 'pending', party: Math.max(0, Math.min(50, +b.party || 1)), note: clamp(b.note, 280), source: 'host' });
        return json(res, 200, { rsvp: r });
      }
      if ((mm = sub.match(/^\/guests\/(\d+)$/))) {
        const r = db.getRsvpById(+mm[1]); if (!r || r.event_id !== ev.id) return json(res, 404, { error: 'Guest not found' });
        if (m === 'PUT') { const b = await readBody(req); return json(res, 200, { rsvp: db.updateRsvp(r.id, { name: b.name != null ? clamp(b.name, 80) : undefined, phone: b.phone != null ? clamp(b.phone, 30) : undefined, status: ['yes', 'maybe', 'no', 'pending'].includes(b.status) ? b.status : undefined, party: b.party != null ? Math.max(0, Math.min(50, +b.party)) : undefined, note: b.note != null ? clamp(b.note, 280) : undefined }) }); }
        if (m === 'DELETE') { db.deleteRsvp(r.id); return json(res, 200, { ok: true }); }
      }
      if (sub === '/contributions' && m === 'POST') {
        const b = await readBody(req); const amount = Math.round((+b.amount || 0) * 100) / 100;
        if (!b.name || amount <= 0) return json(res, 400, { error: 'Name and amount required' });
        return json(res, 200, { contribution: db.addContribution(ev.id, { name: clamp(b.name, 80).trim(), amount, method: clamp(b.method, 20) || 'manual', status: 'recorded' }) });
      }
      if ((mm = sub.match(/^\/contributions\/(\d+)$/)) && m === 'DELETE') {
        const c = db.getContributionById(+mm[1]); if (!c || c.event_id !== ev.id) return json(res, 404, { error: 'Not found' });
        db.deleteContribution(c.id); return json(res, 200, { ok: true });
      }
    }

    return json(res, 404, { error: 'Unknown endpoint' });
  } catch (e) {
    const status = e.message === 'payload too large' ? 413 : (e.message === 'bad json' ? 400 : 500);
    if (!res.headersSent) json(res, status, { error: e.message || 'Server error' });
  } finally {
    process.stderr.write(`${m} ${p} -> ${res.statusCode}\n`);
  }
});

server.listen(PORT, () => console.log(`Durbar server on ${BASE_URL}  (paystack: ${paystack.isConfigured() ? 'live' : 'mock'})`));
