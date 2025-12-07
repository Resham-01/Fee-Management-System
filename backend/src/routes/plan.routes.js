const express = require('express');
const { getAllPlans, createPlan } = require('../controllers/plan.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/', auth, permitRoles(USER_ROLES.SUPER_ADMIN), getAllPlans);
router.post('/', auth, permitRoles(USER_ROLES.SUPER_ADMIN), createPlan);

module.exports = router;



