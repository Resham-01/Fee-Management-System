import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';
import { getErrorMessage } from '../context/ToastContext';
import Icon from './ui/icons';
import Modal from './ui/Modal';

const GATEWAY_OPTIONS = [
  { value: 'esewa', label: 'eSewa', icon: '🟢' },
  { value: 'khalti', label: 'Khalti', icon: '🟣' },
  { value: 'fonepay', label: 'FonePay', icon: '🔵' },
];

const PaymentModal = ({ invoice, availableGateways, onClose, onSuccess, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [redirectGateway, setRedirectGateway] = useState('');
  const formRef = useRef(null);

  const gatewayOptions = GATEWAY_OPTIONS.filter((g) => availableGateways.includes(g.value));

  useEffect(() => {
    if (formData && formRef.current) {
      formRef.current.submit();
    }
  }, [formData]);

  useEffect(() => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  }, [redirectUrl]);

  const resetError = () => setError('');

  const handleInitiate = async (gateway) => {
    resetError();
    setLoading(true);
    try {
      const response = await apiClient.post('/payments/initiate', {
        invoiceId: invoice._id,
        gateway,
      });
      const { type, gatewayUrl, form, paymentUrl } = response.data;
      if (type === 'url') {
        setRedirectGateway(gateway);
        setRedirectUrl(paymentUrl);
      } else {
        setFormData({ action: gatewayUrl, gateway, fields: form });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start payment'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    onSuccess();
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title="Pay Online"
      description="Select a payment method to settle this invoice."
      size="sm"
    >
      <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {invoice.student?.firstName} {invoice.student?.lastName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{invoice.term}</p>
          </div>
          <p className="text-xl font-bold font-display text-brand-700">NPR {invoice.amount.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
          <Icon.info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!formData && !redirectUrl ? (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Choose a payment method</p>
          {gatewayOptions.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
              No online payment methods are available for this school yet. Please check the bank transfer details or contact the school.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              {gatewayOptions.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => handleInitiate(g.value)}
                  disabled={loading}
                  className="group flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl bg-white text-left font-semibold text-slate-800 transition hover:border-brand-300 hover:shadow-card hover:bg-brand-50/40 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-brand-500/20 focus:outline-none"
                >
                  <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg group-hover:bg-white transition">
                    {g.icon}
                  </span>
                  <span className="flex-1">{loading ? 'Preparing payment…' : `Pay with ${g.label}`}</span>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
            <Icon.lock className="w-3.5 h-3.5" />
            You will be redirected to the selected gateway to complete your payment securely.
          </p>
          {!loading && (
            <button type="button" onClick={handleClose} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition">
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-sm">
            <p className="font-semibold mb-0.5 flex items-center gap-1.5">
              <Icon.external className="w-4 h-4" />
              Redirecting to {getPaymentTypeLabel(redirectUrl ? redirectGateway : formData.gateway)}…
            </p>
            <p className="text-xs text-sky-700/80 mt-1">
              A secure payment window should open in a new tab. If it did not, use the button below.
            </p>
          </div>
          {redirectUrl && (
            <button
              type="button"
              onClick={() => window.open(redirectUrl, '_blank')}
              className="w-full mb-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 transition shadow-sm"
            >
              Open {getPaymentTypeLabel(redirectGateway)} window
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            Close
          </button>
        </div>
      )}

      {formData && (
        <form ref={formRef} action={formData.action} method="POST" target="_blank" className="hidden">
          {Object.entries(formData.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </Modal>
  );
};

export default PaymentModal;
