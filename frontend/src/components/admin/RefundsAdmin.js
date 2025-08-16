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
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    partial: 'bg-orange-100 text-orange-700',
    refunded: 'bg-green-100 text-green-700',
};

function RefundsAdmin() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [expandedRows, setExpandedRows] = useState({});
    const [donorStatusRows, setDonorStatusRows] = useState({});
    const [rowBatches, setRowBatches] = useState({});

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        const response = await adminFetch('http://localhost:5001/api/admin/refunds/withdrawals/rejected');
        const data = await response.json();
        setWithdrawals(data.data || []);
        setLoading(false);

        // Fetch batch status for each withdrawal
        const withdrawalsList = data.data || [];
        withdrawalsList.forEach(async (w) => {
            try {
                const res = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${w._id}/batch`);
                const batchData = await res.json();
                if (batchData.success && batchData.data) {
                    setRowBatches(prev => ({ ...prev, [w._id]: batchData.data }));
                }
            } catch (err) {
                // Optionally handle error
            }
        });
    };

    // Analytics
    const total = withdrawals.length;
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const completed = withdrawals.filter(w => w.status === 'completed').length;
    const failed = withdrawals.filter(w => w.status === 'failed').length;

    // Filter/search logic
    const filteredWithdrawals = withdrawals.filter(w => {
        const batch = rowBatches[w._id];
        if (filter === 'completed') {
            return batch && batch.status === 'completed';
        }
        if (filter === 'pending') {
            return batch && (batch.status === 'pending' || batch.status === 'processing');
        }
        if (filter === 'failed') {
            return batch && batch.status === 'failed';
        }
        // 'ALL'
        return true;
    });



    const handleProcessRefundDirectly = async (withdrawal) => {
        let currentBatch = rowBatches[withdrawal._id];

        // If no batch exists, create one first
        if (!currentBatch) {
            try {
                console.log('Creating refund batch for withdrawal:', withdrawal._id);
                const findRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/initiate`, { method: 'POST' });
                const findData = await findRes.json();
                if (findData.success) {
                    currentBatch = findData.data;
                } else if (findData.message === 'Refund batch already exists for this withdrawal') {
                    // Batch already exists, fetch it
                    const getRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/batch`);
                    const getData = await getRes.json();
                    if (getData.success) {
                        currentBatch = getData.data;
                    }
                } else {
                    console.error('Failed to create/fetch batch:', findData.message);
                    return;
                }
                setRowBatches(prev => ({ ...prev, [withdrawal._id]: currentBatch }));
            } catch (error) {
                console.error('Error creating batch:', error);
                return;
            }
        }

        // Update batch status to processing immediately
        setRowBatches(prev => ({
            ...prev,
            [withdrawal._id]: { ...currentBatch, status: 'processing' }
        }));

        try {
            console.log('Processing refund batch:', currentBatch._id);
            await adminFetch(`http://localhost:5001/api/admin/refunds/batch/${currentBatch._id}/process`, { method: 'POST' });

            // Start polling for updates
            const pollInterval = setInterval(async () => {
                const res = await adminFetch(`http://localhost:5001/api/admin/refunds/batch/${currentBatch._id}`);
                const data = await res.json();
                if (data.success) {
                    setRowBatches(prev => ({ ...prev, [withdrawal._id]: data.data }));
                    if (['completed', 'failed'].includes(data.data.status)) {
                        clearInterval(pollInterval);
                    }
                }
            }, 2000);

            // Stop polling after 5 minutes
            setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
        } catch (error) {
            console.error('Error processing refund:', error);
            // Revert status on error
            setRowBatches(prev => ({
                ...prev,
                [withdrawal._id]: currentBatch
            }));
        }
    };



    const toggleExpandRow = async (withdrawal) => {
        setExpandedRows(prev => ({ ...prev, [withdrawal._id]: !prev[withdrawal._id] }));
        if (!rowBatches[withdrawal._id]) {
            // Try to find or create a batch for this row
            let batchData;
            try {
                // First try to create a new batch
                const findRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/initiate`, { method: 'POST' });
                const findData = await findRes.json();
                if (findData.success) {
                    batchData = findData.data;
                } else if (findData.message === 'Refund batch already exists for this withdrawal') {
                    // This is expected - batch already exists, so fetch it
                    const getRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/batch`);
                    const getData = await getRes.json();
                    if (getData.success) {
                        batchData = getData.data;
                    }
                } else {
                    console.error('Unexpected error:', findData.message);
                }
                setRowBatches(prev => ({ ...prev, [withdrawal._id]: batchData }));
            } catch (error) {
                console.error('Error fetching batch data:', error);
            }
        }
    };

    const toggleDonorStatusRow = async (withdrawal) => {
        setDonorStatusRows(prev => ({ ...prev, [withdrawal._id]: !prev[withdrawal._id] }));
        if (!rowBatches[withdrawal._id]) {
            // Try to find or create a batch for this row
            let batchData;
            try {
                // First try to create a new batch
                const findRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/initiate`, { method: 'POST' });
                const findData = await findRes.json();
                if (findData.success) {
                    batchData = findData.data;
                } else if (findData.message === 'Refund batch already exists for this withdrawal') {
                    // This is expected - batch already exists, so fetch it
                    const getRes = await adminFetch(`http://localhost:5001/api/admin/refunds/withdrawals/${withdrawal._id}/batch`);
                    const getData = await getRes.json();
                    if (getData.success) {
                        batchData = getData.data;
                    }
                } else {
                    console.error('Unexpected error:', findData.message);
                }
                setRowBatches(prev => ({ ...prev, [withdrawal._id]: batchData }));
            } catch (error) {
                console.error('Error fetching batch data:', error);
            }
        }
    };

    const exportToCSV = () => {
        const headers = ['Campaign', 'Amount', 'Requested By', 'Status', 'Batch Status', 'Date'];
        const csvData = filteredWithdrawals.map(w => {
            const batch = rowBatches[w._id];
            return [
                w.campaign?.title || '',
                w.amount,
                w.requester?.name || '-',
                w.status,
                batch?.status || '-',
                new Date(w.createdAt).toLocaleDateString('en-IN'),
            ];
        });
        const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `refunds_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">Refunds Management</h2>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">{pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">{completed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Failed</p>
                            <p className="text-2xl font-bold text-gray-900">{failed}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex gap-2 mb-4">
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setFilter('ALL')}>All</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`} onClick={() => setFilter('completed')}>Completed</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'failed' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`} onClick={() => setFilter('failed')}>Failed</button>
                </div>
                <div className="flex-1 flex gap-2 justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by campaign, requester, or status..."
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
                <h3 className="text-lg font-semibold mb-4">Rejected Withdrawals</h3>
                {loading ? <div>Loading...</div> : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredWithdrawals.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No rejected withdrawals found</td>
                                </tr>
                            )}
                            {filteredWithdrawals.map(w => {
                                const batch = rowBatches[w._id];
                                let buttonLabel = 'Refund';
                                let buttonClass = 'bg-indigo-600 hover:bg-indigo-700';
                                let buttonDisabled = false;
                                if (batch) {
                                    if (batch.status === 'completed') {
                                        buttonLabel = 'Completed';
                                        buttonClass = 'bg-green-600 cursor-not-allowed';
                                        buttonDisabled = true;
                                    } else if (batch.status === 'processing') {
                                        buttonLabel = 'Processing...';
                                        buttonClass = 'bg-yellow-500 cursor-not-allowed';
                                        buttonDisabled = true;
                                    } else if (batch.status === 'pending') {
                                        buttonLabel = 'Refund';
                                        buttonClass = 'bg-indigo-600 hover:bg-indigo-700';
                                        buttonDisabled = false;
                                    } else if (batch.status === 'failed') {
                                        buttonLabel = 'Failed';
                                        buttonClass = 'bg-red-600 cursor-not-allowed';
                                        buttonDisabled = true;
                                    } else if (batch.status === 'partial') {
                                        buttonLabel = 'Retry';
                                        buttonClass = 'bg-orange-600 hover:bg-orange-700';
                                        buttonDisabled = false;
                                    }
                                }
                                return (
                                    <React.Fragment key={w._id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{w.campaign?.title || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{w.requester?.name || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{w.requester?.email || ''}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{w.amount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{w.adminApprovedBy?.name || w.adminApprovedBy?.email || 'Admin'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{w.rejectionReason || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap flex gap-2 items-center">
                                                <button
                                                    className={`${buttonClass} text-white px-4 py-2 rounded text-xs font-semibold`}
                                                    onClick={() => handleProcessRefundDirectly(w)}
                                                    disabled={buttonDisabled}
                                                >
                                                    {buttonLabel}
                                                </button>
                                                <button
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold"
                                                    onClick={() => toggleDonorStatusRow(w)}
                                                >
                                                    View Donors
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows[w._id] && (
                                            <tr>
                                                <td colSpan={7} className="bg-gray-50 px-8 py-4">
                                                    {!batch ? (
                                                        <div>Loading refund options...</div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-lg font-semibold text-gray-800">Refund Processing</h4>
                                                                <button
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                                                                    onClick={() => handleProcessRefundDirectly(w)}
                                                                    disabled={buttonDisabled}
                                                                >
                                                                    {buttonDisabled ? 'Processing...' : 'Start Refund'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        {donorStatusRows[w._id] && (
                                            <tr>
                                                <td colSpan={7} className="bg-gray-50 px-8 py-4">
                                                    {!batch ? (
                                                        <div>Loading donor refund details...</div>
                                                    ) : (
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {batch.refundDetails.map((d, i) => (
                                                                    <tr key={i}>
                                                                        <td className="px-2 py-2">{d.donor?.name || 'Unknown'}</td>
                                                                        <td className="px-2 py-2">₹{d.amount}</td>
                                                                        <td className="px-2 py-2">
                                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[d.status] || ''}`}>{d.status}</span>
                                                                        </td>
                                                                        <td className="px-2 py-2 text-red-600">{d.error}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}

export default RefundsAdmin; 