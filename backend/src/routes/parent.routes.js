const express = require('express');
const { linkChild, getLinkedChildren } = require('../controllers/parent.controller');
const { auth } = require('../middleware/auth.middleware');
const { permitRoles } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../models/User');

const router = express.Router();

router.get('/children', auth, permitRoles(USER_ROLES.PARENT), getLinkedChildren);
router.post('/link-child', auth, permitRoles(USER_ROLES.PARENT), linkChild);

module.exports = router;

