import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';
import ReceiptButton from '../components/ReceiptButton';

const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    student: '',
    amount: '',
    dueDate: '',
    term: '',
    description: '',
    status: 'pending',
  });
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  useEffect(() => {
    fetchSchoolDetails();
  }, [id]);

  const fetchSchoolDetails = async () => {
    try {
      const [detailsRes, paymentAccountsRes] = await Promise.all([
        apiClient.get(`/schools/${id}/details`),
        apiClient.get(`/payment-accounts/school/${id}`),
      ]);
      setData(detailsRes.data);
      setPaymentAccounts(paymentAccountsRes.data);
    } catch (err) {
      console.error('Failed to fetch school details');
      showToast('Failed to load school details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPaymentAccount = async (accountId) => {
    try {
      await apiClient.patch(`/payment-accounts/${accountId}/verify`);
      showToast('Payment account verified and activated for parents', 'success');
      fetchSchoolDetails();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to verify payment account'), 'error');
    }
  };

  const handleRejectPaymentAccount = async (accountId) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    try {
      await apiClient.patch(`/payment-accounts/${accountId}/reject`, { rejectionReason: reason });
      showToast('Payment account rejected', 'success');
      fetchSchoolDetails();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to reject payment account'), 'error');
    }
  };

  const handleTogglePaymentAccount = async (accountId, isActive) => {
    try {
      await apiClient.patch(`/payment-accounts/${accountId}/toggle-active`, { isActive });
      showToast(isActive ? 'Payment account activated' : 'Payment account deactivated', 'success');
      fetchSchoolDetails();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update payment account'), 'error');
    }
  };

  const resetInvoiceForm = () => ({
    student: '',
    amount: '',
    dueDate: '',
    term: '',
    description: '',
    status: 'pending',
  });

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...invoiceForm,
        amount: parseFloat(invoiceForm.amount),
        dueDate: new Date(invoiceForm.dueDate),
      };
      const isEditingInvoice = !!editingInvoice;
      if (editingInvoice) {
        await apiClient.put(`/invoices/${editingInvoice._id}`, payload);
      } else {
        await apiClient.post('/invoices', payload);
      }
      setShowInvoiceForm(false);
      setEditingInvoice(null);
      setInvoiceForm(resetInvoiceForm());
      showToast(isEditingInvoice ? 'Invoice updated successfully' : 'Invoice created successfully', 'success');
      fetchSchoolDetails();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save invoice'), 'error');
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      student: invoice.student?._id || '',
      amount: invoice.amount,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      term: invoice.term,
      description: invoice.description || '',
      status: invoice.status,
    });
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const ok = await confirm({
      title: 'Delete invoice?',
      message: 'This invoice will be permanently removed.',
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/invoices/${invoiceId}`);
      showToast('Invoice deleted successfully', 'success');
      fetchSchoolDetails();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete invoice'), 'error');
    }
  };

  const handleNotifyParents = async () => {
    const ok = await confirm({
      title: 'Notify all parents?',
      message: 'Send notification to all parents about pending fees for this school.',
      confirmLabel: 'Send',
      variant: 'info',
    });
    if (!ok) return;
    setNotifying(true);
    try {
      const response = await apiClient.post(`/schools/${id}/notify-parents`);
      showToast(`Notifications sent to ${response.data.notifications.length} parents`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to send notifications'), 'error');
    } finally {
      setNotifying(false);
    }
  };

  const handleNotifySchool = async () => {
    const ok = await confirm({
      title: 'Notify school admin?',
      message: 'Send notification to the school admin about pending fees.',
      confirmLabel: 'Send',
      variant: 'info',
    });
    if (!ok) return;
    setNotifying(true);
    try {
      const response = await apiClient.post(`/schools/${id}/notify-school`);
      showToast(`Notification sent to ${response.data.schoolAdmin.name}`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to send notification'), 'error');
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">School not found</div>
      </div>
    );
  }

  const { school, students, invoices, statistics } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/super-admin')}
                className="text-blue-600 hover:underline"
              >
                ← Back to Schools
              </button>
              <h1 className="text-xl font-bold text-gray-800">{school.name}</h1>
            </div>
            <div className="flex gap-4 items-center">
              <NotificationPanel />
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* School Info */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">School Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{school.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{school.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Email</p>
              <p className="font-medium">{school.contactEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Phone</p>
              <p className="font-medium">{school.contactPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              {school.isApproved ? (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Approved
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Students</h3>
            <p className="text-3xl font-bold text-gray-800">{statistics.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Fees</h3>
            <p className="text-3xl font-bold text-blue-600">NPR {statistics.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Paid</h3>
            <p className="text-3xl font-bold text-green-600">NPR {statistics.paidAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Remaining</h3>
            <p className="text-3xl font-bold text-red-600">NPR {statistics.remainingAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Notification Actions */}
        {statistics.remainingAmount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-yellow-800 mb-4">Pending Fee Notifications</h3>
            <div className="flex gap-4">
              <button
                onClick={handleNotifyParents}
                disabled={notifying}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {notifying ? 'Sending...' : 'Notify All Parents'}
              </button>
              <button
                onClick={handleNotifySchool}
                disabled={notifying}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {notifying ? 'Sending...' : 'Notify School Admin'}
              </button>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Pending Amount: NPR {statistics.pendingAmount.toLocaleString()} | Overdue: NPR{' '}
              {statistics.overdueAmount.toLocaleString()}
            </p>
          </div>
        )}

        {/* Payment Accounts Management */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Payment Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage this school&apos;s individual payment accounts. Parents only see verified accounts.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No payment accounts submitted by this school yet.
                    </td>
                  </tr>
                ) : (
                  paymentAccounts.map((account) => (
                    <tr key={account._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {getPaymentTypeLabel(account.type)}
                      </td>
                      <td className="px-6 py-4">
                        {account.type === 'bank_transfer' ? (
                          <div className="text-sm text-gray-700">
                            <p>{account.bankName} — {account.accountName}</p>
                            <p className="text-gray-500">{account.accountNumber} {account.branch && `(${account.branch})`}</p>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700">
                            <p>{account.merchantName || '—'}</p>
                            <p className="text-gray-500">ID: {account.merchantId || '—'}</p>
                          </div>
                        )}
                        {account.notes && <p className="text-xs text-gray-500 mt-1">{account.notes}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {account.isVerified && account.isActive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Verified & Active
                          </span>
                        ) : account.rejectionReason ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        )}
                        {account.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">{account.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {!account.isVerified && (
                            <button
                              onClick={() => handleVerifyPaymentAccount(account._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Verify
                            </button>
                          )}
                          {!account.isVerified && (
                            <button
                              onClick={() => handleRejectPaymentAccount(account._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          )}
                          {account.isVerified && (
                            <button
                              onClick={() => handleTogglePaymentAccount(account._id, !account.isActive)}
                              className={`px-3 py-1 rounded text-sm text-white ${
                                account.isActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {account.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Students ({students.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.studentCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.parent ? `${student.parent.name} (${student.parent.email})` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Invoices ({invoices.length})</h2>
            <button
              onClick={() => {
                setShowInvoiceForm(true);
                setEditingInvoice(null);
                setInvoiceForm(resetInvoiceForm());
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md"
            >
              Add Invoice
            </button>
          </div>

          {showInvoiceForm && (
            <div className="p-6 border-b bg-gradient-to-br from-slate-50 to-blue-50">
              <form onSubmit={handleInvoiceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={invoiceForm.student}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} ({student.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <input
                    type="text"
                    value={invoiceForm.term}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, term: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    {editingInvoice ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.student?.firstName} {invoice.student?.lastName} ({invoice.student?.studentCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.term}</td>
                    <td className="px-6 py-4 whitespace-nowrap">NPR {invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
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
                      <div className="flex flex-wrap gap-2 items-center">
                        <ActionButtons
                          onEdit={() => handleEditInvoice(invoice)}
                          onDelete={() => handleDeleteInvoice(invoice._id)}
                        />
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
        </div>
      </div>
      {ConfirmDialogElement}
    </div>
  );
};

export default SchoolDetailPage;

