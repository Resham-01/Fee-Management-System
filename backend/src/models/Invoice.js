const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
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
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NPR' },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    term: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

