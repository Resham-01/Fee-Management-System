import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/icons';

const ROLE_HOME = {
  super_admin: '/super-admin',
  school_admin: '/school-admin',
  parent: '/parent',
};

const NotFoundPage = () => {
  const { user } = useAuth();
  const homePath = user ? ROLE_HOME[user.role] || '/profile' : '/login';
  const homeLabel = user ? 'Go to Dashboard' : 'Go to Login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative w-full max-w-md text-center animate-fade-in-up">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
          <img src="/logo.png" alt="Shulkaa Suvidha" className="w-10 h-10 object-contain" />
          <span className="text-lg font-bold font-display text-slate-900">Shulkaa Suvidha</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-lift border border-slate-100 p-8 sm:p-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
            <Icon.warning className="w-7 h-7" />
          </div>

          <p className="text-6xl font-extrabold font-display tracking-tight bg-gradient-to-br from-brand-600 to-violet-600 bg-clip-text text-transparent">
            404
          </p>

          <h2 className="mt-2 text-2xl font-bold font-display text-slate-900 tracking-tight">
            Page not found
          </h2>

          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved. Check the URL or go back to the home page.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={homePath}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-sm shadow-brand-600/30 transition"
            >
              <Icon.dashboard className="w-4 h-4" />
              {homeLabel}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Icon.home className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} Shulkaa Suvidha. All rights reserved.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
