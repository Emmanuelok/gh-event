// ============================================================
//  Durbar — API + static server (Node built-in http, zero deps)
// ============================================================
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from './db.js';
import {
  hashPassword, verifyPassword, signToken, verifyToken,
  parseCookies, sessionCookie, clearCookie, COOKIE_NAME,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const MAX_BODY = 8 * 1024 * 1024; // 8MB (events can carry a cover photo + gallery)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.map': 'application/json',
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
};
const json = (res, status, obj, headers = {}) =>
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', ...headers });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

const currentUser = (req) => {
  const data = verifyToken(parseCookies(req)[COOKIE_NAME]);
  return data && data.uid ? db.getUserById(data.uid) : null;
};

const slugify = (s) => String(s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event';
function uniqueSlug(title) {
  const base = slugify(title);
  for (let i = 0; i < 8; i++) {
    const s = base + '-' + Math.random().toString(36).slice(2, 6);
    if (!db.slugExists(s)) return s;
  }
  return base + '-' + Date.now().toString(36);
}

// strip private host data; guests only ever see the design + the running total
const publicView = (event) => ({
  slug: event.slug,
  event: (JSON.parse(event.data_json).event) || {},
  collected: db.sumContributions(event.id),
});

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, 'Not found');
  const ext = path.extname(file).toLowerCase();
  const body = await readFile(file);
  send(res, 200, body, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const m = req.method;
  let status = 200;
  try {
    if (!p.startsWith('/api/')) { await serveStatic(req, res, p); return; }

    // ---------- AUTH ----------
    if (p === '/api/auth/signup' && m === 'POST') {
      const { email, password, name } = await readBody(req);
      if (!email || !/.+@.+\..+/.test(email)) return json(res, 400, { error: 'Enter a valid email' });
      if (!password || String(password).length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });
      if (db.getUserByEmail(email)) return json(res, 409, { error: 'That email already has an account — try signing in' });
      const user = db.createUser(email, hashPassword(password), name);
      return json(res, 200, { user }, { 'Set-Cookie': sessionCookie(signToken({ uid: user.id })) });
    }
    if (p === '/api/auth/login' && m === 'POST') {
      const { email, password } = await readBody(req);
      const row = db.getUserByEmail(email || '');
      if (!row || !verifyPassword(password, row.pass_hash)) return json(res, 401, { error: 'Wrong email or password' });
      const user = db.getUserById(row.id);
      return json(res, 200, { user }, { 'Set-Cookie': sessionCookie(signToken({ uid: user.id })) });
    }
    if (p === '/api/auth/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
    if (p === '/api/auth/me' && m === 'GET') return json(res, 200, { user: currentUser(req) });

    // ---------- PUBLIC (guest page) ----------
    let mm;
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)$/)) && m === 'GET') {
      const ev = db.getEventBySlug(mm[1]);
      if (!ev) return json(res, 404, { error: 'Event not found' });
      return json(res, 200, publicView(ev));
    }
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)\/rsvp$/)) && m === 'POST') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      const b = await readBody(req);
      if (!b.name || !String(b.name).trim()) return json(res, 400, { error: 'Name is required' });
      const r = db.addRsvp(ev.id, { name: String(b.name).trim().slice(0, 80), phone: String(b.phone || '').slice(0, 30), status: ['yes', 'maybe', 'no'].includes(b.status) ? b.status : 'yes', party: Math.max(0, Math.min(50, +b.party || 1)), note: String(b.note || '').slice(0, 280) });
      return json(res, 200, { ok: true, rsvp: r });
    }
    if ((mm = p.match(/^\/api\/public\/([a-z0-9-]+)\/contribute$/)) && m === 'POST') {
      const ev = db.getEventBySlug(mm[1]); if (!ev) return json(res, 404, { error: 'Event not found' });
      const b = await readBody(req);
      const amount = Math.round((+b.amount || 0) * 100) / 100;
      if (!b.name || !String(b.name).trim()) return json(res, 400, { error: 'Name is required' });
      if (amount <= 0) return json(res, 400, { error: 'Enter an amount' });
      db.addContribution(ev.id, { name: String(b.name).trim().slice(0, 80), amount, method: String(b.method || 'momo').slice(0, 20), ref: '', status: 'recorded' });
      return json(res, 200, { ok: true, collected: db.sumContributions(ev.id) });
    }

    // ---------- EVENTS (owner, auth required) ----------
    const user = currentUser(req);
    if (p === '/api/events' && m === 'GET') {
      if (!user) return json(res, 401, { error: 'Sign in first' });
      return json(res, 200, { events: db.getEventsByOwner(user.id) });
    }
    if (p === '/api/events' && m === 'POST') {
      if (!user) return json(res, 401, { error: 'Sign in first' });
      const { state } = await readBody(req);
      if (!state || !state.event) return json(res, 400, { error: 'Missing event data' });
      const title = state.event.title || 'Untitled event';
      const ev = db.createEvent(user.id, uniqueSlug(title), title, JSON.stringify(state));
      return json(res, 200, { event: { id: ev.id, slug: ev.slug, title: ev.title } });
    }
    if ((mm = p.match(/^\/api\/events\/(\d+)$/))) {
      if (!user) return json(res, 401, { error: 'Sign in first' });
      const ev = db.getEventById(+mm[1]);
      if (!ev || ev.owner_id !== user.id) return json(res, 404, { error: 'Event not found' });
      if (m === 'GET') {
        return json(res, 200, { event: { id: ev.id, slug: ev.slug, title: ev.title, state: JSON.parse(ev.data_json) }, rsvps: db.getRsvps(ev.id), contributions: db.getContributions(ev.id) });
      }
      if (m === 'PUT') {
        const { state } = await readBody(req);
        if (!state || !state.event) return json(res, 400, { error: 'Missing event data' });
        db.updateEvent(ev.id, state.event.title || ev.title, JSON.stringify(state));
        return json(res, 200, { ok: true });
      }
    }

    return json(res, 404, { error: 'Unknown endpoint' });
  } catch (e) {
    status = e.message === 'payload too large' ? 413 : (e.message === 'bad json' ? 400 : 500);
    if (!res.headersSent) json(res, status, { error: e.message || 'Server error' });
  } finally {
    process.stderr.write(`${m} ${p} -> ${res.statusCode}\n`);
  }
});

server.listen(PORT, () => console.log(`Durbar server on http://localhost:${PORT}`));
