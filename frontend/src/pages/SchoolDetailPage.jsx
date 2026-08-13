import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';
import ReceiptButton from '../components/ReceiptButton';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import Input, { Field } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { TableSkeleton } from '../components/ui/Skeleton';

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spinner label="Loading school details…" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-10 text-center">
          <Icon.warning className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">School not found</p>
          <Button className="mt-4" onClick={() => navigate('/super-admin')}>
            Back to Schools
          </Button>
        </Card>
      </div>
    );
  }

  const { school, students, invoices, statistics } = data;

  const navItems = [
    { label: 'Back to Schools', icon: <Icon.arrowLeft />, path: '/super-admin' },
    { label: 'School Info', icon: <Icon.building />, onClick: () => scrollToId('info') },
    { label: 'Payment Accounts', icon: <Icon.wallet />, onClick: () => scrollToId('accounts') },
    { label: 'Students', icon: <Icon.users />, onClick: () => scrollToId('students') },
    { label: 'Invoices', icon: <Icon.receipt />, onClick: () => scrollToId('invoices') },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password' },
  ];

  return (
    <AppLayout
      navItems={navItems}
      title={school.name}
      subtitle={school.address}
    >
      <div className="space-y-8">
        <PageHeader
          title={school.name}
          description={school.address}
          icon={<Icon.building />}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/super-admin')} icon={<Icon.arrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="secondary" onClick={fetchSchoolDetails} icon={<Icon.refresh className="w-4 h-4" />}>
                Refresh
              </Button>
            </div>
          }
        />

        {/* School info */}
        <section id="info" className="scroll-mt-20">
          <Card>
            <div className="card-header flex items-center justify-between gap-4">
              <h2 className="text-base font-bold font-display text-slate-900">School Information</h2>
              <StatusBadge status={school.isApproved ? 'approved' : 'pending'} />
            </div>
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact Email</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Icon.mail className="w-4 h-4 text-slate-400" /> {school.contactEmail}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact Phone</p>
                <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <Icon.phone className="w-4 h-4 text-slate-400" /> {school.contactPhone}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Address</p>
                <p className="text-sm font-medium text-slate-800">{school.address}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</p>
                <StatusBadge status={school.isApproved ? 'approved' : 'pending'} />
              </div>
            </div>
          </Card>
        </section>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={statistics.totalStudents} tone="brand" icon={<Icon.users />} />
          <StatCard label="Total Fees" value={`NPR ${statistics.totalAmount.toLocaleString()}`} tone="brand" icon={<Icon.money />} />
          <StatCard label="Collected" value={`NPR ${statistics.paidAmount.toLocaleString()}`} tone="emerald" icon={<Icon.check />} />
          <StatCard label="Remaining" value={`NPR ${statistics.remainingAmount.toLocaleString()}`} tone="rose" icon={<Icon.clock />} />
        </div>

        {/* Notification actions */}
        {statistics.remainingAmount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div>
              <h3 className="text-sm font-bold font-display text-amber-900 flex items-center gap-2">
                <Icon.warning className="w-4 h-4 text-amber-600" />
                Pending Fee Notifications
              </h3>
              <p className="mt-1 text-xs text-amber-700">
                Pending: NPR {statistics.pendingAmount.toLocaleString()} · Overdue: NPR {statistics.overdueAmount.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button onClick={handleNotifyParents} loading={notifying} variant="secondary" icon={<Icon.bell className="w-4 h-4" />}>
                Notify All Parents
              </Button>
              <Button onClick={handleNotifySchool} loading={notifying} icon={<Icon.mail className="w-4 h-4" />}>
                Notify School Admin
              </Button>
            </div>
          </div>
        )}

        {/* Payment Accounts */}
        <section id="accounts" className="scroll-mt-20">
          <Card>
            <div className="card-header">
              <h2 className="text-base font-bold font-display text-slate-900">Payment Accounts</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Review and manage this school&apos;s payment accounts. Parents only see verified accounts.
              </p>
            </div>
            {paymentAccounts.length === 0 ? (
              <EmptyState
                icon={<Icon.wallet />}
                title="No payment accounts submitted"
                description="This school hasn't submitted any payment details yet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Type', 'Details', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                          {getPaymentTypeLabel(account.type)}
                        </td>
                        <td className="px-6 py-4">
                          {account.type === 'bank_transfer' ? (
                            <div className="text-sm text-slate-600">
                              <p>{account.bankName} — {account.accountName}</p>
                              <p className="text-slate-400">{account.accountNumber} {account.branch && `(${account.branch})`}</p>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">
                              <p>{account.merchantName || '—'}</p>
                              <p className="text-slate-400">ID: {account.merchantId || '—'}</p>
                            </div>
                          )}
                          {account.notes && <p className="text-xs text-slate-400 mt-1">{account.notes}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.isVerified && account.isActive ? (
                            <StatusBadge status="verified_active" />
                          ) : account.rejectionReason ? (
                            <StatusBadge status="rejected" />
                          ) : (
                            <StatusBadge status="pending approval" />
                          )}
                          {account.rejectionReason && (
                            <p className="text-xs text-rose-600 mt-1 max-w-[180px]">{account.rejectionReason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {!account.isVerified && (
                              <button
                                onClick={() => handleVerifyPaymentAccount(account._id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition"
                              >
                                Verify
                              </button>
                            )}
                            {!account.isVerified && (
                              <button
                                onClick={() => handleRejectPaymentAccount(account._id)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 shadow-sm transition"
                              >
                                Reject
                              </button>
                            )}
                            {account.isVerified && (
                              <button
                                onClick={() => handleTogglePaymentAccount(account._id, !account.isActive)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition ${
                                  account.isActive ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {account.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Students */}
        <section id="students" className="scroll-mt-20">
          <Card>
            <div className="card-header flex items-center justify-between gap-4">
              <h2 className="text-base font-bold font-display text-slate-900">Students</h2>
              <Badge tone="indigo">{students.length}</Badge>
            </div>
            {students.length === 0 ? (
              <EmptyState icon={<Icon.users />} title="No students" description="This school hasn't added any students yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Name', 'Code', 'Class', 'Section', 'Parent'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge tone="slate">{student.studentCode}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.className}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {student.parent ? `${student.parent.name} (${student.parent.email})` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Invoices */}
        <section id="invoices" className="scroll-mt-20">
          <Card>
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Invoices</h2>
                <p className="mt-0.5 text-sm text-slate-500">All invoices issued by this school.</p>
              </div>
              <Button
                onClick={() => {
                  setShowInvoiceForm(true);
                  setEditingInvoice(null);
                  setInvoiceForm(resetInvoiceForm());
                }}
                icon={<Icon.plus className="w-4 h-4" />}
              >
                Add Invoice
              </Button>
            </div>
            {invoices.length === 0 ? (
              <EmptyState icon={<Icon.receipt />} title="No invoices" description="Invoices created for this school will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Student', 'Term', 'Amount', 'Due Date', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                          {invoice.student?.firstName} {invoice.student?.lastName}{' '}
                          <span className="text-slate-400 text-xs">({invoice.student?.studentCode})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{invoice.term}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                          NPR {invoice.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2 items-center">
                            <ActionButtons
                              onEdit={() => handleEditInvoice(invoice)}
                              onDelete={() => handleDeleteInvoice(invoice._id)}
                            />
                            {invoice.status === 'paid' && <ReceiptButton invoiceId={invoice._id} showToast={showToast} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </div>

      <Modal
        isOpen={showInvoiceForm}
        onClose={() => setShowInvoiceForm(false)}
        title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
        description="Bill a student for a specific term or month."
        size="md"
      >
        <form onSubmit={handleInvoiceSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Student" htmlFor="inv-student" required>
            <Select id="inv-student" value={invoiceForm.student} onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} ({student.studentCode})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (NPR)" htmlFor="inv-amount" required>
            <Input id="inv-amount" type="number" step="0.01" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} required />
          </Field>
          <Field label="Term" htmlFor="inv-term" required>
            <Input id="inv-term" value={invoiceForm.term} onChange={(e) => setInvoiceForm({ ...invoiceForm, term: e.target.value })} required placeholder="e.g. June 2026" />
          </Field>
          <Field label="Due Date" htmlFor="inv-due" required>
            <Input id="inv-due" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} required />
          </Field>
          <Field label="Status" htmlFor="inv-status">
            <Select id="inv-status" value={invoiceForm.status} onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </Field>
          <Field label="Description" htmlFor="inv-desc" className="sm:col-span-2">
            <Input id="inv-desc" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Optional" />
          </Field>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowInvoiceForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingInvoice ? 'Update Invoice' : 'Create Invoice'}</Button>
          </div>
        </form>
      </Modal>

      {ConfirmDialogElement}
    </AppLayout>
  );
};

export default SchoolDetailPage;
