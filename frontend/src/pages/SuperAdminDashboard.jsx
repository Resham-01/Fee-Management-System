import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import ReceiptButton from '../components/ReceiptButton';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import Input, { Field } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

const emptyPlanForm = () => ({
  name: '',
  pricePerMonth: '',
  maxStudents: '',
  features: '',
  isActive: true,
});

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, plansRes, receiptsRes] = await Promise.all([
        apiClient.get('/schools'),
        apiClient.get('/plans'),
        apiClient.get('/receipts'),
      ]);
      setSchools(schoolsRes.data);
      setPlans(plansRes.data);
      setReceipts(receiptsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (schoolId, schoolName) => {
    const ok = await confirm({
      title: 'Approve school?',
      message: `Approve "${schoolName}" so they can use the system.`,
      confirmLabel: 'Approve',
      variant: 'info',
    });
    if (!ok) return;
    try {
      await apiClient.patch(`/schools/${schoolId}/approve`);
      showToast('School approved successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to approve school'), 'error');
    }
  };

  const handleReject = async (schoolId, schoolName) => {
    const ok = await confirm({
      title: 'Reject school?',
      message: `"${schoolName}" will be marked as not approved.`,
      confirmLabel: 'Reject',
    });
    if (!ok) return;
    try {
      await apiClient.patch(`/schools/${schoolId}/reject`);
      showToast('School rejected', 'info');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to reject school'), 'error');
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: planForm.name,
        pricePerMonth: parseFloat(planForm.pricePerMonth),
        maxStudents: parseInt(planForm.maxStudents, 10),
        features: planForm.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        isActive: planForm.isActive,
      };
      const isEditingPlan = !!editingPlan;
      if (editingPlan) {
        await apiClient.put(`/plans/${editingPlan._id}`, payload);
      } else {
        await apiClient.post('/plans', payload);
      }
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm(emptyPlanForm());
      showToast(isEditingPlan ? 'Plan updated successfully' : 'Plan created successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save plan'), 'error');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      pricePerMonth: plan.pricePerMonth,
      maxStudents: plan.maxStudents,
      features: (plan.features || []).join(', '),
      isActive: plan.isActive !== false,
    });
    setShowPlanForm(true);
  };

  const handleDeletePlan = async (planId, planName) => {
    const ok = await confirm({
      title: 'Delete plan?',
      message: `Remove subscription plan "${planName}" permanently.`,
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/plans/${planId}`);
      showToast('Plan deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete plan'), 'error');
    }
  };

  const approvedCount = schools.filter((s) => s.isApproved).length;
  const pendingCount = schools.filter((s) => !s.isApproved).length;

  const navItems = [
    { label: 'Overview', icon: <Icon.dashboard />, onClick: () => scrollToId('top') },
    { label: 'Schools', icon: <Icon.building />, badge: pendingCount, onClick: () => scrollToId('schools') },
    { label: 'Receipts', icon: <Icon.receipt />, onClick: () => scrollToId('receipts') },
    { label: 'Subscription Plans', icon: <Icon.card />, onClick: () => scrollToId('plans') },
    { label: 'My Profile', icon: <Icon.user />, path: '/profile' },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password' },
  ];

  return (
    <AppLayout
      navItems={navItems}
      title="Super Admin"
      subtitle="Manage schools, receipts and subscription plans"
    >
      <div id="top" className="scroll-mt-20 space-y-8">
        <PageHeader
          title="Overview"
          description="A live snapshot of every school across the platform."
          icon={<Icon.dashboard />}
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
              label="Total Schools"
              value={schools.length}
              tone="brand"
              icon={<Icon.building />}
            />
            <StatCard
              label="Approved Schools"
              value={approvedCount}
              tone="emerald"
              icon={<Icon.check />}
            />
            <StatCard
              label="Pending Approval"
              value={pendingCount}
              tone="amber"
              icon={<Icon.clock />}
              sublabel={pendingCount > 0 ? 'Waiting for your review' : 'All caught up'}
            />
          </div>
        )}

        {/* Schools */}
        <section id="schools" className="scroll-mt-20">
          <Card>
            <div className="card-header flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Schools</h2>
                <p className="mt-0.5 text-sm text-slate-500">Approve or reject school registrations.</p>
              </div>
              <Badge tone="indigo">{schools.length}</Badge>
            </div>
            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : schools.length === 0 ? (
              <EmptyState
                icon={<Icon.building />}
                title="No schools registered yet"
                description="Schools will appear here once they register on the platform."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Name', 'Contact', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schools.map((school) => (
                      <tr key={school._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/super-admin/school/${school._id}`)}
                            className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                          >
                            {school.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-slate-600">{school.contactEmail}</p>
                          <p className="text-xs text-slate-400">{school.contactPhone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={school.isApproved ? 'approved' : 'pending'} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {!school.isApproved && (
                              <button
                                onClick={() => handleApprove(school._id, school.name)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleReject(school._id, school.name)}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium shadow-sm transition"
                            >
                              Reject
                            </button>
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

        {/* Receipts */}
        <section id="receipts" className="scroll-mt-20">
          <Card>
            <div className="card-header">
              <h2 className="text-base font-bold font-display text-slate-900">Payment Receipts</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Download official receipts for all successful fee payments across schools.
              </p>
            </div>
            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : receipts.length === 0 ? (
              <EmptyState
                icon={<Icon.receipt />}
                title="No payment receipts yet"
                description="Once parents pay fees, their official receipts will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Receipt No.', 'School', 'Student', 'Term', 'Amount', 'Method', 'Paid On', 'Action'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipts.map((receipt) => (
                      <tr key={receipt.invoiceId} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{receipt.receiptNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{receipt.schoolName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-slate-800">{receipt.studentName}</p>
                          <p className="text-xs text-slate-400">{receipt.studentCode}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{receipt.term}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                          {receipt.currency} {receipt.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge tone={receipt.gateway ? 'violet' : 'slate'}>
                            {receipt.gateway ? getPaymentTypeLabel(receipt.gateway) : 'Manual'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(receipt.paidAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ReceiptButton invoiceId={receipt.invoiceId} showToast={showToast} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Plans */}
        <section id="plans" className="scroll-mt-20">
          <Card>
            <div className="card-header flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Subscription Plans</h2>
                <p className="mt-0.5 text-sm text-slate-500">Pricing plans available to schools.</p>
              </div>
              <Button
                onClick={() => {
                  setShowPlanForm(true);
                  setEditingPlan(null);
                  setPlanForm(emptyPlanForm());
                }}
                icon={<Icon.plus className="w-4 h-4" />}
              >
                Add Plan
              </Button>
            </div>
            {loading ? (
              <CardSkeleton count={3} />
            ) : plans.length === 0 ? (
              <EmptyState
                icon={<Icon.card />}
                title="No subscription plans"
                description="Create your first plan to offer pricing to schools."
                action={
                  <Button
                    onClick={() => {
                      setShowPlanForm(true);
                      setEditingPlan(null);
                      setPlanForm(emptyPlanForm());
                    }}
                    icon={<Icon.plus className="w-4 h-4" />}
                  >
                    Create a Plan
                  </Button>
                }
              />
            ) : (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className="relative border border-slate-200 rounded-2xl p-5 bg-gradient-to-b from-white to-slate-50/70 shadow-card hover:shadow-lift hover:border-slate-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold font-display text-slate-900">{plan.name}</h3>
                        {plan.isActive ? (
                          <Badge tone="emerald" dot>Active</Badge>
                        ) : (
                          <Badge tone="slate" dot>Inactive</Badge>
                        )}
                      </div>
                      <ActionButtons
                        onEdit={() => handleEditPlan(plan)}
                        onDelete={() => handleDeletePlan(plan._id, plan.name)}
                      />
                    </div>
                    <p className="text-2xl font-bold font-display text-brand-700 mb-1">
                      NPR {plan.pricePerMonth}
                      <span className="text-sm font-medium text-slate-400">/month</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-3">Up to {plan.maxStudents} students</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.features?.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg"
                        >
                          <Icon.check className="w-3 h-3 text-emerald-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>

      <Modal
        isOpen={showPlanForm}
        onClose={() => setShowPlanForm(false)}
        title={editingPlan ? 'Edit Plan' : 'Create a New Plan'}
        description={editingPlan ? 'Update the details of this subscription plan.' : 'Add a new subscription plan for schools.'}
        size="md"
      >
        <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Plan Name" htmlFor="plan-name" required>
            <Input
              id="plan-name"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              required
              placeholder="e.g. Premium"
            />
          </Field>
          <Field label="Price / Month (NPR)" htmlFor="plan-price" required>
            <Input
              id="plan-price"
              type="number"
              value={planForm.pricePerMonth}
              onChange={(e) => setPlanForm({ ...planForm, pricePerMonth: e.target.value })}
              required
              placeholder="5000"
            />
          </Field>
          <Field label="Max Students" htmlFor="plan-students" required>
            <Input
              id="plan-students"
              type="number"
              value={planForm.maxStudents}
              onChange={(e) => setPlanForm({ ...planForm, maxStudents: e.target.value })}
              required
              placeholder="100"
            />
          </Field>
          <Field label="Features (comma separated)" htmlFor="plan-features" hint="e.g. Invoices, Reports, SMS">
            <Input
              id="plan-features"
              value={planForm.features}
              onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
              placeholder="Invoices, Reports, SMS"
            />
          </Field>
          <label className="sm:col-span-2 flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={planForm.isActive}
              onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Plan is active</span>
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowPlanForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>

      {ConfirmDialogElement}
    </AppLayout>
  );
};

export default SuperAdminDashboard;
