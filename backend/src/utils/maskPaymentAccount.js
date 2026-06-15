const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  const visible = accountNumber.slice(-4);
  return `****${visible}`;
};

const maskPaymentAccount = (account, { fullDetails = false } = {}) => {
  const obj = account.toObject ? account.toObject() : { ...account };
  if (!fullDetails && obj.accountNumber) {
    obj.accountNumber = maskAccountNumber(obj.accountNumber);
  }
  return obj;
};

module.exports = { maskAccountNumber, maskPaymentAccount };
