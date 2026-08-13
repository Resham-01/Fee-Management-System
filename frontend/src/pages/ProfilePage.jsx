import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast, getErrorMessage } from '../context/ToastContext';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import PageHeader from '../components/ui/PageHeader';
import Input, { Field } from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    home: '/super-admin',
    avatar: 'from-brand-500 to-violet-600',
    badge: 'indigo',
  },
  school_admin: {
    label: 'School Admin',
    home: '/school-admin',
    avatar: 'from-teal-500 to-emerald-600',
    badge: 'emerald',
  },
  parent: {
    label: 'Parent',
    home: '/parent',
    avatar: 'from-fuchsia-500 to-pink-600',
    badge: 'violet',
  },
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        setProfile(res.data);
        setForm({
          name: res.data.user?.name || '',
          phone: res.data.user?.phone || '',
          address: res.data.user?.address || '',
        });
      } catch (err) {
        showToast(getErrorMessage(err, 'Failed to load profile'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await apiClient.put('/auth/me', form);
      setProfile((prev) => ({ ...prev, user: res.data.user }));
      updateUser({ name: res.data.user.name, phone: res.data.user.phone, address: res.data.user.address });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update profile');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.parent;
  const profileUser = profile?.user || user;
  const joinedDate = profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const initials = (profileUser?.name || profileUser?.email || 'U')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems = [
    { label: 'Dashboard', icon: <Icon.dashboard />, path: roleConfig.home },
    { label: 'My Profile', icon: <Icon.user />, path: '/profile', end: true },
    { label: 'Change Password', icon: <Icon.lock />, path: '/change-password' },
  ];

  const stats = profile?.stats;
  const children = profile?.children;

  return (
    <AppLayout navItems={navItems} title="My Profile" subtitle="View and manage your account details">
      <div className="space-y-8">
        <PageHeader
          title="My Profile"
          description="Your account details and role-specific information."
          icon={<Icon.user />}
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-5 w-2/3 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity card */}
            <div className="space-y-6">
              <Card className="p-6 text-center">
                <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${roleConfig.avatar} text-white text-2xl font-bold font-display flex items-center justify-center shadow-lg`}>
                  {initials}
                </div>
                <h2 className="mt-4 text-lg font-bold font-display text-slate-900 truncate">{profileUser?.name}</h2>
                <div className="mt-1.5 flex justify-center">
                  <Badge tone={roleConfig.badge}>{roleConfig.label}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-500 break-all">{profileUser?.email}</p>
                {joinedDate && (
                  <p className="mt-1 text-xs text-slate-400">Member since {joinedDate}</p>
                )}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate('/change-password')}
                    icon={<Icon.lock className="w-4 h-4" />}
                  >
                    Change Password
                  </Button>
                </div>
              </Card>

              {/* Role context */}
              {user?.role === 'super_admin' && stats && (
                <Card className="p-5">
                  <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                    <Icon.chart className="w-4 h-4 text-brand-600" />
                    Platform Overview
                  </h3>
                  <dl className="mt-3 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <dt className="text-slate-500">Total Schools</dt>
                      <dd className="font-semibold text-slate-800">{stats.totalSchools}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-slate-500">Approved</dt>
                      <dd className="font-semibold text-emerald-600">{stats.approvedSchools}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-slate-500">Pending Approval</dt>
                      <dd className="font-semibold text-amber-600">{stats.pendingSchools}</dd>
                    </div>
                  </dl>
                </Card>
              )}

              {user?.role === 'school_admin' && profileUser?.school && (
                <Card className="p-5">
                  <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                    <Icon.building className="w-4 h-4 text-teal-600" />
                    Your School
                  </h3>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{profileUser.school.name}</p>
                  <dl className="mt-2 space-y-1.5 text-sm text-slate-500">
                    {profileUser.school.address && <dd className="flex items-center gap-1.5 text-slate-500">{profileUser.school.address}</dd>}
                    {profileUser.school.contactEmail && <dd className="flex items-center gap-1.5"><Icon.mail className="w-3.5 h-3.5 text-slate-400" />{profileUser.school.contactEmail}</dd>}
                    {profileUser.school.contactPhone && <dd className="flex items-center gap-1.5"><Icon.phone className="w-3.5 h-3.5 text-slate-400" />{profileUser.school.contactPhone}</dd>}
                  </dl>
                </Card>
              )}

              {user?.role === 'parent' && profileUser?.school && (
                <Card className="p-5">
                  <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                    <Icon.school className="w-4 h-4 text-fuchsia-600" />
                    School
                  </h3>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{profileUser.school.name}</p>
                  {profileUser.school.address && <p className="mt-1 text-sm text-slate-500">{profileUser.school.address}</p>}
                </Card>
              )}
            </div>

            {/* Edit profile + role details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="card-header">
                  <h2 className="text-base font-bold font-display text-slate-900">Account Information</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Update your personal details. Your email cannot be changed.</p>
                </div>
                <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
                  <Field label="Full Name" htmlFor="pf-name" required>
                    <Input
                      id="pf-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Your full name"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Email Address" htmlFor="pf-email">
                      <Input id="pf-email" value={profileUser?.email || ''} disabled />
                    </Field>
                    <Field label="Phone" htmlFor="pf-phone">
                      <div className="relative">
                        <Icon.phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="pf-phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="pl-10"
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                    </Field>
                  </div>
                  <Field label="Address" htmlFor="pf-address">
                    <div className="relative">
                      <Icon.building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="pf-address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="pl-10"
                        placeholder="City, District"
                      />
                    </div>
                  </Field>

                  {error && (
                    <div className="px-3.5 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
                      <Icon.warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" loading={saving} icon={<Icon.check className="w-4 h-4" />}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Role-specific details */}
              {user?.role === 'super_admin' && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total Schools" value={stats.totalSchools} tone="brand" icon={<Icon.building />} />
                  <StatCard label="Approved" value={stats.approvedSchools} tone="emerald" icon={<Icon.check />} />
                  <StatCard label="Pending" value={stats.pendingSchools} tone="amber" icon={<Icon.clock />} />
                </div>
              )}

              {user?.role === 'school_admin' && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Students" value={stats.totalStudents} tone="brand" icon={<Icon.users />} />
                  <StatCard label="Invoices" value={stats.totalInvoices} tone="brand" icon={<Icon.receipt />} />
                  <StatCard label="Pending" value={`NPR ${stats.pendingAmount.toLocaleString()}`} tone="amber" icon={<Icon.clock />} />
                  <StatCard label="Collected" value={`NPR ${stats.paidAmount.toLocaleString()}`} tone="emerald" icon={<Icon.money />} />
                </div>
              )}

              {user?.role === 'parent' && (
                <Card>
                  <div className="card-header flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold font-display text-slate-900">Linked Children</h2>
                      <p className="mt-0.5 text-sm text-slate-500">Children currently linked to your account.</p>
                    </div>
                    <Badge tone="violet">{children?.length || 0}</Badge>
                  </div>
                  {!children || children.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Icon.users />
                      </div>
                      <p className="text-sm text-slate-500">No children linked yet.</p>
                      <Button className="mt-4" variant="secondary" onClick={() => navigate('/parent')} icon={<Icon.arrowLeft className="w-4 h-4 rotate-180" />}>
                        Link a child
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            {['Name', 'Student Code', 'Class', 'Section'].map((h) => (
                              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {children.map((child) => (
                            <tr key={child._id} className="hover:bg-slate-50/70 transition">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                                {child.firstName} {child.lastName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge tone="slate">{child.studentCode}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{child.className}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{child.section}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
