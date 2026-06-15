const express = require('express');
const {
  initiatePayment,
  verifyPaymentOtp,
  resendPaymentOtp,
  paymentWebhook,
} = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post('/initiate', auth, permitRoles(USER_ROLES.PARENT), initiatePayment);
router.post('/verify-otp', auth, permitRoles(USER_ROLES.PARENT), verifyPaymentOtp);
router.post('/resend-otp', auth, permitRoles(USER_ROLES.PARENT), resendPaymentOtp);
router.post('/webhook', paymentWebhook); // Public webhook endpoint

module.exports = router;



