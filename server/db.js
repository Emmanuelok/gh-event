// ============================================================
//  Durbar — data layer (real SQLite via Node's built-in driver)
//  Zero external dependencies. One file-backed database.
// ============================================================
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DURBAR_DB || './.data/durbar.db';
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT UNIQUE NOT NULL,
    pass_hash    TEXT NOT NULL,
    name         TEXT,
    verified     INTEGER NOT NULL DEFAULT 0,
    verify_token TEXT,
    reset_token  TEXT,
    reset_exp    INTEGER,
    created      INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug      TEXT UNIQUE NOT NULL,
    title     TEXT,
    data_json TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    created   INTEGER NOT NULL,
    updated   INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rsvps (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    phone     TEXT,
    status    TEXT NOT NULL,
    party     INTEGER NOT NULL DEFAULT 1,
    note      TEXT,
    source    TEXT NOT NULL DEFAULT 'link',
    meta      TEXT,
    created   INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contributions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    email     TEXT,
    amount    REAL NOT NULL,
    method    TEXT,
    ref       TEXT,
    fund      TEXT,
    status    TEXT NOT NULL DEFAULT 'recorded',
    created   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
  CREATE INDEX IF NOT EXISTS idx_rsvps_event  ON rsvps(event_id);
  CREATE INDEX IF NOT EXISTS idx_contrib_event ON contributions(event_id);
  CREATE INDEX IF NOT EXISTS idx_contrib_ref ON contributions(ref);
`);

// ---- forward-compatible migrations for databases created by older builds ----
function ensureColumn(table, col, decl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
}
ensureColumn('users', 'verified', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'verify_token', 'TEXT');
ensureColumn('users', 'reset_token', 'TEXT');
ensureColumn('users', 'reset_exp', 'INTEGER');
ensureColumn('rsvps', 'source', "TEXT NOT NULL DEFAULT 'link'");
ensureColumn('rsvps', 'meta', 'TEXT');
ensureColumn('contributions', 'email', 'TEXT');
ensureColumn('contributions', 'fund', 'TEXT');

const now = () => Date.now();

// ---- users ----
export function createUser(email, passHash, name, verifyToken) {
  const r = db.prepare('INSERT INTO users (email, pass_hash, name, verify_token, created) VALUES (?, ?, ?, ?, ?)')
    .run(email.toLowerCase(), passHash, name || '', verifyToken || null, now());
  return getUserById(Number(r.lastInsertRowid));
}
export const getUserByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
export const getUserById = (id) => db.prepare('SELECT id, email, name, verified, created FROM users WHERE id = ?').get(id);
export function verifyUserByToken(token) {
  const u = db.prepare('SELECT id FROM users WHERE verify_token = ?').get(token);
  if (!u) return false;
  db.prepare('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?').run(u.id);
  return true;
}
export function setResetToken(userId, token, exp) {
  db.prepare('UPDATE users SET reset_token = ?, reset_exp = ? WHERE id = ?').run(token, exp, userId);
}
export const getUserByResetToken = (token) =>
  db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_exp > ?').get(token, now());
export function updatePassword(userId, passHash) {
  db.prepare('UPDATE users SET pass_hash = ?, reset_token = NULL, reset_exp = NULL WHERE id = ?').run(passHash, userId);
}

// ---- events ----
export function createEvent(ownerId, slug, title, dataJson) {
  const t = now();
  const r = db.prepare('INSERT INTO events (owner_id, slug, title, data_json, published, created, updated) VALUES (?, ?, ?, ?, 1, ?, ?)')
    .run(ownerId, slug, title || 'Untitled', dataJson, t, t);
  return getEventById(Number(r.lastInsertRowid));
}
export const getEventById = (id) => db.prepare('SELECT * FROM events WHERE id = ?').get(id);
export const getEventBySlug = (slug) => db.prepare('SELECT * FROM events WHERE slug = ?').get(slug);
export const getEventsByOwner = (ownerId) =>
  db.prepare('SELECT id, slug, title, published, created, updated FROM events WHERE owner_id = ? ORDER BY updated DESC').all(ownerId);
export function updateEvent(id, title, dataJson) {
  db.prepare('UPDATE events SET title = ?, data_json = ?, updated = ? WHERE id = ?').run(title, dataJson, now(), id);
  return getEventById(id);
}
export const deleteEvent = (id) => db.prepare('DELETE FROM events WHERE id = ?').run(id);
export const slugExists = (slug) => !!db.prepare('SELECT 1 FROM events WHERE slug = ?').get(slug);

// ---- rsvps ----
export function addRsvp(eventId, { name, phone, status, party, note, source, meta }) {
  const r = db.prepare('INSERT INTO rsvps (event_id, name, phone, status, party, note, source, meta, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(eventId, name, phone || '', status || 'yes', party || 1, note || '', source || 'link', meta || '', now());
  return getRsvpById(Number(r.lastInsertRowid));
}
export const getRsvpById = (id) => db.prepare('SELECT * FROM rsvps WHERE id = ?').get(id);
export const getRsvps = (eventId) => db.prepare('SELECT * FROM rsvps WHERE event_id = ? ORDER BY created DESC').all(eventId);
export function updateRsvp(id, f) {
  const cur = getRsvpById(id); if (!cur) return null;
  db.prepare('UPDATE rsvps SET name = ?, phone = ?, status = ?, party = ?, note = ? WHERE id = ?')
    .run(f.name ?? cur.name, f.phone ?? cur.phone, f.status ?? cur.status, f.party ?? cur.party, f.note ?? cur.note, id);
  return getRsvpById(id);
}
export const deleteRsvp = (id) => db.prepare('DELETE FROM rsvps WHERE id = ?').run(id);

// ---- contributions ----
export function addContribution(eventId, { name, email, amount, method, ref, status, fund }) {
  const r = db.prepare('INSERT INTO contributions (event_id, name, email, amount, method, ref, fund, status, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(eventId, name, email || '', amount, method || 'momo', ref || '', fund || '', status || 'recorded', now());
  return getContributionById(Number(r.lastInsertRowid));
}
export const getContributionById = (id) => db.prepare('SELECT * FROM contributions WHERE id = ?').get(id);
export const getContributionByRef = (ref) => db.prepare('SELECT * FROM contributions WHERE ref = ?').get(ref);
export const getContributions = (eventId) => db.prepare('SELECT * FROM contributions WHERE event_id = ? ORDER BY created DESC').all(eventId);
export const setContributionStatusByRef = (ref, status) => db.prepare('UPDATE contributions SET status = ? WHERE ref = ?').run(status, ref);
export const deleteContribution = (id) => db.prepare('DELETE FROM contributions WHERE id = ?').run(id);
export const sumContributions = (eventId) =>
  db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM contributions WHERE event_id = ? AND status IN ('recorded','paid')").get(eventId).total;
export const sumContributionsByFund = (eventId) =>
  db.prepare("SELECT fund, COALESCE(SUM(amount),0) AS total FROM contributions WHERE event_id = ? AND status IN ('recorded','paid') AND fund IS NOT NULL AND fund <> '' GROUP BY fund").all(eventId);

export default db;
