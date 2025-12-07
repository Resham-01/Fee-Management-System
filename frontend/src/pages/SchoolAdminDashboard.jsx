import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';

const SchoolAdminDashboard = () => {
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
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    studentCode: '',
    className: '',
    section: '',
    parent: '',
  });
  const [feeStructureForm, setFeeStructureForm] = useState({
    student: '',
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
      const formData = {
        ...studentForm,
        parent: studentForm.parent && studentForm.parent.trim() !== '' ? studentForm.parent : null,
      };
      
      if (editingStudent) {
        await apiClient.put(`/students/${editingStudent._id}`, formData);
      } else {
        await apiClient.post('/students', formData);
      }
      setShowStudentForm(false);
      setEditingStudent(null);
      setStudentForm({ firstName: '', lastName: '', studentCode: '', className: '', section: '', parent: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setStudentForm({
      firstName: student.firstName,
      lastName: student.lastName,
      studentCode: student.studentCode,
      className: student.className,
      section: student.section,
      parent: student.parent?._id || '',
    });
    setShowStudentForm(true);
  };

  const handleDelete = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await apiClient.delete(`/students/${studentId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleFeeStructureSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...feeStructureForm,
        monthlyFee: parseFloat(feeStructureForm.monthlyFee),
        scholarship: parseFloat(feeStructureForm.scholarship) || 0,
        effectiveFrom: new Date(feeStructureForm.effectiveFrom),
        effectiveTo: feeStructureForm.effectiveTo ? new Date(feeStructureForm.effectiveTo) : null,
      };

      if (editingFeeStructure) {
        await apiClient.put(`/fee-structures/${editingFeeStructure._id}`, formData);
      } else {
        await apiClient.post('/fee-structures', formData);
      }
      setShowFeeStructureForm(false);
      setEditingFeeStructure(null);
      setFeeStructureForm({
        student: '',
        monthlyFee: '',
        scholarship: '',
        scholarshipType: 'none',
        effectiveFrom: '',
        effectiveTo: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save fee structure');
    }
  };

  const handleEditFeeStructure = (feeStruct) => {
    setEditingFeeStructure(feeStruct);
    setFeeStructureForm({
      student: feeStruct.student._id,
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
    if (!confirm(`Generate invoices for ${generateInvoiceData.month}/${generateInvoiceData.year}?`)) return;
    try {
      const response = await apiClient.post('/fee-structures/generate-invoices', generateInvoiceData);
      alert(`Generated ${response.data.created} invoices${response.data.errors ? '. Some errors occurred.' : ''}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoices');
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
                setStudentForm({ firstName: '', lastName: '', studentCode: '', className: '', section: '', parent: '' });
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label>
                  <input
                    type="text"
                    value={studentForm.studentCode}
                    onChange={(e) => setStudentForm({ ...studentForm, studentCode: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
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
              </form>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
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

        {/* Fee Structure Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Fee Structures</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFeeStructureForm(true);
                  setEditingFeeStructure(null);
                  setFeeStructureForm({
                    student: '',
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
                <div>
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
                    <option value="none">No Scholarship</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (NPR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scholarship {feeStructureForm.scholarshipType === 'percentage' ? '(%)' : '(NPR)'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
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
                          {feeStruct.student?.firstName} {feeStruct.student?.lastName}
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
                          <button
                            onClick={() => handleEditFeeStructure(feeStruct)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Edit
                          </button>
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
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Invoices</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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

export default SchoolAdminDashboard;

