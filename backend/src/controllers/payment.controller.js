const crypto = require('crypto');
const Joi = require('joi');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const PaymentAccount = require('../models/PaymentAccount');
const { getSchoolId } = require('../utils/getSchoolId');
const { getGateway } = require('../services/payment');
const logger = require('../config/logger');

const initiatePaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  gateway: Joi.string().valid('esewa', 'khalti', 'fonepay').required(),
});

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const getBackendUrl = () => (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

const resultUrl = (status, params = {}) => {
  const query = new URLSearchParams({ status, ...params }).toString();
  return `${getFrontendUrl()}/payments/result?${query}`;
};

// Verifies the parent is linked to the invoice's school and is the parent of the student
const validateParentInvoiceAccess = async (invoiceId, user) => {
  const invoice = await Invoice.findById(invoiceId).populate('student');
  if (!invoice) {
    return { error: { status: 404, message: 'Invoice not found' } };
  }

  const parentSchoolId = getSchoolId(user);
  if (!parentSchoolId) {
    return { error: { status: 403, message: 'Parent must be linked to a school' } };
  }

  if (invoice.school.toString() !== parentSchoolId) {
    return { error: { status: 403, message: 'Invoice does not belong to your school' } };
  }

  const student = await Student.findOne({ _id: invoice.student._id, parent: user._id });
  if (!student) {
    return { error: { status: 403, message: 'Invoice does not belong to your child' } };
  }

  return { invoice };
};

// Parent: Start a real gateway payment (eSewa / Khalti)
exports.initiatePayment = async (req, res) => {
  try {
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { invoiceId, gateway } = value;

    const gatewayImpl = getGateway(gateway);
    if (!gatewayImpl || gatewayImpl.available === false) {
      return res.status(400).json({
        message: `${gateway} payment gateway is not available yet. Please choose another method.`,
      });
    }

    const { invoice, error: accessError } = await validateParentInvoiceAccess(invoiceId, req.user);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const paymentAccount = await PaymentAccount.findOne({
      school: invoice.school,
      type: gateway,
      isVerified: true,
      isActive: true,
    });

    if (!paymentAccount) {
      return res.status(400).json({
        message: `No verified ${gateway} payment account is configured for this school. Please contact the school or use another payment method.`,
      });
    }

    const transactionUuid = crypto.randomUUID();
    const transaction = await Transaction.create({
      invoice: invoiceId,
      school: invoice.school,
      paymentAccount: paymentAccount._id,
      amount: invoice.amount,
      gateway,
      transactionUuid,
      status: 'initiated',
    });

    // Form-based gateways (eSewa) return a hidden-form payload.
    // URL-based gateways (Khalti) return a payment_url to redirect to.
    const payload = await gatewayImpl.buildPaymentForm({
      transactionUuid,
      amount: invoice.amount,
      backendUrl: getBackendUrl(),
    });

    if (payload.pidx) {
      transaction.pidx = payload.pidx;
      await transaction.save();
    }

    if (payload.type === 'url') {
      return res.json({
        transactionId: transaction._id,
        gateway,
        type: 'url',
        paymentUrl: payload.paymentUrl,
        message: `Redirecting to ${gatewayImpl.label || gateway} to complete payment`,
      });
    }

    res.json({
      transactionId: transaction._id,
      gateway,
      type: 'form',
      gatewayUrl: payload.paymentUrl,
      form: payload.form,
      message: `Redirecting to ${gatewayImpl.label || gateway} to complete payment`,
    });
  } catch (err) {
    logger.error('Initiate payment error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// eSewa redirects the browser back here with a base64 `data` payload
exports.esewaCallback = async (req, res) => {
  const gateway = getGateway('esewa');
  try {
    const { data } = req.query;
    if (!data) {
      return res.redirect(resultUrl('failed', { message: 'No payment response received' }));
    }

    const payload = gateway.decodeCallback(data);
    if (!payload || !payload.transaction_uuid) {
      return res.redirect(resultUrl('failed', { message: 'Invalid payment response' }));
    }

    const transaction = await Transaction.findOne({ transactionUuid: payload.transaction_uuid });
    if (!transaction) {
      return res.redirect(resultUrl('failed', { message: 'Transaction not found' }));
    }

    const signatureOk = gateway.verifySignature(payload);
    if (!signatureOk) {
      transaction.status = 'failed';
      transaction.rawResponse = payload;
      await transaction.save();
      return res.redirect(
        resultUrl('failed', { transactionId: transaction._id, message: 'Signature verification failed' })
      );
    }

    // Confirm with the eSewa status-check API (defence-in-depth)
    let remoteStatus = null;
    let remoteError = null;
    try {
      remoteStatus = await gateway.checkTransactionStatus({
        transactionUuid: transaction.transactionUuid,
        totalAmount: transaction.amount,
      });
    } catch (err) {
      remoteError = err.message;
    }

    const amountMatches = !remoteStatus || Number(remoteStatus.total_amount) === Number(transaction.amount);
    const remoteComplete = !remoteStatus || remoteStatus.status === 'COMPLETE';

    if (payload.status === 'COMPLETE' && amountMatches && remoteComplete) {
      // Guard against callback replays so an invoice is only credited once
      if (transaction.status !== 'success') {
        transaction.status = 'success';
        transaction.gatewayRefId = remoteStatus?.ref_id || payload.transaction_code || payload.transaction_id || null;
        transaction.rawResponse = payload;
        await transaction.save();
        await Invoice.findByIdAndUpdate(transaction.invoice, { status: 'paid' });
      }
      return res.redirect(
        resultUrl('success', {
          transactionId: transaction._id,
          ref: transaction.gatewayRefId,
        })
      );
    }

    transaction.status = 'failed';
    transaction.rawResponse = payload;
    await transaction.save();
    return res.redirect(
      resultUrl('failed', {
        transactionId: transaction._id,
        message: `Payment was not completed${remoteError ? ` (${remoteError})` : ''}`,
      })
    );
  } catch (err) {
    logger.error('eSewa callback error', { error: err.message });
    return res.redirect(resultUrl('failed', { message: 'Server error' }));
  }
};

// Khalti redirects the browser back here with `pidx` (and order params).
// Success is ONLY confirmed via the Lookup API — redirect params are never trusted.
exports.khaltiCallback = async (req, res) => {
  const gateway = getGateway('khalti');
  try {
    const { pidx } = req.query;
    if (!pidx) {
      return res.redirect(resultUrl('failed', { message: 'No payment reference received' }));
    }

    let transaction;
    if (req.query.purchase_order_id) {
      transaction = await Transaction.findOne({ transactionUuid: req.query.purchase_order_id });
    }
    if (!transaction) {
      transaction = await Transaction.findOne({ pidx });
    }
    if (!transaction) {
      return res.redirect(resultUrl('failed', { message: 'Transaction not found' }));
    }

    let lookup;
    try {
      lookup = await gateway.lookupTransaction({ pidx });
    } catch (err) {
      logger.error('Khalti lookup error', { error: err.message });
      return res.redirect(
        resultUrl('failed', {
          transactionId: transaction._id,
          message: 'Could not verify the payment with Khalti. Please check your invoice status.',
        })
      );
    }

    const status = lookup.status;
    const amountMatches =
      lookup.total_amount == null || Number(lookup.total_amount) === Number(transaction.amount) * 100;

    if (status === 'Completed' && amountMatches) {
      if (transaction.status !== 'success') {
        transaction.status = 'success';
        transaction.gatewayRefId = lookup.transaction_id || lookup.idx || null;
        transaction.rawResponse = lookup;
        await transaction.save();
        await Invoice.findByIdAndUpdate(transaction.invoice, { status: 'paid' });
      }
      return res.redirect(
        resultUrl('success', {
          transactionId: transaction._id,
          ref: transaction.gatewayRefId,
        })
      );
    }

    const isCancelled = ['User canceled', 'Canceled', 'Expired'].includes(status);
    transaction.status = isCancelled ? 'cancelled' : 'failed';
    transaction.rawResponse = lookup;
    await transaction.save();

    return res.redirect(
      resultUrl(isCancelled ? 'cancelled' : 'failed', {
        transactionId: transaction._id,
        message: isCancelled ? 'Payment was cancelled or expired.' : `Payment was not completed (${status || 'unknown'})`,
      })
    );
  } catch (err) {
    logger.error('Khalti callback error', { error: err.message });
    return res.redirect(resultUrl('failed', { message: 'Server error' }));
  }
};

// eSewa failure redirect (no payload; identifies the transaction from the URL)
exports.paymentFailure = async (req, res) => {
  const { transactionId } = req.query;
  try {
    if (transactionId) {
      const transaction = await Transaction.findOne({ transactionUuid: transactionId });
      if (transaction && transaction.status === 'initiated') {
        transaction.status = 'cancelled';
        await transaction.save();
      }
    }
  } catch (err) {
    logger.error('Payment failure handler error', { error: err.message });
  }

  return res.redirect(
    resultUrl('cancelled', {
      transactionId,
      message: 'Payment was cancelled or failed.',
    })
  );
};

// Parent: poll transaction status after returning to the app
exports.getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { error: accessError } = await validateParentInvoiceAccess(transaction.invoice, req.user);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    res.json({
      transactionId: transaction._id,
      status: transaction.status,
      gateway: transaction.gateway,
      amount: transaction.amount,
      gatewayRefId: transaction.gatewayRefId || null,
    });
  } catch (err) {
    logger.error('Get transaction status error', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};