
const crypto = require('crypto');

const getConfig = () => ({
  productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  gatewayUrl:
    process.env.ESEWA_GATEWAY_URL ||
    'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  statusUrlPath:
    process.env.ESEWA_STATUS_URL ||
    'https://rc.esewa.com.np/api/epay/transaction/status',
});

const hmacSign = (secretKey, dataString) => {
  return crypto.createHmac('sha256', secretKey).update(dataString).digest('base64');
};

// Request signature is computed over the signed_field_names values in order
const signRequest = ({ productCode, transactionUuid, totalAmount }) => {
  const dataString = [
    `total_amount=${totalAmount}`,
    `transaction_uuid=${transactionUuid}`,
    `product_code=${productCode}`,
  ].join(',');
  return hmacSign(getConfig().secretKey, dataString);
};

const buildPaymentForm = ({ transactionUuid, amount, backendUrl }) => {
  const cfg = getConfig();
  const totalAmount = Number(amount);
  const signature = signRequest({
    totalAmount,
    transactionUuid,
    productCode: cfg.productCode,
  });

  return {
    type: 'form',
    label: 'eSewa',
    paymentUrl: cfg.gatewayUrl,
    form: {
      amount: String(totalAmount),
      tax_amount: '0',
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: cfg.productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${backendUrl}/api/payments/callback/esewa`,
      failure_url: `${backendUrl}/api/payments/failure?transactionId=${transactionUuid}`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    },
  };
};

const decodeCallback = (encodedData) => {
  try {
    const json = Buffer.from(encodedData, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
};

// Response signature is generated the same way as the request signature:
// field_name=value pairs for every field listed in signed_field_names, in order.
const verifySignature = (payload, secretKey = null) => {
  const key = secretKey || getConfig().secretKey;
  const fieldNames = payload?.signed_field_names;
  if (!fieldNames || !payload.signature) return false;

  const nameList = fieldNames.split(',');
  const dataString = nameList.map((name) => `${name}=${payload[name]}`).join(',');
  const expected = hmacSign(key, dataString);
  return expected === payload.signature;
};

const checkTransactionStatus = async ({ transactionUuid, totalAmount }) => {
  const cfg = getConfig();
  const params = new URLSearchParams({
    product_code: cfg.productCode,
    total_amount: String(totalAmount),
    transaction_uuid: transactionUuid,
  });
  const res = await fetch(`${cfg.statusUrlPath}/?${params.toString()}`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error(`eSewa status check failed with status ${res.status}`);
  }
  return res.json();
};

module.exports = {
  buildPaymentForm,
  decodeCallback,
  verifySignature,
  checkTransactionStatus,
  hmacSign,
};