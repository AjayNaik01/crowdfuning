import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function KYCRequests() {
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImages, setModalImages] = useState({ idCardImage: '', faceImage: '' });
    const [modalUser, setModalUser] = useState(null);
    const [zoomImage, setZoomImage] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        // Set status filter based on route
        if (location.pathname.endsWith('/pending')) setStatusFilter('PENDING');
        else if (location.pathname.endsWith('/approved')) setStatusFilter('VERIFIED');
        else if (location.pathname.endsWith('/rejected')) setStatusFilter('REJECTED');
        else setStatusFilter('ALL');
    }, [location.pathname]);

    useEffect(() => {
        let url = '/api/admin/kyc-users';
        if (location.pathname === '/admin/kyc/pending') {
            url = '/api/admin/kyc-users?status=PENDING';
        } else if (location.pathname === '/admin/kyc/approved') {
            url = '/api/admin/kyc-users?status=VERIFIED';
        } else if (location.pathname === '/admin/kyc/rejected') {
            url = '/api/admin/kyc-users?status=REJECTED';
        }
        fetch(url, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUsers(data.users || []);
                } else {
                    setError(data.message || 'Failed to load KYC users');
                }
                setLoading(false);
            })
            .catch(err => {
                setError('Network or server error');
                setLoading(false);
            });
    }, [location.pathname]);

    let filteredUsers = users;
    if (filter !== 'ALL' && filter !== 'AADHAR' && filter !== 'PAN') {
        filteredUsers = filteredUsers.filter(user => user.kycStatus === filter);
    }
    filteredUsers = filteredUsers.filter(user => {
        // Existing Aadhaar/PAN filter
        if (filter === 'AADHAR' && user.idType !== 'AADHAR') return false;
        if (filter === 'PAN' && user.idType !== 'PAN') return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                (user.name && user.name.toLowerCase().includes(searchLower)) ||
                (user.idType && user.idType.toLowerCase().includes(searchLower)) ||
                (user.aadhaar_number && user.aadhaar_number.toLowerCase().includes(searchLower)) ||
                (user.pan_number && user.pan_number.toLowerCase().includes(searchLower))
            );
        }
        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const openImageModal = (idCardImage, faceImage) => {
        setModalImages({ idCardImage, faceImage });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalImages({ idCardImage: '', faceImage: '' });
    };

    const openUserModal = (user) => {
        setModalUser(user);
        setModalOpen(true);
    };

    // Helper to get full image URL
    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        return `http://localhost:5001/uploads/kyc/${img}`;
    };

    // Approve/Reject handlers
    const handleApprove = async () => {
        if (!modalUser) return;
        await fetch(`http://localhost:5001/api/admin/kyc/${modalUser._id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        });
        setUsers(users => users.map(u => u._id === modalUser._id ? { ...u, kycStatus: 'VERIFIED' } : u));
        setModalOpen(false);
    };
    const handleReject = async () => {
        if (!modalUser) return;
        await fetch(`http://localhost:5001/api/admin/kyc/${modalUser._id}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        });
        setUsers(users => users.map(u => u._id === modalUser._id ? { ...u, kycStatus: 'NOT_VERIFIED' } : u));
        setModalOpen(false);
    };

    // 1. Calculate analytics
    const total = users.length;
    const pending = users.filter(u => u.kycStatus === 'PENDING').length;
    const approved = users.filter(u => u.kycStatus === 'VERIFIED').length;
    const rejected = users.filter(u => u.kycStatus === 'NOT_VERIFIED').length;

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">KYC Requests</h2>
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
                            <p className="text-sm font-medium text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-gray-900">{approved}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Rejected</p>
                            <p className="text-2xl font-bold text-gray-900">{rejected}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex gap-2 mb-4">
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setFilter('ALL')}>All</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`} onClick={() => setFilter('PENDING')}>Pending</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'VERIFIED' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`} onClick={() => setFilter('VERIFIED')}>Approved</button>
                    <button className={`px-4 py-2 rounded font-semibold ${filter === 'NOT_VERIFIED' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`} onClick={() => setFilter('NOT_VERIFIED')}>Rejected</button>
                </div>
                <div className="flex-1 flex gap-2 justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by name, ID type, Aadhaar, PAN..."
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
                            const headers = ['Name', 'ID Type', 'Aadhaar/PAN', 'KYC Status'];
                            const csvData = filteredUsers.map(u => [u.name, u.idType, u.idType === 'AADHAR' ? u.aadhaar_number : u.pan_number, u.kycStatus]);
                            const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `kyc_requests_${new Date().toISOString().split('T')[0]}.csv`;
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
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">ID Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Aadhaar / PAN</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">KYC Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-400">No KYC users found.</td>
                            </tr>
                        ) : (
                            paginatedUsers.map(user => (
                                <tr key={user._id} className="hover:bg-indigo-50 transition">
                                    <td className="px-6 py-4 font-medium">{user.name}</td>
                                    <td className="px-6 py-4">{user.idType}</td>
                                    <td className="px-6 py-4">{user.idType === 'AADHAR' ? user.aadhaar_number : user.idType === 'PAN' ? user.pan_number : ''}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow ${user.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : user.kycStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : user.kycStatus === 'NOT_VERIFIED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{user.kycStatus}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition"
                                                onClick={() => openUserModal(user)}
                                            >
                                                View Details
                                            </button>
                                            {user.kycStatus === 'PENDING' && (
                                                <>
                                                    <button
                                                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium transition"
                                                        onClick={() => { setModalUser(user); setModalOpen(true); }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"
                                                        onClick={() => { setModalUser(user); setModalOpen(true); }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`px-3 py-1 rounded ${currentPage === page ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => goToPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
            {/* Details Modal (existing code) */}
            {modalOpen && modalUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative flex flex-col gap-6">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 flex flex-col items-center">
                                <div className="font-semibold mb-2">ID Card Image</div>
                                {getImageUrl(modalUser.idCardImage) ? (
                                    <>
                                        <img
                                            src={getImageUrl(modalUser.idCardImage)}
                                            alt="ID Card"
                                            className="w-64 h-40 object-contain border rounded cursor-zoom-in transition-transform hover:scale-105"
                                            onClick={() => setZoomImage(getImageUrl(modalUser.idCardImage))}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">Click to enlarge</div>
                                    </>
                                ) : <span className="text-gray-400">No ID Card Image</span>}
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <div className="font-semibold mb-2">Face Image</div>
                                {getImageUrl(modalUser.faceImage) ? (
                                    <>
                                        <img
                                            src={getImageUrl(modalUser.faceImage)}
                                            alt="Face"
                                            className="w-40 h-40 object-contain rounded-full border cursor-zoom-in transition-transform hover:scale-105"
                                            onClick={() => setZoomImage(getImageUrl(modalUser.faceImage))}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">Click to enlarge</div>
                                    </>
                                ) : <span className="text-gray-400">No Face Image</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <div><span className="font-semibold">Name:</span> {modalUser.name}</div>
                                <div><span className="font-semibold">ID Type:</span> {modalUser.idType}</div>
                                <div><span className="font-semibold">KYC Status:</span> {modalUser.kycStatus}</div>
                                <div><span className="font-semibold">KYC Name:</span> {modalUser.kycName}</div>
                                <div><span className="font-semibold">DOB:</span> {modalUser.dob}</div>
                                <div><span className="font-semibold">Gender:</span> {modalUser.gender}</div>
                                <div><span className="font-semibold">Aadhaar:</span> {modalUser.aadhaar_number}</div>
                                {modalUser.idType !== 'AADHAR' && <div><span className="font-semibold">Father Name:</span> {modalUser.father_name}</div>}
                                {modalUser.idType !== 'AADHAR' && <div><span className="font-semibold">PAN:</span> {modalUser.pan_number}</div>}
                                <div><span className="font-semibold">Verified At:</span> {modalUser.verifiedAt ? new Date(modalUser.verifiedAt).toLocaleString() : '-'}</div>
                            </div>
                            <div>
                                <div className="font-semibold mb-1">AI Verification Result:</div>
                                <pre className="whitespace-pre-wrap text-xs max-w-xs overflow-x-auto bg-gray-100 p-2 rounded border">{modalUser.verificationResult}</pre>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end mt-4">
                            <>
                                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleApprove}>Approve</button>
                                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleReject}>Reject</button>
                            </>
                        </div>
                    </div>
                </div>
            )}

            {/* Zoom Modal for ID Card Image */}
            {zoomImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="relative">
                        <img
                            src={zoomImage}
                            alt="Zoomed ID Card"
                            className="max-w-full max-h-[80vh] rounded shadow-lg border-4 border-white"
                            style={{ cursor: 'zoom-out' }}
                            onClick={() => setZoomImage(null)}
                        />
                        <button
                            className="absolute top-2 right-2 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full px-2 hover:bg-opacity-70"
                            onClick={() => setZoomImage(null)}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KYCRequests; 