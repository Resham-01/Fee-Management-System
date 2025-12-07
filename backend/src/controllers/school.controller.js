const School = require('../models/School');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const { User } = require('../models/User');
const { USER_ROLES } = require('../models/User');
const logger = require('../config/logger');

// Public/Super Admin: Get all schools (filtered by isApproved if public route)
exports.getAllSchools = async (req, res) => {
  try {
    // Check if this is the /approved route (public endpoint)
    const isPublicRoute = req.originalUrl.includes('/approved') || req.path.includes('/approved');
    const query = isPublicRoute ? { isApproved: true } : {};
    const schools = await School.find(query).populate('subscriptionPlan').sort({ createdAt: -1 });
    res.json(schools);
  } catch (err) {
    logger.error('Get all schools error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Get school details with students and invoices
exports.getSchoolDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id).populate('subscriptionPlan');
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const students = await Student.find({ school: id }).populate('parent', 'name email');
    const invoices = await Invoice.find({ school: id })
      .populate('student', 'firstName lastName studentCode')
      .sort({ createdAt: -1 });

    // Calculate fee statistics
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      school,
      students,
      invoices,
      statistics: {
        totalStudents: students.length,
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        remainingAmount: pendingAmount + overdueAmount,
      },
    });
  } catch (err) {
    logger.error('Get school details error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Approve school
exports.approveSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByIdAndUpdate(id, { isApproved: true }, { new: true });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({ message: 'School approved successfully', school });
  } catch (err) {
    logger.error('Approve school error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Reject school
exports.rejectSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByIdAndUpdate(id, { isApproved: false }, { new: true });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({ message: 'School rejected', school });
  } catch (err) {
    logger.error('Reject school error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Send notification to parents about pending fees
exports.notifyParents = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Get all pending invoices for this school
    const pendingInvoices = await Invoice.find({ school: id, status: 'pending' })
      .populate('student', 'firstName lastName parent')
      .populate({
        path: 'student',
        populate: { path: 'parent', select: 'name email' },
      });

    // Group by parent
    const parentNotifications = {};
    pendingInvoices.forEach((invoice) => {
      const parent = invoice.student?.parent;
      if (parent) {
        if (!parentNotifications[parent._id]) {
          parentNotifications[parent._id] = {
            parent,
            invoices: [],
            totalAmount: 0,
          };
        }
        parentNotifications[parent._id].invoices.push(invoice);
        parentNotifications[parent._id].totalAmount += invoice.amount;
      }
    });

    // TODO: Send actual email/SMS notifications
    // For now, just return the notification data
    const notificationCount = Object.keys(parentNotifications).length;

    res.json({
      message: `Notifications prepared for ${notificationCount} parents`,
      notifications: Object.values(parentNotifications),
      totalPendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    });
  } catch (err) {
    logger.error('Notify parents error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: Send notification to school admin about pending fees
exports.notifySchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const schoolAdmin = await User.findOne({ school: id, role: USER_ROLES.SCHOOL_ADMIN });
    if (!schoolAdmin) {
      return res.status(404).json({ message: 'School admin not found' });
    }

    const pendingInvoices = await Invoice.find({ school: id, status: 'pending' });
    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // TODO: Send actual email/SMS notification to school admin
    res.json({
      message: 'School admin notification prepared',
      schoolAdmin: { name: schoolAdmin.name, email: schoolAdmin.email },
      pendingInvoicesCount: pendingInvoices.length,
      totalPendingAmount,
    });
  } catch (err) {
    logger.error('Notify school error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Get own school details
exports.getMySchool = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const school = await School.findById(req.user.school).populate('subscriptionPlan');
    res.json(school);
  } catch (err) {
    logger.error('Get my school error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
