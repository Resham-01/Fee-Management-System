import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/PasswordInput';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AuthLayout from '../components/layout/AuthLayout';
import Input, { Field } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const ParentRegisterPage = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    schoolId: '',
  });
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiClient.get('/schools/approved');
        setSchools(response.data);
      } catch (err) {
        console.error('Failed to fetch schools', err);
        setError('Failed to load schools. Please refresh the page.');
      }
    };
    fetchSchools();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register-parent', formData);
      setSuccess('Parent account created! A verification link has been sent to your email. Verify it to activate your account.');
      showToast('Check your email to verify your account', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-6 sm:p-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Create a Parent Account</h2>
          <p className="mt-1 text-sm text-slate-500">Link your children and manage their fees in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Full Name" htmlFor="name" required>
            <div className="relative">
              <Icon.user className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="pl-10" placeholder="Enter your full name" />
            </div>
          </Field>

          <Field label="Email Address" htmlFor="email" required>
            <div className="relative">
              <Icon.mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className="pl-10" placeholder="you@example.com" />
            </div>
          </Field>

          <Field label="Password" htmlFor="password" required hint="Must be at least 6 characters.">
            <PasswordInput id="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create a strong password" label="Password" />
          </Field>

          <Field label="Select School" htmlFor="schoolId" required>
            <Select id="schoolId" name="schoolId" value={formData.schoolId} onChange={handleChange} required>
              <option value="">Choose a school</option>
              {schools.length === 0 ? (
                <option value="" disabled>No approved schools available</option>
              ) : (
                schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name} - {school.address}
                  </option>
                ))
              )}
            </Select>
            {schools.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                <Icon.warning className="w-3.5 h-3.5" />
                Please wait for schools to be approved by the admin.
              </p>
            )}
          </Field>

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

          <Button type="submit" size="lg" loading={loading} disabled={loading || schools.length === 0} className="w-full">
            {loading ? 'Creating account…' : 'Create Account'}
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

export default ParentRegisterPage;
