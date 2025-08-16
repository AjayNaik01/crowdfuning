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
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-800',
};

function DonationsAdmin() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDonations, setTotalDonations] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [campaignFilter, setCampaignFilter] = useState('all');

    // Get unique campaigns for filter dropdown
    const campaignOptions = [
        ...new Set(donations.map(d => d.campaign?.title).filter(Boolean))
    ];

    useEffect(() => {
        fetchDonations(page);
    }, [page]);

    const fetchDonations = async (pageNum = 1) => {
        setLoading(true);
        const response = await adminFetch(`http://localhost:5001/api/donations/admin-all?page=${pageNum}&limit=50`);
        const data = await response.json();
        if (data.success) {
            setDonations(data.data.donations || []);
            setTotalPages(data.data.totalPages || 1);
            setTotalDonations(data.data.total || 0);
            setTotalAmount(
                (data.data.donations || []).reduce((sum, d) => sum + (d.amount || 0), 0)
            );
        }
        setLoading(false);
    };

    const filteredDonations = donations.filter(d => {
        if (statusFilter !== 'all' && d.paymentStatus !== statusFilter) return false;
        if (campaignFilter !== 'all' && d.campaign?.title !== campaignFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                (d.campaign?.title && d.campaign.title.toLowerCase().includes(s)) ||
                (d.donor?.name && d.donor.name.toLowerCase().includes(s)) ||
                (d.donor?.email && d.donor.email.toLowerCase().includes(s))
            );
        }
        return true;
    });

    const exportToCSV = () => {
        const headers = ['Campaign', 'Donor', 'Email', 'Amount', 'Date', 'Status'];
        const csvData = filteredDonations.map(d => [
            d.campaign?.title || '',
            d.donor?.name || 'Anonymous',
            d.donor?.email || '-',
            d.amount,
            new Date(d.createdAt).toLocaleDateString('en-IN'),
            d.paymentStatus || 'completed',
        ]);
        const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">Donations Management</h2>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Donations</p>
                            <p className="text-2xl font-bold text-gray-900">{totalDonations}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
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
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
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
                </div>
                <div className="flex-1 flex gap-2 justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by campaign, donor, or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-semibold"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">All Donations</h3>
                {loading ? <div>Loading...</div> : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDonations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">No donations found</td>
                                </tr>
                            )}
                            {filteredDonations.map(d => (
                                <tr key={d._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{d.campaign?.title || ''}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{d.donor?.name || 'Anonymous'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{d.donor?.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{d.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[d.paymentStatus] || ''}`}>{d.paymentStatus || 'completed'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
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

export default DonationsAdmin; 