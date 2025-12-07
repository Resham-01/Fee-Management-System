const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('School', schoolSchema);

