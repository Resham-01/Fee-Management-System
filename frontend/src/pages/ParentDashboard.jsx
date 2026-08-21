import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import { getPaymentTypeLabel, GATEWAY_TYPES } from '../constants/paymentAccounts';
import PaymentModal from '../components/PaymentModal';
import ReceiptButton from '../components/ReceiptButton';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const ParentDashboard = () => {
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
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

  const attemptStyles = {
    initiated: { text: 'Payment started', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    failed: { text: 'Last attempt failed', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
    cancelled: { text: 'Last attempt cancelled', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  };

  const renderAttempt = (invoice) => {
    const attempt = invoice.lastPaymentAttempt;
    const cfg = attempt && attemptStyles[attempt.status];
    if (!cfg) return null;
    return (
      <span className={`mt-1.5 inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ring-inset ${cfg.cls}`}>
        {cfg.text}
      </span>
    );
  };

  const navItems = [
    { label: 'Overview', icon: <Icon.dashboard />, onClick: () => scrollToId('top') },
    { label: 'My Children', icon: <Icon.users />, onClick: () => scrollToId('children') },
    { label: 'Invoices', icon: <Icon.receipt />, onClick: () => scrollToId('invoices') },
    { label: 'My Profile', icon: <Icon.user />, path: '/profile' },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password' },
  ];

  return (
    <AppLayout
      navItems={navItems}
      title="Parent Dashboard"
      subtitle="Manage your children's school fees"
    >
      <div id="top" className="scroll-mt-20 space-y-8">
        <PageHeader
          title="Overview"
          description="Track your children's fees and pay online."
          icon={<Icon.user />}
          actions={
            <Button variant="secondary" onClick={fetchData} icon={<Icon.refresh className="w-4 h-4" />}>
              Refresh
            </Button>
          }
        />

        {/* Stats */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Invoices"
              value={invoices.length}
              tone="brand"
              icon={<Icon.receipt />}
            />
            <StatCard
              label="Amount Pending"
              value={`NPR ${totalPending.toLocaleString()}`}
              tone="amber"
              icon={<Icon.clock />}
            />
            <StatCard
              label="Amount Paid"
              value={`NPR ${totalPaid.toLocaleString()}`}
              tone="emerald"
              icon={<Icon.money />}
            />
          </div>
        )}

        {/* School Payment Accounts */}
        {/* <section id="accounts" className="scroll-mt-20">
          <Card>
            <div className="card-header">
              <h2 className="text-base font-bold font-display text-slate-900">School Payment Accounts</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Pay fees only to your child&apos;s school accounts below. Each school has its own payment details.
              </p>
            </div>
            {loading ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="skeleton h-32 rounded-2xl" />
                ))}
              </div>
            ) : paymentAccounts.length === 0 ? (
              <EmptyState
                icon={<Icon.wallet />}
                title="No payment accounts available"
                description="The school admin must submit details and the Super Admin must verify them before you can pay online."
              />
            ) : (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentAccounts.map((account) => (
                  <div key={account._id} className="border border-slate-200 rounded-2xl p-4 bg-gradient-to-b from-white to-slate-50/70">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                          <Icon.card className="w-4 h-4" />
                        </span>
                        {getPaymentTypeLabel(account.type)}
                      </h3>
                    </div>
                    {account.type === 'bank_transfer' ? (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><span className="text-slate-400">Bank:</span> {account.bankName}</p>
                        <p><span className="text-slate-400">Account:</span> {account.accountName}</p>
                        <p><span className="text-slate-400">Number:</span> {account.accountNumber}</p>
                        {account.branch && <p><span className="text-slate-400">Branch:</span> {account.branch}</p>}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><span className="text-slate-400">Merchant:</span> {account.merchantName || '—'}</p>
                        <p><span className="text-slate-400">ID:</span> {account.merchantId || '—'}</p>
                      </div>
                    )}
                    {account.notes && <p className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">{account.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section> */}

        {/* Linked Children */}
        <section id="children" className="scroll-mt-20">
          <Card>
            <div className="card-header flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">My Children</h2>
                <p className="mt-0.5 text-sm text-slate-500">Children linked to your account.</p>
              </div>
              <Badge tone="indigo">{children.length}</Badge>
            </div>

            {loading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : children.length === 0 ? (
              <EmptyState
                icon={<Icon.users />}
                title="No children linked yet"
                description="Use the form below to link your child using their student code."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Name', 'Student Code', 'Class', 'Action'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {children.map((child) => (
                      <tr key={child._id} className="hover:bg-slate-50/70 transition">
                        <td data-label="Name" className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                          {child.firstName} {child.lastName}
                        </td>
                        <td data-label="Student Code" className="px-6 py-4 whitespace-nowrap">
                          <Badge tone="slate">{child.studentCode}</Badge>
                        </td>
                        <td data-label="Class" className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{child.className}</td>
                        <td data-label="Action" className="px-6 py-4 whitespace-nowrap">
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
          </Card>

          {/* Link Child */}
          <Card className="mt-5">
            <div className="card-header">
              <h2 className="text-base font-bold font-display text-slate-900">Link Your Child</h2>
              <p className="mt-0.5 text-sm text-slate-500">Enter the student code provided by your school.</p>
            </div>
            <form onSubmit={handleLinkChild} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Icon.search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="e.g. KMS-STU-5-001"
                    required
                    className="pl-10"
                  />
                </div>
                <Button type="submit" icon={<Icon.plus className="w-4 h-4" />}>
                  Link Child
                </Button>
              </div>
              {linkError && (
                <div className="mt-3 px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
                  <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="mt-3 px-3.5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2">
                  <Icon.check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {linkSuccess}
                </div>
              )}
            </form>
          </Card>
        </section>

        {/* Invoices */}
        <section id="invoices" className="scroll-mt-20">
          <Card>
            <div className="card-header">
              <h2 className="text-base font-bold font-display text-slate-900">Invoices & Payments</h2>
              <p className="mt-0.5 text-sm text-slate-500">Pay your children's fees online with ease.</p>
            </div>
            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<Icon.receipt />}
                title="No invoices yet"
                description="When your child's school issues an invoice, it will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Child', 'Term', 'Amount', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50/70 transition">
                        <td data-label="Child" className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                          {invoice.student?.firstName} {invoice.student?.lastName}
                        </td>
                        <td data-label="Term" className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{invoice.term}</td>
                        <td data-label="Amount" className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                          NPR {invoice.amount.toLocaleString()}
                        </td>
                        <td data-label="Status" className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start">
                            <StatusBadge status={invoice.status} />
                            {renderAttempt(invoice)}
                          </div>
                        </td>
                        <td data-label="Actions" className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                            {(invoice.status === 'pending' || invoice.status === 'overdue') &&
                              (availableGateways.length > 0 ? (
                                <Button
                                  onClick={() => setPayingInvoice(invoice)}
                                  variant="primary"
                                  size="sm"
                                  icon={<Icon.card className="w-4 h-4" />}
                                >
                                  Pay Online
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400 py-1.5">
                                  {bankAccounts.length > 0 ? 'Use bank transfer details above' : 'No payment methods available'}
                                </span>
                              ))}
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

      {ConfirmDialogElement}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          availableGateways={availableGateways}
          onClose={() => setPayingInvoice(null)}
          onSuccess={fetchData}
          showToast={showToast}
        />
      )}
    </AppLayout>
  );
};

export default ParentDashboard;
