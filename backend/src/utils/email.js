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

module.exports = { sendPasswordResetEmail, isEmailConfigured };
