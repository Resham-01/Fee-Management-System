const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const { notFoundHandler, errorHandler } = require('./src/middleware/error.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const schoolRoutes = require('./src/routes/school.routes');
const studentRoutes = require('./src/routes/student.routes');
const parentRoutes = require('./src/routes/parent.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const planRoutes = require('./src/routes/plan.routes');
const feeStructureRoutes = require('./src/routes/feeStructure.routes');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/fee-structures', feeStructureRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start server due to DB connection error', { error: err.message });
    process.exit(1);
  });

