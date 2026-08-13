const express = require('express');
const {
  login,
  registerSchool,
  registerParent,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getProfile,
  updateProfile,
} = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register-school', registerSchool);
router.post('/register-parent', registerParent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.post('/change-password', auth, changePassword);
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);

module.exports = router;






