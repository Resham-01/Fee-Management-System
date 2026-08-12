import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileGuard from './components/ProfileGuard';
import LoginPage from './pages/LoginPage';
import SchoolRegisterPage from './pages/SchoolRegisterPage';
import ParentRegisterPage from './pages/ParentRegisterPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import SchoolDetailPage from './pages/SchoolDetailPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentResultPage from './pages/PaymentResultPage';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen">
        {!user && (
          <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link to="/" className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/30">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
                      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.6" />
                    </svg>
                  </span>
                  <span className="text-lg font-bold font-display text-slate-900">Shulkaa Suvidha</span>
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register-school"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 transition"
                  >
                    Register School
                  </Link>
                  <Link
                    to="/register-parent"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-sm shadow-brand-600/30 transition"
                  >
                    Register Parent
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/register-school" element={<SchoolRegisterPage />} />
          <Route path="/register-parent" element={<ParentRegisterPage />} />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/school/:id"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SchoolDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/school-admin"
            element={
              <ProtectedRoute allowedRoles={['school_admin']}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProfileGuard>
                <ProfilePage />
              </ProfileGuard>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProfileGuard>
                <ChangePasswordPage />
              </ProfileGuard>
            }
          />
          <Route path="/payments/result" element={<PaymentResultPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;


