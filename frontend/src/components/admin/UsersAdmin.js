import React, { useEffect, useState } from 'react';

function UsersAdmin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [userStats, setUserStats] = useState(null);

    useEffect(() => {
        fetch('/api/admin/users', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        })
            .then(res => res.json())
            .then(data => {
                setUsers((data.data && data.data.users) || []);
                setLoading(false);
            });
    }, []);

    const handleAction = (id, action) => {
        fetch(`/api/admin/users/${id}/${action}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        })
            .then(res => res.json())
            .then(() => setUsers(users.map(u => u._id === id ? { ...u, isBlocked: action === 'block' ? true : false } : u)));
    };

    const handleViewDetails = (id) => {
        setShowModal(true);
        setModalLoading(true);
        setUserStats(null);
        fetch(`/api/admin/users/${id}/stats`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        })
            .then(res => res.json())
            .then(data => {
                setUserStats(data.data);
                setModalLoading(false);
            })
            .catch(() => setModalLoading(false));
    };

    // Analytics
    const total = users.length;
    const active = users.filter(u => !u.isBlocked).length;
    const blocked = users.filter(u => u.isBlocked).length;

    // Filtering
    let filteredUsers = users;
    if (filter === 'ACTIVE') filteredUsers = users.filter(u => !u.isBlocked);
    if (filter === 'BLOCKED') filteredUsers = users.filter(u => u.isBlocked);
    if (search) {
        filteredUsers = filteredUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
        );
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">User Management</h2>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Blocked</p>
                            <p className="text-2xl font-bold text-gray-900">{blocked}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex gap-2 mb-4">
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setFilter('ALL')}>All</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`} onClick={() => setFilter('ACTIVE')}>Active</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'BLOCKED' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`} onClick={() => setFilter('BLOCKED')}>Blocked</button>
                </div>
                <div className="flex-1 flex gap-2 justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button
                        onClick={() => { setSearch(''); setFilter('ALL'); }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Clear Filters
                    </button>
                    <button
                        onClick={() => {
                            const headers = ['Name', 'Email', 'Status'];
                            const csvData = filteredUsers.map(u => [u.name, u.email, u.isBlocked ? 'Blocked' : 'Active']);
                            const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/80 backdrop-blur-xl">
                <table className="min-w-full divide-y divide-indigo-100">
                    <thead className="bg-indigo-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">No users found.</td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user._id} className="hover:bg-indigo-50 transition">
                                    <td className="px-6 py-4 font-medium">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => handleViewDetails(user._id)}
                                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                                        >
                                            View Details
                                        </button>
                                        {user.isBlocked ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'unblock')}
                                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition"
                                            >
                                                Unblock
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'block')}
                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"
                                            >
                                                Block
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* User Details Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowModal(false)}
                        >
                            &times;
                        </button>
                        {modalLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : userStats ? (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-indigo-700">User Details</h3>
                                <div className="mb-2"><span className="font-semibold">Name:</span> {userStats.user.name}</div>
                                <div className="mb-2"><span className="font-semibold">Email:</span> {userStats.user.email}</div>
                                <div className="mb-2"><span className="font-semibold">Registered:</span> {new Date(userStats.createdAt).toLocaleDateString()}</div>
                                <div className="mb-2"><span className="font-semibold">KYC Status:</span> {userStats.kycStatus || 'N/A'}</div>
                                <div className="mb-2"><span className="font-semibold">Campaigns Created:</span> {userStats.campaignsCreated}</div>
                                <div className="mb-2"><span className="font-semibold">Donations Made:</span> {userStats.donationsMade}</div>
                                {userStats.kycData && (
                                    <div className="mb-2"><span className="font-semibold">KYC Data:</span> <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(userStats.kycData, null, 2)}</pre></div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-red-500">Failed to load user details.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersAdmin; 