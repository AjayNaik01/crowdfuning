import React, { useEffect, useState } from 'react';

function KYCPendingRequests() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalUser, setModalUser] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [zoomImage, setZoomImage] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5001/api/admin/kyc-users?status=PENDING', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUsers(data.users || []);
                } else {
                    setError(data.message || 'Failed to load pending KYC users');
                }
                setLoading(false);
            })
            .catch(err => {
                setError('Network or server error');
                setLoading(false);
            });
    }, []);

    const filteredUsers = users.filter(user => user.kycStatus === 'PENDING').filter(user => {
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

    const openUserModal = (user) => {
        setModalUser(user);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalUser(null);
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
        setUsers(users => users.filter(u => u._id !== modalUser._id));
        setModalOpen(false);
    };
    const handleReject = async () => {
        if (!modalUser) return;
        await fetch(`http://localhost:5001/api/admin/kyc/${modalUser._id}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        });
        setUsers(users => users.filter(u => u._id !== modalUser._id));
        setModalOpen(false);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className="p-6 min-h-screen flex flex-col" style={{ height: '100vh' }}>
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">Pending KYC Users</h2>
            <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 flex justify-end">
                    <input
                        type="text"
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Search by name, ID type, Aadhaar, PAN..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1" style={{ maxHeight: 'calc(100vh - 270px)' }}>
                    <table className="min-w-full bg-white rounded-lg shadow divide-y divide-gray-200">
                        <thead className="bg-indigo-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">ID Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">Aadhaar / PAN</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">KYC Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase">Show Docs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">No pending KYC users found.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-indigo-50 transition">
                                        <td className="px-4 py-3 font-medium">{user.name}</td>
                                        <td className="px-4 py-3">{user.idType}</td>
                                        <td className="px-4 py-3">
                                            {user.idType === 'AADHAR' ? user.aadhaar_number : user.idType === 'PAN' ? user.pan_number : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block bg-gray-200 text-gray-700 font-semibold px-2 py-1 rounded">{user.kycStatus}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                                                onClick={() => openUserModal(user)}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Show Docs
                                            </button>
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
                                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
            </div>
            {/* Modal for user KYC details */}
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
                            {modalUser.kycStatus === 'PENDING' && (
                                <>
                                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleApprove}>Approve</button>
                                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleReject}>Reject</button>
                                </>
                            )}
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

export default KYCPendingRequests; 