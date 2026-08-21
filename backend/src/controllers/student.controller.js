const Joi = require('joi');
const Student = require('../models/Student');
const School = require('../models/School');
const logger = require('../config/logger');
const { GRADE_OPTIONS } = require('../constants/grades');
const { getSchoolShortName } = require('../utils/schoolShortName');

const gradeSchema = Joi.string()
  .valid(...GRADE_OPTIONS)
  .required()
  .messages({ 'any.only': 'Please select a valid grade (Grade 1 to Grade 12)' });

const createStudentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  className: gradeSchema,
  parent: Joi.string().allow(null, ''),
});

const updateStudentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  studentCode: Joi.string().required(),
  className: gradeSchema,
  parent: Joi.string().allow(null, ''),
});

/** Class number only, e.g. "Grade 5" → "5", "Grade 10" → "10" */
const getClassNumber = (className) => {
  const match = String(className).match(/Grade\s*(\d+)/i);
  if (match) return match[1];
  const digits = String(className).replace(/\D/g, '');
  return digits || '0';
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Format: {SchoolShort}-STU-{ClassNumber}-{Order}
 * Example: KMS-STU-5-001 (school KMS, class 5, 1st student in that class)
 */
const generateUniqueStudentCode = async (schoolId, className) => {
  const school = await School.findById(schoolId);
  if (!school) {
    throw new Error('School not found');
  }

  const schoolShort = getSchoolShortName(school);
  const classNumber = getClassNumber(className);
  const prefix = `${schoolShort}-STU-${classNumber}-`;

  const existingStudents = await Student.find({
    school: schoolId,
    className,
  }).select('studentCode');

  let maxOrder = 0;
  const codePattern = new RegExp(`^${escapeRegex(prefix)}(\\d{3})$`);
  const legacyPattern = new RegExp(
    `^${escapeRegex(schoolShort)}-STU-G${escapeRegex(classNumber)}-(\\d{3})$`
  );

  for (const student of existingStudents) {
    let match = student.studentCode.match(codePattern);
    if (!match) {
      match = student.studentCode.match(legacyPattern);
    }
    if (match) {
      maxOrder = Math.max(maxOrder, parseInt(match[1], 10));
    }
  }

  const nextOrder = (maxOrder + 1).toString().padStart(3, '0');
  return `${prefix}${nextOrder}`;
};

exports.getGradeOptions = async (req, res) => {
  res.json(GRADE_OPTIONS);
};

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
    const { error, value } = createStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const generatedStudentCode = await generateUniqueStudentCode(req.user.school, value.className);

    const student = await Student.create({
      ...value,
      studentCode: generatedStudentCode,
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
    const { error, value } = updateStudentSchema.validate(req.body);
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

