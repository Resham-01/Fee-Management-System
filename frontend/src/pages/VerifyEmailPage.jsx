import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await apiClient.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message);
        showToast(response.data.message, 'success');
      } catch (err) {
        const msg = getErrorMessage(err, 'Failed to verify email');
        setStatus('error');
        setMessage(msg);
        showToast(msg, 'error');
      }
    };

    verify();
  }, [token]);

  const getStatusUi = () => {
    if (status === 'verifying') {
      return (
        <div className="text-center py-6">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Verifying your email…</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <>
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon.check className="w-7 h-7" />
          </div>
          <p className="text-slate-700 font-medium mb-6">{message}</p>
          <Link to="/login">
            <Button size="lg" className="w-full">Go to Login</Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Icon.warning className="w-7 h-7" />
        </div>
        <p className="text-slate-700 font-medium mb-6">{message}</p>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          <Icon.arrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </>
    );
  };

  return (
    <AuthLayout maxWidth="max-w-md">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 mx-auto">
          <Icon.mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight mb-2">Email Verification</h2>
        {getStatusUi()}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
