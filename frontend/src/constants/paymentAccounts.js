export const PAYMENT_ACCOUNT_TYPES = [
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'fonepay', label: 'FonePay' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export const getPaymentTypeLabel = (type) =>
  PAYMENT_ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

export const GATEWAY_TYPES = ['esewa', 'khalti', 'fonepay'];
