import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { useToast } from '../context/ToastContext';
=======
import { toast } from 'react-hot-toast';
>>>>>>> 1ec8abd91af216d15260297b7e7bad239ad89a81
import PasswordInput from '../components/PasswordInput';

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
      // Check if user role matches selected role
      if (result.user.role !== selectedRole) {
<<<<<<< HEAD
        const msg = `This account is a "${result.user.role}" account. Please choose the correct login type.`;
        setError(msg);
        showToast(msg, 'error');
=======
        const errorMsg = `This account is a "${result.user.role}" account. Please choose the correct login type.`;
        setError(errorMsg);
        toast.error(errorMsg);
>>>>>>> 1ec8abd91af216d15260297b7e7bad239ad89a81
        setLoading(false);
        return;
      }

<<<<<<< HEAD
      showToast('Login successful', 'success');

=======
      toast.success('Successfully logged in!');
>>>>>>> 1ec8abd91af216d15260297b7e7bad239ad89a81
      // Redirect based on role
      if (result.user.role === 'super_admin') {
        navigate('/super-admin');
      } else if (result.user.role === 'school_admin') {
        navigate('/school-admin');
      } else if (result.user.role === 'parent') {
        navigate('/parent');
      }
    } else {
<<<<<<< HEAD
      setError(result.message);
      showToast(result.message, 'error');
=======
      const errorMsg = result.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast.error(errorMsg);
>>>>>>> 1ec8abd91af216d15260297b7e7bad239ad89a81
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20 backdrop-blur-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Shulkaa Suvidha
          </h1>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Digital Fee Management System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            with Online Payment Integration
          </p>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8">Login to your account</p>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('parent')}
            className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${selectedRole === 'parent'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }`}
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('school_admin')}
            className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${selectedRole === 'school_admin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }`}
          >
            School Admin
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('super_admin')}
            className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${selectedRole === 'super_admin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }`}
          >
            Super Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
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

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          {selectedRole === 'parent' && (
            <a href="/register-parent" className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors">
              Register as Parent
            </a>
          )}
          {selectedRole === 'school_admin' && (
            <a href="/register-school" className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors">
              Register School
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

