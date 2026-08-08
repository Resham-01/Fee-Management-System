const express = require('express');
const {
  login,
  registerSchool,
  registerParent,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register-school', registerSchool);
router.post('/register-parent', registerParent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/change-password', auth, changePassword);

module.exports = router;






