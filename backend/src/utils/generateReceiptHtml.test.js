const { generateReceiptHtml, formatDate, formatAmount, gatewayLabel } = require('./generateReceiptHtml');

describe('formatDate', () => {
  test('returns an em dash for empty input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('formats a valid date', () => {
    const out = formatDate('2024-01-15T10:30:00Z');
    expect(out).toContain('2024');
    expect(out).not.toBe('—');
  });
});

describe('formatAmount', () => {
  test('formats amount with currency and 2 decimals', () => {
    expect(formatAmount(1000)).toBe('NPR 1,000.00');
    expect(formatAmount(1234.5)).toBe('NPR 1,234.50');
  });

  test('supports custom currency', () => {
    expect(formatAmount(500, 'USD')).toBe('USD 500.00');
  });
});

describe('gatewayLabel', () => {
  test('maps known gateways to friendly labels', () => {
    expect(gatewayLabel('esewa')).toBe('eSewa');
    expect(gatewayLabel('khalti')).toBe('Khalti');
    expect(gatewayLabel('fonepay')).toBe('FonePay');
  });

  test('falls back for unknown or missing gateway', () => {
    expect(gatewayLabel('other')).toBe('other');
    expect(gatewayLabel(undefined)).toBe('Manual / Cash');
    expect(gatewayLabel('')).toBe('Manual / Cash');
  });
});

describe('generateReceiptHtml', () => {
  const receipt = {
    receiptNumber: 'R-001',
    schoolName: 'Mid Valley School',
    studentName: 'Binita Dulal',
    studentCode: 'ST-123',
    className: 'Grade 10',
    parentName: 'Resham Thapa',
    term: 'January',
    gateway: 'esewa',
    amount: 15000,
    currency: 'NPR',
    paidAt: '2024-01-15T10:30:00Z',
  };

  test('produces an HTML document with receipt details', () => {
    const html = generateReceiptHtml(receipt);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('R-001');
    expect(html).toContain('Mid Valley School');
    expect(html).toContain('Binita Dulal');
    expect(html).toContain('ST-123');
    expect(html).toContain('15,000.00');
    expect(html).toContain('eSewa');
  });

  test('falls back to transactionId when receiptNumber is missing', () => {
    const html = generateReceiptHtml({ ...receipt, receiptNumber: null, transactionId: 'TXN-9' });
    expect(html).toContain('TXN-9');
  });
});