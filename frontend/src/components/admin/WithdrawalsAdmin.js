import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper to fetch with admin token
function adminFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            'Authorization': 'Bearer ' + token
        }
    });
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

const payoutStatusColors = {
    pending: 'bg-orange-100 text-orange-800',
    processed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    reversed: 'bg-gray-100 text-gray-700',
};

const VotingProgressBar = ({ approveCount, rejectCount }) => {
    const total = approveCount + rejectCount;
    const approvePercent = total ? (approveCount / total) * 100 : 0;
    const rejectPercent = total ? (rejectCount / total) * 100 : 0;
    return (
        <div className="w-full bg-gray-200 rounded h-3 mb-1 flex overflow-hidden">
            <div className="bg-emerald-400 h-3" style={{ width: `${approvePercent}%` }} />
            <div className="bg-red-400 h-3" style={{ width: `${rejectPercent}%` }} />
        </div>
    );
};

function WithdrawalsAdmin() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [showVotesModal, setShowVotesModal] = useState(false);
    const [votesCampaign, setVotesCampaign] = useState(null);
    const [userKycData, setUserKycData] = useState(null);
    const [loadingKyc, setLoadingKyc] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedWithdrawalDetails, setSelectedWithdrawalDetails] = useState(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [notifyFeedback, setNotifyFeedback] = useState('');
    const [notifyCampaignId, setNotifyCampaignId] = useState(null);

    // New state for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedWithdrawals, setSelectedWithdrawals] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        pendingAmount: 0
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    useEffect(() => {
        applyFilters();
        calculateStats();
    }, [withdrawals, searchTerm, statusFilter, dateRange, sortBy, sortOrder]);

    const fetchWithdrawals = async () => {
        try {
            const response = await adminFetch('http://localhost:5001/api/admin/withdrawals');
            const data = await response.json();
            const withdrawalsData = data.data || [];
            setWithdrawals(withdrawalsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...withdrawals];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(w =>
                w.campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.requester?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.rejectionReason?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter (fix: only show matching status)
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(w => w.status === statusFilter);
        }

        // Date range filter
        if (dateRange.start) {
            filtered = filtered.filter(w => new Date(w.createdAt) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            filtered = filtered.filter(w => new Date(w.createdAt) <= new Date(dateRange.end));
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'campaign':
                    aValue = a.campaign?.title || '';
                    bValue = b.campaign?.title || '';
                    break;
                case 'requester':
                    aValue = a.requester?.name || '';
                    bValue = b.requester?.name || '';
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredWithdrawals(filtered);
    };

    const calculateStats = () => {
        const stats = {
            total: withdrawals.length,
            pending: withdrawals.filter(w => w.status === 'pending').length,
            approved: withdrawals.filter(w => w.status === 'approved').length,
            rejected: withdrawals.filter(w => w.status === 'rejected').length,
            totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
            pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
        };
        setStats(stats);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedWithdrawals(filteredWithdrawals.map(w => w._id));
        } else {
            setSelectedWithdrawals([]);
        }
    };

    const handleSelectWithdrawal = (withdrawalId, checked) => {
        if (checked) {
            setSelectedWithdrawals([...selectedWithdrawals, withdrawalId]);
        } else {
            setSelectedWithdrawals(selectedWithdrawals.filter(id => id !== withdrawalId));
        }
    };

    const exportToCSV = () => {
        const headers = ['Campaign', 'Requester', 'Amount', 'Status', 'Reason', 'Rejection Reason', 'Date'];
        const csvData = filteredWithdrawals.map(w => [
            w.campaign?.title || 'N/A',
            w.requester?.name || 'N/A',
            w.amount,
            w.status,
            w.reason || 'N/A',
            w.rejectionReason || 'N/A',
            new Date(w.createdAt).toLocaleDateString()
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateRange({ start: '', end: '' });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const openDetailsModal = (withdrawal) => {
        setSelectedWithdrawalDetails(withdrawal);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedWithdrawalDetails(null);
    };

    const fetchUserKycData = async (userId) => {
        setLoadingKyc(true);
        console.log('Fetching KYC data for userId:', userId);
        try {
            const response = await adminFetch(`http://localhost:5001/api/admin/users/${userId}/kyc`);
            const data = await response.json();
            console.log('KYC API response:', data);
            if (data.success) {
                setUserKycData(data.data);
            } else {
                console.log('KYC API failed:', data.message);
                setUserKycData(null);
            }
        } catch (error) {
            console.error('Error fetching KYC data:', error);
            setUserKycData(null);
        } finally {
            setLoadingKyc(false);
        }
    };

    const handleApprove = async (id) => {
        setApprovingId(id);
        // Find the withdrawal to get campaign creator ID
        const withdrawal = withdrawals.find(w => w._id === id);
        console.log('Withdrawal found:', withdrawal);
        console.log('Campaign data:', withdrawal?.campaign);

        if (withdrawal && withdrawal.campaign && withdrawal.campaign.creator) {
            const creatorId = withdrawal.campaign.creator._id || withdrawal.campaign.creator;
            console.log('Extracted campaign creator ID:', creatorId);
            await fetchUserKycData(creatorId);
        } else {
            console.log('No campaign creator found in withdrawal');
            console.log('Withdrawal campaign data:', withdrawal?.campaign);
            console.log('Campaign creator data:', withdrawal?.campaign?.creator);
        }
        setShowApproveModal(true);
    };

    const submitApprove = async () => {
        try {
            const response = await adminFetch(`http://localhost:5001/api/admin/withdrawals/${approvingId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                // Update the withdrawal in the list
                setWithdrawals(withdrawals.map(w =>
                    w._id === approvingId
                        ? {
                            ...w,
                            status: 'approved',
                            payoutId: result.data.payoutId,
                            payoutStatus: result.data.payoutStatus
                        }
                        : w
                ));
                setShowApproveModal(false);
                setApprovingId(null);
                setUserKycData(null);
                alert('Withdrawal approved and payout initiated successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            alert('Failed to approve withdrawal. Please try again.');
        }
    };

    const handleReject = (id) => {
        setRejectingId(id);
        setShowRejectModal(true);
        setRejectReason('');
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please enter a rejection reason');
            return;
        }

        try {
            const response = await adminFetch(`http://localhost:5001/api/admin/withdrawals/${rejectingId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectionReason: rejectReason })
            });

            const result = await response.json();

            if (result.success) {
                setWithdrawals(withdrawals.map(w =>
                    w._id === rejectingId
                        ? { ...w, status: 'rejected', rejectionReason: rejectReason }
                        : w
                ));
                setShowRejectModal(false);
                setRejectingId(null);
                setRejectReason('');
                alert('Withdrawal rejected successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            alert('Failed to reject withdrawal. Please try again.');
        }
    };

    const openVotesModal = (campaign) => {
        setVotesCampaign(campaign);
        setShowVotesModal(true);
    };

    const closeVotesModal = () => {
        setShowVotesModal(false);
        setVotesCampaign(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Helper to get all campaign IDs missing proof documents
    const getCampaignsMissingProofDocs = () => {
        const ids = withdrawals
            .filter(w => w.campaign && (!w.campaign.proofDocuments || w.campaign.proofDocuments.length === 0))
            .map(w => w.campaign._id)
            .filter((id, idx, arr) => id && arr.indexOf(id) === idx); // unique
        return ids;
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Withdrawal Requests</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                        Showing {filteredWithdrawals.length} of {withdrawals.length} requests
                    </span>
                    <button
                        onClick={fetchWithdrawals}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(stats.pendingAmount)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Rejected</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search campaigns, users, reasons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                            Export CSV
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setStatusFilter('approved')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'approved'
                                ? 'bg-green-500 text-white'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                        >
                            Approved ({stats.approved})
                        </button>
                        <button
                            onClick={() => setStatusFilter('rejected')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                        >
                            Rejected ({stats.rejected})
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/80 backdrop-blur-xl">
                <table className="min-w-full divide-y divide-indigo-100">
                    <thead className="bg-indigo-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Campaign</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Requester</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Proof Docs</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Voting</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Rejection Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWithdrawals.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="text-center py-12 text-gray-400">No withdrawals found.</td>
                            </tr>
                        ) : (
                            filteredWithdrawals.map(w => (
                                <tr key={w._id} className="transition-all duration-500 ease-in-out hover:bg-emerald-50">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{w.campaign?.title || w.campaign || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{w.campaign?._id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{w.requester?.name || w.requester || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{w.requester?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{formatCurrency(w.amount)}</div>
                                        <div className="text-xs text-gray-500">{w.reason}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${statusColors[w.status] || 'bg-gray-100 text-gray-500'}`}>{w.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            className="mt-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs transition"
                                            onClick={() => {
                                                if (w.campaign && w.campaign._id) {
                                                    window.open(`/admin/campaigns/${w.campaign._id}/documents`, '_blank');
                                                } else {
                                                    alert('Campaign ID not found for this withdrawal.');
                                                }
                                            }}
                                        >
                                            View Docs
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            let vr = w.campaign?.voteResults;
                                            const votes = w.campaign?.votes || [];
                                            let approveCount = vr?.approveCount;
                                            let rejectCount = vr?.rejectCount;
                                            if (typeof approveCount !== 'number' || typeof rejectCount !== 'number') {
                                                approveCount = votes.filter(v => v.vote === 'approve').length;
                                                rejectCount = votes.filter(v => v.vote === 'reject').length;
                                            }
                                            if (approveCount === 0 && rejectCount === 0) {
                                                return <span className="text-xs text-gray-500">No votes yet</span>;
                                            }
                                            if (approveCount > rejectCount) {
                                                return <span className="text-xs font-bold text-green-700">Majority: Approve</span>;
                                            }
                                            if (rejectCount > approveCount) {
                                                return <span className="text-xs font-bold text-red-700">Majority: Reject</span>;
                                            }
                                            return <span className="text-xs font-bold text-yellow-700">Tie</span>;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-red-600">{w.rejectionReason || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            {w.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(w._id)}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow focus-visible:outline-indigo-500 transition"
                                                >
                                                    Approve & Pay (KYC)
                                                </button>
                                            )}
                                            {w.status === 'pending' && (
                                                <button
                                                    onClick={() => handleReject(w._id)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded shadow focus-visible:outline-indigo-500 transition"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Approve Modal with KYC Data */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-emerald-700">Approve Withdrawal & Initiate Payout</h3>

                        {loadingKyc ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading KYC data...</p>
                            </div>
                        ) : userKycData ? (
                            <div className="space-y-6">
                                <div className="bg-emerald-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-emerald-800 mb-3">Beneficiary Details (from KYC)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                            <p className="text-sm text-gray-900 font-mono">{userKycData.accountNumber}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                            <p className="text-sm text-gray-900 font-mono">{userKycData.ifsc}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                                            <p className="text-sm text-gray-900">{userKycData.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                            <p className="text-sm text-gray-900">{userKycData.phone}</p>
                                        </div>
                                        {userKycData.bankName && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                                <p className="text-sm text-gray-900">{userKycData.bankName}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Confirmation</h4>
                                    <p className="text-sm text-yellow-700">
                                        This will initiate a payout of {formatCurrency(withdrawals.find(w => w._id === approvingId)?.amount || 0)}
                                        to the above bank account using the user's verified KYC data.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-red-800 mb-2">❌ KYC Data Not Found</h4>
                                <p className="text-sm text-red-700">
                                    The user must complete KYC verification with bank account details before withdrawal can be approved.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 mt-6">
                            {userKycData && (
                                <button
                                    onClick={submitApprove}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium"
                                >
                                    Approve & Pay
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setApprovingId(null);
                                    setUserKycData(null);
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-2 text-red-700">Reject Withdrawal</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason (required)"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={submitReject}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Votes Modal */}
            {showVotesModal && votesCampaign && votesCampaign.isVotingEnabled && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-indigo-700">Voting Results for {votesCampaign.title}</h3>
                            <button
                                onClick={closeVotesModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                <span className="font-semibold text-green-800">Approve Votes</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {votesCampaign.voteResults?.approveCount || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                                <span className="font-semibold text-red-800">Reject Votes</span>
                                <span className="text-2xl font-bold text-red-600">
                                    {votesCampaign.voteResults?.rejectCount || 0}
                                </span>
                            </div>
                            <VotingProgressBar
                                approveCount={votesCampaign.voteResults?.approveCount || 0}
                                rejectCount={votesCampaign.voteResults?.rejectCount || 0}
                            />
                            {/* Voter details table */}
                            {Array.isArray(votesCampaign.votes) && votesCampaign.votes.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-indigo-800 mb-2">Voter Details</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Vote</th>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Comment</th>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Voted At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {votesCampaign.votes.map((v, idx) => (
                                                    <tr key={idx} className="bg-white even:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm">{v.voter?.name || '-'}</td>
                                                        <td className="px-4 py-2 text-sm">{v.voter?.email || '-'}</td>
                                                        <td className="px-4 py-2 text-sm capitalize">{v.vote}</td>
                                                        <td className="px-4 py-2 text-sm">{v.comment || '-'}</td>
                                                        <td className="px-4 py-2 text-sm">{v.votedAt ? new Date(v.votedAt).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedWithdrawalDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Withdrawal Details</h3>
                            <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-3">Basic Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Campaign:</span> {selectedWithdrawalDetails.campaign?.title || 'N/A'}</div>
                                        <div><span className="font-medium">Requester:</span> {selectedWithdrawalDetails.requester?.name || 'N/A'}</div>
                                        <div><span className="font-medium">Email:</span> {selectedWithdrawalDetails.requester?.email || 'N/A'}</div>
                                        <div><span className="font-medium">Amount:</span> {formatCurrency(selectedWithdrawalDetails.amount)}</div>
                                        <div><span className="font-medium">Reason:</span> {selectedWithdrawalDetails.reason || 'N/A'}</div>
                                        <div><span className="font-medium">Status:</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${statusColors[selectedWithdrawalDetails.status]}`}>
                                                {selectedWithdrawalDetails.status}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">Created:</span> {new Date(selectedWithdrawalDetails.createdAt).toLocaleString()}</div>
                                        {selectedWithdrawalDetails.adminApprovedAt && (
                                            <div><span className="font-medium">Processed:</span> {new Date(selectedWithdrawalDetails.adminApprovedAt).toLocaleString()}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Payout Information */}
                                {selectedWithdrawalDetails.payoutId && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-3">Payout Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Payout ID:</span> {selectedWithdrawalDetails.payoutId}</div>
                                            <div><span className="font-medium">Payout Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${payoutStatusColors[selectedWithdrawalDetails.payoutStatus]}`}>
                                                    {selectedWithdrawalDetails.payoutStatus}
                                                </span>
                                            </div>
                                            {selectedWithdrawalDetails.beneficiaryDetails && (
                                                <>
                                                    <div><span className="font-medium">Account Number:</span> {selectedWithdrawalDetails.beneficiaryDetails.accountNumber}</div>
                                                    <div><span className="font-medium">IFSC:</span> {selectedWithdrawalDetails.beneficiaryDetails.ifsc}</div>
                                                    <div><span className="font-medium">Account Holder:</span> {selectedWithdrawalDetails.beneficiaryDetails.name}</div>
                                                    {selectedWithdrawalDetails.beneficiaryDetails.bankName && (
                                                        <div><span className="font-medium">Bank:</span> {selectedWithdrawalDetails.beneficiaryDetails.bankName}</div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-4">
                                {/* Rejection Information */}
                                {selectedWithdrawalDetails.rejectionReason && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800 mb-3">Rejection Information</h4>
                                        <div className="text-sm">
                                            <div><span className="font-medium">Reason:</span></div>
                                            <div className="mt-1 text-red-700">{selectedWithdrawalDetails.rejectionReason}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Campaign Information */}
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-3">Campaign Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Campaign ID:</span> {selectedWithdrawalDetails.campaign?._id || 'N/A'}</div>
                                        <div><span className="font-medium">Current Amount:</span> {formatCurrency(selectedWithdrawalDetails.campaign?.currentAmount || 0)}</div>
                                        <div><span className="font-medium">Target Amount:</span> {formatCurrency(selectedWithdrawalDetails.campaign?.targetAmount || 0)}</div>
                                        <div><span className="font-medium">Campaign Status:</span> {selectedWithdrawalDetails.campaign?.status || 'N/A'}</div>
                                        <div><span className="font-medium">Voting Enabled:</span> {selectedWithdrawalDetails.campaign?.isVotingEnabled ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>

                                {/* Proof Documents */}
                                {selectedWithdrawalDetails.campaign?.proofDocuments && selectedWithdrawalDetails.campaign.proofDocuments.length > 0 && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-purple-800 mb-3">Proof Documents</h4>
                                        <div className="space-y-2">
                                            {selectedWithdrawalDetails.campaign.proofDocuments.map((doc, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <a
                                                        href={doc.fileUrl || doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        {doc.title || 'Proof Document'} ({doc.type || 'doc'})
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeDetailsModal}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WithdrawalsAdmin; 