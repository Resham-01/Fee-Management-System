const logger = require('../config/logger');

let transporter = null;

const isEmailConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
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

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Reset your Shulkaa Suvidha password';
  const text = `Hello ${name},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.\n\nShulkaa Suvidha`;
  const html = `
    <p>Hello ${name},</p>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    <p>Shulkaa Suvidha</p>
  `;

  const mailTransporter = await getTransporter();

  if (!mailTransporter) {
    logger.info('Password reset link (email not configured)', { email: to, resetUrl });
    return false;
  }

  await mailTransporter.sendMail({ from, to, subject, text, html });
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

module.exports = { sendPasswordResetEmail, sendInvoiceNotificationEmail, isEmailConfigured };
