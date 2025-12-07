const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'fee_management',
    });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

module.exports = connectDB;



