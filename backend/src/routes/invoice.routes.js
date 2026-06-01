const express = require('express');
const {
  getSchoolInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getParentInvoices,
} = require('../controllers/invoice.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

// Static paths before /:id
router.get('/school', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), getSchoolInvoices);
router.get('/parent', auth, permitRoles(USER_ROLES.PARENT), getParentInvoices);

router.post('/', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN, USER_ROLES.SUPER_ADMIN), createInvoice);
router.put(
  '/:id',
  auth,
  permitRoles(USER_ROLES.SCHOOL_ADMIN, USER_ROLES.SUPER_ADMIN),
  updateInvoice
);
router.delete(
  '/:id',
  auth,
  permitRoles(USER_ROLES.SCHOOL_ADMIN, USER_ROLES.SUPER_ADMIN),
  deleteInvoice
);

module.exports = router;



