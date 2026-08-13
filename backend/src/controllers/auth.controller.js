const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const { User, USER_ROLES } = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const logger = require('../config/logger');
const { deriveShortName } = require('../utils/schoolShortName');
const { sendPasswordResetEmail, sendEmailVerificationEmail } = require('../utils/email');

// Strong password policy: min 8 chars, at least one lowercase, one uppercase,
// one digit and one special character.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordField = () =>
  Joi.string()
    .min(8)
    .pattern(
      PASSWORD_PATTERN,
      'must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'
    );

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerSchoolSchema = Joi.object({
  schoolName: Joi.string().required(),
  address: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().required(),
  adminName: Joi.string().required(),
  adminEmail: Joi.string().email().required(),
  adminPassword: passwordField().required(),
});

const registerParentSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: passwordField().required(),
  schoolId: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: passwordField().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordField().required(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  phone: Joi.string().allow('').max(30),
  address: Joi.string().allow('').max(200),
}).min(1);

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Builds links from the URL the user is actually browsing so they also work
// from remote devices (mobile, another machine). Priority:
//   1. Origin header of the request (e.g. http://192.168.1.5:5173)
//   2. FRONTEND_URL env var
//   3. localhost fallback
const getFrontendBaseUrl = (req) => {
  const origin = req && req.get ? req.get('origin') : null;
  if (origin && /^https?:\/\/[^/\s]+$/i.test(origin)) {
    return origin;
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return frontendUrl.replace(/\/$/, '');
};

const getResetUrl = (req, token) => `${getFrontendBaseUrl(req)}/reset-password/${token}`;

const getVerifyUrl = (req, token) => `${getFrontendBaseUrl(req)}/verify-email/${token}`;

const issueVerificationToken = async (user, req) => {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  user.emailVerified = false;
  user.emailVerificationToken = hashResetToken(verifyToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: getVerifyUrl(req, verifyToken),
      baseUrl: getFrontendBaseUrl(req),
    });
  } catch (emailErr) {
    logger.error('Failed to send email verification link', { error: emailErr.message });
  }
};

const generateToken = (userId, role, schoolId) => {
  return jwt.sign({ id: userId, role, school: schoolId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value;
    const user = await User.findOne({ email: email.toLowerCase() }).populate('school');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email address before logging in. Check your inbox and click the verification link we sent.',
        needsVerification: true,
      });
    }

    // Check if school admin's school is approved
    if (user.role === USER_ROLES.SCHOOL_ADMIN) {
      if (!user.school || !user.school.isApproved) {
        return res.status(403).json({
          message: 'School is not approved yet. Please contact platform admin.',
        });
      }
    }

    const token = generateToken(user._id, user.role, user.school?._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
      },
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerSchool = async (req, res) => {
  try {
    const { error, value } = registerSchoolSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { schoolName, address, contactEmail, contactPhone, adminName, adminEmail, adminPassword } = value;

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin email already registered' });
    }

    // Create school (not approved yet)
    const school = await School.create({
      name: schoolName,
      shortName: deriveShortName(schoolName),
      address,
      contactEmail,
      contactPhone,
      isApproved: false,
    });

    // Create school admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: USER_ROLES.SCHOOL_ADMIN,
      school: school._id,
    });

    await issueVerificationToken(admin, req);

    res.status(201).json({
      message:
        'School registered successfully. A verification link has been sent to your email — verify it to activate your account. School approval is pending from Super Admin.',
      schoolId: school._id,
    });
  } catch (err) {
    logger.error('School registration error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerParent = async (req, res) => {
  try {
    const { error, value } = registerParentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, schoolId } = value;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Verify school exists and is approved
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    if (!school.isApproved) {
      return res.status(403).json({ message: 'School is not approved yet' });
    }

    // Create parent user
    const parent = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: USER_ROLES.PARENT,
      school: schoolId,
    });

    await issueVerificationToken(parent, req);

    res.status(201).json({
      message: 'Parent registered successfully. A verification link has been sent to your email — verify it to activate your account.',
      userId: parent._id,
    });
  } catch (err) {
    logger.error('Parent registration error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { oldPassword, newPassword } = value;
    const user = await User.findById(req.user.id);

    if (!(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error('Change password error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email } = value;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isActive) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = hashResetToken(resetToken);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const resetUrl = getResetUrl(req, resetToken);
      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          baseUrl: getFrontendBaseUrl(req),
        });
      } catch (emailErr) {
        // Never leak SMTP failures to the client; log for the developer instead.
        logger.error('Failed to send password reset email', { error: emailErr.message });
      }
    }

    res.json({
      message:
        'Password reset link has been sent to your email.',
    });
  } catch (err) {
    logger.error('Forgot password error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { token, newPassword } = value;
    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    logger.error('Reset password error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { token } = value;
    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Email verified successfully. You can now log in with your account.' });
  } catch (err) {
    logger.error('Email verification error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { error, value } = resendVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email } = value;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isActive && user.emailVerified === false) {
      await issueVerificationToken(user, req);
    }

    res.json({
      message: 'New verification link has been sent.',
    });
  } catch (err) {
    logger.error('Resend verification error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  address: user.address || '',
  school: user.school,
  createdAt: user.createdAt,
});

exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    let extra = {};

    if (user.role === USER_ROLES.SUPER_ADMIN) {
      const schools = await School.find({}).select('isApproved');
      extra.stats = {
        totalSchools: schools.length,
        approvedSchools: schools.filter((s) => s.isApproved).length,
        pendingSchools: schools.filter((s) => !s.isApproved).length,
      };
    } else if (user.role === USER_ROLES.SCHOOL_ADMIN) {
      const [totalStudents, invoices] = await Promise.all([
        Student.countDocuments({ school: user.school?._id }),
        Invoice.find({ school: user.school?._id }).select('amount status'),
      ]);
      extra.stats = {
        totalStudents,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter((i) => i.status === 'pending').length,
        paidAmount: invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
        pendingAmount: invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0),
      };
    } else if (user.role === USER_ROLES.PARENT) {
      const children = await Student.find({
        parent: user._id,
        school: user.school?._id,
      }).sort({ createdAt: -1 });
      extra.children = children;
    }

    res.json({ user: serializeUser(user), ...extra });
  } catch (err) {
    logger.error('Get profile error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = req.user;
    if (value.name !== undefined) user.name = value.name;
    if (value.phone !== undefined) user.phone = value.phone;
    if (value.address !== undefined) user.address = value.address;
    await user.save();

    res.json({ user: serializeUser(user), message: 'Profile updated successfully' });
  } catch (err) {
    logger.error('Update profile error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};






