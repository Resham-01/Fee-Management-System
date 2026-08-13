import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../NotificationPanel';
import Icon from '../ui/icons';

const roleLabels = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  parent: 'Parent',
};

const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-2.5">
    <img
      src="/logo.png"
      alt="Shulkaa Suvidha"
      className="flex-shrink-0 w-9 h-9 object-contain"
    />
    {!compact && (
      <div className="leading-tight">
        <p className="text-sm font-bold font-display text-white">Shulkaa Suvidha</p>
        <p className="text-[10px] uppercase tracking-widest text-brand-200">Fee Management</p>
      </div>
    )}
  </div>
);

const NavItem = ({ item, onNavigate }) => {
  const classes = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
        : 'text-brand-100 hover:bg-white/5 hover:text-white'
    }`;

  const content = (
    <>
      <span className="flex-shrink-0">{item.icon}</span>
      {item.label}
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold text-center">
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          item.onClick();
        }}
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100 hover:bg-white/5 hover:text-white transition-all w-full text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink to={item.path} end={item.end} onClick={onNavigate} className={classes}>
      {content}
    </NavLink>
  );
};

const SidebarContent = ({ navItems, onNavigate, user, onLogout }) => (
  <div className="flex flex-col h-full">
    <div className="px-5 pt-5 pb-4">
      <Logo />
    </div>

    <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
      <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-300/70">Menu</p>
      {navItems.map((item) => (
        <NavItem key={item.path} item={item} onNavigate={onNavigate} />
      ))}
    </nav>

    <div className="p-3 border-t border-white/10">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold flex items-center justify-center shadow-inner ring-2 ring-white/20">
          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-[11px] text-brand-200 truncate">{roleLabels[user?.role] || user?.role}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className="flex-shrink-0 w-8 h-8 rounded-lg text-brand-200 hover:bg-white/10 hover:text-white transition flex items-center justify-center"
        >
          <Icon.logout />
        </button>
      </div>
    </div>
  </div>
);

const AppLayout = ({ navItems, title, subtitle, actions, children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 z-40 flex-col">
        <SidebarContent navItems={navItems} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 animate-slide-in-right shadow-lift">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-lg text-brand-200 hover:bg-white/10 hover:text-white transition flex items-center justify-center"
              >
                <Icon.close />
              </button>
            </div>
            <SidebarContent navItems={navItems} onNavigate={() => setSidebarOpen(false)} user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden flex-shrink-0 w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition flex items-center justify-center"
            >
              <Icon.menu />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold font-display text-slate-900 truncate">{title}</h1>
              {subtitle && <p className="hidden sm:block text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <NotificationPanel />
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{roleLabels[user?.role] || user?.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex-shrink-0 w-9 h-9 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center"
              >
                <Icon.logout />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          {actions && <div className="mb-6">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
