const Joi = require('joi');
const Student = require('../models/Student');
const logger = require('../config/logger');

const studentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  studentCode: Joi.string().required(),
  className: Joi.string().required(),
  section: Joi.string().required(),
  parent: Joi.string().allow(null, ''),
});

// School Admin: Get all students for their school
exports.getStudents = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const students = await Student.find({ school: req.user.school })
      .populate('parent', 'name email')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    logger.error('Get students error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Create student
exports.createStudent = async (req, res) => {
  try {
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    // Check if studentCode already exists
    const existing = await Student.findOne({ studentCode: value.studentCode });
    if (existing) {
      return res.status(400).json({ message: 'Student code already exists' });
    }

    const student = await Student.create({
      ...value,
      school: req.user.school,
      parent: value.parent || null,
    });

    const populated = await Student.findById(student._id).populate('parent', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    logger.error('Create student error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    // Ensure student belongs to this school
    const student = await Student.findOne({ _id: id, school: req.user.school });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check studentCode uniqueness if changed
    if (value.studentCode !== student.studentCode) {
      const existing = await Student.findOne({ studentCode: value.studentCode });
      if (existing) {
        return res.status(400).json({ message: 'Student code already exists' });
      }
    }

    // Handle parent field - convert empty string to null
    const updateData = {
      ...value,
      parent: value.parent && value.parent.trim() !== '' ? value.parent : null,
    };

    Object.assign(student, updateData);
    await student.save();

    const populated = await Student.findById(student._id).populate('parent', 'name email');

    res.json(populated);
  } catch (err) {
    logger.error('Update student error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const student = await Student.findOne({ _id: id, school: req.user.school });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(id);

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    logger.error('Delete student error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

