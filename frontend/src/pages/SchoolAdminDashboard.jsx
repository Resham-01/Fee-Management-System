import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';
import ActionButtons from '../components/ActionButtons';
import { GRADE_OPTIONS } from '../constants/grades';
import { useConfirm } from '../hooks/useConfirm';
import { useToast, getErrorMessage } from '../context/ToastContext';

const SchoolAdminDashboard = () => {
  const { confirm, ConfirmDialogElement } = useConfirm();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
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
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    className: '',
    section: '',
    parent: '',
  });
  const [feeStructureForm, setFeeStructureForm] = useState({
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
  const [generateInvoiceData, setGenerateInvoiceData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
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

  const resetInvoiceForm = () => ({
    student: '',
    amount: '',
    dueDate: '',
    term: '',
    description: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, invoicesRes, feeStructuresRes] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/invoices/school'),
        apiClient.get('/fee-structures'),
      ]);
      setStudents(studentsRes.data);
      setInvoices(invoicesRes.data);
      setFeeStructures(feeStructuresRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
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
      setStudentForm({ firstName: '', lastName: '', className: '', section: '', parent: '' });
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
      setFeeStructureForm({
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
      showToast(
        `Generated ${response.data.created} invoice(s)${response.data.errors ? '. Some errors occurred.' : ''}`,
        response.data.errors ? 'info' : 'success'
      );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-green-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-white">School Admin Dashboard</h1>
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
            <h3 className="text-gray-600 text-sm">Total Students</h3>
            <p className="text-3xl font-bold text-gray-800">{students.length}</p>
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

        {/* Students Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Students</h2>
            <button
              onClick={() => {
                setShowStudentForm(true);
                setEditingStudent(null);
                setStudentForm({ firstName: '', lastName: '', className: '', section: '', parent: '' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>

          {showStudentForm && (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Select class</option>
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    {editingStudent ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentForm(false);
                      setEditingStudent(null);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                {!editingStudent && (
                  <div className="md:col-span-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    Student code is generated automatically (e.g. KMS-STU-5-001: school short name, class number, and order).
                  </div>
                )}
              </form>
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Class-wise Student Details</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(studentsByClass).map(([classLabel, count]) => (
                  <span key={classLabel} className="text-xs bg-white border text-gray-700 px-3 py-1 rounded-full">
                    {classLabel}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">{student.parent?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActionButtons
                          onEdit={() => handleEdit(student)}
                          onDelete={() => handleDelete(student._id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fee Structure Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Fee Structures</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFeeStructureForm(true);
                  setEditingFeeStructure(null);
                  setFeeTargetMode('student');
                  setFeeStructureForm({
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
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Fee Structure
              </button>
            </div>
          </div>

          {showFeeStructureForm && (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleFeeStructureSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allocate Fee By</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="feeTargetMode"
                        value="student"
                        checked={feeTargetMode === 'student'}
                        onChange={(e) => setFeeTargetMode(e.target.value)}
                      />
                      Student
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="feeTargetMode"
                        value="class"
                        checked={feeTargetMode === 'class'}
                        onChange={(e) => setFeeTargetMode(e.target.value)}
                      />
                      Class-wise
                    </label>
                  </div>
                </div>
                <div>
                  {feeTargetMode === 'student' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                      <select
                        value={feeStructureForm.student}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, student: e.target.value })}
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.firstName} {student.lastName} ({student.studentCode})
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select
                        value={feeStructureForm.className}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, className: e.target.value })}
                        required
                        className="w-full px-4 py-2 border rounded-lg bg-white"
                      >
                        <option value="">Select class</option>
                        {GRADE_OPTIONS.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                <div>
                  {feeTargetMode === 'class' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                      <input
                        type="text"
                        value={feeStructureForm.section}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, section: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g. A"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <input
                        type="text"
                        value={students.find((s) => s._id === feeStructureForm.student)?.className || ''}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                      />
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeStructureForm.monthlyFee}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, monthlyFee: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Type</label>
                  <select
                    value={feeStructureForm.scholarshipType}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, scholarshipType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="none">No Discount / Scholarship</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount / Scholarship {feeStructureForm.scholarshipType === 'percentage' ? '(%)' : '(NPR)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeStructureForm.scholarship}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, scholarship: e.target.value })}
                    disabled={feeStructureForm.scholarshipType === 'none'}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                  <input
                    type="date"
                    value={feeStructureForm.effectiveFrom}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, effectiveFrom: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={feeStructureForm.effectiveTo}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, effectiveTo: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={feeStructureForm.notes}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    {editingFeeStructure ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeeStructureForm(false);
                      setEditingFeeStructure(null);
                      setFeeTargetMode('student');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Generate Monthly Invoices */}
          <div className="p-6 border-b bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Monthly Invoices</h3>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={generateInvoiceData.month}
                  onChange={(e) => setGenerateInvoiceData({ ...generateInvoiceData, month: parseInt(e.target.value) })}
                  className="px-4 py-2 border rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={generateInvoiceData.year}
                  onChange={(e) => setGenerateInvoiceData({ ...generateInvoiceData, year: parseInt(e.target.value) })}
                  className="px-4 py-2 border rounded-lg"
                  min="2020"
                  max="2100"
                />
              </div>
              <button
                onClick={handleGenerateInvoices}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Generate Invoices
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This will create invoices for all students with active fee structures for the selected month.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {feeStructures.map((feeStruct) => {
                    const actualFee = calculateActualFee(feeStruct);
                    return (
                      <tr key={feeStruct._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {feeStruct.student
                            ? `${feeStruct.student?.firstName} ${feeStruct.student?.lastName}`
                            : `${feeStruct.className}${feeStruct.section ? ` (${feeStruct.section})` : ''} - All Students`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">NPR {feeStruct.monthlyFee.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {feeStruct.scholarshipType === 'none' ? (
                            <span className="text-gray-400">-</span>
                          ) : feeStruct.scholarshipType === 'percentage' ? (
                            <span className="text-green-600">{feeStruct.scholarship}%</span>
                          ) : (
                            <span className="text-green-600">NPR {feeStruct.scholarship.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">
                          NPR {actualFee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Invoices</h2>
            <button
              onClick={() => {
                setShowInvoiceForm(true);
                setEditingInvoice(null);
                setInvoiceForm(resetInvoiceForm());
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition"
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
                    placeholder="e.g. June 2026"
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
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md"
                  >
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInvoiceForm(false);
                      setEditingInvoice(null);
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
          ) : invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No invoices yet.</div>
          ) : (
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
                    <tr key={invoice._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.student?.firstName} {invoice.student?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.term}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                        NPR {invoice.amount.toLocaleString()}
                      </td>
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
                        <ActionButtons
                          onEdit={() => handleEditInvoice(invoice)}
                          onDelete={() => handleDeleteInvoice(invoice._id)}
                        />
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
    </div>
  );
};

export default SchoolAdminDashboard;

