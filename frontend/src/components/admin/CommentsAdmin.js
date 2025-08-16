import React, { useEffect, useState } from 'react';
import adminFetch from './adminFetch';

function CommentsAdmin() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchUser, setSearchUser] = useState('');
    const [searchCampaign, setSearchCampaign] = useState('');
    const [searchText, setSearchText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deletingId, setDeletingId] = useState(null);

    const fetchComments = async (pageNum = 1) => {
        setLoading(true);
        let url = `http://localhost:5001/api/admin/comments?page=${pageNum}&limit=20`;
        if (searchUser) url += `&userName=${encodeURIComponent(searchUser)}`;
        if (searchCampaign) url += `&campaignId=${encodeURIComponent(searchCampaign)}`;
        if (searchText) url += `&text=${encodeURIComponent(searchText)}`;
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        const res = await adminFetch(url);
        const data = await res.json();
        if (data.success) {
            setComments(data.data.comments);
            setTotalPages(data.data.totalPages);
            setTotal(data.data.total);
            setPage(data.data.currentPage);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchComments(1);
        // eslint-disable-next-line
    }, [searchUser, searchCampaign, searchText, startDate, endDate]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this comment?')) return;
        setDeletingId(id);
        const res = await adminFetch(`http://localhost:5001/api/admin/comments/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setComments(comments.filter(c => c._id !== id));
        } else {
            alert('Failed to delete comment');
        }
        setDeletingId(null);
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50">
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">Comments Moderation</h2>
            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <input
                    type="text"
                    className="px-4 py-2 border rounded w-48"
                    placeholder="Search by user name..."
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                />
                <input
                    type="text"
                    className="px-4 py-2 border rounded w-48"
                    placeholder="Search by campaign ID..."
                    value={searchCampaign}
                    onChange={e => setSearchCampaign(e.target.value)}
                />
                <input
                    type="text"
                    className="px-4 py-2 border rounded w-48"
                    placeholder="Search by comment text..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                        type="date"
                        className="px-4 py-2 border rounded w-40"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">End Date</label>
                    <input
                        type="date"
                        className="px-4 py-2 border rounded w-40"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    onClick={() => fetchComments(1)}
                >
                    Search
                </button>
                <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    onClick={() => {
                        setSearchUser('');
                        setSearchCampaign('');
                        setSearchText('');
                        setStartDate('');
                        setEndDate('');
                        fetchComments(1);
                    }}
                >
                    Clear
                </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                {loading ? <div>Loading...</div> : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">User</th>
                                <th className="px-4 py-2 text-left">Comment</th>
                                <th className="px-4 py-2 text-left">Campaign</th>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comments.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No comments found</td></tr>
                            )}
                            {comments.map(comment => (
                                <tr key={comment._id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-semibold text-indigo-700">{comment.userName}</td>
                                    <td className="px-4 py-2 text-gray-800">{comment.text}</td>
                                    <td className="px-4 py-2 text-gray-600">{comment.campaignId?.title || comment.campaignId}</td>
                                    <td className="px-4 py-2 text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                            onClick={() => handleDelete(comment._id)}
                                            disabled={deletingId === comment._id}
                                        >
                                            {deletingId === comment._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-600">Total: {total}</div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 rounded bg-gray-200"
                            onClick={() => fetchComments(page - 1)}
                            disabled={page <= 1}
                        >Prev</button>
                        <span className="px-3 py-1">Page {page} of {totalPages}</span>
                        <button
                            className="px-3 py-1 rounded bg-gray-200"
                            onClick={() => fetchComments(page + 1)}
                            disabled={page >= totalPages}
                        >Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommentsAdmin; 