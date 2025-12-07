import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import NotificationPanel from '../components/NotificationPanel';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, plansRes] = await Promise.all([
        apiClient.get('/schools'),
        apiClient.get('/plans'),
      ]);
      setSchools(schoolsRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (schoolId) => {
    try {
      await apiClient.patch(`/schools/${schoolId}/approve`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve school');
    }
  };

  const handleReject = async (schoolId) => {
    try {
      await apiClient.patch(`/schools/${schoolId}/reject`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject school');
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
        {/* Stats */}
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

        {/* Schools Table */}
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
                    <tr key={school._id}>
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
                        <div className="flex gap-2">
                          {!school.isApproved ? (
                            <>
                              <button
                                onClick={() => handleApprove(school._id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(school._id)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleReject(school._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Reject
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
        </div>

        {/* Plans */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Subscription Plans</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div key={plan._id} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">NPR {plan.pricePerMonth}/month</p>
                    <p className="text-sm text-gray-600 mb-2">Max Students: {plan.maxStudents}</p>
                    <div className="mt-2">
                      {plan.features?.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
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
    </div>
  );
};

export default SuperAdminDashboard;

