const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('school');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { auth };



