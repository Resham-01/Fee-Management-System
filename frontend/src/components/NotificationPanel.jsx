import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const NotificationPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch notifications based on user role
      if (user.role === 'super_admin') {
        // Get pending schools count
        const schoolsRes = await apiClient.get('/schools');
        const pendingCount = schoolsRes.data.filter((s) => !s.isApproved).length;
        setNotifications([
          {
            id: 1,
            type: 'info',
            message: `${pendingCount} school(s) waiting for approval`,
            timestamp: new Date(),
          },
        ]);
      } else if (user.role === 'school_admin') {
        // Get pending invoices count
        const invoicesRes = await apiClient.get('/invoices/school');
        const pendingCount = invoicesRes.data.filter((inv) => inv.status === 'pending').length;
        const overdueCount = invoicesRes.data.filter((inv) => inv.status === 'overdue').length;
        const notificationsList = [];
        if (pendingCount > 0) {
          notificationsList.push({
            id: 1,
            type: 'warning',
            message: `${pendingCount} invoice(s) pending payment`,
            timestamp: new Date(),
          });
        }
        if (overdueCount > 0) {
          notificationsList.push({
            id: 2,
            type: 'error',
            message: `${overdueCount} invoice(s) overdue`,
            timestamp: new Date(),
          });
        }
        setNotifications(notificationsList);
      } else if (user.role === 'parent') {
        // Get pending invoices for parent
        const invoicesRes = await apiClient.get('/invoices/parent');
        const pendingCount = invoicesRes.data.filter((inv) => inv.status === 'pending').length;
        const overdueCount = invoicesRes.data.filter((inv) => inv.status === 'overdue').length;
        const notificationsList = [];
        if (pendingCount > 0) {
          notificationsList.push({
            id: 1,
            type: 'warning',
            message: `You have ${pendingCount} pending invoice(s)`,
            timestamp: new Date(),
          });
        }
        if (overdueCount > 0) {
          notificationsList.push({
            id: 2,
            type: 'error',
            message: `You have ${overdueCount} overdue invoice(s)`,
            timestamp: new Date(),
          });
        }
        setNotifications(notificationsList);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded-lg transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;

