import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 animate-pulse-soft">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.6" />
            </svg>
          </div>
          <Spinner label="Loading your workspace…" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
