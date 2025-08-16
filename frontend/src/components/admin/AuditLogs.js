import React, { useEffect, useState } from 'react';
import adminFetch from './adminFetch';

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        actor: '',
        action: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        setForbidden(false);
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...Object.fromEntries(Object.entries(filters).filter(([k, v]) => v))
            });
            const response = await adminFetch(`/api/audit-logs?${params.toString()}`);
            if (response.status === 403) {
                setForbidden(true);
                setLogs([]);
                setError('');
                setLoading(false);
                return;
            }
            const data = await response.json();
            if (data.success) {
                setLogs(data.data);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            } else {
                setError('Failed to load audit logs');
            }
        } catch (err) {
            setError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const clearFilters = () => {
        setFilters({ actor: '', action: '', startDate: '', endDate: '' });
        setPage(1);
        fetchLogs();
    };

    const getActionColor = (action) => {
        if (action?.includes('login')) return 'bg-green-100 text-green-800';
        if (action?.includes('logout')) return 'bg-orange-100 text-orange-800';
        if (action?.includes('approve')) return 'bg-green-100 text-green-800';
        if (action?.includes('reject')) return 'bg-red-100 text-red-800';
        if (action?.includes('create')) return 'bg-blue-100 text-blue-800';
        if (action?.includes('delete')) return 'bg-red-100 text-red-800';
        if (action?.includes('update')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const formatAction = (action) => {
        if (action === 'admin_login') return 'LOGIN';
        if (action === 'admin_logout') return 'LOGOUT';
        return action?.replace(/_/g, ' ').toUpperCase() || '';
    };

    const exportToCSV = () => {
        if (logs.length === 0) {
            alert('No logs to export');
            return;
        }

        const headers = ['Date/Time', 'Action', 'Admin Name', 'Admin Email', 'Target', 'Target Type', 'Method', 'URL', 'Params', 'Response'];

        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                new Date(log.createdAt).toLocaleString(),
                formatAction(log.action),
                log.actor?.name || 'System',
                log.actor?.email || '-',
                log.target?.name || log.target?.email || '-',
                log.target?.type || '-',
                log.details?.method || '-',
                log.details?.url || '-',
                log.details?.params ? JSON.stringify(log.details.params) : '-',
                log.details?.response?.message || '-'
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToJSON = () => {
        if (logs.length === 0) {
            alert('No logs to export');
            return;
        }

        const exportData = logs.map(log => ({
            dateTime: new Date(log.createdAt).toLocaleString(),
            action: formatAction(log.action),
            adminName: log.actor?.name || 'System',
            adminEmail: log.actor?.email || '-',
            target: log.target?.name || log.target?.email || '-',
            targetType: log.target?.type || '-',
            method: log.details?.method || '-',
            url: log.details?.url || '-',
            params: log.details?.params || {},
            response: log.details?.response?.message || '-',
            rawData: log
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (forbidden) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center mx-auto">
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
                    <p className="text-gray-700 text-lg">
                        You do not have permission to access this page.<br />
                        Only super admins can view audit logs.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading audit logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                            <p className="text-gray-600 mt-1">Track all admin activities and system events</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={fetchLogs}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={exportToJSON}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Export JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                            <input
                                type="text"
                                name="actor"
                                value={filters.actor}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="admin@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <select
                                name="action"
                                value={filters.action}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">All Actions</option>
                                <option value="admin_login">Login</option>
                                <option value="admin_logout">Logout</option>
                                <option value="kyc_approve">KYC Approve</option>
                                <option value="kyc_reject">KYC Reject</option>
                                <option value="campaign_approve">Campaign Approve</option>
                                <option value="campaign_reject">Campaign Reject</option>
                                <option value="withdrawal_approve">Withdrawal Approve</option>
                                <option value="withdrawal_reject">Withdrawal Reject</option>
                                <option value="admin_create">Admin Create</option>
                                <option value="admin_delete">Admin Delete</option>
                                <option value="platform_settings_update">Settings Update</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex items-end space-x-2">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date/Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Target
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                                <span className="ml-2 text-gray-500">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {log.actor?.name || 'System'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {log.actor?.email || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {log.target?.name || log.target?.email ||
                                                        (log.details?.params?.userId ? `User ID: ${log.details.params.userId.substring(0, 8)}...` :
                                                            log.details?.params?.id ? `ID: ${log.details.params.id.substring(0, 8)}...` : '-')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {log.target?.type ||
                                                        (log.action?.includes('kyc') ? 'User' :
                                                            log.action?.includes('campaign') ? 'Campaign' :
                                                                log.action?.includes('withdrawal') ? 'Withdrawal' :
                                                                    log.action?.includes('admin') ? 'Admin' :
                                                                        log.action?.includes('platform') ? 'Platform' : 'System')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {log.details && typeof log.details === 'object' ? (
                                                    <div className="space-y-1">
                                                        <div><span className="font-medium">Method:</span> {log.details.method}</div>
                                                        <div><span className="font-medium">URL:</span> <span className="text-blue-600">{log.details.url}</span></div>
                                                        {log.details.params && Object.keys(log.details.params).length > 0 && (
                                                            <div><span className="font-medium">Params:</span> {Object.entries(log.details.params).map(([key, value]) => `${key}: ${value}`).join(', ')}</div>
                                                        )}
                                                        {log.details.response && (
                                                            <div><span className="font-medium">Response:</span> <span className="text-green-600">{log.details.response.message || 'Success'}</span></div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    log.details || '-'
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                                        <span className="font-medium">{total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuditLogs; 