const logger = require('../config/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFoundHandler, errorHandler };



