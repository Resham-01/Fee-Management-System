const express = require('express');
const { getAllPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/', auth, permitRoles(USER_ROLES.SUPER_ADMIN), getAllPlans);
router.post('/', auth, permitRoles(USER_ROLES.SUPER_ADMIN), createPlan);
router.put('/:id', auth, permitRoles(USER_ROLES.SUPER_ADMIN), updatePlan);
router.delete('/:id', auth, permitRoles(USER_ROLES.SUPER_ADMIN), deletePlan);

module.exports = router;






