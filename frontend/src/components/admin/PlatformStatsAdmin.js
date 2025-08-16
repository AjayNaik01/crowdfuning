import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { UserGroupIcon, CurrencyRupeeIcon, ChartBarIcon, SparklesIcon, MapIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/solid';
import adminFetch from './adminFetch';

const COLORS = ['#6366F1', '#10B981', '#F59E42', '#F43F5E'];

function PlatformStatsAdmin() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: { total: 0, admins: 0, regularUsers: 0, pendingKYC: 0 },
        campaigns: { total: 0, active: 0, pending: 0, completed: 0, rejected: 0 },
        donations: { total: 0, amountRaised: 0 },
        recentActivities: { users: [], campaigns: [], donations: [] }
    });
    const [campaigns, setCampaigns] = useState([]);
    const [donations, setDonations] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        fetchCampaigns();
        fetchDonations();
        fetchUsers();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await adminFetch('/api/admin/dashboard');
            const data = await response.json();
            if (data.success) {
                setStats({
                    ...data.data.statistics,
                    recentActivities: data.data.recentActivities
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const response = await adminFetch('/api/admin/campaigns');
            const data = await response.json();
            if (data.success) {
                setCampaigns(data.data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    const fetchDonations = async () => {
        try {
            const response = await adminFetch('/api/donations/admin-all?page=1&limit=1000');
            const data = await response.json();
            if (data.success) {
                setDonations(data.data.donations || []);
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await adminFetch('/api/admin/users');
            const data = await response.json();
            if (data.success) {
                setUsers(data.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Process real data for charts
    const getCategoryData = () => {
        const categoryCount = {};
        campaigns.forEach(campaign => {
            const category = campaign.category || 'Other';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        return Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
    };

    const getStatusData = () => {
        const statusCount = {};
        campaigns.forEach(campaign => {
            const status = campaign.status || 'Unknown';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
    };

    const getTopCampaigns = () => {
        return campaigns
            .filter(c => c.currentAmount > 0)
            .sort((a, b) => b.currentAmount - a.currentAmount)
            .slice(0, 5)
            .map(campaign => ({
                name: campaign.title,
                amount: campaign.currentAmount
            }));
    };

    const getTopDonors = () => {
        const donorTotals = {};
        donations.forEach(donation => {
            const donorName = donation.donor?.name || donation.donorName || 'Anonymous';
            donorTotals[donorName] = (donorTotals[donorName] || 0) + donation.amount;
        });
        return Object.entries(donorTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));
    };

    const getGrowthData = () => {
        // Group by month for the last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentMonth = new Date().getMonth();

        return months.map((month, index) => {
            const monthIndex = (currentMonth - 5 + index + 12) % 12;
            const monthDate = new Date(new Date().getFullYear(), monthIndex, 1);

            const monthUsers = users.filter(user => {
                const userDate = new Date(user.createdAt);
                return userDate.getMonth() === monthIndex && userDate.getFullYear() === new Date().getFullYear();
            }).length;

            const monthCampaigns = campaigns.filter(campaign => {
                const campaignDate = new Date(campaign.createdAt);
                return campaignDate.getMonth() === monthIndex && campaignDate.getFullYear() === new Date().getFullYear();
            }).length;

            const monthDonations = donations.filter(donation => {
                const donationDate = new Date(donation.createdAt);
                return donationDate.getMonth() === monthIndex && donationDate.getFullYear() === new Date().getFullYear();
            }).length;

            return {
                date: month,
                users: monthUsers,
                campaigns: monthCampaigns,
                donations: monthDonations
            };
        });
    };

    const getUserGrowthData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentMonth = new Date().getMonth();
        let cumulativeUsers = 0;

        return months.map((month, index) => {
            const monthIndex = (currentMonth - 5 + index + 12) % 12;
            const monthUsers = users.filter(user => {
                const userDate = new Date(user.createdAt);
                return userDate.getMonth() === monthIndex && userDate.getFullYear() === new Date().getFullYear();
            }).length;

            cumulativeUsers += monthUsers;
            return {
                date: month,
                users: cumulativeUsers
            };
        });
    };

    // Stat cards with real data
    const statCards = [
        {
            label: 'Total Users',
            value: stats.users?.total || 0,
            icon: <UserGroupIcon className="w-8 h-8 text-indigo-600" />
        },
        {
            label: 'Total Campaigns',
            value: stats.campaigns?.total || 0,
            icon: <ChartBarIcon className="w-8 h-8 text-emerald-600" />
        },
        {
            label: 'Total Donations',
            value: stats.donations?.total || 0,
            icon: <CurrencyRupeeIcon className="w-8 h-8 text-yellow-500" />
        },
        {
            label: 'Funds Raised',
            value: stats.donations?.amountRaised || 0,
            icon: <SparklesIcon className="w-8 h-8 text-pink-500" />
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const refreshData = () => {
        setLoading(true);
        fetchDashboardData();
        fetchCampaigns();
        fetchDonations();
        fetchUsers();
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-emerald-50 flex flex-col px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Platform Analytics</h2>
                <button
                    onClick={refreshData}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'trends'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Trends
                    </button>
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Campaigns
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Users
                    </button>
                </nav>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((card, index) => (
                                <motion.div
                                    key={card.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl shadow-xl p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{card.label}</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {card.label === 'Funds Raised' ? (
                                                    <CountUp end={card.value} prefix="₹" separator="," />
                                                ) : (
                                                    <CountUp end={card.value} separator="," />
                                                )}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-xl">
                                            {card.icon}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Campaign Categories */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Categories</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={getCategoryData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getCategoryData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Campaign Status */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={getStatusData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getStatusData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {stats.recentActivities?.users?.slice(0, 5).map((user, index) => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-600">New user registered</p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </motion.div>
                                ))}
                                {stats.recentActivities?.campaigns?.slice(0, 5).map((campaign, index) => (
                                    <motion.div
                                        key={campaign._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{campaign.title}</p>
                                            <p className="text-xs text-gray-600">New campaign created</p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(campaign.createdAt).toLocaleDateString()}
                                        </span>
                                    </motion.div>
                                ))}
                                {stats.recentActivities?.donations?.slice(0, 5).map((donation, index) => (
                                    <motion.div
                                        key={donation._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                ₹{donation.amount} donated
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                by {donation.donor?.name || donation.donorName || 'Anonymous'}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'trends' && (
                    <motion.div
                        key="trends"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Growth Trends */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends (Last 6 Months)</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={getGrowthData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="users" stroke="#6366F1" strokeWidth={2} />
                                    <Line type="monotone" dataKey="campaigns" stroke="#10B981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="donations" stroke="#F59E42" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* User Growth */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative User Growth</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={getUserGrowthData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="users" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <motion.div
                        key="campaigns"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Top Campaigns */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campaigns by Funds Raised</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={getTopCampaigns()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                                    <Bar dataKey="amount" fill="#6366F1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Top Donors */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Donors</h3>
                            <div className="space-y-4">
                                {getTopDonors().map((donor, index) => (
                                    <motion.div
                                        key={donor.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-semibold text-indigo-600">
                                                    {donor.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900">{donor.name}</span>
                                        </div>
                                        <span className="text-lg font-bold text-indigo-600">
                                            ₹{donor.amount.toLocaleString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ExportDataAdmin() {
    const [exporting, setExporting] = useState('');
    const [msg, setMsg] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [exportFormat, setExportFormat] = useState('csv');
    const [selectedExports, setSelectedExports] = useState([]);
    const [bulkExporting, setBulkExporting] = useState(false);

    // Helper to export CSV
    const exportCSV = async (type) => {
        setExporting(type);
        setMsg('');
        let url = '';
        let headers = [];
        let formatRow = (row) => row;

        // Add date range to URL if specified
        const dateParams = dateRange.start && dateRange.end
            ? `&startDate=${dateRange.start}&endDate=${dateRange.end}`
            : '';

        switch (type) {
            case 'users':
                url = `/api/admin/users?page=1&limit=10000${dateParams}`;
                headers = ['Name', 'Email', 'Role', 'KYC Status', 'Phone', 'Created At', 'Last Login'];
                formatRow = (u) => [
                    u.name,
                    u.email,
                    u.role,
                    u.kycStatus,
                    u.phone || '',
                    new Date(u.createdAt).toLocaleDateString('en-IN'),
                    u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : ''
                ];
                break;
            case 'campaigns':
                url = `/api/admin/campaigns?page=1&limit=10000${dateParams}`;
                headers = ['Title', 'Creator', 'Email', 'Status', 'Category', 'Target Amount', 'Current Amount', 'Progress %', 'Start Date', 'End Date', 'Created At'];
                formatRow = (c) => [
                    c.title,
                    c.creator?.name,
                    c.creator?.email,
                    c.status,
                    c.category,
                    c.targetAmount,
                    c.currentAmount,
                    c.targetAmount > 0 ? Math.round((c.currentAmount / c.targetAmount) * 100) : 0,
                    c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : '',
                    c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : '',
                    new Date(c.createdAt).toLocaleDateString('en-IN')
                ];
                break;
            case 'donations':
                url = `/api/donations/admin-all?page=1&limit=10000${dateParams}`;
                headers = ['Campaign', 'Donor Name', 'Donor Email', 'Amount', 'Payment Method', 'Transaction ID', 'Date', 'Status', 'Anonymous'];
                formatRow = (d) => [
                    d.campaign?.title,
                    d.donor?.name || d.donorName,
                    d.donor?.email,
                    d.amount,
                    d.paymentMethod || '',
                    d.transactionId || '',
                    new Date(d.createdAt).toLocaleDateString('en-IN'),
                    d.paymentStatus,
                    d.isAnonymous ? 'Yes' : 'No'
                ];
                break;
            case 'withdrawals':
                url = `/api/admin/withdrawals${dateParams}`;
                headers = ['Campaign', 'Requested By', 'Email', 'Amount', 'Status', 'Request Date', 'Processed Date', 'Notes'];
                formatRow = (w) => [
                    w.campaign?.title,
                    w.requester?.name,
                    w.requester?.email,
                    w.amount,
                    w.status,
                    new Date(w.createdAt).toLocaleDateString('en-IN'),
                    w.processedAt ? new Date(w.processedAt).toLocaleDateString('en-IN') : '',
                    w.notes || ''
                ];
                break;
            case 'reports':
                url = `/api/reports?page=1&limit=10000${dateParams}`;
                headers = ['Campaign', 'Reporter Name', 'Reporter Email', 'Reason', 'Status', 'Report Date', 'Resolved Date'];
                formatRow = (r) => [
                    r.campaignId?.title,
                    r.reporterName,
                    r.reporterId?.email,
                    r.reason,
                    r.status,
                    new Date(r.createdAt).toLocaleDateString('en-IN'),
                    r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString('en-IN') : ''
                ];
                break;
            case 'comments':
                url = `/api/admin/comments?page=1&limit=10000${dateParams}`;
                headers = ['Campaign', 'Commenter Name', 'Commenter Email', 'Comment', 'Date', 'Status'];
                formatRow = (c) => [
                    c.campaignId?.title,
                    c.userId?.name,
                    c.userId?.email,
                    c.content,
                    new Date(c.createdAt).toLocaleDateString('en-IN'),
                    c.status || 'active'
                ];
                break;
            case 'kyc':
                url = `/api/admin/kyc-requests${dateParams}`;
                headers = ['User Name', 'Email', 'KYC Status', 'Document Type', 'Submitted Date', 'Verified Date', 'Rejection Reason'];
                formatRow = (k) => [
                    k.userId?.name,
                    k.userId?.email,
                    k.status,
                    k.documentType || 'ID Card',
                    new Date(k.createdAt).toLocaleDateString('en-IN'),
                    k.verifiedAt ? new Date(k.verifiedAt).toLocaleDateString('en-IN') : '',
                    k.rejectionReason || ''
                ];
                break;
            case 'analytics':
                // Export analytics summary
                headers = ['Metric', 'Value', 'Date'];
                const analyticsData = [
                    ['Total Users', 'Calculated from users export', new Date().toLocaleDateString('en-IN')],
                    ['Total Campaigns', 'Calculated from campaigns export', new Date().toLocaleDateString('en-IN')],
                    ['Total Donations', 'Calculated from donations export', new Date().toLocaleDateString('en-IN')],
                    ['Total Funds Raised', 'Calculated from donations export', new Date().toLocaleDateString('en-IN')],
                    ['Pending KYC', 'Calculated from KYC export', new Date().toLocaleDateString('en-IN')],
                    ['Active Campaigns', 'Calculated from campaigns export', new Date().toLocaleDateString('en-IN')]
                ];
                const csvContent = [headers, ...analyticsData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const urlObj = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = urlObj;
                a.download = `analytics_summary_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(urlObj);
                setMsg('Analytics summary exported!');
                setExporting('');
                return;
            default:
                return;
        }
        try {
            const res = await adminFetch(url);
            const data = await res.json();
            let rows = [];
            if (type === 'users') rows = data.data?.users || [];
            if (type === 'campaigns') rows = data.data?.campaigns || [];
            if (type === 'donations') rows = data.data?.donations || [];
            if (type === 'withdrawals') rows = data.data || [];
            if (type === 'reports') rows = data.data?.reports || [];
            if (type === 'comments') rows = data.data?.comments || [];
            if (type === 'kyc') rows = data.data || [];

            const csvData = rows.map(formatRow);
            const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell ?? ''}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const urlObj = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlObj;
            a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(urlObj);
            setMsg(`Export successful! ${rows.length} records exported.`);
        } catch (err) {
            console.error('Export error:', err);
            setMsg('Export failed. Please try again.');
        }
        setExporting('');
    };

    const exportTypes = [
        { id: 'users', label: 'Users', color: 'indigo' },
        { id: 'campaigns', label: 'Campaigns', color: 'emerald' },
        { id: 'donations', label: 'Donations', color: 'yellow' },
        { id: 'withdrawals', label: 'Withdrawals', color: 'indigo' },
        { id: 'reports', label: 'Reports', color: 'red' },
        { id: 'comments', label: 'Comments', color: 'blue' },
        { id: 'kyc', label: 'KYC Requests', color: 'purple' },
        { id: 'analytics', label: 'Analytics Summary', color: 'green' }
    ];

    const handleBulkExport = async () => {
        if (selectedExports.length === 0) {
            setMsg('Please select at least one export type.');
            return;
        }

        setBulkExporting(true);
        setMsg('Starting bulk export...');

        for (const exportType of selectedExports) {
            try {
                await exportCSV(exportType);
                // Small delay between exports
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error exporting ${exportType}:`, error);
            }
        }

        setBulkExporting(false);
        setMsg(`Bulk export completed! ${selectedExports.length} files exported.`);
        setSelectedExports([]);
    };

    const toggleExportSelection = (exportType) => {
        setSelectedExports(prev =>
            prev.includes(exportType)
                ? prev.filter(type => type !== exportType)
                : [...prev, exportType]
        );
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-emerald-50 flex flex-col px-8 py-8">
            <h2 className="text-3xl font-extrabold mb-8 text-indigo-800 tracking-tight">Export Data</h2>
            {msg && <div className="mb-6 px-4 py-2 bg-green-100 text-green-800 rounded font-semibold w-fit">{msg}</div>}

            {/* Date Range Filter */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Leave dates empty to export all data. Set date range to filter exports by specific period.
                </p>
            </div>

            {/* Bulk Export Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Export</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {exportTypes.map((type) => (
                        <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedExports.includes(type.id)}
                                onChange={() => toggleExportSelection(type.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{type.label}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleBulkExport}
                        disabled={bulkExporting || selectedExports.length === 0}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {bulkExporting ? 'Exporting...' : `Export Selected (${selectedExports.length})`}
                    </button>
                    <button
                        onClick={() => setSelectedExports(exportTypes.map(t => t.id))}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
                    >
                        Select All
                    </button>
                    <button
                        onClick={() => setSelectedExports([])}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-semibold"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Users */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">Users</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all registered users with their roles, KYC status, and registration date.</p>
                    <button
                        onClick={() => exportCSV('users')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold w-full"
                        disabled={exporting === 'users'}
                    >
                        {exporting === 'users' ? 'Exporting...' : 'Export Users CSV'}
                    </button>
                </div>
                {/* Campaigns */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">Campaigns</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all campaigns with creator, status, category, and fundraising details.</p>
                    <button
                        onClick={() => exportCSV('campaigns')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold w-full"
                        disabled={exporting === 'campaigns'}
                    >
                        {exporting === 'campaigns' ? 'Exporting...' : 'Export Campaigns CSV'}
                    </button>
                </div>
                {/* Donations */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">Donations</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all donations with campaign, donor, amount, and status.</p>
                    <button
                        onClick={() => exportCSV('donations')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold w-full"
                        disabled={exporting === 'donations'}
                    >
                        {exporting === 'donations' ? 'Exporting...' : 'Export Donations CSV'}
                    </button>
                </div>
                {/* Withdrawals */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">Withdrawals</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all withdrawal requests with campaign, requester, amount, and status.</p>
                    <button
                        onClick={() => exportCSV('withdrawals')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold w-full"
                        disabled={exporting === 'withdrawals'}
                    >
                        {exporting === 'withdrawals' ? 'Exporting...' : 'Export Withdrawals CSV'}
                    </button>
                </div>

                {/* Reports */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-red-700 mb-2">Reports</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all campaign reports with reporter details, reasons, and resolution status.</p>
                    <button
                        onClick={() => exportCSV('reports')}
                        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold w-full"
                        disabled={exporting === 'reports'}
                    >
                        {exporting === 'reports' ? 'Exporting...' : 'Export Reports CSV'}
                    </button>
                </div>

                {/* Comments */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-blue-700 mb-2">Comments</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all campaign comments with commenter details and moderation status.</p>
                    <button
                        onClick={() => exportCSV('comments')}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold w-full"
                        disabled={exporting === 'comments'}
                    >
                        {exporting === 'comments' ? 'Exporting...' : 'Export Comments CSV'}
                    </button>
                </div>

                {/* KYC Requests */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-purple-700 mb-2">KYC Requests</h3>
                    <p className="text-gray-500 mb-4 text-center">Export all KYC verification requests with user details and verification status.</p>
                    <button
                        onClick={() => exportCSV('kyc')}
                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 font-semibold w-full"
                        disabled={exporting === 'kyc'}
                    >
                        {exporting === 'kyc' ? 'Exporting...' : 'Export KYC CSV'}
                    </button>
                </div>

                {/* Analytics Summary */}
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-green-700 mb-2">Analytics Summary</h3>
                    <p className="text-gray-500 mb-4 text-center">Export platform analytics summary with key metrics and statistics.</p>
                    <button
                        onClick={() => exportCSV('analytics')}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold w-full"
                        disabled={exporting === 'analytics'}
                    >
                        {exporting === 'analytics' ? 'Exporting...' : 'Export Analytics CSV'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export { PlatformStatsAdmin, ExportDataAdmin }; 