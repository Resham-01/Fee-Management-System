import { PAYMENT_ACCOUNT_TYPES, getPaymentTypeLabel, GATEWAY_TYPES } from './paymentAccounts';

describe('PAYMENT_ACCOUNT_TYPES', () => {
  test('exposes the expected account types', () => {
    const values = PAYMENT_ACCOUNT_TYPES.map((t) => t.value);
    expect(values).toEqual(['esewa', 'khalti', 'fonepay', 'bank_transfer']);
  });

  test('each entry has a non-empty label', () => {
    for (const type of PAYMENT_ACCOUNT_TYPES) {
      expect(type.label).toBeTruthy();
    }
  });
});

describe('getPaymentTypeLabel', () => {
  test('returns the friendly label for known types', () => {
    expect(getPaymentTypeLabel('esewa')).toBe('eSewa');
    expect(getPaymentTypeLabel('khalti')).toBe('Khalti');
    expect(getPaymentTypeLabel('bank_transfer')).toBe('Bank Transfer');
  });

  test('falls back to the raw value for unknown types', () => {
    expect(getPaymentTypeLabel('crypto')).toBe('crypto');
    expect(getPaymentTypeLabel('')).toBe('');
  });
});

describe('GATEWAY_TYPES', () => {
  test('lists supported online gateways', () => {
    expect(GATEWAY_TYPES).toEqual(['esewa', 'khalti', 'fonepay']);
  });
});