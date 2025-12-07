import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SchoolRegisterPage from './pages/SchoolRegisterPage';
import ParentRegisterPage from './pages/ParentRegisterPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import SchoolDetailPage from './pages/SchoolDetailPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen">
        {!user && (
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                  Fee Management System
                </Link>
                <div className="flex gap-4">
                  <Link to="/login" className="text-gray-700 hover:text-gray-900">
                    Login
                  </Link>
                  <Link to="/register-school" className="text-gray-700 hover:text-gray-900">
                    Register School
                  </Link>
                  <Link to="/register-parent" className="text-gray-700 hover:text-gray-900">
                    Register Parent
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

