const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    studentCode: { type: String, required: true, unique: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);

