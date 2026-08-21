const { buildPaymentForm, decodeCallback, verifySignature, hmacSign } = require('./esewa');

describe('hmacSign', () => {
  test('produces a base64 HMAC-SHA256 signature', () => {
    const sig = hmacSign('secret', 'total_amount=100');
    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test('is deterministic for the same input', () => {
    expect(hmacSign('secret', 'data')).toBe(hmacSign('secret', 'data'));
  });

  test('changes when the secret changes', () => {
    expect(hmacSign('a', 'data')).not.toBe(hmacSign('b', 'data'));
  });
});

describe('buildPaymentForm', () => {
  const form = buildPaymentForm({
    transactionUuid: 'txn-123',
    amount: '1000',
    backendUrl: 'https://api.example.com',
  });

  test('returns a form-type payload with eSewa label', () => {
    expect(form.type).toBe('form');
    expect(form.label).toBe('eSewa');
    expect(form.paymentUrl).toContain('esewa.com.np');
  });

  test('converts amount and tax to strings', () => {
    expect(form.form.amount).toBe('1000');
    expect(form.form.total_amount).toBe('1000');
    expect(form.form.tax_amount).toBe('0');
  });

  test('includes callback URLs built from backendUrl', () => {
    expect(form.form.success_url).toBe('https://api.example.com/api/payments/callback/esewa');
    expect(form.form.failure_url).toBe('https://api.example.com/api/payments/failure?transactionId=txn-123');
  });

  test('includes a base64 signature', () => {
    expect(form.form.signature).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('decodeCallback', () => {
  test('decodes a base64 JSON payload', () => {
    const payload = { total_amount: '100', transaction_uuid: 'txn' };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    expect(decodeCallback(encoded)).toEqual(payload);
  });

  test('returns null for invalid input', () => {
    expect(decodeCallback('not-base64!')).toBeNull();
    expect(decodeCallback('')).toBeNull();
  });
});

describe('verifySignature', () => {
  const SECRET = 'test-secret';
  const sign = (payload, secret = SECRET) => {
    const nameList = payload.signed_field_names.split(',');
    const dataString = nameList.map((name) => `${name}=${payload[name]}`).join(',');
    return hmacSign(secret, dataString);
  };

  test('accepts a correctly signed payload', () => {
    const payload = {
      total_amount: '100',
      transaction_uuid: 'txn-1',
      product_code: 'EPAYTEST',
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };
    payload.signature = sign(payload);
    expect(verifySignature(payload, SECRET)).toBe(true);
  });

  test('rejects a tampered payload', () => {
    const payload = {
      total_amount: '100',
      transaction_uuid: 'txn-1',
      product_code: 'EPAYTEST',
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };
    payload.signature = sign(payload);
    payload.total_amount = '999';
    expect(verifySignature(payload, SECRET)).toBe(false);
  });

  test('rejects payloads missing signature or field names', () => {
    expect(verifySignature({ signature: 'abc' }, SECRET)).toBe(false);
    expect(verifySignature({ signed_field_names: 'total_amount' }, SECRET)).toBe(false);
  });
});