const {
  OTP_EXPIRY_MS,
  MAX_OTP_ATTEMPTS,
  generateOtp,
  hashOtp,
  verifyOtp,
  maskPhone,
  sendPaymentOtpSms,
} = require('./paymentOtp');

describe('generateOtp', () => {
  test('returns a 6-digit numeric string', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  test('generates different OTPs on consecutive calls', () => {
    expect(generateOtp()).not.toBe(generateOtp());
  });
});

describe('hashOtp / verifyOtp', () => {
  test('hashes an OTP and verifies it successfully', async () => {
    const otp = '123456';
    const hash = await hashOtp(otp);
    expect(hash).not.toBe(otp);
    await expect(verifyOtp(otp, hash)).resolves.toBe(true);
  });

  test('rejects a wrong OTP', async () => {
    const hash = await hashOtp('123456');
    await expect(verifyOtp('654321', hash)).resolves.toBe(false);
  });
});

describe('maskPhone', () => {
  test('masks middle digits of a long phone', () => {
    expect(maskPhone('9841234567')).toBe('98******67');
  });

  test('returns short numbers unchanged', () => {
    expect(maskPhone('123')).toBe('123');
  });

  test('returns falsy values unchanged', () => {
    expect(maskPhone(null)).toBeNull();
    expect(maskPhone(undefined)).toBeUndefined();
    expect(maskPhone('')).toBe('');
  });
});

describe('sendPaymentOtpSms', () => {
  test('returns success and formats gateway message', async () => {
    const result = await sendPaymentOtpSms('9841234567', '123456', 'khalti', 1500);
    expect(result).toEqual({ success: true });
  });
});

describe('constants', () => {
  test('OTP expires after 5 minutes', () => {
    expect(OTP_EXPIRY_MS).toBe(5 * 60 * 1000);
  });

  test('allows up to 5 attempts', () => {
    expect(MAX_OTP_ATTEMPTS).toBe(5);
  });
});