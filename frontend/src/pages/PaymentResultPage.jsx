import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Icon from '../components/ui/icons';

const FALLBACK_STATUSES = ['success', 'failed', 'cancelled'];

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [txStatus, setTxStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const status = searchParams.get('status') || '';
  const transactionId = searchParams.get('transactionId');
  const ref = searchParams.get('ref');
  const message = searchParams.get('message');

  const isFinal = FALLBACK_STATUSES.includes(status);

  useEffect(() => {
    if (!transactionId || isFinal) return undefined;

    let cancelled = false;
    const fetchStatus = async () => {
      setPolling(true);
      try {
        const res = await apiClient.get(`/payments/status/${transactionId}`);
        if (!cancelled) {
          setTxStatus(res.data.status);
          if (res.data.gatewayRefId) {
            searchParams.set('ref', res.data.gatewayRefId);
          }
        }
      } catch (err) {
        // keep polling; the callback may still be processing
      } finally {
        if (!cancelled) setPolling(false);
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [transactionId, isFinal, searchParams]);

  const effectiveStatus = isFinal ? status : txStatus;
  const isSuccess = effectiveStatus === 'success';
  const isPending = !effectiveStatus || effectiveStatus === 'initiated';

  const config = isSuccess
    ? {
        ring: 'border-emerald-200',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40',
        title: 'Payment Successful',
        subtitle: 'Your fee payment has been received.',
      }
    : isPending
      ? {
          ring: 'border-sky-200',
          iconBg: 'bg-gradient-to-br from-brand-500 to-violet-600 shadow-brand-500/40',
          title: 'Confirming Payment',
          subtitle: 'Please wait while we confirm your payment with the gateway.',
        }
      : {
          ring: status === 'cancelled' ? 'border-slate-200' : 'border-rose-200',
          iconBg: status === 'cancelled' ? 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/40' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/40',
          title: status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed',
          subtitle: message || 'Your payment could not be completed. Please try again.',
        };

  const icon = isSuccess ? <Icon.check className="w-8 h-8" /> : isPending ? <Icon.clock className="w-8 h-8" /> : <Icon.x className="w-8 h-8" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-slate-50 to-violet-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-white rounded-3xl shadow-lift border-2 ${config.ring} p-8 sm:p-10 text-center animate-fade-in-up`}>
        <div className={`w-16 h-16 mx-auto rounded-2xl text-white flex items-center justify-center shadow-lg ${config.iconBg} ${isPending ? 'animate-pulse-soft' : ''}`}>
          {icon}
        </div>

        <h1 className="mt-5 text-2xl font-bold font-display text-slate-900 tracking-tight">{config.title}</h1>
        <p className="mt-2 text-slate-500 text-sm leading-relaxed">{config.subtitle}</p>

        {isPending && polling && (
          <p className="mt-3 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Icon.refresh className="w-3.5 h-3.5 animate-spin" />
            Checking payment status…
          </p>
        )}

        {ref && (
          <div className="mt-5 px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-600">
            <span className="text-slate-400">Gateway Reference:</span>{' '}
            <span className="font-semibold text-slate-800">{ref}</span>
          </div>
        )}

        {!isPending && (
          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/parent"
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 transition shadow-sm shadow-brand-600/30"
            >
              Go to Dashboard
            </Link>
            {user && (
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="text-slate-500 text-sm hover:text-slate-700 hover:underline transition"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
