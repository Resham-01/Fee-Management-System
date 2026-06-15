import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import { getPaymentTypeLabel, GATEWAY_TYPES } from '../constants/paymentAccounts';
import WalletPaymentModal from '../components/WalletPaymentModal';
import ReceiptButton from '../components/ReceiptButton';

const ParentDashboard = () => {
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [children, setChildren] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentCode, setStudentCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [payingInvoice, setPayingInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, childrenRes, paymentAccountsRes] = await Promise.all([
        apiClient.get('/invoices/parent'),
        apiClient.get('/parents/children'),
        apiClient.get('/payment-accounts/parent'),
      ]);
      setInvoices(invoicesRes.data);
      setChildren(childrenRes.data);
      setPaymentAccounts(paymentAccountsRes.data);
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
      showToast('Child linked successfully', 'success');
      setStudentCode('');
      fetchData();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to link child');
      setLinkError(msg);
      showToast(msg, 'error');
    }
  };

  const handleRemoveChild = async (studentId) => {
    const ok = await confirm({
      title: 'Remove linked child?',
      message: 'This child will be unlinked from your account. You can link again later using the student code.',
      confirmLabel: 'Yes, remove',
    });
    if (!ok) return;
    setLinkError('');
    setLinkSuccess('');
    try {
      await apiClient.post('/parents/unlink-child', { studentId });
      setLinkSuccess('Child removed successfully');
      showToast('Child removed successfully', 'success');
      fetchData();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to remove child');
      setLinkError(msg);
      showToast(msg, 'error');
    }
  };

  const availableGateways = paymentAccounts
    .filter((a) => GATEWAY_TYPES.includes(a.type))
    .map((a) => a.type);

  const bankAccounts = paymentAccounts.filter((a) => a.type === 'bank_transfer');

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

        {/* School Payment Accounts */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">School Payment Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pay fees only to your child&apos;s school accounts below. Each school has its own separate payment details.
            </p>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : paymentAccounts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No payment accounts are available yet. The school admin must submit details and Super Admin must verify them.
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentAccounts.map((account) => (
                <div key={account._id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-2">{getPaymentTypeLabel(account.type)}</h3>
                  {account.type === 'bank_transfer' ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="text-gray-500">Bank:</span> {account.bankName}</p>
                      <p><span className="text-gray-500">Account Name:</span> {account.accountName}</p>
                      <p><span className="text-gray-500">Account No:</span> {account.accountNumber}</p>
                      {account.branch && <p><span className="text-gray-500">Branch:</span> {account.branch}</p>}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="text-gray-500">Merchant:</span> {account.merchantName || '—'}</p>
                      <p><span className="text-gray-500">ID:</span> {account.merchantId || '—'}</p>
                    </div>
                  )}
                  {account.notes && <p className="text-xs text-gray-500 mt-2">{account.notes}</p>}
                </div>
              ))}
            </div>
          )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActionButtons
                          showEdit={false}
                          onDelete={() => handleRemoveChild(child._id)}
                          deleteLabel="Remove"
                        />
                      </td>
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
                        <div className="flex flex-wrap gap-2">
                          {(invoice.status === 'pending' || invoice.status === 'overdue') &&
                            (availableGateways.length > 0 ? (
                              <button
                                onClick={() => setPayingInvoice(invoice)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                              >
                                Pay with Wallet
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {bankAccounts.length > 0
                                  ? 'Use bank transfer details above'
                                  : 'No payment methods available'}
                              </span>
                            ))}
                          {invoice.status === 'paid' && (
                            <ReceiptButton invoiceId={invoice._id} showToast={showToast} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {ConfirmDialogElement}
      {payingInvoice && (
        <WalletPaymentModal
          invoice={payingInvoice}
          availableGateways={availableGateways}
          onClose={() => setPayingInvoice(null)}
          onSuccess={fetchData}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
