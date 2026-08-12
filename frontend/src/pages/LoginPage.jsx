import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const ROLE_OPTIONS = [
  {
    value: 'parent',
    label: 'Parent',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: 'school_admin',
    label: 'School Admin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.user.role !== selectedRole) {
        const msg = `This account is a "${result.user.role}" account. Please choose the correct login type.`;
        setError(msg);
        showToast(msg, 'error');
        setLoading(false);
        return;
      }

      showToast('Login successful', 'success');

      if (result.user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (result.user.role === 'school_admin') {
        navigate('/school-admin');
      } else if (result.user.role === 'parent') {
        navigate('/parent');
      }
    } else {
      const msg = result.message || 'Login failed. Please check your credentials.';
      setError(msg);
      showToast(msg, 'error');
      setLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-md">
      <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-6 sm:p-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">I am a</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-xs font-semibold transition-all duration-150 ${
                  selectedRole === role.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={selectedRole === role.value ? 'text-brand-600' : 'text-slate-400'}>{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Icon.mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              label="Password"
              id="password"
            />
          </div>

          {error && (
            <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
              <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm">
          {selectedRole === 'parent' ? (
            <>
              <span className="text-slate-500">New to Shulkaa Suvidha?</span>{' '}
              <Link to="/register-parent" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                Register as Parent
              </Link>
            </>
          ) : selectedRole === 'school_admin' ? (
            <>
              <span className="text-slate-500">Is your school ready?</span>{' '}
              <Link to="/register-school" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                Register your School
              </Link>
            </>
          ) : (
            <span className="text-slate-500">Super Admin accounts are provisioned by the platform team.</span>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
