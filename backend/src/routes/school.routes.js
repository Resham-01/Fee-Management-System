const express = require('express');
const {
  getAllSchools,
  getSchoolDetails,
  approveSchool,
  rejectSchool,
  notifyParents,
  notifySchool,
  getMySchool,
} = require('../controllers/school.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

// Public route: Get approved schools (for parent registration) - MUST be before /:id routes
router.get('/approved', getAllSchools);

// Super Admin routes
router.get('/', auth, permitRoles(USER_ROLES.SUPER_ADMIN), getAllSchools);
router.get('/:id/details', auth, permitRoles(USER_ROLES.SUPER_ADMIN), getSchoolDetails);
router.patch('/:id/approve', auth, permitRoles(USER_ROLES.SUPER_ADMIN), approveSchool);
router.patch('/:id/reject', auth, permitRoles(USER_ROLES.SUPER_ADMIN), rejectSchool);
router.post('/:id/notify-parents', auth, permitRoles(USER_ROLES.SUPER_ADMIN), notifyParents);
router.post('/:id/notify-school', auth, permitRoles(USER_ROLES.SUPER_ADMIN), notifySchool);

// School Admin route
router.get('/my-school', auth, permitRoles(USER_ROLES.SCHOOL_ADMIN), getMySchool);

module.exports = router;

