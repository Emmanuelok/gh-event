// ============================================================
//  Durbar — Paystack (Ghana MoMo + cards). Optional: only active
//  when PAYSTACK_SECRET is set, otherwise the app falls back to the
//  record-and-track flow so everything keeps working without keys.
// ============================================================
import { createHmac } from 'node:crypto';

const SECRET = process.env.PAYSTACK_SECRET || '';
export const isConfigured = () => !!SECRET;

// Initialize a transaction; returns { authorization_url, access_code, reference }
export async function initTransaction({ email, amount, reference, metadata, callbackUrl }) {
  if (!SECRET) throw new Error('Paystack not configured');
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      amount: Math.round(Number(amount) * 100), // pesewas
      currency: 'GHS',
      reference,
      metadata,
      callback_url: callbackUrl,
      channels: ['mobile_money', 'card'],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) throw new Error((data && data.message) || 'Paystack init failed');
  return data.data;
}

// Verify the X-Paystack-Signature header (HMAC SHA512 of the raw body).
export function verifySignature(rawBody, signature) {
  if (!SECRET || !signature) return false;
  const expected = createHmac('sha512', SECRET).update(rawBody).digest('hex');
  // constant-ish time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
