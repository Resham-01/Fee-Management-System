const express = require('express');
const {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  generateMonthlyInvoices,
} = require('../controllers/feeStructure.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.use(auth);
router.use(permitRoles(USER_ROLES.SCHOOL_ADMIN));

router.get('/', getFeeStructures);
router.post('/', createFeeStructure);
router.put('/:id', updateFeeStructure);
router.post('/generate-invoices', generateMonthlyInvoices);

module.exports = router;

