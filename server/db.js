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
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT UNIQUE NOT NULL,
    pass_hash TEXT NOT NULL,
    name      TEXT,
    created   INTEGER NOT NULL
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
    created   INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contributions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    amount    REAL NOT NULL,
    method    TEXT,
    ref       TEXT,
    status    TEXT NOT NULL DEFAULT 'recorded',
    created   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
  CREATE INDEX IF NOT EXISTS idx_rsvps_event  ON rsvps(event_id);
  CREATE INDEX IF NOT EXISTS idx_contrib_event ON contributions(event_id);
`);

const now = () => Date.now();

// ---- users ----
export function createUser(email, passHash, name) {
  const r = db.prepare('INSERT INTO users (email, pass_hash, name, created) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase(), passHash, name || '', now());
  return getUserById(Number(r.lastInsertRowid));
}
export const getUserByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
export const getUserById = (id) => db.prepare('SELECT id, email, name, created FROM users WHERE id = ?').get(id);

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
export const slugExists = (slug) => !!db.prepare('SELECT 1 FROM events WHERE slug = ?').get(slug);

// ---- rsvps ----
export function addRsvp(eventId, { name, phone, status, party, note }) {
  const r = db.prepare('INSERT INTO rsvps (event_id, name, phone, status, party, note, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(eventId, name, phone || '', status || 'yes', party || 1, note || '', now());
  return db.prepare('SELECT * FROM rsvps WHERE id = ?').get(Number(r.lastInsertRowid));
}
export const getRsvps = (eventId) => db.prepare('SELECT * FROM rsvps WHERE event_id = ? ORDER BY created DESC').all(eventId);

// ---- contributions ----
export function addContribution(eventId, { name, amount, method, ref, status }) {
  const r = db.prepare('INSERT INTO contributions (event_id, name, amount, method, ref, status, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(eventId, name, amount, method || 'momo', ref || '', status || 'recorded', now());
  return db.prepare('SELECT * FROM contributions WHERE id = ?').get(Number(r.lastInsertRowid));
}
export const getContributions = (eventId) => db.prepare('SELECT * FROM contributions WHERE event_id = ? ORDER BY created DESC').all(eventId);
export const sumContributions = (eventId) =>
  db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM contributions WHERE event_id = ? AND status != 'failed'").get(eventId).total;

export default db;
