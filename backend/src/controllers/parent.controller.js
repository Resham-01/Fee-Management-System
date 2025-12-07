const Joi = require('joi');
const Student = require('../models/Student');
const logger = require('../config/logger');

const linkChildSchema = Joi.object({
  studentCode: Joi.string().required(),
});

// Parent: Link child using student code
exports.linkChild = async (req, res) => {
  try {
    const { error, value } = linkChildSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'Parent must be linked to a school' });
    }

    const { studentCode } = value;

    // Find student by code in parent's school
    const student = await Student.findOne({
      studentCode,
      school: req.user.school,
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this code' });
    }

    // Link parent to student
    student.parent = req.user._id;
    await student.save();

    res.json({ message: 'Child linked successfully', student });
  } catch (err) {
    logger.error('Link child error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent: Get linked children
exports.getLinkedChildren = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'Parent must be linked to a school' });
    }

    const students = await Student.find({
      parent: req.user._id,
      school: req.user.school,
    }).sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    logger.error('Get linked children error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
