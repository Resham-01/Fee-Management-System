const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('./logger');

// Pre-configure DNS servers if the system is configured to only use loopback resolvers (common on some Windows setups)
try {
  const servers = dns.getServers();
  if (servers.length === 0 || servers.every(s => s === '127.0.0.1' || s === '::1')) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
} catch (e) {
  logger.warn('Failed to pre-configure DNS servers', { error: e.message });
}

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
    // If connection still fails due to querySrv or DNS errors, try setting public DNS servers as fallback
    if (err.message.includes('querySrv') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      logger.warn('MongoDB connection failed due to DNS/querySrv issue. Attempting with Google DNS servers...');
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
        await mongoose.connect(uri, {
          dbName: 'fee_management',
        });
        logger.info('MongoDB connected successfully using fallback DNS servers');
        return;
      } catch (fallbackErr) {
        logger.error('MongoDB connection also failed with fallback DNS', { error: fallbackErr.message });
      }
    }
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

module.exports = connectDB;



