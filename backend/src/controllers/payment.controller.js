const Joi = require('joi');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const PaymentAccount = require('../models/PaymentAccount');
const { maskPaymentAccount } = require('../utils/maskPaymentAccount');
const { getSchoolId } = require('../utils/getSchoolId');
const {
  OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
  generateOtp,
  hashOtp,
  verifyOtp,
  maskPhone,
  sendPaymentOtpSms,
} = require('../utils/paymentOtp');
const logger = require('../config/logger');

const initiatePaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  gateway: Joi.string().valid('esewa', 'khalti', 'fonepay').required(),
  walletPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({ 'string.pattern.base': 'Wallet phone must be a 10-digit number' }),
});

const verifyOtpSchema = Joi.object({
  transactionId: Joi.string().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({ 'string.length': 'OTP must be 6 digits' }),
});

const resendOtpSchema = Joi.object({
  transactionId: Joi.string().required(),
});

const validateParentInvoiceAccess = async (invoiceId, user) => {
  const invoice = await Invoice.findById(invoiceId).populate('student');
  if (!invoice) {
    return { error: { status: 404, message: 'Invoice not found' } };
  }

  const parentSchoolId = getSchoolId(user);
  if (!parentSchoolId) {
    return { error: { status: 403, message: 'Parent must be linked to a school' } };
  }

  if (invoice.school.toString() !== parentSchoolId) {
    return { error: { status: 403, message: 'Invoice does not belong to your school' } };
  }

  const student = await Student.findOne({ _id: invoice.student._id, parent: user._id });
  if (!student) {
    return { error: { status: 403, message: 'Invoice does not belong to your child' } };
  }

  if (invoice.status === 'paid') {
    return { error: { status: 400, message: 'Invoice already paid' } };
  }

  return { invoice };
};

const validateTransactionAccess = async (transactionId, user) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    return { error: { status: 404, message: 'Transaction not found' } };
  }

  if (!['initiated', 'otp_pending'].includes(transaction.status)) {
    return { error: { status: 400, message: 'This payment session is no longer active' } };
  }

  const { error } = await validateParentInvoiceAccess(transaction.invoice, user);
  if (error) {
    return { error };
  }

  return { transaction };
};

// Parent: Initiate wallet payment and send SMS OTP
exports.initiatePayment = async (req, res) => {
  try {
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { invoiceId, gateway, walletPhone } = value;

    const { invoice, error: accessError } = await validateParentInvoiceAccess(invoiceId, req.user);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    const paymentAccount = await PaymentAccount.findOne({
      school: invoice.school,
      type: gateway,
      isVerified: true,
      isActive: true,
    });

    if (!paymentAccount) {
      return res.status(400).json({
        message: `No verified ${gateway} payment account is configured for this school. Please contact the school or use another payment method.`,
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const transaction = await Transaction.create({
      invoice: invoiceId,
      school: invoice.school,
      paymentAccount: paymentAccount._id,
      amount: invoice.amount,
      gateway,
      walletPhone,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      status: 'otp_pending',
    });

    await sendPaymentOtpSms(walletPhone, otp, gateway, invoice.amount);

    const accountDetails = maskPaymentAccount(paymentAccount);
    const response = {
      transactionId: transaction._id,
      gateway,
      amount: invoice.amount,
      walletPhone: maskPhone(walletPhone),
      paymentAccount: accountDetails,
      message: `OTP sent to ${maskPhone(walletPhone)} via SMS`,
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
    };

    if (process.env.NODE_ENV !== 'production') {
      response.demoOtp = otp;
    }

    res.json(response);
  } catch (err) {
    logger.error('Initiate payment error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent: Verify SMS OTP and complete wallet payment
exports.verifyPaymentOtp = async (req, res) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { transactionId, otp } = value;

    const { transaction, error: accessError } = await validateTransactionAccess(transactionId, req.user);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    if (transaction.otpExpiresAt && new Date() > transaction.otpExpiresAt) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({ message: 'OTP has expired. Please start payment again.' });
    }

    if (transaction.otpAttempts >= MAX_OTP_ATTEMPTS) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({ message: 'Too many incorrect attempts. Please start payment again.' });
    }

    const isValid = await verifyOtp(otp, transaction.otpHash);
    if (!isValid) {
      transaction.otpAttempts += 1;
      await transaction.save();
      const remaining = MAX_OTP_ATTEMPTS - transaction.otpAttempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }

    transaction.status = 'success';
    transaction.gatewayRefId = `WALLET-${transaction.gateway.toUpperCase()}-${Date.now()}`;
    transaction.otpHash = undefined;
    transaction.otpExpiresAt = undefined;
    await transaction.save();

    await Invoice.findByIdAndUpdate(transaction.invoice, { status: 'paid' });

    res.json({
      message: 'Payment successful',
      transactionId: transaction._id,
      gateway: transaction.gateway,
      amount: transaction.amount,
      gatewayRefId: transaction.gatewayRefId,
    });
  } catch (err) {
    logger.error('Verify payment OTP error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent: Resend SMS OTP for pending payment
exports.resendPaymentOtp = async (req, res) => {
  try {
    const { error, value } = resendOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { transactionId } = value;

    const { transaction, error: accessError } = await validateTransactionAccess(transactionId, req.user);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    const otp = generateOtp();
    transaction.otpHash = await hashOtp(otp);
    transaction.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    transaction.otpAttempts = 0;
    transaction.status = 'otp_pending';
    await transaction.save();

    await sendPaymentOtpSms(transaction.walletPhone, otp, transaction.gateway, transaction.amount);

    const response = {
      message: `New OTP sent to ${maskPhone(transaction.walletPhone)}`,
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
    };

    if (process.env.NODE_ENV !== 'production') {
      response.demoOtp = otp;
    }

    res.json(response);
  } catch (err) {
    logger.error('Resend payment OTP error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Payment webhook (public endpoint, should be secured with gateway secret)
exports.paymentWebhook = async (req, res) => {
  try {
    const { transactionId, status, gatewayRefId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = status;
    transaction.gatewayRefId = gatewayRefId;
    transaction.rawResponse = req.body;
    await transaction.save();

    if (status === 'success') {
      await Invoice.findByIdAndUpdate(transaction.invoice, { status: 'paid' });
    }

    res.json({ message: 'Webhook processed' });
  } catch (err) {
    logger.error('Payment webhook error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
