import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import KYCRequests from './KYCRequests';
import KYCPendingRequests from './KYCPendingRequests';
import CampaignsAdmin from './CampaignsAdmin';
import WithdrawalsAdmin from './WithdrawalsAdmin';
import UsersAdmin from './UsersAdmin';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import RefundsAdmin from './RefundsAdmin';
import AuditLogs from './AuditLogs';
import { DonationsAdmin, ReportsAdmin, CommentsAdmin, PlatformStatsAdmin, NotificationsAdmin, SettingsAdmin, ExportDataAdmin, AdminRoles } from './index';

// Helper to decode JWT and get email
function getAdminEmail() {
    const token = localStorage.getItem('adminToken');
    if (!token) return '';
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.email || '';
    } catch {
        return '';
    }
}

const AdminDashboardHome = ({ stats, loading, email }) => {
    // Sidebar links for quick navigation (match AdminSidebar)
    const adminLinks = [
        { label: 'Campaigns', path: '/admin/campaigns' },
        { label: 'KYC Requests', path: '/admin/kyc' },
        { label: 'Withdrawals', path: '/admin/withdrawals' },
        { label: 'Refunds', path: '/admin/refunds' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Donations', path: '/admin/donations' },
        { label: 'Reports', path: '/admin/reports' },
        { label: 'Comments', path: '/admin/reports/comments' },
        { label: 'Analytics', path: '/admin/analytics' },
        { label: 'Export Data', path: '/admin/analytics/export' },
        { label: 'Notifications', path: '/admin/notifications' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Admin Roles', path: '/admin/settings/roles' },
        { label: 'Audit Logs', path: '/admin/audit-logs' },
    ];
    // Stat cards
    const statCards = [
        { label: 'Total Users', value: loading ? '--' : stats.users?.total, color: 'indigo', icon: '👤' },
        { label: 'Admins', value: loading ? '--' : stats.users?.admins, color: 'emerald', icon: '🛡️' },
        { label: 'Pending KYC', value: loading ? '--' : stats.users?.pendingKYC, color: 'yellow', icon: '📝' },
        { label: 'Total Campaigns', value: loading ? '--' : stats.campaigns?.total, color: 'blue', icon: '📢' },
        { label: 'Active Campaigns', value: loading ? '--' : stats.campaigns?.active, color: 'green', icon: '✅' },
        { label: 'Pending Campaigns', value: loading ? '--' : stats.campaigns?.pending, color: 'orange', icon: '⏳' },
        { label: 'Completed Campaigns', value: loading ? '--' : stats.campaigns?.completed, color: 'gray', icon: '🏁' },
        { label: 'Total Donations', value: loading ? '--' : stats.donations?.total, color: 'pink', icon: '💸' },
        { label: 'Funds Raised', value: loading ? '--' : `₹${Number(stats.donations?.amountRaised || 0).toLocaleString()}`, color: 'purple', icon: '💰' },
    ];
    return (
        <main className="flex-1 p-8 bg-gradient-to-br from-indigo-50 to-emerald-50 min-h-screen">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-indigo-700">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center font-bold text-indigo-700">A</span>
                    <span className="text-gray-700 font-medium">{email}</span>
                </div>
            </header>
            {/* Stat cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map(card => (
                    <div key={card.label} className={`bg-white p-6 rounded-xl shadow flex flex-col items-center border-t-4 border-${card.color}-400`}>
                        <div className="text-3xl mb-2">{card.icon}</div>
                        <div className="text-lg font-semibold text-gray-700">{card.label}</div>
                        <div className={`text-2xl font-bold text-${card.color}-700 mt-2`}>{card.value}</div>
                    </div>
                ))}
            </section>
            {/* Quick Actions */}
            <section className="mb-8">
                <div className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="font-semibold text-indigo-700 text-lg mb-2 md:mb-0">Quick Actions</div>
                    <div className="flex gap-4 flex-wrap">
                        <a href="/admin/kyc" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold">Approve KYC</a>
                        <a href="/admin/campaigns" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Review Campaigns</a>
                        <a href="/admin/notifications" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold">Send Notification</a>
                        <a href="/admin/analytics" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold">View Analytics</a>
                        <a href="/admin/settings" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold">Platform Settings</a>
                    </div>
                </div>
            </section>
            {/* All Admin Links */}
            <section>
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="font-semibold text-indigo-700 text-lg mb-4">Go to Admin Pages</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {adminLinks.map(link => (
                            <a key={link.label} href={link.path} className="block bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg px-4 py-3 text-center shadow transition">
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

const AdminPage = () => {
    const email = getAdminEmail();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch('/api/admin/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setStats(data.data.statistics); // Pass the full statistics object
                } else {
                    setStats({});
                }
            } catch {
                setStats({});
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <ProtectedAdminRoute>
                <Routes>
                    <Route index element={<AdminDashboardHome stats={stats} loading={loading} email={email} />} />
                    <Route path="kyc" element={<KYCRequests />} />
                    <Route path="kyc/pending" element={<KYCPendingRequests />} />
                    <Route path="kyc/approved" element={<KYCRequests />} />
                    <Route path="kyc/rejected" element={<KYCRequests />} />
                    <Route path="campaigns" element={<CampaignsAdmin />} />
                    <Route path="campaigns/voting" element={<CampaignsAdmin votingFilter="voting" />} />
                    <Route path="campaigns/nonvoting" element={<CampaignsAdmin votingFilter="nonvoting" />} />
                    <Route path="withdrawals" element={<WithdrawalsAdmin />} />
                    <Route path="users" element={<UsersAdmin />} />
                    <Route path="refunds" element={<RefundsAdmin />} />
                    <Route path="donations" element={<DonationsAdmin />} />
                    <Route path="reports" element={<ReportsAdmin />} />
                    <Route path="reports/comments" element={<CommentsAdmin />} />
                    <Route path="analytics" element={<PlatformStatsAdmin />} />
                    <Route path="analytics/export" element={<ExportDataAdmin />} />
                    <Route path="notifications" element={<NotificationsAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                    <Route path="settings/roles" element={<AdminRoles />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                </Routes>
            </ProtectedAdminRoute>
        </div>
    );
};

export default AdminPage; 