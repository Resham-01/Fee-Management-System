const { getGateway, GATEWAY_NAMES } = require('./index');

describe('payment gateway registry', () => {
  test('registers the expected gateways', () => {
    expect(GATEWAY_NAMES).toEqual(['esewa', 'khalti']);
  });

  test('returns the esewa module for "esewa"', () => {
    const gateway = getGateway('esewa');
    expect(gateway).toBeTruthy();
    expect(typeof gateway.buildPaymentForm).toBe('function');
    expect(gateway.buildPaymentForm({}).label).toBe('eSewa');
  });

  test('returns the khalti module for "khalti"', () => {
    const gateway = getGateway('khalti');
    expect(gateway).toBeTruthy();
    expect(typeof gateway.buildPaymentForm).toBe('function');
    expect(gateway.name).toBe('khalti');
  });

  test('returns null for unknown gateways', () => {
    expect(getGateway('fonepay')).toBeNull();
    expect(getGateway('')).toBeNull();
    expect(getGateway(null)).toBeNull();
  });
});