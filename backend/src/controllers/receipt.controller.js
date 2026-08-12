const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const School = require('../models/School');
const { USER_ROLES } = require('../models/User');
const { getSchoolId } = require('../utils/getSchoolId');
const { generateReceiptHtml } = require('../utils/generateReceiptHtml');
const logger = require('../config/logger');

const buildReceiptData = async (invoice, transaction) => {
  const school = await School.findById(invoice.school);
  const student = await Student.findById(invoice.student).populate('parent', 'name email');
  if (!school || !student) return null;

  const parent = student.parent;

  return {
    receiptNumber: transaction?.gatewayRefId || `RCP-${invoice._id.toString().slice(-8).toUpperCase()}`,
    transactionId: transaction?._id,
    invoiceId: invoice._id,
    schoolName: school.name,
    schoolAddress: school.address,
    schoolContactEmail: school.contactEmail,
    schoolContactPhone: school.contactPhone,
    studentName: `${student.firstName} ${student.lastName}`,
    studentCode: student.studentCode,
    className: student.className,
    section: student.section,
    parentName: parent?.name || '—',
    parentEmail: parent?.email || '—',
    term: invoice.term,
    description: invoice.description,
    amount: transaction?.amount ?? invoice.amount,
    currency: invoice.currency || 'NPR',
    gateway: transaction?.gateway || null,
    gatewayRefId: transaction?.gatewayRefId || null,
    paidAt: transaction?.updatedAt || invoice.updatedAt,
    status: 'paid',
  };
};

const canAccessInvoice = async (invoice, user) => {
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    return true;
  }

  if (user.role === USER_ROLES.SCHOOL_ADMIN) {
    const schoolId = getSchoolId(user);
    return schoolId && invoice.school.toString() === schoolId;
  }

  if (user.role === USER_ROLES.PARENT) {
    const parentSchoolId = getSchoolId(user);
    if (!parentSchoolId || invoice.school.toString() !== parentSchoolId) {
      return false;
    }
    const student = await Student.findOne({ _id: invoice.student, parent: user._id });
    return !!student;
  }

  return false;
};

const getPaidInvoiceWithTransaction = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return { error: { status: 404, message: 'Invoice not found' } };
  }

  if (invoice.status !== 'paid') {
    return { error: { status: 400, message: 'Receipt is only available for paid invoices' } };
  }

  const transaction = await Transaction.findOne({ invoice: invoiceId, status: 'success' }).sort({
    updatedAt: -1,
  });

  return { invoice, transaction };
};

// List receipts (successful payments / paid invoices)
exports.getReceipts = async (req, res) => {
  try {
    let invoiceQuery = { status: 'paid' };

    if (req.user.role === USER_ROLES.SCHOOL_ADMIN) {
      const schoolId = getSchoolId(req.user);
      if (!schoolId) {
        return res.status(403).json({ message: 'School admin must be linked to a school' });
      }
      invoiceQuery.school = schoolId;
    } else if (req.user.role === USER_ROLES.PARENT) {
      const parentSchoolId = getSchoolId(req.user);
      if (!parentSchoolId) {
        return res.status(403).json({ message: 'Parent must be linked to a school' });
      }
      const students = await Student.find({ parent: req.user._id, school: parentSchoolId });
      const studentIds = students.map((s) => s._id);
      invoiceQuery.student = { $in: studentIds };
    }

    const invoices = await Invoice.find(invoiceQuery)
      .populate('student', 'firstName lastName studentCode className section')
      .populate('school', 'name')
      .sort({ updatedAt: -1 });

    const invoiceIds = invoices.map((inv) => inv._id);
    const transactions = await Transaction.find({
      invoice: { $in: invoiceIds },
      status: 'success',
    }).sort({ updatedAt: -1 });

    const txByInvoice = {};
    transactions.forEach((tx) => {
      const key = tx.invoice.toString();
      if (!txByInvoice[key]) txByInvoice[key] = tx;
    });

    const receipts = invoices.map((invoice) => {
      const tx = txByInvoice[invoice._id.toString()];
      return {
        invoiceId: invoice._id,
        transactionId: tx?._id,
        receiptNumber: tx?.gatewayRefId || `RCP-${invoice._id.toString().slice(-8).toUpperCase()}`,
        schoolName: invoice.school?.name,
        studentName: invoice.student
          ? `${invoice.student.firstName} ${invoice.student.lastName}`
          : '—',
        studentCode: invoice.student?.studentCode,
        term: invoice.term,
        amount: tx?.amount ?? invoice.amount,
        currency: invoice.currency || 'NPR',
        gateway: tx?.gateway || null,
        paidAt: tx?.updatedAt || invoice.updatedAt,
      };
    });

    res.json(receipts);
  } catch (err) {
    logger.error('Get receipts error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get receipt data as JSON
exports.getReceiptByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { invoice, transaction, error } = await getPaidInvoiceWithTransaction(invoiceId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const allowed = await canAccessInvoice(invoice, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to view this receipt' });
    }

    const receipt = await buildReceiptData(invoice, transaction);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt data not found' });
    }

    res.json(receipt);
  } catch (err) {
    logger.error('Get receipt error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Download receipt as HTML file
exports.downloadReceiptByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { invoice, transaction, error } = await getPaidInvoiceWithTransaction(invoiceId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const allowed = await canAccessInvoice(invoice, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to download this receipt' });
    }

    const receipt = await buildReceiptData(invoice, transaction);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt data not found' });
    }

    const html = generateReceiptHtml(receipt);
    const filename = `receipt-${receipt.receiptNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    logger.error('Download receipt error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
