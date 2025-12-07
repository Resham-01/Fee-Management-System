const express = require('express');
const { initiatePayment, paymentWebhook } = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.post('/initiate', auth, permitRoles(USER_ROLES.PARENT), initiatePayment);
router.post('/webhook', paymentWebhook); // Public webhook endpoint

module.exports = router;

