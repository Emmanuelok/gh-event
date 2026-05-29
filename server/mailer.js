// ============================================================
//  Durbar — pluggable email. Dev mode (default) logs the message to
//  the server console so verification / reset flows are testable
//  without a provider. For production, wire a real transport here
//  (e.g. nodemailer SMTP, Resend, Postmark) behind these env checks.
// ============================================================
const FROM = process.env.MAIL_FROM || 'Durbar <no-reply@durbar.app>';

export async function sendMail({ to, subject, text }) {
  // Integration point: if you add a provider, branch on its env var here.
  // if (process.env.RESEND_API_KEY) { ...fetch resend... return; }
  process.stderr.write(`\n[mail:dev] from=${FROM} to=${to}\n  subject: ${subject}\n  ${text.replace(/\n/g, '\n  ')}\n\n`);
  return { dev: true };
}
