import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

const LoginPage = () => {
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
      // Check if user role matches selected role
      if (result.user.role !== selectedRole) {
        setError(`This account is a "${result.user.role}" account. Please choose the correct login type.`);
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (result.user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (result.user.role === 'school_admin') {
        navigate('/school-admin');
      } else if (result.user.role === 'parent') {
        navigate('/parent');
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-8">Login to your account</p>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('parent')}
            className={`py-2 px-4 rounded-lg font-medium transition ${
              selectedRole === 'parent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('school_admin')}
            className={`py-2 px-4 rounded-lg font-medium transition ${
              selectedRole === 'school_admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            School Admin
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('super_admin')}
            className={`py-2 px-4 rounded-lg font-medium transition ${
              selectedRole === 'super_admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Super Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          {selectedRole === 'parent' && (
            <a href="/register-parent" className="text-blue-600 hover:underline">
              Register as Parent
            </a>
          )}
          {selectedRole === 'school_admin' && (
            <a href="/register-school" className="text-blue-600 hover:underline">
              Register School
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

