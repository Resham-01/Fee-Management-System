const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    paymentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount',
      required: true,
    },
    amount: { type: Number, required: true },
    gateway: {
      type: String,
      enum: ['esewa', 'khalti', 'fonepay'],
      required: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'otp_pending', 'success', 'failed'],
      default: 'initiated',
    },
    walletPhone: { type: String },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    gatewayRefId: { type: String },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);



