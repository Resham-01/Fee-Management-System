import { validatePassword, PASSWORD_PATTERN, PASSWORD_RULES } from './validation';

describe('validatePassword', () => {
  test('accepts a strong password', () => {
    expect(validatePassword('Strong@123')).toBeNull();
  });

  test('rejects passwords without an uppercase letter', () => {
    expect(validatePassword('strong@123')).not.toBeNull();
  });

  test('rejects passwords without a lowercase letter', () => {
    expect(validatePassword('STRONG@123')).not.toBeNull();
  });

  test('rejects passwords without a number', () => {
    expect(validatePassword('Strong@pass')).not.toBeNull();
  });

  test('rejects passwords without a special character', () => {
    expect(validatePassword('Strong1234')).not.toBeNull();
  });

  test('rejects short passwords', () => {
    expect(validatePassword('Ab@1')).not.toBeNull();
  });

  test('returns a helpful rule message on failure', () => {
    expect(validatePassword('weak')).toBe(`Password ${PASSWORD_RULES.charAt(0).toLowerCase()}${PASSWORD_RULES.slice(1)}.`);
  });

  test('handles empty input without throwing', () => {
    expect(validatePassword('')).not.toBeNull();
    expect(validatePassword()).not.toBeNull();
  });
});

describe('PASSWORD_PATTERN', () => {
  test('matches the documented rules', () => {
    expect(PASSWORD_PATTERN.test('Abcdef1!')).toBe(true);
    expect(PASSWORD_PATTERN.test('abcdefg!1')).toBe(false);
  });
});