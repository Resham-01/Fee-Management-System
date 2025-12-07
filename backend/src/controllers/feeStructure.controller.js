const Joi = require('joi');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const logger = require('../config/logger');

const feeStructureSchema = Joi.object({
  student: Joi.string().required(),
  monthlyFee: Joi.number().required().min(0),
  scholarship: Joi.number().min(0).default(0),
  scholarshipType: Joi.string().valid('none', 'percentage', 'fixed').default('none'),
  effectiveFrom: Joi.date().required(),
  effectiveTo: Joi.date().allow(null, ''),
  notes: Joi.string().allow(''),
});

// School Admin: Get all fee structures for their school
exports.getFeeStructures = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const feeStructures = await FeeStructure.find({ school: req.user.school, isActive: true })
      .populate('student', 'firstName lastName studentCode className section')
      .sort({ createdAt: -1 });

    res.json(feeStructures);
  } catch (err) {
    logger.error('Get fee structures error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Create fee structure
exports.createFeeStructure = async (req, res) => {
  try {
    const { error, value } = feeStructureSchema.validate(req.body);
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

    // Deactivate old fee structures for this student
    await FeeStructure.updateMany(
      { student: value.student, isActive: true },
      { isActive: false }
    );

    const feeStructure = await FeeStructure.create({
      ...value,
      school: req.user.school,
    });

    const populated = await FeeStructure.findById(feeStructure._id).populate(
      'student',
      'firstName lastName studentCode className section'
    );

    res.status(201).json(populated);
  } catch (err) {
    logger.error('Create fee structure error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Update fee structure
exports.updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = feeStructureSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const feeStructure = await FeeStructure.findOne({ _id: id, school: req.user.school });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    Object.assign(feeStructure, value);
    await feeStructure.save();

    const populated = await FeeStructure.findById(feeStructure._id).populate(
      'student',
      'firstName lastName studentCode className section'
    );

    res.json(populated);
  } catch (err) {
    logger.error('Update fee structure error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: Generate monthly invoices from fee structures
exports.generateMonthlyInvoices = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    if (!req.user.school) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    // Get all active fee structures
    const feeStructures = await FeeStructure.find({
      school: req.user.school,
      isActive: true,
    }).populate('student');

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const term = `${monthNames[month - 1]} ${year}`;

    const createdInvoices = [];
    const errors = [];

    for (const feeStruct of feeStructures) {
      try {
        // Check if invoice already exists for this month
        const existingInvoice = await Invoice.findOne({
          school: req.user.school,
          student: feeStruct.student._id,
          term: term,
        });

        if (existingInvoice) {
          errors.push(`Invoice already exists for ${feeStruct.student.firstName} ${feeStruct.student.lastName} - ${term}`);
          continue;
        }

        // Calculate actual fee
        let actualFee = feeStruct.monthlyFee;
        if (feeStruct.scholarshipType === 'percentage') {
          actualFee = feeStruct.monthlyFee - (feeStruct.monthlyFee * feeStruct.scholarship / 100);
        } else if (feeStruct.scholarshipType === 'fixed') {
          actualFee = Math.max(0, feeStruct.monthlyFee - feeStruct.scholarship);
        }

        // Create invoice
        const dueDate = new Date(year, month - 1, 15); // 15th of the month
        const invoice = await Invoice.create({
          school: req.user.school,
          student: feeStruct.student._id,
          amount: actualFee,
          currency: 'NPR',
          dueDate: dueDate,
          term: term,
          description: `Monthly fee for ${term}${feeStruct.scholarship > 0 ? ` (Scholarship: ${feeStruct.scholarshipType === 'percentage' ? feeStruct.scholarship + '%' : 'NPR ' + feeStruct.scholarship})` : ''}`,
          status: 'pending',
        });

        createdInvoices.push(invoice);
      } catch (err) {
        errors.push(`Failed to create invoice for ${feeStruct.student.firstName}: ${err.message}`);
      }
    }

    res.json({
      message: `Generated ${createdInvoices.length} invoices`,
      created: createdInvoices.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error('Generate monthly invoices error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

