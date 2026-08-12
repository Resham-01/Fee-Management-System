import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AuthLayout from '../components/layout/AuthLayout';
import Input, { Field } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const ForgotPasswordPage = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(response.data.message);
      showToast(response.data.message, 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send reset instructions');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-md">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-6 sm:p-8">
        <div className="mb-7">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <Icon.key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Forgot password?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Email address" htmlFor="email" required>
            <div className="relative">
              <Icon.mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" placeholder="you@example.com" />
            </div>
          </Field>

          {error && (
            <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="px-3.5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2">
              <Icon.mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} disabled={loading || Boolean(success)} className="w-full">
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            <Icon.arrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
