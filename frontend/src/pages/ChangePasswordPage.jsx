import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/PasswordInput';

const ChangePasswordPage = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/change-password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Change Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <PasswordInput
              value={formData.oldPassword}
              onChange={(e) => handleChange('oldPassword', e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <PasswordInput
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;

