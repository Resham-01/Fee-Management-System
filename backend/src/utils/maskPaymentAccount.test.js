const { maskAccountNumber, maskPaymentAccount } = require('./maskPaymentAccount');

describe('maskAccountNumber', () => {
  test('masks all but the last 4 digits', () => {
    expect(maskAccountNumber('1234567890')).toBe('****7890');
  });

  test('returns short numbers unchanged', () => {
    expect(maskAccountNumber('123')).toBe('123');
  });

  test('returns falsy values unchanged', () => {
    expect(maskAccountNumber(null)).toBeNull();
    expect(maskAccountNumber(undefined)).toBeUndefined();
    expect(maskAccountNumber('')).toBe('');
  });
});

describe('maskPaymentAccount', () => {
  test('masks accountNumber by default', () => {
    const result = maskPaymentAccount({ name: 'Test', accountNumber: '1234567890' });
    expect(result.accountNumber).toBe('****7890');
    expect(result.name).toBe('Test');
  });

  test('keeps accountNumber when fullDetails is true', () => {
    const result = maskPaymentAccount({ accountNumber: '1234567890' }, { fullDetails: true });
    expect(result.accountNumber).toBe('1234567890');
  });

  test('does not mutate the input object', () => {
    const input = { accountNumber: '1234567890' };
    maskPaymentAccount(input);
    expect(input.accountNumber).toBe('1234567890');
  });

  test('supports Mongoose-style objects with toObject()', () => {
    const doc = { toObject: () => ({ accountNumber: '1234567890', bank: 'NMB' }) };
    const result = maskPaymentAccount(doc);
    expect(result.accountNumber).toBe('****7890');
    expect(result.bank).toBe('NMB');
  });
});