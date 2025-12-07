import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';

const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    fetchSchoolDetails();
  }, [id]);

  const fetchSchoolDetails = async () => {
    try {
      const response = await apiClient.get(`/schools/${id}/details`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch school details');
      alert('Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyParents = async () => {
    if (!confirm('Send notification to all parents about pending fees?')) return;
    setNotifying(true);
    try {
      const response = await apiClient.post(`/schools/${id}/notify-parents`);
      alert(`Notifications sent to ${response.data.notifications.length} parents`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send notifications');
    } finally {
      setNotifying(false);
    }
  };

  const handleNotifySchool = async () => {
    if (!confirm('Send notification to school admin about pending fees?')) return;
    setNotifying(true);
    try {
      const response = await apiClient.post(`/schools/${id}/notify-school`);
      alert(`Notification sent to ${response.data.schoolAdmin.name} (${response.data.schoolAdmin.email})`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send notification');
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
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Invoices ({invoices.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;

