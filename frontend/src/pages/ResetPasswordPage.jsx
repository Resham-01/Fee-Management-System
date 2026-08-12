import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/PasswordInput';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AuthLayout from '../components/layout/AuthLayout';
import { Field } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });
      showToast(response.data.message, 'success');
      navigate('/login');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to reset password');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout maxWidth="max-w-md">
        <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Icon.warning className="w-7 h-7" />
          </div>
          <p className="text-slate-700 font-medium mb-4">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout maxWidth="max-w-md">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-6 sm:p-8">
        <div className="mb-7">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <Icon.lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Set a new password</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your new password below to regain access.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="New Password" htmlFor="newPassword" required hint="Must be at least 6 characters.">
            <PasswordInput id="newPassword" value={formData.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)} placeholder="Enter new password" label="New Password" />
          </Field>

          <Field label="Confirm New Password" htmlFor="confirmPassword" required>
            <PasswordInput id="confirmPassword" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} placeholder="Confirm new password" label="Confirm New Password" />
          </Field>

          {error && (
            <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'Resetting…' : 'Reset Password'}
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

export default ResetPasswordPage;
