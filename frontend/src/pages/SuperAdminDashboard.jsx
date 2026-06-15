import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';
import ActionButtons from '../components/ActionButtons';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
import ReceiptButton from '../components/ReceiptButton';
import { getPaymentTypeLabel } from '../constants/paymentAccounts';

const emptyPlanForm = () => ({
  name: '',
  pricePerMonth: '',
  maxStudents: '',
  features: '',
  isActive: true,
});

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Total Schools</h3>
            <p className="text-3xl font-bold text-gray-800">{schools.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Approved Schools</h3>
            <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm">Pending Approval</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Schools</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schools.map((school) => (
                    <tr key={school._id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/super-admin/school/${school._id}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {school.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{school.contactEmail}</div>
                        <div className="text-sm text-gray-500">{school.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {school.isApproved ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {!school.isApproved && (
                            <button
                              onClick={() => handleApprove(school._id, school.name)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleReject(school._id, school.name)}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium shadow-sm"
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
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Payment Receipts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Download official receipts for all successful fee payments across schools.
            </p>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : receipts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No payment receipts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid On</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.invoiceId} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{receipt.receiptNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{receipt.schoolName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {receipt.studentName}
                        {receipt.studentCode && (
                          <span className="text-gray-500 block text-xs">{receipt.studentCode}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{receipt.term}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {receipt.currency} {receipt.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {receipt.gateway ? getPaymentTypeLabel(receipt.gateway) : 'Manual'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
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
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Subscription Plans</h2>
            <button
              onClick={() => {
                setShowPlanForm(true);
                setEditingPlan(null);
                setPlanForm(emptyPlanForm());
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md"
            >
              Add Plan
            </button>
          </div>

          {showPlanForm && (
            <div className="p-6 border-b bg-gradient-to-br from-slate-50 to-indigo-50">
              <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price / Month (NPR)</label>
                  <input
                    type="number"
                    value={planForm.pricePerMonth}
                    onChange={(e) => setPlanForm({ ...planForm, pricePerMonth: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={planForm.maxStudents}
                    onChange={(e) => setPlanForm({ ...planForm, maxStudents: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                  <input
                    type="text"
                    value={planForm.features}
                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Invoices, Reports, SMS"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="planActive"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="planActive" className="text-sm font-medium text-gray-700">
                    Plan is active
                  </label>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(null);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
                      <ActionButtons
                        onEdit={() => handleEditPlan(plan)}
                        onDelete={() => handleDeletePlan(plan._id, plan.name)}
                      />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">NPR {plan.pricePerMonth}/month</p>
                    <p className="text-sm text-gray-600 mb-2">Max Students: {plan.maxStudents}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plan.features?.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {ConfirmDialogElement}
    </div>
  );
};

export default SuperAdminDashboard;
