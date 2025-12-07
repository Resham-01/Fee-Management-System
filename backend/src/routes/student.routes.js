const express = require('express');
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/student.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

// All routes require school admin authentication
router.use(auth);
router.use(permitRoles(USER_ROLES.SCHOOL_ADMIN));

router.get('/', getStudents);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;



