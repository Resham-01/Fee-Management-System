import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './ui/icons';

const POLL_INTERVAL = 30000;

const NotificationPanel = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const viewedRef = useRef(new Set());
  const previousRef = useRef(new Set());
  const hasLoadedRef = useRef(false);

  const storageKey = user ? `shulkaa-notif-seen-${user.id}` : 'shulkaa-notif-seen';

  const signatureOf = (n) => `${n.id}:${n.count ?? 1}`;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      viewedRef.current = new Set(Array.isArray(stored) ? stored : []);
    } catch {
      viewedRef.current = new Set();
    }
  }, [storageKey]);

  const persistViewed = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...viewedRef.current]));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const isFirstLoad = !hasLoadedRef.current;
      if (isFirstLoad) setLoading(true);
      try {
        let list = [];
        if (user.role === 'super_admin') {
          const schoolsRes = await apiClient.get('/schools');
          const pendingCount = schoolsRes.data.filter((s) => !s.isApproved).length;
          if (pendingCount > 0) {
            list.push({ id: 'school-approval', count: pendingCount, type: 'info', message: `${pendingCount} school(s) waiting for approval` });
          }
        } else if (user.role === 'school_admin') {
          const invoicesRes = await apiClient.get('/invoices/school');
          const pendingCount = invoicesRes.data.filter((inv) => inv.status === 'pending').length;
          const overdueCount = invoicesRes.data.filter((inv) => inv.status === 'overdue').length;
          if (pendingCount > 0) list.push({ id: 'pending-invoices', count: pendingCount, type: 'warning', message: `${pendingCount} invoice(s) pending payment` });
          if (overdueCount > 0) list.push({ id: 'overdue-invoices', count: overdueCount, type: 'error', message: `${overdueCount} invoice(s) overdue` });
        } else if (user.role === 'parent') {
          const invoicesRes = await apiClient.get('/invoices/parent');
          const pendingCount = invoicesRes.data.filter((inv) => inv.status === 'pending').length;
          const overdueCount = invoicesRes.data.filter((inv) => inv.status === 'overdue').length;
          if (pendingCount > 0) list.push({ id: 'parent-pending', count: pendingCount, type: 'warning', message: `You have ${pendingCount} pending invoice(s)` });
          if (overdueCount > 0) list.push({ id: 'parent-overdue', count: overdueCount, type: 'error', message: `You have ${overdueCount} overdue invoice(s)` });
        }

        setNotifications(list);

        // Only unviewed notifications count toward the red badge
        const unseen = list.filter((n) => !viewedRef.current.has(signatureOf(n)));
        setBadgeCount(unseen.length);

        // Toast once for freshly appeared notifications (after the very first load)
        const fresh = list.filter((n) => !previousRef.current.has(signatureOf(n)));
        if (hasLoadedRef.current && fresh.length > 0) {
          showToast('You have new notifications', 'info');
        }
        previousRef.current = new Set(list.map(signatureOf));
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const opening = !isOpen;
    if (opening) {
      // Mark everything currently shown as seen -> badge clears automatically
      notifications.forEach((n) => viewedRef.current.add(signatureOf(n)));
      persistViewed();
      setBadgeCount(0);
    }
    setIsOpen(opening);
  };

  const iconConfig = {
    error: 'bg-rose-100 text-rose-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-sky-100 text-sky-600',
  };

  const iconSvg = {
    error: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifications${badgeCount > 0 ? ` (${badgeCount} unread)` : ''}`}
        className="relative w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition flex items-center justify-center"
      >
        <Icon.bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-lift border border-slate-200 z-50 overflow-hidden animate-scale-in">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-slate-900">Notifications</h3>
            {badgeCount > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                {badgeCount} new
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Icon.bell className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const seen = viewedRef.current.has(signatureOf(notification));
                return (
                  <div key={notification.id} className="px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/70 transition">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center ${iconConfig[notification.type]}`}>
                        {iconSvg[notification.type]}
                      </div>
                      <p className={`text-sm flex-1 ${seen ? 'text-slate-500' : 'text-slate-700'}`}>{notification.message}</p>
                      <span
                        title={seen ? 'Seen' : 'New'}
                        className={`flex-shrink-0 mt-1.5 w-4 h-4 rounded-full flex items-center justify-center ${
                          seen ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {seen ? (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;