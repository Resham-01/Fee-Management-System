const Joi = require('joi');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const logger = require('../config/logger');

const invoiceSchema = Joi.object({
  student: Joi.string().required(),
  amount: Joi.number().required(),
  currency: Joi.string().default('NPR'),
  dueDate: Joi.date().required(),
  term: Joi.string().required(),
  description: Joi.string().allow(''),
});

// School Admin: Get all invoices for their school
exports.getSchoolInvoices = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const invoices = await Invoice.find({ school: req.user.school })
      .populate('student', 'firstName lastName studentCode className section')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    logger.error('Get school invoices error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { error, value } = invoiceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    // Verify student belongs to this school
    const student = await Student.findOne({ _id: value.student, school: req.user.school });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in your school' });
    }

    const invoice = await Invoice.create({
      ...value,
      school: req.user.school,
      status: 'pending',
    });

    const populated = await Invoice.findById(invoice._id).populate(
      'student',
      'firstName lastName studentCode className section'
    );

    res.status(201).json(populated);
  } catch (err) {
    logger.error('Create invoice error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent: Get invoices for their children
exports.getParentInvoices = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'Parent must be linked to a school' });
    }

    // Find all students linked to this parent
    const students = await Student.find({ parent: req.user._id, school: req.user.school });
    const studentIds = students.map((s) => s._id);

    const invoices = await Invoice.find({ student: { $in: studentIds } })
      .populate('student', 'firstName lastName studentCode className section')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    logger.error('Get parent invoices error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

