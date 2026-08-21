const khalti = require('./khalti');

const mockFetch = (res, ok = true, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(res),
  });
};

describe('post', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('parses a successful JSON response', async () => {
    mockFetch(JSON.stringify({ pidx: 'p-1', payment_url: 'https://pay' }));
    const data = await khalti.post('https://url', { a: 1 });
    expect(data).toEqual({ pidx: 'p-1', payment_url: 'https://pay' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://url',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Key ') }),
      })
    );
  });

  test('throws a detailed error on non-OK responses', async () => {
    mockFetch(JSON.stringify({ detail: 'Bad credentials' }), false, 401);
    await expect(khalti.post('https://url', {})).rejects.toThrow('Khalti: 401 Bad credentials');
  });

  test('throws on invalid JSON', async () => {
    mockFetch('<html>oops</html>');
    await expect(khalti.post('https://url', {})).rejects.toThrow('Khalti returned an invalid response');
  });
});

describe('buildPaymentForm', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('returns a url-type payload with paisa-converted amount', async () => {
    jest.spyOn(khalti, 'post').mockResolvedValue({
      pidx: 'pidx-1',
      payment_url: 'https://khalti.com/checkout',
    });

    const result = await khalti.buildPaymentForm({
      transactionUuid: 'txn-12345678',
      amount: 1500.5,
      backendUrl: 'https://api.example.com',
    });

    expect(result.type).toBe('url');
    expect(result.paymentUrl).toBe('https://khalti.com/checkout');
    expect(result.pidx).toBe('pidx-1');

    expect(khalti.post).toHaveBeenCalledWith(
      expect.stringContaining('/initiate/'),
      expect.objectContaining({
        amount: '150050',
        purchase_order_id: 'txn-12345678',
        return_url: 'https://api.example.com/api/payments/callback/khalti',
      })
    );
  });

  test('throws when Khalti returns no payment URL', async () => {
    jest.spyOn(khalti, 'post').mockResolvedValue({ pidx: 'x' });
    await expect(
      khalti.buildPaymentForm({ transactionUuid: 'txn', amount: 100 })
    ).rejects.toThrow('Khalti did not return a payment URL');
  });
});

describe('lookupTransaction', () => {
  test('delegates to the lookup endpoint with pidx', async () => {
    const spy = jest.spyOn(khalti, 'post').mockResolvedValue({ status: 'Completed' });
    const result = await khalti.lookupTransaction({ pidx: 'pidx-1' });
    expect(result).toEqual({ status: 'Completed' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/lookup/'), { pidx: 'pidx-1' });
  });
});

describe('verifySignature', () => {
  test('always returns true (verification is via Lookup API)', () => {
    expect(khalti.verifySignature()).toBe(true);
  });
});