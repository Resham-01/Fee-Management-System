import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';
import { getErrorMessage } from '../context/ToastContext';

const GATEWAY_OPTIONS = [
  { value: 'esewa', label: 'eSewa', color: 'border-green-500 bg-green-50 text-green-800' },
  { value: 'khalti', label: 'Khalti', color: 'border-purple-500 bg-purple-50 text-purple-800' },
  { value: 'fonepay', label: 'FonePay', color: 'border-blue-500 bg-blue-50 text-blue-800' },
];

const WalletPaymentModal = ({ invoice, availableGateways, onClose, onSuccess, showToast }) => {
  const [step, setStep] = useState('wallet');
  const [gateway, setGateway] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const gatewayOptions = GATEWAY_OPTIONS.filter((g) => availableGateways.includes(g.value));

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetError = () => setError('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const response = await apiClient.post('/payments/initiate', {
        invoiceId: invoice._id,
        gateway,
        walletPhone,
      });
      setTransactionId(response.data.transactionId);
      setMaskedPhone(response.data.walletPhone);
      setDemoOtp(response.data.demoOtp || '');
      setCountdown(response.data.expiresInSeconds || 300);
      setStep('otp');
      showToast(response.data.message, 'success');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const response = await apiClient.post('/payments/verify-otp', {
        transactionId,
        otp,
      });
      showToast(response.data.message || 'Payment successful', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    resetError();
    setLoading(true);
    try {
      const response = await apiClient.post('/payments/resend-otp', { transactionId });
      setDemoOtp(response.data.demoOtp || '');
      setCountdown(response.data.expiresInSeconds || 300);
      setOtp('');
      showToast(response.data.message, 'info');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend OTP'));
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Pay with Wallet</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-600">
              {invoice.student?.firstName} {invoice.student?.lastName} — {invoice.term}
            </p>
            <p className="text-xl font-bold text-gray-800 mt-1">NPR {invoice.amount.toLocaleString()}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'wallet' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Choose your wallet</p>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {gatewayOptions.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => {
                      setGateway(g.value);
                      setStep('phone');
                      resetError();
                    }}
                    className={`p-4 border-2 rounded-xl text-left font-semibold transition hover:shadow-md ${g.color}`}
                  >
                    Pay with {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp}>
              <button
                type="button"
                onClick={() => setStep('wallet')}
                className="text-sm text-purple-600 hover:underline mb-4"
              >
                &larr; Change wallet
              </button>
              <p className="text-sm text-gray-600 mb-4">
                Paying via <strong>{getPaymentTypeLabel(gateway)}</strong>. Enter the mobile number linked to your wallet.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Mobile Number</label>
              <input
                type="tel"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98XXXXXXXX"
                required
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <p className="text-xs text-gray-500 mb-4">
                A 6-digit verification code will be sent to this number via SMS.
              </p>
              <button
                type="submit"
                disabled={loading || walletPhone.length !== 10}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP via SMS'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-sm text-gray-600 mb-2">
                Enter the 6-digit code sent to <strong>{maskedPhone}</strong> for{' '}
                <strong>{getPaymentTypeLabel(gateway)}</strong> payment.
              </p>
              {demoOtp && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  Demo mode — your OTP is: <strong>{demoOtp}</strong>
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mb-4">
                {countdown > 0 ? `Code expires in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : 'OTP expired — resend to continue'}
              </p>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 mb-3"
              >
                {loading ? 'Verifying...' : 'Confirm Payment'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || countdown > 240}
                className="w-full text-purple-600 text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {countdown > 240 ? `Resend OTP in ${countdown - 240}s` : 'Resend OTP'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPaymentModal;
