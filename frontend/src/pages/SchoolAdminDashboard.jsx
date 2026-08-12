import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import ActionButtons from '../components/ActionButtons';
import { GRADE_OPTIONS } from '../constants/grades';
import { PAYMENT_ACCOUNT_TYPES, getPaymentTypeLabel } from '../constants/paymentAccounts';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';
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
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const resetInvoiceForm = () => ({
  student: '',
  amount: '',
  dueDate: '',
  term: '',
  description: '',
  status: 'pending',
});

const resetPaymentForm = () => ({
  type: 'esewa',
  merchantId: '',
  merchantName: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
  notes: '',
});

const emptyStudentForm = () => ({
  firstName: '',
  lastName: '',
  className: '',
  section: '',
  parent: '',
});

const emptyFeeStructureForm = () => ({
  student: '',
  className: '',
  section: '',
  monthlyFee: '',
  scholarship: '',
  scholarshipType: 'none',
  effectiveFrom: '',
  effectiveTo: '',
  notes: '',
});

const SchoolAdminDashboard = () => {
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingFeeStructure, setEditingFeeStructure] = useState(null);
  const [feeTargetMode, setFeeTargetMode] = useState('student');
  const [studentForm, setStudentForm] = useState(emptyStudentForm());
  const [feeStructureForm, setFeeStructureForm] = useState(emptyFeeStructureForm());
  const [generateInvoiceData, setGenerateInvoiceData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(resetInvoiceForm());
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentAccount, setEditingPaymentAccount] = useState(null);
  const [paymentForm, setPaymentForm] = useState(resetPaymentForm());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, invoicesRes, feeStructuresRes, paymentAccountsRes] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/invoices/school'),
        apiClient.get('/fee-structures'),
        apiClient.get('/payment-accounts/my-school'),
      ]);
      setStudents(studentsRes.data);
      setInvoices(invoicesRes.data);
      setFeeStructures(feeStructuresRes.data);
      setPaymentAccounts(paymentAccountsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEditing = !!editingPaymentAccount;
      if (isEditing) {
        await apiClient.put(`/payment-accounts/my-school/${editingPaymentAccount._id}`, paymentForm);
        showToast('Payment account updated. Waiting for Super Admin approval.', 'success');
      } else {
        await apiClient.post('/payment-accounts/my-school', paymentForm);
        showToast('Payment account submitted for Super Admin approval.', 'success');
      }
      setShowPaymentForm(false);
      setEditingPaymentAccount(null);
      setPaymentForm(resetPaymentForm());
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save payment account'), 'error');
    }
  };

  const handleEditPaymentAccount = (account) => {
    setEditingPaymentAccount(account);
    setPaymentForm({
      type: account.type,
      merchantId: account.merchantId || '',
      merchantName: account.merchantName || '',
      bankName: account.bankName || '',
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      branch: account.branch || '',
      notes: account.notes || '',
    });
    setShowPaymentForm(true);
  };

  const handleDeletePaymentAccount = async (accountId) => {
    const ok = await confirm({
      title: 'Delete payment account?',
      message: 'This payment account submission will be removed.',
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/payment-accounts/my-school/${accountId}`);
      showToast('Payment account deleted', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete payment account'), 'error');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const baseData = {
        ...studentForm,
        parent: studentForm.parent && studentForm.parent.trim() !== '' ? studentForm.parent : null,
      };

      const isEditingStudent = !!editingStudent;
      if (editingStudent) {
        const formData = {
          ...baseData,
          studentCode: editingStudent.studentCode,
        };
        await apiClient.put(`/students/${editingStudent._id}`, formData);
      } else {
        await apiClient.post('/students', baseData);
      }
      setShowStudentForm(false);
      setEditingStudent(null);
      setStudentForm(emptyStudentForm());
      showToast(isEditingStudent ? 'Student updated successfully' : 'Student added successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save student'), 'error');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setStudentForm({
      firstName: student.firstName,
      lastName: student.lastName,
      className: student.className,
      section: student.section,
      parent: student.parent?._id || '',
    });
    setShowStudentForm(true);
  };

  const handleDelete = async (studentId) => {
    const ok = await confirm({
      title: 'Delete student?',
      message: 'This will permanently remove the student and cannot be undone.',
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/students/${studentId}`);
      showToast('Student deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete student'), 'error');
    }
  };

  const handleDeleteFeeStructure = async (feeStructureId) => {
    const ok = await confirm({
      title: 'Delete fee structure?',
      message: 'This fee structure will be removed. Existing invoices will not be affected.',
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/fee-structures/${feeStructureId}`);
      showToast('Fee structure deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete fee structure'), 'error');
    }
  };

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
      fetchData();
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
      message: 'This invoice will be permanently removed from the system.',
      confirmLabel: 'Yes, delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/invoices/${invoiceId}`);
      showToast('Invoice deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete invoice'), 'error');
    }
  };

  const handleFeeStructureSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...feeStructureForm,
        student: feeTargetMode === 'student' ? feeStructureForm.student : null,
        className: feeTargetMode === 'class' ? feeStructureForm.className : null,
        section: feeTargetMode === 'class' ? feeStructureForm.section : null,
        monthlyFee: parseFloat(feeStructureForm.monthlyFee),
        scholarship: parseFloat(feeStructureForm.scholarship) || 0,
        effectiveFrom: new Date(feeStructureForm.effectiveFrom),
        effectiveTo: feeStructureForm.effectiveTo ? new Date(feeStructureForm.effectiveTo) : null,
      };

      const isEditingFeeStructure = !!editingFeeStructure;
      if (editingFeeStructure) {
        await apiClient.put(`/fee-structures/${editingFeeStructure._id}`, formData);
      } else {
        await apiClient.post('/fee-structures', formData);
      }
      setShowFeeStructureForm(false);
      setEditingFeeStructure(null);
      setFeeTargetMode('student');
      setFeeStructureForm(emptyFeeStructureForm());
      showToast(
        isEditingFeeStructure ? 'Fee structure updated successfully' : 'Fee structure created successfully',
        'success'
      );
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save fee structure'), 'error');
    }
  };

  const handleEditFeeStructure = (feeStruct) => {
    setEditingFeeStructure(feeStruct);
    setFeeTargetMode(feeStruct.student ? 'student' : 'class');
    setFeeStructureForm({
      student: feeStruct.student?._id || '',
      className: feeStruct.className || '',
      section: feeStruct.section || '',
      monthlyFee: feeStruct.monthlyFee,
      scholarship: feeStruct.scholarship,
      scholarshipType: feeStruct.scholarshipType,
      effectiveFrom: feeStruct.effectiveFrom ? new Date(feeStruct.effectiveFrom).toISOString().split('T')[0] : '',
      effectiveTo: feeStruct.effectiveTo ? new Date(feeStruct.effectiveTo).toISOString().split('T')[0] : '',
      notes: feeStruct.notes || '',
    });
    setShowFeeStructureForm(true);
  };

  const handleGenerateInvoices = async () => {
    const ok = await confirm({
      title: 'Generate monthly invoices?',
      message: `Create invoices for ${generateInvoiceData.month}/${generateInvoiceData.year} for all students with active fee structures.`,
      confirmLabel: 'Generate',
      variant: 'info',
    });
    if (!ok) return;
    try {
      const response = await apiClient.post('/fee-structures/generate-invoices', generateInvoiceData);
      const data = response.data;
      if (data.noFeeStructures) {
        showToast(data.message, 'info');
      } else if (data.created > 0) {
        showToast(data.message, 'success');
      } else if (data.errors && data.errors.length > 0) {
        showToast(`${data.message}. ${data.errors[0]}`, 'info');
      } else {
        showToast('No new invoices were created for the selected month.', 'info');
      }
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to generate invoices'), 'error');
    }
  };

  const calculateActualFee = (feeStruct) => {
    if (feeStruct.scholarshipType === 'percentage') {
      return feeStruct.monthlyFee - (feeStruct.monthlyFee * feeStruct.scholarship / 100);
    } else if (feeStruct.scholarshipType === 'fixed') {
      return Math.max(0, feeStruct.monthlyFee - feeStruct.scholarship);
    }
    return feeStruct.monthlyFee;
  };

  const totalPending = invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const studentsByClass = students.reduce((acc, student) => {
    const key = `${student.className} - ${student.section}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const navItems = [
    { label: 'Overview', icon: <Icon.dashboard />, onClick: () => scrollToId('top') },
    { label: 'Payment Accounts', icon: <Icon.wallet />, onClick: () => scrollToId('accounts') },
    { label: 'Students', icon: <Icon.users />, onClick: () => scrollToId('students') },
    { label: 'Fee Structures', icon: <Icon.card />, onClick: () => scrollToId('fees') },
    { label: 'Invoices', icon: <Icon.receipt />, onClick: () => scrollToId('invoices') },
    { label: 'My Profile', icon: <Icon.user />, path: '/profile' },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password' },
  ];

  return (
    <AppLayout
      navItems={navItems}
      title="School Admin"
      subtitle="Manage your students, fee structures and invoices"
    >
      <div id="top" className="scroll-mt-20 space-y-8">
        <PageHeader
          title="Overview"
          description="Your school at a glance — students and fee collections."
          icon={<Icon.school />}
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
              label="Total Students"
              value={students.length}
              tone="brand"
              icon={<Icon.users />}
            />
            <StatCard
              label="Pending Fees"
              value={`NPR ${totalPending.toLocaleString()}`}
              tone="amber"
              icon={<Icon.clock />}
            />
            <StatCard
              label="Collected"
              value={`NPR ${totalPaid.toLocaleString()}`}
              tone="emerald"
              icon={<Icon.money />}
            />
          </div>
        )}

        {/* Payment Accounts */}
        <section id="accounts" className="scroll-mt-20">
          <Card>
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Payment Accounts</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Submit payment details for parents. Super Admin verifies them before going live.
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowPaymentForm(true);
                  setEditingPaymentAccount(null);
                  setPaymentForm(resetPaymentForm());
                }}
                icon={<Icon.plus className="w-4 h-4" />}
              >
                Add Payment Account
              </Button>
            </div>

            {loading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : paymentAccounts.length === 0 ? (
              <EmptyState
                icon={<Icon.wallet />}
                title="No payment accounts yet"
                description="Add your school's eSewa, Khalti, FonePay, or bank details so parents can pay fees."
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
                            <p className="text-sm text-slate-600">
                              {account.bankName} — {account.accountName} ({account.accountNumber})
                            </p>
                          ) : (
                            <p className="text-sm text-slate-600">{account.merchantName || account.merchantId || '—'}</p>
                          )}
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
                          <ActionButtons
                            onEdit={() => handleEditPaymentAccount(account)}
                            onDelete={!account.isVerified ? () => handleDeletePaymentAccount(account._id) : undefined}
                            showDelete={!account.isVerified}
                          />
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
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Students</h2>
                <p className="mt-0.5 text-sm text-slate-500">Add and manage the students in your school.</p>
              </div>
              <Button
                onClick={() => {
                  setShowStudentForm(true);
                  setEditingStudent(null);
                  setStudentForm(emptyStudentForm());
                }}
                icon={<Icon.plus className="w-4 h-4" />}
              >
                Add Student
              </Button>
            </div>

            {!loading && students.length > 0 && (
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50/70 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Class-wise breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(studentsByClass).map(([classLabel, count]) => (
                    <Badge key={classLabel} tone="indigo">
                      {classLabel}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : students.length === 0 ? (
              <EmptyState
                icon={<Icon.users />}
                title="No students yet"
                description="Add your first student to start assigning fees and generating invoices."
                action={
                  <Button
                    onClick={() => {
                      setShowStudentForm(true);
                      setEditingStudent(null);
                      setStudentForm(emptyStudentForm());
                    }}
                    icon={<Icon.plus className="w-4 h-4" />}
                  >
                    Add Student
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Name', 'Code', 'Class', 'Section', 'Parent', 'Actions'].map((h) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{student.parent?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ActionButtons onEdit={() => handleEdit(student)} onDelete={() => handleDelete(student._id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Fee Structures */}
        <section id="fees" className="scroll-mt-20">
          <Card>
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900">Fee Structures</h2>
                <p className="mt-0.5 text-sm text-slate-500">Set monthly fees and scholarships for students or whole classes.</p>
              </div>
              <Button
                onClick={() => {
                  setShowFeeStructureForm(true);
                  setEditingFeeStructure(null);
                  setFeeTargetMode('student');
                  setFeeStructureForm(emptyFeeStructureForm());
                }}
                icon={<Icon.plus className="w-4 h-4" />}
              >
                Add Fee Structure
              </Button>
            </div>

            {/* Generate Monthly Invoices */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-brand-50/80 to-violet-50/80 border-b border-brand-100">
              <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                <Icon.sparkles className="w-4 h-4 text-brand-600" />
                Generate Monthly Invoices
              </h3>
              <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex gap-3">
                  <Field label="Month" htmlFor="gen-month" className="flex-1">
                    <Select
                      id="gen-month"
                      value={generateInvoiceData.month}
                      onChange={(e) => setGenerateInvoiceData({ ...generateInvoiceData, month: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Year" htmlFor="gen-year" className="w-24">
                    <Input
                      id="gen-year"
                      type="number"
                      value={generateInvoiceData.year}
                      onChange={(e) => setGenerateInvoiceData({ ...generateInvoiceData, year: parseInt(e.target.value) })}
                      min="2020"
                      max="2100"
                    />
                  </Field>
                </div>
                <Button onClick={handleGenerateInvoices} icon={<Icon.sparkles className="w-4 h-4" />}>
                  Generate Invoices
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Creates invoices for all students with active fee structures for the selected month.
              </p>
            </div>

            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : feeStructures.length === 0 ? (
              <EmptyState
                icon={<Icon.card />}
                title="No fee structures yet"
                description="Create a fee structure to start billing students automatically."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Target', 'Monthly Fee', 'Scholarship', 'Actual Fee', 'Effective From', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feeStructures.map((feeStruct) => {
                      const actualFee = calculateActualFee(feeStruct);
                      return (
                        <tr key={feeStruct._id} className="hover:bg-slate-50/70 transition">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                            {feeStruct.student
                              ? `${feeStruct.student?.firstName} ${feeStruct.student?.lastName}`
                              : `${feeStruct.className}${feeStruct.section ? ` (${feeStruct.section})` : ''} — All`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            NPR {feeStruct.monthlyFee.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {feeStruct.scholarshipType === 'none' ? (
                              <span className="text-slate-300">—</span>
                            ) : feeStruct.scholarshipType === 'percentage' ? (
                              <Badge tone="emerald">{feeStruct.scholarship}%</Badge>
                            ) : (
                              <Badge tone="emerald">NPR {feeStruct.scholarship.toLocaleString()}</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-brand-700">
                            NPR {actualFee.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(feeStruct.effectiveFrom).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionButtons
                              onEdit={() => handleEditFeeStructure(feeStruct)}
                              onDelete={() => handleDeleteFeeStructure(feeStruct._id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
                <p className="mt-0.5 text-sm text-slate-500">Track every invoice and its payment status.</p>
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

            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<Icon.receipt />}
                title="No invoices yet"
                description="Create an invoice manually or generate them for a whole month at once."
              />
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
                          {invoice.student?.firstName} {invoice.student?.lastName}
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

      {/* Payment Account Modal */}
      <Modal
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title={editingPaymentAccount ? 'Edit Payment Account' : 'Add Payment Account'}
        description="These details will be reviewed by the Super Admin before parents can use them."
        size="md"
      >
        <form onSubmit={handlePaymentAccountSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment Type" htmlFor="pay-type" required>
            <Select
              id="pay-type"
              value={paymentForm.type}
              onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
              required
              disabled={!!editingPaymentAccount}
            >
              {PAYMENT_ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          {paymentForm.type === 'bank_transfer' ? (
            <>
              <Field label="Bank Name" htmlFor="bank-name" required>
                <Input id="bank-name" value={paymentForm.bankName} onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })} required />
              </Field>
              <Field label="Account Name" htmlFor="acc-name" required>
                <Input id="acc-name" value={paymentForm.accountName} onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })} required />
              </Field>
              <Field label="Account Number" htmlFor="acc-no" required>
                <Input id="acc-no" value={paymentForm.accountNumber} onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} required />
              </Field>
              <Field label="Branch" htmlFor="branch">
                <Input id="branch" value={paymentForm.branch} onChange={(e) => setPaymentForm({ ...paymentForm, branch: e.target.value })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Merchant ID / Number" htmlFor="merchant-id">
                <Input id="merchant-id" value={paymentForm.merchantId} onChange={(e) => setPaymentForm({ ...paymentForm, merchantId: e.target.value })} placeholder="e.g. 98XXXXXXXX" />
              </Field>
              <Field label="Merchant / Account Name" htmlFor="merchant-name">
                <Input id="merchant-name" value={paymentForm.merchantName} onChange={(e) => setPaymentForm({ ...paymentForm, merchantName: e.target.value })} placeholder="School name on wallet" />
              </Field>
            </>
          )}

          <Field label="Notes (optional)" htmlFor="pay-notes" className="sm:col-span-2">
            <Input id="pay-notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Any instructions for parents" />
          </Field>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowPaymentForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingPaymentAccount ? 'Update & Resubmit' : 'Submit for Approval'}</Button>
          </div>
        </form>
      </Modal>

      {/* Student Modal */}
      <Modal
        isOpen={showStudentForm}
        onClose={() => setShowStudentForm(false)}
        title={editingStudent ? 'Edit Student' : 'Add a New Student'}
        description={editingStudent ? 'Update the details of this student.' : 'Students are managed by the school; parents link to them via their student code.'}
        size="md"
      >
        <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" htmlFor="st-first" required>
            <Input id="st-first" value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} required />
          </Field>
          <Field label="Last Name" htmlFor="st-last" required>
            <Input id="st-last" value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} required />
          </Field>
          <Field label="Class" htmlFor="st-class" required>
            <Select id="st-class" value={studentForm.className} onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })} required>
              <option value="">Select class</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section" htmlFor="st-section" required>
            <Input id="st-section" value={studentForm.section} onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })} required placeholder="e.g. A" />
          </Field>
          {!editingStudent && (
            <div className="sm:col-span-2 flex items-start gap-2 px-3.5 py-3 rounded-xl bg-brand-50 border border-brand-100 text-brand-800 text-xs">
              <Icon.info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                The student code is generated automatically (e.g. KMS-STU-5-001: school short name, class number, and order).
              </span>
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowStudentForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingStudent ? 'Update Student' : 'Add Student'}</Button>
          </div>
        </form>
      </Modal>

      {/* Fee Structure Modal */}
      <Modal
        isOpen={showFeeStructureForm}
        onClose={() => setShowFeeStructureForm(false)}
        title={editingFeeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
        description="Allocate a monthly fee to an individual student or an entire class."
        size="md"
      >
        <form onSubmit={handleFeeStructureSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Allocate Fee By" className="sm:col-span-2">
            <div className="flex gap-4 px-1 py-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="feeTargetMode"
                  value="student"
                  checked={feeTargetMode === 'student'}
                  onChange={(e) => setFeeTargetMode(e.target.value)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">Student</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="feeTargetMode"
                  value="class"
                  checked={feeTargetMode === 'class'}
                  onChange={(e) => setFeeTargetMode(e.target.value)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">Class-wise</span>
              </label>
            </div>
          </Field>

          {feeTargetMode === 'student' ? (
            <>
              <Field label="Student" htmlFor="fs-student" required className="sm:col-span-2">
                <Select id="fs-student" value={feeStructureForm.student} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, student: e.target.value })} required>
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.studentCode})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Class" htmlFor="fs-class-display">
                <Input
                  id="fs-class-display"
                  value={students.find((s) => s._id === feeStructureForm.student)?.className || ''}
                  disabled
                  placeholder="Auto-filled"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Class" htmlFor="fs-class" required>
                <Select id="fs-class" value={feeStructureForm.className} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, className: e.target.value })} required>
                  <option value="">Select class</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Section (Optional)" htmlFor="fs-section">
                <Input id="fs-section" value={feeStructureForm.section} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, section: e.target.value })} placeholder="e.g. A" />
              </Field>
            </>
          )}

          <Field label="Monthly Fee (NPR)" htmlFor="fs-monthly" required>
            <Input id="fs-monthly" type="number" step="0.01" value={feeStructureForm.monthlyFee} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, monthlyFee: e.target.value })} required />
          </Field>
          <Field label="Scholarship Type" htmlFor="fs-scholarship-type">
            <Select id="fs-scholarship-type" value={feeStructureForm.scholarshipType} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, scholarshipType: e.target.value })}>
              <option value="none">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (NPR)</option>
            </Select>
          </Field>
          <Field
            label={`Discount ${feeStructureForm.scholarshipType === 'percentage' ? '(%)' : '(NPR)'}`}
            htmlFor="fs-scholarship"
          >
            <Input
              id="fs-scholarship"
              type="number"
              step="0.01"
              value={feeStructureForm.scholarship}
              onChange={(e) => setFeeStructureForm({ ...feeStructureForm, scholarship: e.target.value })}
              disabled={feeStructureForm.scholarshipType === 'none'}
            />
          </Field>
          <Field label="Effective From" htmlFor="fs-from" required>
            <Input id="fs-from" type="date" value={feeStructureForm.effectiveFrom} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, effectiveFrom: e.target.value })} required />
          </Field>
          <Field label="Effective To (Optional)" htmlFor="fs-to">
            <Input id="fs-to" type="date" value={feeStructureForm.effectiveTo} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, effectiveTo: e.target.value })} />
          </Field>
          <Field label="Notes" htmlFor="fs-notes" className="sm:col-span-2">
            <Textarea id="fs-notes" value={feeStructureForm.notes} onChange={(e) => setFeeStructureForm({ ...feeStructureForm, notes: e.target.value })} rows={2} />
          </Field>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setShowFeeStructureForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingFeeStructure ? 'Update Fee Structure' : 'Create Fee Structure'}</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
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

export default SchoolAdminDashboard;
