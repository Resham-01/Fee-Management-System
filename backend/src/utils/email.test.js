const { isEmailConfigured } = require('./email');

describe('isEmailConfigured', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  test('returns true when real SMTP credentials are set', () => {
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_USER = 'real.user@gmail.com';
    process.env.SMTP_PASS = 'real-password';
    expect(isEmailConfigured()).toBe(true);
  });

  test('returns false when credentials are missing', () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  test('returns false for placeholder credentials', () => {
    process.env.SMTP_HOST = 'smtp.yourgmail.com';
    process.env.SMTP_USER = 'your-email@gmail.com';
    process.env.SMTP_PASS = 'xxxxxxxx';
    expect(isEmailConfigured()).toBe(false);
  });
});