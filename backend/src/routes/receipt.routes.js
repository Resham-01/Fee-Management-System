const express = require('express');
const {
  getReceipts,
  getReceiptByInvoice,
  downloadReceiptByInvoice,
} = require('../controllers/receipt.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

const allRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.SCHOOL_ADMIN, USER_ROLES.PARENT];

router.get('/', auth, permitRoles(...allRoles), getReceipts);
router.get('/invoice/:invoiceId', auth, permitRoles(...allRoles), getReceiptByInvoice);
router.get('/invoice/:invoiceId/download', auth, permitRoles(...allRoles), downloadReceiptByInvoice);

module.exports = router;
