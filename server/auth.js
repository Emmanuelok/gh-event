// ============================================================
//  Durbar — auth helpers (Node built-in crypto only)
//  - passwords: scrypt with a per-user random salt
//  - sessions : HMAC-signed, expiring stateless token in a cookie
// ============================================================
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const SECRET = process.env.DURBAR_SECRET || 'dev-insecure-secret-change-me';
const COOKIE = 'durbar_session';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(pw), salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}
export function verifyPassword(pw, stored) {
  try {
    const [s, h] = String(stored).split(':');
    const hash = scryptSync(String(pw), Buffer.from(s, 'hex'), 64);
    const want = Buffer.from(h, 'hex');
    return hash.length === want.length && timingSafeEqual(hash, want);
  } catch { return false; }
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
export function signToken(payload) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + TTL_MS }));
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}
export function verifyToken(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const want = createHmac('sha256', SECRET).update(body).digest('base64url');
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

export function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
export function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  const maxAge = Math.floor(TTL_MS / 1000);
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/;${secure} Max-Age=${maxAge}`;
}
export const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
export const COOKIE_NAME = COOKIE;
