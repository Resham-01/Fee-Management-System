import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/PasswordInput';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AuthLayout from '../components/layout/AuthLayout';
import Input, { Field } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const SchoolRegisterPage = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register-school', formData);
      setSuccess('School registered successfully! Waiting for Super Admin approval.');
      showToast('School registered! Waiting for admin approval.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-2xl">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-6 sm:p-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Register Your School</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create your school account. A Super Admin must approve it before you can sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                <Icon.building className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wide">School Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="School / College Name" htmlFor="schoolName" required>
                <Input id="schoolName" name="schoolName" value={formData.schoolName} onChange={handleChange} required placeholder="e.g. Kantipur Model College" />
              </Field>
              <Field label="Address" htmlFor="address" required>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} required placeholder="City, District" />
              </Field>
              <Field label="Contact Email" htmlFor="contactEmail" required>
                <div className="relative">
                  <Icon.mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input id="contactEmail" type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required className="pl-10" placeholder="office@school.edu.np" />
                </div>
              </Field>
              <Field label="Contact Phone" htmlFor="contactPhone" required>
                <div className="relative">
                  <Icon.phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input id="contactPhone" type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} required className="pl-10" placeholder="98XXXXXXXX" />
                </div>
              </Field>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                <Icon.user className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wide">Admin Account</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Admin Name" htmlFor="adminName" required>
                <Input id="adminName" name="adminName" value={formData.adminName} onChange={handleChange} required placeholder="Full name" />
              </Field>
              <Field label="Admin Email" htmlFor="adminEmail" required>
                <Input id="adminEmail" type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required placeholder="admin@school.edu.np" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Admin Password" htmlFor="adminPassword" required hint="Must be at least 6 characters.">
                  <PasswordInput id="adminPassword" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} placeholder="Create a strong password" label="Admin Password" />
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="px-3.5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2">
              <Icon.check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'Registering…' : 'Register School'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Already have an account?</span>{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SchoolRegisterPage;
