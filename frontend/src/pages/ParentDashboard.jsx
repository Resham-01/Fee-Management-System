import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentCode, setStudentCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, childrenRes] = await Promise.all([
        apiClient.get('/invoices/parent'),
        apiClient.get('/parents/children'),
      ]);
      setInvoices(invoicesRes.data);
      setChildren(childrenRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    try {
      await apiClient.post('/parents/link-child', { studentCode });
      setLinkSuccess('Child linked successfully!');
      setStudentCode('');
      fetchData();
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link child');
    }
  };

  const handlePayment = async (invoiceId, gateway) => {
    try {
      const response = await apiClient.post('/payments/initiate', { invoiceId, gateway });
      // In real implementation, redirect to payment gateway
      window.open(response.data.redirectUrl, '_blank');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const totalPending = invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-white">Parent Dashboard</h1>
            <div className="flex gap-4 items-center">
              <NotificationPanel />
              <span className="text-sm text-white">{user?.name}</span>
              <a href="/change-password" className="text-white hover:text-gray-200 text-sm font-medium">
                Change Password
              </a>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Invoices</h3>
            <p className="text-3xl font-bold text-gray-800">{invoices.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">NPR {totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600">NPR {totalPaid.toLocaleString()}</p>
          </div>
        </div>

        {/* Linked Children */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">My Children ({children.length})</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : children.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No children linked yet. Use the form below to link your child.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {children.map((child) => (
                    <tr key={child._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {child.firstName} {child.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{child.studentCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{child.className}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{child.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Link Child */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Link Your Child</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleLinkChild} className="flex gap-4">
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Enter student code"
                required
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Link Child
              </button>
            </form>
            {linkError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {linkError}
              </div>
            )}
            {linkSuccess && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {linkSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Invoices & Payments</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.student?.firstName} {invoice.student?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.term}</td>
                      <td className="px-6 py-4 whitespace-nowrap">NPR {invoice.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.status === 'paid' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        ) : invoice.status === 'overdue' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePayment(invoice._id, 'esewa')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Pay eSewa
                            </button>
                            <button
                              onClick={() => handlePayment(invoice._id, 'khalti')}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                            >
                              Pay Khalti
                            </button>
                            <button
                              onClick={() => handlePayment(invoice._id, 'fonepay')}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Pay FonePay
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

