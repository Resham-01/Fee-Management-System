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
    transactionUuid: { type: String, required: true, unique: true },
    // Khalti payment index returned by the gateway on initiate
    pidx: { type: String },
    status: {
      type: String,
      enum: ['initiated', 'success', 'failed', 'cancelled'],
      default: 'initiated',
    },
    gatewayRefId: { type: String },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ invoice: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
