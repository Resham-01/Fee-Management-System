import { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AppLayout from '../components/layout/AppLayout';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { Field } from '../components/ui/Input';

const ROLE_HOME = {
  super_admin: '/super-admin',
  school_admin: '/school-admin',
  parent: '/parent',
};

const ChangePasswordPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <Icon.dashboard />, path: ROLE_HOME[user?.role] || '/parent' },
    { label: 'My Profile', icon: <Icon.user />, path: '/profile' },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password', end: true },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword,
      });
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to change password');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout navItems={navItems} title="Change Password" subtitle="Keep your account secure">
      <div className="max-w-2xl space-y-8">
        <PageHeader
          title="Change Password"
          description="Update your account password. Choose a strong, unique password you don't use elsewhere."
          icon={<Icon.lock />}
        />

        <Card>
          <div className="card-header">
            <h2 className="text-base font-bold font-display text-slate-900">Update password</h2>
            <p className="mt-0.5 text-sm text-slate-500">Your new password must be at least 6 characters long.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            <Field label="Current Password" htmlFor="cp-current" required>
              <PasswordInput
                id="cp-current"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password" htmlFor="cp-new" required>
                <PasswordInput
                  id="cp-new"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm New Password" htmlFor="cp-confirm" required>
                <PasswordInput
                  id="cp-confirm"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </Field>
            </div>

            {error && (
              <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
                <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button type="submit" loading={loading} icon={<Icon.check className="w-4 h-4" />}>
                {loading ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChangePasswordPage;
