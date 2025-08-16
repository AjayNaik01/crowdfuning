import React, { useEffect, useState } from 'react';

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
    open: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-red-100 text-red-700',
};

function ReportsAdmin() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [campaignFilter, setCampaignFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'resolve' or 'reject'
    const [modalReport, setModalReport] = useState(null);
    const [modalNote, setModalNote] = useState('');
    const [modalFlag, setModalFlag] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [sendNotification, setSendNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    // Modal state for viewing reports
    const [viewReportsModal, setViewReportsModal] = useState({ open: false, campaign: null, reports: [] });
    const [sortBy, setSortBy] = useState('most'); // 'most' or 'least'

    // Get unique campaigns for filter dropdown
    const campaignOptions = [
        ...new Set(reports.map(r => r.campaignId?.title).filter(Boolean))
    ];

    useEffect(() => {
        fetchReports(page);
        // eslint-disable-next-line
    }, [page]);

    const fetchReports = async (pageNum = 1) => {
        setLoading(true);
        const response = await adminFetch(`http://localhost:5001/api/reports?page=${pageNum}&limit=50`);
        const data = await response.json();
        if (data.success) {
            setReports(data.data.reports || []);
            setTotalPages(data.data.totalPages || 1);
            setTotalReports(data.data.total || 0);
        }
        setLoading(false);
    };

    // Filtering
    const filteredReports = reports.filter(r => {
        if (statusFilter !== 'all') {
            if (statusFilter === 'open' && r.status !== 'open' && r.status !== 'pending') return false;
            if (statusFilter === 'pending' && r.status !== 'pending') return false;
            if (statusFilter === 'resolved' && r.status !== 'resolved') return false;
            if (statusFilter === 'dismissed' && r.status !== 'dismissed') return false;
        }
        if (campaignFilter !== 'all' && r.campaignId?.title !== campaignFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                (r.campaignId?.title && r.campaignId.title.toLowerCase().includes(s)) ||
                (r.reporterName && r.reporterName.toLowerCase().includes(s)) ||
                (r.reporterId?.email && r.reporterId.email.toLowerCase().includes(s)) ||
                (r.reason && r.reason.toLowerCase().includes(s))
            );
        }
        return true;
    });

    // Group reports by campaignId
    const groupedReports = filteredReports.reduce((acc, report) => {
        const campaignKey = report.campaignId?._id || report.campaignId || 'unknown';
        if (!acc[campaignKey]) {
            acc[campaignKey] = {
                campaign: report.campaignId,
                reports: [],
            };
        }
        acc[campaignKey].reports.push(report);
        return acc;
    }, {});
    const groupedCampaigns = Object.values(groupedReports);

    // Sort grouped campaigns by report count
    let sortedGroupedCampaigns = [...groupedCampaigns];
    if (sortBy === 'most') {
        sortedGroupedCampaigns.sort((a, b) => b.reports.length - a.reports.length);
    } else {
        sortedGroupedCampaigns.sort((a, b) => a.reports.length - b.reports.length);
    }

    // Analytics
    const openCount = reports.filter(r => r.status === 'open' || r.status === 'pending').length;
    const resolvedCount = reports.filter(r => r.status === 'resolved').length;
    const dismissedCount = reports.filter(r => r.status === 'dismissed').length;

    // Modal logic for resolve/dismiss
    const openModal = (type, report) => {
        setModalType(type);
        setModalReport(report);
        setModalNote('');
        setModalFlag(false);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setModalType('');
        setModalReport(null);
        setModalNote('');
        setModalFlag(false);
        setSendNotification(false);
        setNotificationMessage('');
    };
    const handleModalSubmit = async () => {
        if (!modalReport) return;
        setActionLoading(true);
        const body = {
            status: modalType === 'resolve' ? 'resolved' : 'dismissed',
            adminNotes: modalNote,
            flagCampaign: modalType === 'resolve' ? modalFlag : undefined,
            sendNotification: sendNotification,
            notificationMessage: notificationMessage
        };
        const response = await adminFetch(`http://localhost:5001/api/reports/${modalReport._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        setActionLoading(false);
        closeModal();
        fetchReports(page);
        if (result.success) {
            const action = modalType === 'resolve' ? 'resolved' : 'dismissed';
            const notificationText = sendNotification ? ' and notifications sent' : '';
            alert(`Report ${action} successfully${notificationText}!`);
        } else {
            alert('Failed to update report. Please try again.');
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">Reports Management</h2>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Reports</p>
                            <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Open</p>
                            <p className="text-2xl font-bold text-gray-900">{openCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Resolved</p>
                            <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Dismissed</p>
                            <p className="text-2xl font-bold text-gray-900">{dismissedCount}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex gap-2 mb-4">
                    <select
                        className="px-4 py-2 rounded border border-gray-300"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <select
                        className="px-4 py-2 rounded border border-gray-300"
                        value={campaignFilter}
                        onChange={e => setCampaignFilter(e.target.value)}
                    >
                        <option value="all">All Campaigns</option>
                        {campaignOptions.map(title => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                    <select
                        className="px-4 py-2 rounded border border-gray-300"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="most">Most Reports</option>
                        <option value="least">Least Reports</option>
                    </select>
                </div>
                <div className="flex-1 flex gap-2 justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by campaign, reporter, email, or reason..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            {/* Card Grid */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">All Reports</h3>
                {loading ? <div>Loading...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedGroupedCampaigns.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500">No reports found</div>
                        )}
                        {sortedGroupedCampaigns.map(({ campaign, reports }) => {
                            const status = reports.some(r => r.status === 'open' || r.status === 'pending')
                                ? 'pending'
                                : reports.every(r => r.status === 'resolved')
                                    ? 'resolved'
                                    : 'dismissed';
                            const campaignId = campaign?._id || campaign || 'unknown';
                            // Find the first open/pending report for this campaign
                            const actionableReport = reports.find(r => r.status === 'open' || r.status === 'pending');
                            return (
                                <div
                                    key={campaignId}
                                    className="relative bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-200 flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500">ID: {campaignId}</span>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || ''}`}>{status}</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-indigo-800 mb-1">{campaign?.title || 'Untitled Campaign'}</h4>
                                    <div className="text-sm text-gray-600 mb-6">Category: <span className="font-medium">{campaign?.category || '-'}</span></div>
                                    <div className="flex flex-col items-center justify-center flex-1">
                                        <span className="text-5xl font-extrabold text-emerald-700 mb-1">{reports.length}</span>
                                        <span className="text-lg font-semibold text-gray-700">Total Reports</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        <a
                                            href={campaign?._id ? `/campaign/${campaign._id}` : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                        >
                                            View Campaign
                                        </a>
                                        <button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                            onClick={() => setViewReportsModal({ open: true, campaign, reports })}
                                        >
                                            View Reports
                                        </button>
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                            disabled={!actionableReport}
                                            onClick={() => actionableReport && openModal('resolve', actionableReport)}
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                            disabled={!actionableReport}
                                            onClick={() => actionableReport && openModal('reject', actionableReport)}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Modal for admin notes and flag/hide option */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">{modalType === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}</h3>
                        {modalType === 'resolve' && (
                            <label className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={modalFlag}
                                    onChange={e => setModalFlag(e.target.checked)}
                                />
                                Flag/Hide this campaign
                            </label>
                        )}
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold" onClick={closeModal} disabled={actionLoading}>Cancel</button>
                            <button
                                className={`px-4 py-2 rounded ${modalType === 'resolve' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} font-semibold`}
                                onClick={handleModalSubmit}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Saving...' : (modalType === 'resolve' ? 'Resolve' : 'Dismiss')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal for viewing all reports for a campaign */}
            {viewReportsModal.open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">Reports for: {viewReportsModal.campaign?.title || 'Untitled Campaign'}</h3>
                        <div className="max-h-80 overflow-y-auto">
                            {viewReportsModal.reports.length === 0 ? (
                                <div className="text-gray-500">No reports found.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {viewReportsModal.reports.map((r, idx) => (
                                        <li key={r._id || idx} className="py-3">
                                            <div className="font-semibold text-gray-800">{r.reporterName || r.reporterId?.name || 'Anonymous'}</div>
                                            <div className="text-sm text-gray-600">{r.reason}</div>
                                            {r.message && <div className="text-xs text-gray-400 mt-1">{r.message}</div>}
                                            <div className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                                onClick={() => setViewReportsModal({ open: false, campaign: null, reports: [] })}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Pagination */}
            <div className="flex justify-end gap-2">
                <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>
                <span className="px-4 py-2 font-semibold">Page {page} of {totalPages}</span>
                <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default ReportsAdmin;