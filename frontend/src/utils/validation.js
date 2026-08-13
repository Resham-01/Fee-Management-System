export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_RULES =
  'At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character';

export const validatePassword = (password) => {
  if (!PASSWORD_PATTERN.test(password || '')) {
    return `Password ${PASSWORD_RULES.charAt(0).toLowerCase()}${PASSWORD_RULES.slice(1)}.`;
  }
  return null;
};
