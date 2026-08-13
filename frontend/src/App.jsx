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
import NotFoundPage from './pages/NotFoundPage';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen">
        {!user && (
          <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 sm:py-0 sm:h-16">
                <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                  <img
                    src="/logo.png"
                    alt="Shulkaa Suvidha"
                    className="w-9 h-9 object-contain"
                  />
                  <span className="text-base sm:text-lg font-bold font-display text-slate-900">Shulkaa Suvidha</span>
                </Link>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register-school"
                    className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 transition"
                  >
                    Register <span className="hidden min-[400px]:inline">School</span>
                  </Link>
                  <Link
                    to="/register-parent"
                    className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-sm shadow-brand-600/30 transition"
                  >
                    Register <span className="hidden min-[400px]:inline">Parent</span>
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
          <Route path="*" element={<NotFoundPage />} />
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


