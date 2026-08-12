const Joi = require('joi');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const logger = require('../config/logger');
const { USER_ROLES } = require('../models/User');
const { getSchoolId } = require('../utils/getSchoolId');

const invoiceSchema = Joi.object({
  student: Joi.string().required(),
  amount: Joi.number().required().min(0),
  currency: Joi.string().default('NPR'),
  dueDate: Joi.date().required(),
  term: Joi.string().required(),
  description: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'paid', 'overdue').default('pending'),
});

const updateInvoiceSchema = invoiceSchema;

const findInvoiceForUser = async (invoiceId, user, { allowForbidden = false } = {}) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return { invoice: null, forbidden: false };

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    return { invoice, forbidden: false };
  }

  const userSchoolId = getSchoolId(user);
  if (userSchoolId && invoice.school.toString() === userSchoolId) {
    return { invoice, forbidden: false };
  }

  if (allowForbidden) {
    return { invoice: null, forbidden: true };
  }

  return { invoice: null, forbidden: false };
};

// School Admin: Get all invoices for their school
exports.getSchoolInvoices = async (req, res) => {
  try {
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    // Auto-flag expired pending invoices as overdue
    await Invoice.updateMany(
      { school: schoolId, status: 'pending', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const invoices = await Invoice.find({ school: schoolId })
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

    const student = await Student.findById(value.student);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      // Super admin can create invoices for any school via student record
    } else {
      const schoolId = getSchoolId(req.user);
      if (!schoolId || student.school.toString() !== schoolId) {
        return res.status(404).json({ message: 'Student not found in your school' });
      }
    }

    const invoice = await Invoice.create({
      ...value,
      school: student.school,
      status: value.status || 'pending',
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
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'Parent must be linked to a school' });
    }

    // Auto-flag expired pending invoices as overdue
    await Invoice.updateMany(
      { school: schoolId, status: 'pending', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const students = await Student.find({ parent: req.user._id, school: schoolId });
    const studentIds = students.map((s) => s._id);

    const invoices = await Invoice.find({ student: { $in: studentIds } })
      .populate('student', 'firstName lastName studentCode className section')
      .sort({ createdAt: -1 });

    // Attach the latest non-successful payment attempt so parents can see
    // that a payment was started / cancelled / failed on the invoice row.
    const invoiceIds = invoices.map((inv) => inv._id);
    const attempts = await Transaction.find({
      invoice: { $in: invoiceIds },
      status: { $ne: 'success' },
    })
      .sort({ updatedAt: 1 })
      .lean();

    const attemptByInvoice = {};
    attempts.forEach((attempt) => {
      attemptByInvoice[attempt.invoice.toString()] = attempt;
    });

    const result = invoices.map((inv) => {
      const obj = inv.toObject();
      const attempt = attemptByInvoice[inv._id.toString()];
      if (attempt) {
        obj.lastPaymentAttempt = {
          status: attempt.status,
          gateway: attempt.gateway,
          gatewayRefId: attempt.gatewayRefId,
          updatedAt: attempt.updatedAt,
        };
      }
      return obj;
    });

    res.json(result);
  } catch (err) {
    logger.error('Get parent invoices error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin / Super Admin: Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateInvoiceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { invoice, forbidden } = await findInvoiceForUser(id, req.user, { allowForbidden: true });
    if (forbidden) {
      return res.status(403).json({ message: 'You do not have permission to update this invoice' });
    }
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const schoolId = req.user.role === USER_ROLES.SUPER_ADMIN ? invoice.school : getSchoolId(req.user);
    const student = await Student.findOne({ _id: value.student, school: schoolId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school' });
    }

    Object.assign(invoice, value);
    await invoice.save();

    const populated = await Invoice.findById(invoice._id).populate(
      'student',
      'firstName lastName studentCode className section'
    );

    res.json(populated);
  } catch (err) {
    logger.error('Update invoice error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin / Super Admin: Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const { invoice, forbidden } = await findInvoiceForUser(id, req.user, { allowForbidden: true });
    if (forbidden) {
      return res.status(403).json({ message: 'You do not have permission to delete this invoice' });
    }
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await Invoice.findByIdAndDelete(invoice._id);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    logger.error('Delete invoice error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

