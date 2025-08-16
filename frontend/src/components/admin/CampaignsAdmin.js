import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaSearch, FaEye, FaCalendar, FaMoneyBillWave, FaUsers, FaImage, FaVideo, FaVoteYea, FaBuilding, FaFileAlt, FaClock, FaPercent } from 'react-icons/fa';

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

function CampaignsAdmin() {
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // New state for enhanced features
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });
    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        completed: 0,
        rejected: 0,
        totalRaised: 0,
        activeRaised: 0,
        successRate: 0
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        applyFilters();
        calculateStats();
    }, [campaigns, search, statusFilter, categoryFilter, dateRange, amountRange, sortBy, sortOrder]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const response = await adminFetch('/api/admin/campaigns');
            const data = await response.json();
            const campaignsData = (data.data && data.data.campaigns) || [];
            setCampaigns(campaignsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...campaigns];

        // Search filter
        if (search) {
            filtered = filtered.filter(c =>
                c.title?.toLowerCase().includes(search.toLowerCase()) ||
                c.creator?.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.creator?.email?.toLowerCase().includes(search.toLowerCase()) ||
                c.description?.toLowerCase().includes(search.toLowerCase()) ||
                c.organizationName?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(c => c.category === categoryFilter);
        }

        // Date range filter
        if (dateRange.start) {
            filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            filtered = filtered.filter(c => new Date(c.createdAt) <= new Date(dateRange.end));
        }

        // Amount range filter
        if (amountRange.min) {
            filtered = filtered.filter(c => c.targetAmount >= parseFloat(amountRange.min));
        }
        if (amountRange.max) {
            filtered = filtered.filter(c => c.targetAmount <= parseFloat(amountRange.max));
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'title':
                    aValue = a.title || '';
                    bValue = b.title || '';
                    break;
                case 'creator':
                    aValue = a.creator?.name || '';
                    bValue = b.creator?.name || '';
                    break;
                case 'targetAmount':
                    aValue = a.targetAmount;
                    bValue = b.targetAmount;
                    break;
                case 'currentAmount':
                    aValue = a.currentAmount;
                    bValue = b.currentAmount;
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

        setFilteredCampaigns(filtered);
    };

    const calculateStats = () => {
        const stats = {
            total: campaigns.length,
            active: campaigns.filter(c => c.status === 'active').length,
            pending: campaigns.filter(c => c.status === 'pending_review').length,
            completed: campaigns.filter(c => c.status === 'completed').length,
            rejected: campaigns.filter(c => c.status === 'rejected').length,
            totalRaised: campaigns.reduce((sum, c) => sum + c.currentAmount, 0),
            activeRaised: campaigns.filter(c => c.status === 'active').reduce((sum, c) => sum + c.currentAmount, 0),
            successRate: campaigns.length > 0 ?
                (campaigns.filter(c => c.status === 'completed').length / campaigns.length * 100).toFixed(1) : 0
        };
        setStats(stats);
    };

    const handleAction = async (id, action) => {
        try {
            const response = await adminFetch(`/api/admin/campaigns/${id}/${action}`, {
                method: 'PUT'
            });
            const result = await response.json();
            if (result.success) {
                setCampaigns(campaigns.map(c => c._id === id ? { ...c, status: action === 'approve' ? 'active' : 'rejected' } : c));
            }
        } catch (error) {
            console.error('Error updating campaign:', error);
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedCampaigns(filteredCampaigns.map(c => c._id));
        } else {
            setSelectedCampaigns([]);
        }
    };

    const handleSelectCampaign = (campaignId, checked) => {
        if (checked) {
            setSelectedCampaigns([...selectedCampaigns, campaignId]);
        } else {
            setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId));
        }
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Are you sure you want to approve ${selectedCampaigns.length} campaign(s)?`)) {
            return;
        }

        const results = [];
        for (const campaignId of selectedCampaigns) {
            try {
                const response = await adminFetch(`/api/admin/campaigns/${campaignId}/approve`, {
                    method: 'PUT'
                });
                const result = await response.json();
                results.push({ id: campaignId, success: result.success, message: result.message });
            } catch (error) {
                results.push({ id: campaignId, success: false, message: 'Network error' });
            }
        }

        const successCount = results.filter(r => r.success).length;
        alert(`Bulk approval completed: ${successCount}/${selectedCampaigns.length} successful`);

        setSelectedCampaigns([]);
        fetchCampaigns();
    };

    const handleBulkReject = async () => {
        const reason = prompt('Enter rejection reason for all selected campaigns:');
        if (!reason || !reason.trim()) {
            alert('Rejection reason is required');
            return;
        }

        if (!window.confirm(`Are you sure you want to reject ${selectedCampaigns.length} campaign(s)?`)) {
            return;
        }

        const results = [];
        for (const campaignId of selectedCampaigns) {
            try {
                const response = await adminFetch(`/api/admin/campaigns/${campaignId}/reject`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rejectionReason: reason })
                });
                const result = await response.json();
                results.push({ id: campaignId, success: result.success, message: result.message });
            } catch (error) {
                results.push({ id: campaignId, success: false, message: 'Network error' });
            }
        }

        const successCount = results.filter(r => r.success).length;
        alert(`Bulk rejection completed: ${successCount}/${selectedCampaigns.length} successful`);

        setSelectedCampaigns([]);
        fetchCampaigns();
    };

    const exportToCSV = () => {
        const headers = ['Title', 'Creator', 'Category', 'Status', 'Target Amount', 'Current Amount', 'Progress %', 'Start Date', 'End Date', 'Created Date'];
        const csvData = filteredCampaigns.map(c => [
            c.title || 'N/A',
            c.creator?.name || 'N/A',
            c.category || 'N/A',
            c.status || 'N/A',
            c.targetAmount || 0,
            c.currentAmount || 0,
            calculateProgress(c.currentAmount, c.targetAmount).toFixed(1),
            formatDate(c.startDate),
            formatDate(c.endDate),
            formatDate(c.createdAt)
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setCategoryFilter('all');
        setDateRange({ start: '', end: '' });
        setAmountRange({ min: '', max: '' });
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const openDetailsModal = (campaign) => {
        setSelectedCampaignDetails(campaign);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedCampaignDetails(null);
    };

    const statusColors = {
        draft: 'bg-gray-200 text-gray-700',
        pending_review: 'bg-yellow-100 text-yellow-800',
        active: 'bg-emerald-100 text-emerald-700',
        completed: 'bg-indigo-100 text-indigo-700',
        rejected: 'bg-red-100 text-red-700',
        deleted: 'bg-gray-100 text-gray-400',
        awaiting_admin_approval: 'bg-blue-100 text-blue-700',
    };

    const categoryColors = {
        disaster_recovery: 'bg-red-100 text-red-700',
        education: 'bg-blue-100 text-blue-700',
        sports: 'bg-green-100 text-green-700',
        business: 'bg-purple-100 text-purple-700',
        medical: 'bg-pink-100 text-pink-700',
        community: 'bg-orange-100 text-orange-700',
        environment: 'bg-teal-100 text-teal-700',
        arts: 'bg-indigo-100 text-indigo-700',
        technology: 'bg-cyan-100 text-cyan-700',
        other: 'bg-gray-100 text-gray-700',
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateProgress = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            {/* Header with Title and Refresh */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Campaign Management</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                        Showing {filteredCampaigns.length} of {campaigns.length} campaigns
                    </span>
                    <button
                        onClick={fetchCampaigns}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(stats.activeRaised)} raised</p>
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
                            <p className="text-sm font-medium text-gray-600">Pending Review</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Success Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                            <p className="text-sm text-gray-500">{formatCurrency(stats.totalRaised)} total raised</p>
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
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search campaigns, creators..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Categories</option>
                            <option value="education">Education</option>
                            <option value="medical">Medical</option>
                            <option value="business">Business</option>
                            <option value="community">Community</option>
                            <option value="environment">Environment</option>
                            <option value="arts">Arts</option>
                            <option value="technology">Technology</option>
                            <option value="sports">Sports</option>
                            <option value="disaster_recovery">Disaster Recovery</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Amount Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount Range</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={amountRange.min}
                                onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={amountRange.max}
                                onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
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
                            onClick={() => setStatusFilter('pending_review')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'pending_review'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'active'
                                ? 'bg-green-500 text-white'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                        >
                            Active ({stats.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('completed')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === 'completed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                        >
                            Completed ({stats.completed})
                        </button>
                    </div>

                    <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="createdAt">Date</option>
                            <option value="title">Title</option>
                            <option value="creator">Creator</option>
                            <option value="targetAmount">Target Amount</option>
                            <option value="currentAmount">Current Amount</option>
                            <option value="status">Status</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedCampaigns.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-yellow-800">
                                {selectedCampaigns.length} campaign(s) selected
                            </span>
                            <button
                                onClick={() => setSelectedCampaigns([])}
                                className="text-sm text-yellow-600 hover:text-yellow-800"
                            >
                                Clear Selection
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkApprove}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                            >
                                Approve All
                            </button>
                            <button
                                onClick={handleBulkReject}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                            >
                                Reject All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">No campaigns found.</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCampaigns.map((campaign, idx) => (
                        <div
                            key={campaign._id}
                            className="relative bg-white rounded-2xl shadow hover:shadow-lg border border-gray-100 p-6 flex flex-col gap-4 transition-all duration-200 group"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Status badge */}
                            <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow ${statusColors[campaign.status] || 'bg-gray-100 text-gray-500'}`}>{campaign.status.replace(/_/g, ' ')}</span>
                            {/* Title */}
                            <div className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{campaign.title}</div>
                            {/* Category badge */}
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${categoryColors[campaign.category] || 'bg-gray-100 text-gray-700'}`}>{campaign.category.replace(/_/g, ' ')}</span>
                            {/* Creator */}
                            <div className="text-xs text-gray-500 mb-2">Creator: {campaign.creator?.name || 'Unknown'}</div>
                            {/* Funding progress */}
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{calculateProgress(campaign.currentAmount, campaign.targetAmount).toFixed(1)}%</span>
                                    <span>{formatCurrency(campaign.currentAmount)} / {formatCurrency(campaign.targetAmount)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full" style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}></div>
                                </div>
                            </div>
                            {/* Dates */}
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Start: {formatDate(campaign.startDate)}</span>
                                <span>End: {formatDate(campaign.endDate)}</span>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => openDetailsModal(campaign)}
                                    className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-xs font-medium transition"
                                >
                                    View Details
                                </button>
                                {campaign.status === 'pending_review' && (
                                    <button
                                        onClick={() => handleAction(campaign._id, 'approve')}
                                        className="flex-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow text-xs font-medium transition"
                                    >
                                        Approve
                                    </button>
                                )}
                                {campaign.status === 'pending_review' && (
                                    <button
                                        onClick={() => handleAction(campaign._id, 'reject')}
                                        className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded shadow text-xs font-medium transition"
                                    >
                                        Reject
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedCampaignDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Campaign Details</h3>
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
                                        <div><span className="font-medium">Title:</span> {selectedCampaignDetails.title}</div>
                                        <div><span className="font-medium">Creator:</span> {selectedCampaignDetails.creator?.name || 'N/A'}</div>
                                        <div><span className="font-medium">Email:</span> {selectedCampaignDetails.creator?.email || 'N/A'}</div>
                                        <div><span className="font-medium">Category:</span> {selectedCampaignDetails.category?.replace(/_/g, ' ') || 'N/A'}</div>
                                        <div><span className="font-medium">Status:</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${statusColors[selectedCampaignDetails.status]}`}>
                                                {selectedCampaignDetails.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">Organization:</span> {selectedCampaignDetails.organizationName || 'N/A'}</div>
                                        <div><span className="font-medium">Created:</span> {formatDate(selectedCampaignDetails.createdAt)}</div>
                                        <div><span className="font-medium">Last Updated:</span> {formatDate(selectedCampaignDetails.updatedAt)}</div>
                                    </div>
                                </div>

                                {/* Funding Information */}
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-3">Funding Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Target Amount:</span> {formatCurrency(selectedCampaignDetails.targetAmount)}</div>
                                        <div><span className="font-medium">Current Amount:</span> {formatCurrency(selectedCampaignDetails.currentAmount)}</div>
                                        <div><span className="font-medium">Progress:</span> {calculateProgress(selectedCampaignDetails.currentAmount, selectedCampaignDetails.targetAmount).toFixed(1)}%</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                                                style={{ width: `${calculateProgress(selectedCampaignDetails.currentAmount, selectedCampaignDetails.targetAmount)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Campaign Timeline */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 mb-3">Campaign Timeline</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Start Date:</span> {formatDate(selectedCampaignDetails.startDate)}</div>
                                        <div><span className="font-medium">End Date:</span> {formatDate(selectedCampaignDetails.endDate)}</div>
                                        {selectedCampaignDetails.status === 'active' && (
                                            <div><span className="font-medium">Days Remaining:</span> {getDaysRemaining(selectedCampaignDetails.endDate)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-4">
                                {/* Description */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-800 mb-3">Description</h4>
                                    <div className="text-sm text-gray-700">
                                        {selectedCampaignDetails.description || 'No description available'}
                                    </div>
                                </div>

                                {/* Voting Information */}
                                {selectedCampaignDetails.isVotingEnabled && (
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-indigo-800 mb-3">Voting Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Voting Enabled:</span> Yes</div>
                                            <div><span className="font-medium">Approve Votes:</span> {selectedCampaignDetails.voteResults?.approveCount || 0}</div>
                                            <div><span className="font-medium">Reject Votes:</span> {selectedCampaignDetails.voteResults?.rejectCount || 0}</div>
                                            {selectedCampaignDetails.votingEndDate && (
                                                <div><span className="font-medium">Voting Ends:</span> {formatDate(selectedCampaignDetails.votingEndDate)}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Media Information */}
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-orange-800 mb-3">Media</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Images:</span> {selectedCampaignDetails.images?.length || 0}</div>
                                        <div><span className="font-medium">Videos:</span> {selectedCampaignDetails.videos?.length || 0}</div>
                                        <div><span className="font-medium">Proof Documents:</span> {selectedCampaignDetails.proofDocuments?.length || 0}</div>
                                    </div>
                                </div>

                                {/* Rejection Information */}
                                {selectedCampaignDetails.rejectionReason && (
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-red-800 mb-3">Rejection Information</h4>
                                        <div className="text-sm">
                                            <div><span className="font-medium">Reason:</span></div>
                                            <div className="mt-1 text-red-700">{selectedCampaignDetails.rejectionReason}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Funds Release Status */}
                                {selectedCampaignDetails.fundsReleased && (
                                    <div className="bg-emerald-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-emerald-800 mb-3">Funds Status</h4>
                                        <div className="text-sm text-emerald-700">
                                            ✓ Funds have been released to the campaign creator
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            {selectedCampaignDetails.status !== 'active' && selectedCampaignDetails.status !== 'completed' && (
                                <button
                                    onClick={() => {
                                        handleAction(selectedCampaignDetails._id, 'approve');
                                        closeDetailsModal();
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium"
                                >
                                    Approve Campaign
                                </button>
                            )}
                            {selectedCampaignDetails.status !== 'rejected' && selectedCampaignDetails.status !== 'completed' && (
                                <button
                                    onClick={() => {
                                        handleAction(selectedCampaignDetails._id, 'reject');
                                        closeDetailsModal();
                                    }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
                                >
                                    Reject Campaign
                                </button>
                            )}
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

export default CampaignsAdmin; 