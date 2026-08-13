const logger = require('../config/logger');

let transporter = null;

// Treats empty or placeholder values as "not configured" so the app never
// attempts a real SMTP connection with fake credentials.
const isPlaceholder = (value) => {
  if (!value) return true;
  const lower = String(value).toLowerCase();
  return (
    lower.includes('yourgmail') ||
    lower.includes('your-') ||
    lower.includes('change_me') ||
    lower.includes('example') ||
    lower.includes('xxxxxxxx')
  );
};

const isEmailConfigured = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (isPlaceholder(SMTP_HOST) || isPlaceholder(SMTP_USER) || isPlaceholder(SMTP_PASS)) return false;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
};

const getTransporter = async () => {
  if (!isEmailConfigured()) return null;
  if (transporter) return transporter;

  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// Verifies the SMTP connection works (throws with a clear message on failure).
const verifyEmailConfig = async () => {
  const mailTransporter = await getTransporter();
  if (!mailTransporter) return false;
  await mailTransporter.verify();
  return true;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Reset your Shulkaa Suvidha password';
  const text = `Hello ${name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.\n\nShulkaa Suvidha`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png" alt="Shulkaa Suvidha" width="32" height="32" style="border-radius:6px;" />
        <span style="font-size:16px;font-weight:700;color:#1e1b4b;">Shulkaa Suvidha</span>
      </div>
      <p style="font-size:14px;color:#334155;">Hello ${name},</p>
      <p style="font-size:14px;color:#334155;">You requested a password reset for your <strong>Shulkaa Suvidha</strong> account. Click the button below to set a new password:</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">Reset Password</a>
      </p>
      <p style="font-size:13px;color:#475569;">Or copy and paste this link into your browser:</p>
      <p style="font-size:13px;color:#4f46e5;word-break:break-all;">${resetUrl}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const mailTransporter = await getTransporter();

  if (!mailTransporter) {
    logger.warn('Password reset link (email not configured — reset link logged for development only)', {
      email: to,
      resetUrl,
    });
    return false;
  }

  await mailTransporter.sendMail({ from, to, subject, text, html });
  logger.info('Password reset email sent', { email: to });
  return true;
};

const formatNpr = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`;

const sendInvoiceNotificationEmail = async ({ to, name, schoolName, term, items }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `New monthly invoices for ${term} from ${schoolName}`;
  const text = `Hello ${name},\n\nNew monthly invoices have been generated for you by ${schoolName} for ${term}:\n\n${items
    .map((item) => `- ${item.studentName}: ${formatNpr(item.amount)} (due ${item.dueDate.toDateString()})`)
    .join('\n')}\n\nPlease log in to Shulkaa Suvidha to review and pay.\n\nShulkaa Suvidha`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p>Hello ${name},</p>
      <p>New monthly invoices have been generated for you by <strong>${schoolName}</strong> for <strong>${term}</strong>:</p>
      <ul>
        ${items
          .map(
            (item) =>
              `<li><strong>${item.studentName}</strong> — ${formatNpr(item.amount)} (due ${item.dueDate.toDateString()})</li>`
          )
          .join('')}
      </ul>
      <p>Please log in to <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Shulkaa Suvidha</a> to review and pay.</p>
      <p style="color:#6b7280;font-size:12px;">This is an automated notification. Please do not reply to this email.</p>
    </div>
  `;

  const mailTransporter = await getTransporter();

  if (!mailTransporter) {
    logger.info('Invoice notification (email not configured)', { email: to, term, count: items.length });
    return false;
  }

  await mailTransporter.sendMail({ from, to, subject, text, html });
  return true;
};

module.exports = { sendPasswordResetEmail, sendInvoiceNotificationEmail, isEmailConfigured, verifyEmailConfig };
