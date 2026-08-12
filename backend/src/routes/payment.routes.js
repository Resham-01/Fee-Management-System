const express = require('express');
const {
  initiatePayment,
  esewaCallback,
  khaltiCallback,
  paymentFailure,
  getTransactionStatus,
} = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post('/initiate', auth, permitRoles(USER_ROLES.PARENT), initiatePayment);
router.get('/status/:transactionId', auth, permitRoles(USER_ROLES.PARENT), getTransactionStatus);

// Gateway redirects (public, browser is redirected here by the gateways)
router.get('/callback/esewa', esewaCallback);
router.get('/callback/khalti', khaltiCallback);
router.get('/failure', paymentFailure);

module.exports = router;