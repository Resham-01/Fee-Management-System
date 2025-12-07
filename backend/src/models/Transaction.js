const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
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
      enum: ['initiated', 'success', 'failed'],
      default: 'initiated',
    },
    gatewayRefId: { type: String },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

