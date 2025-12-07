const Joi = require('joi');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const logger = require('../config/logger');

const initiatePaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  gateway: Joi.string().valid('esewa', 'khalti', 'fonepay').required(),
});

// Parent: Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { invoiceId, gateway } = value;

    // Get invoice and verify it belongs to parent's child
    const invoice = await Invoice.findById(invoiceId).populate('student');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if student belongs to this parent
    const student = await Student.findOne({ _id: invoice.student._id, parent: req.user._id });
    if (!student) {
      return res.status(403).json({ message: 'Invoice does not belong to your child' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      invoice: invoiceId,
      amount: invoice.amount,
      gateway,
      status: 'initiated',
    });

    // TODO: Generate actual payment gateway URL
    // For now, return mock redirect URL
    const redirectUrl = `https://${gateway}.com/payment?transactionId=${transaction._id}`;

    res.json({
      transactionId: transaction._id,
      gateway,
      redirectUrl,
      amount: invoice.amount,
    });
  } catch (err) {
    logger.error('Initiate payment error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Payment webhook (public endpoint, should be secured with gateway secret)
exports.paymentWebhook = async (req, res) => {
  try {
    const { transactionId, status, gatewayRefId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = status;
    transaction.gatewayRefId = gatewayRefId;
    transaction.rawResponse = req.body;
    await transaction.save();

    if (status === 'success') {
      await Invoice.findByIdAndUpdate(transaction.invoice, { status: 'paid' });
    }

    res.json({ message: 'Webhook processed' });
  } catch (err) {
    logger.error('Payment webhook error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};



