const Joi = require('joi');
const PaymentAccount = require('../models/PaymentAccount');
const { PAYMENT_ACCOUNT_TYPES } = require('../models/PaymentAccount');
const { USER_ROLES } = require('../models/User');
const { getSchoolId } = require('../utils/getSchoolId');
const { maskPaymentAccount } = require('../utils/maskPaymentAccount');
const logger = require('../config/logger');

const paymentAccountSchema = Joi.object({
  type: Joi.string()
    .valid(...PAYMENT_ACCOUNT_TYPES)
    .required(),
  merchantId: Joi.string().allow('', null),
  merchantName: Joi.string().allow('', null),
  bankName: Joi.string().allow('', null),
  accountName: Joi.string().allow('', null),
  accountNumber: Joi.string().allow('', null),
  branch: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const superAdminUpdateSchema = paymentAccountSchema.keys({
  isActive: Joi.boolean(),
  isVerified: Joi.boolean(),
  rejectionReason: Joi.string().allow('', null),
});

const validateAccountFields = (type, data) => {
  if (type === 'bank_transfer') {
    if (!data.bankName || !data.accountName || !data.accountNumber) {
      return 'Bank name, account name, and account number are required for bank transfer';
    }
  } else if (!data.merchantId && !data.merchantName) {
    return 'Merchant ID or merchant name is required for digital wallets';
  }
  return null;
};

// School Admin: list own school's payment accounts
exports.getMySchoolPaymentAccounts = async (req, res) => {
  try {
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const accounts = await PaymentAccount.find({ school: schoolId }).sort({ type: 1 });
    res.json(accounts.map((a) => maskPaymentAccount(a, { fullDetails: true })));
  } catch (err) {
    logger.error('Get my school payment accounts error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: submit payment account details
exports.createMySchoolPaymentAccount = async (req, res) => {
  try {
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const { error, value } = paymentAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const fieldError = validateAccountFields(value.type, value);
    if (fieldError) {
      return res.status(400).json({ message: fieldError });
    }

    const existing = await PaymentAccount.findOne({ school: schoolId, type: value.type });
    if (existing) {
      return res.status(400).json({
        message: `A ${value.type} payment account already exists. Please update the existing one.`,
      });
    }

    const account = await PaymentAccount.create({
      ...value,
      school: schoolId,
      submittedBy: req.user._id,
      isActive: false,
      isVerified: false,
    });

    res.status(201).json({
      message: 'Payment account submitted. Waiting for Super Admin approval.',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Payment account type already exists for this school' });
    }
    logger.error('Create payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: update payment account (resets verification)
exports.updateMySchoolPaymentAccount = async (req, res) => {
  try {
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const { error, value } = paymentAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const account = await PaymentAccount.findOne({ _id: req.params.id, school: schoolId });
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    const fieldError = validateAccountFields(value.type, value);
    if (fieldError) {
      return res.status(400).json({ message: fieldError });
    }

    Object.assign(account, value, {
      isVerified: false,
      isActive: false,
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      submittedBy: req.user._id,
    });
    await account.save();

    res.json({
      message: 'Payment account updated. Waiting for Super Admin re-approval.',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    logger.error('Update payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// School Admin: delete unverified payment account
exports.deleteMySchoolPaymentAccount = async (req, res) => {
  try {
    const schoolId = getSchoolId(req.user);
    if (!schoolId) {
      return res.status(403).json({ message: 'School admin must be linked to a school' });
    }

    const account = await PaymentAccount.findOne({ _id: req.params.id, school: schoolId });
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    if (account.isVerified) {
      return res.status(400).json({
        message: 'Verified accounts cannot be deleted. Contact Super Admin to deactivate.',
      });
    }

    await account.deleteOne();
    res.json({ message: 'Payment account deleted' });
  } catch (err) {
    logger.error('Delete payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: list payment accounts for a school
exports.getSchoolPaymentAccounts = async (req, res) => {
  try {
    const accounts = await PaymentAccount.find({ school: req.params.schoolId })
      .populate('submittedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ type: 1 });

    res.json(accounts.map((a) => maskPaymentAccount(a, { fullDetails: true })));
  } catch (err) {
    logger.error('Get school payment accounts error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: update any payment account
exports.updatePaymentAccount = async (req, res) => {
  try {
    const { error, value } = superAdminUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    const fieldError = validateAccountFields(value.type || account.type, { ...account.toObject(), ...value });
    if (fieldError) {
      return res.status(400).json({ message: fieldError });
    }

    Object.assign(account, value);

    if (value.isVerified === true) {
      account.verifiedAt = new Date();
      account.verifiedBy = req.user._id;
      account.rejectionReason = null;
      account.isActive = true;
    }

    if (value.isVerified === false && value.isActive === false) {
      account.verifiedAt = null;
      account.verifiedBy = null;
    }

    await account.save();

    res.json({
      message: 'Payment account updated',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    logger.error('Super admin update payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: verify payment account
exports.verifyPaymentAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    account.isVerified = true;
    account.isActive = true;
    account.verifiedAt = new Date();
    account.verifiedBy = req.user._id;
    account.rejectionReason = null;
    await account.save();

    res.json({
      message: 'Payment account verified and activated for parents',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    logger.error('Verify payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: reject payment account
exports.rejectPaymentAccount = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    account.isVerified = false;
    account.isActive = false;
    account.verifiedAt = null;
    account.verifiedBy = null;
    account.rejectionReason = rejectionReason || 'Rejected by Super Admin';
    await account.save();

    res.json({
      message: 'Payment account rejected',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    logger.error('Reject payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Super Admin: toggle active status
exports.togglePaymentAccountActive = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Payment account not found' });
    }

    if (!account.isVerified && req.body.isActive) {
      return res.status(400).json({ message: 'Account must be verified before activation' });
    }

    account.isActive = req.body.isActive ?? !account.isActive;
    await account.save();

    res.json({
      message: account.isActive ? 'Payment account activated' : 'Payment account deactivated',
      account: maskPaymentAccount(account, { fullDetails: true }),
    });
  } catch (err) {
    logger.error('Toggle payment account error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent: get verified active payment accounts for their school
exports.getParentPaymentAccounts = async (req, res) => {
  try {
    if (!req.user.school) {
      return res.status(403).json({ message: 'Parent must be linked to a school' });
    }

    const accounts = await PaymentAccount.find({
      school: req.user.school,
      isVerified: true,
      isActive: true,
    }).sort({ type: 1 });

    res.json(accounts.map((a) => maskPaymentAccount(a)));
  } catch (err) {
    logger.error('Get parent payment accounts error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
