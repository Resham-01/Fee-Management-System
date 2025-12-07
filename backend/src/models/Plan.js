const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pricePerMonth: { type: Number, required: true },
    maxStudents: { type: Number, required: true },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);

