const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    monthlyFee: { type: Number, required: true },
    scholarship: { type: Number, default: 0 }, // Scholarship amount (discount)
    scholarshipType: {
      type: String,
      enum: ['none', 'percentage', 'fixed'],
      default: 'none',
    },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Calculate actual fee after scholarship
feeStructureSchema.virtual('actualFee').get(function () {
  if (this.scholarshipType === 'percentage') {
    return this.monthlyFee - (this.monthlyFee * this.scholarship / 100);
  } else if (this.scholarshipType === 'fixed') {
    return Math.max(0, this.monthlyFee - this.scholarship);
  }
  return this.monthlyFee;
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);



