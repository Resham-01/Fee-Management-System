const express = require('express');
const {
  getSchoolInvoices,
  createInvoice,
  getParentInvoices,
} = require('../controllers/invoice.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

// School Admin routes
router.get('/school', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), getSchoolInvoices);
router.post('/', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), createInvoice);

// Parent route
router.get('/parent', auth, permitRoles(USER_ROLES.PARENT), getParentInvoices);

module.exports = router;

