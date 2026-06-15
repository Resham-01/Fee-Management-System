const mongoose = require('mongoose');

const PAYMENT_ACCOUNT_TYPES = ['esewa', 'khalti', 'fonepay', 'bank_transfer'];

const paymentAccountSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    type: {
      type: String,
      enum: PAYMENT_ACCOUNT_TYPES,
      required: true,
    },
    // Digital wallet fields (eSewa, Khalti, FonePay)
    merchantId: { type: String, trim: true },
    merchantName: { type: String, trim: true },
    // Bank transfer fields
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentAccountSchema.index({ school: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('PaymentAccount', paymentAccountSchema);
module.exports.PAYMENT_ACCOUNT_TYPES = PAYMENT_ACCOUNT_TYPES;
