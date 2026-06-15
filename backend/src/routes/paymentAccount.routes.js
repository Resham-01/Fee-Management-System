const express = require('express');
const {
  getMySchoolPaymentAccounts,
  createMySchoolPaymentAccount,
  updateMySchoolPaymentAccount,
  deleteMySchoolPaymentAccount,
  getSchoolPaymentAccounts,
  updatePaymentAccount,
  verifyPaymentAccount,
  rejectPaymentAccount,
  togglePaymentAccountActive,
  getParentPaymentAccounts,
} = require('../controllers/paymentAccount.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

// School Admin routes
router.get('/my-school', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), getMySchoolPaymentAccounts);
router.post('/my-school', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), createMySchoolPaymentAccount);
router.put('/my-school/:id', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), updateMySchoolPaymentAccount);
router.delete('/my-school/:id', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), deleteMySchoolPaymentAccount);

// Parent route
router.get('/parent', auth, permitRoles(USER_ROLES.PARENT), getParentPaymentAccounts);

// Super Admin routes
router.get('/school/:schoolId', auth, permitRoles(USER_ROLES.SUPER_ADMIN), getSchoolPaymentAccounts);
router.put('/:id', auth, permitRoles(USER_ROLES.SUPER_ADMIN), updatePaymentAccount);
router.patch('/:id/verify', auth, permitRoles(USER_ROLES.SUPER_ADMIN), verifyPaymentAccount);
router.patch('/:id/reject', auth, permitRoles(USER_ROLES.SUPER_ADMIN), rejectPaymentAccount);
router.patch('/:id/toggle-active', auth, permitRoles(USER_ROLES.SUPER_ADMIN), togglePaymentAccountActive);

module.exports = router;
