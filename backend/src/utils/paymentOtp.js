const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const verifyOtp = async (otp, hash) => bcrypt.compare(otp, hash);

const maskPhone = (phone) => {
  if (!phone || phone.length < 4) return phone;
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
};

const sendPaymentOtpSms = async (phone, otp, gateway, amount) => {
  const message = `Your ${gateway.toUpperCase()} payment OTP for NPR ${amount} is ${otp}. Valid for 5 minutes. Do not share this code.`;
  logger.info(`Payment OTP SMS sent to ${maskPhone(phone)}`, { gateway, amount });
  // TODO: Integrate real SMS provider (Sparrow SMS, Twilio, etc.)
  logger.debug(`[DEV SMS] ${phone}: ${message}`);
  return { success: true };
};

module.exports = {
  OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
  generateOtp,
  hashOtp,
  verifyOtp,
  maskPhone,
  sendPaymentOtpSms,
};
