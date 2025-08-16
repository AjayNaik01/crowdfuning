import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'image', label: 'Images' },
    { key: 'video', label: 'Videos' },
    { key: 'proof', label: 'Proof Documents' },
];

function CampaignDocumentsAdmin() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState(null);
    const [tab, setTab] = useState('all');
    // Notification modal state
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [notifyFeedback, setNotifyFeedback] = useState('');

    // Debug logging
    console.log('CampaignDocumentsAdmin: campaignId from useParams:', campaignId);

    useEffect(() => {
        async function fetchDocs() {
            // Safety check for campaignId
            if (!campaignId) {
                console.error('CampaignDocumentsAdmin: campaignId is undefined!');
                alert('Campaign ID is missing. Please go back and try again.');
                navigate('/admin/withdrawals');
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                console.log('CampaignDocumentsAdmin: Fetching documents for campaignId:', campaignId);
                const res = await fetch(`http://localhost:5001/api/admin/campaigns/${campaignId}/documents`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (data.success) {
                    // Merge images, videos, and proof documents into a single docs array
                    const proofDocs = (data.data.documents || []).map(doc => ({ ...doc, type: 'proof' }));
                    const images = (data.data.images || []).map(url => ({ type: 'image', url }));
                    const videos = (data.data.videos || []).map(url => ({ type: 'video', url }));
                    setDocs([...images, ...videos, ...proofDocs]);
                    setCampaign(data.data.campaign || null);
                } else {
                    setDocs([]);
                }
            } catch (err) {
                console.error('CampaignDocumentsAdmin: Error fetching documents:', err);
                setDocs([]);
            } finally {
                setLoading(false);
            }
        }
        fetchDocs();
    }, [campaignId, navigate]);

    const filteredDocs = tab === 'all' ? docs : docs.filter(d => d.type === tab);

    // Send notification handler
    const handleSendNotification = async () => {
        if (!campaignId || !notifyMessage.trim()) return;
        setNotifyLoading(true);
        setNotifyFeedback('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`http://localhost:5001/api/admin/campaigns/${campaignId}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ message: notifyMessage })
            });
            const data = await res.json();
            if (data.success) {
                setNotifyFeedback('Notification sent successfully!');
                setNotifyMessage('');
            } else {
                setNotifyFeedback('Failed to send notification.');
            }
        } catch (err) {
            setNotifyFeedback('Error sending notification.');
        } finally {
            setNotifyLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -top-2 left-0 flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 shadow transition font-semibold"
                    style={{ top: 0 }}
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-4xl font-extrabold text-center text-indigo-900 mb-8 tracking-tight">Campaign Documents</h1>
                {/* --- CAMPAIGN INFO CARD --- */}
                {campaign && (
                    <div className="mb-8 p-6 bg-white rounded-xl shadow flex flex-col md:flex-row md:justify-between gap-6">
                        <div>
                            <div className="text-2xl font-bold text-indigo-800 mb-2">{campaign.title}</div>
                            <div className="text-sm text-gray-600 mb-1">Campaign ID: <span className="font-mono">{campaign._id}</span></div>
                            <div className="text-sm text-gray-600 mb-1">Category: {campaign.category}</div>
                            <div className="text-sm text-gray-600 mb-1">Location: {campaign.location}</div>
                            <div className="text-sm text-gray-600 mb-1">Target: ₹{campaign.targetAmount} | Raised: ₹{campaign.currentAmount}</div>
                            <div className="text-sm text-gray-600 mb-1">Start: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : ''} | End: {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : ''}</div>
                            <div className="text-sm text-gray-600 mb-1">Org: {campaign.isOrganization ? `${campaign.organizationName} (${campaign.organizationDetails})` : 'No'}</div>
                            <div className="text-sm text-gray-600 mb-1">Description: {campaign.description}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-base font-medium transition"
                                onClick={() => {
                                    setShowNotifyModal(true);
                                    setNotifyFeedback('');
                                    setNotifyMessage('');
                                }}
                            >
                                Send Notification
                            </button>
                        </div>
                    </div>
                )}
                {/* --- VOTING RESULTS CARD --- */}
                {campaign?.isVotingEnabled && (
                    <div className="mb-8 p-6 bg-white rounded-xl shadow flex flex-col gap-2">
                        <h2 className="text-xl font-bold text-indigo-800 mb-2">Voting Results</h2>
                        <div className="flex gap-4 items-center mb-2">
                            {(() => {
                                const vr = campaign.voteResults || {};
                                const votes = campaign.votes || [];
                                let approveCount = vr.approveCount;
                                let rejectCount = vr.rejectCount;
                                let totalVotes = vr.totalVotes;
                                if (typeof approveCount !== 'number' || typeof rejectCount !== 'number' || typeof totalVotes !== 'number') {
                                    approveCount = votes.filter(v => v.vote === 'approve').length;
                                    rejectCount = votes.filter(v => v.vote === 'reject').length;
                                    totalVotes = votes.length;
                                }
                                return <>
                                    <span className="font-semibold">
                                        Majority:&nbsp;
                                        {approveCount === 0 && rejectCount === 0 ? (
                                            <span className="text-gray-500">No votes yet</span>
                                        ) : approveCount > rejectCount ? (
                                            <span className="text-green-700">Approve</span>
                                        ) : rejectCount > approveCount ? (
                                            <span className="text-red-700">Reject</span>
                                        ) : (
                                            <span className="text-yellow-700">Tie</span>
                                        )}
                                    </span>
                                    <span className="text-green-700">Approve: {approveCount}</span>
                                    <span className="text-red-700">Reject: {rejectCount}</span>
                                    <span className="text-gray-700">Total: {totalVotes}</span>
                                </>;
                            })()}
                        </div>
                        {Array.isArray(campaign.votes) && campaign.votes.length > 0 && (
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
                                        {campaign.votes.map((v, idx) => (
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
                        )}
                    </div>
                )}
                {/* --- DOCUMENT GRID --- */}
                <div className="mb-6 flex gap-2">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-full font-medium text-sm transition ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading documents...</div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded shadow text-center max-w-md mx-auto">
                            <div className="text-xl font-semibold mb-2">No documents found for this campaign.</div>
                            <div className="text-sm mb-4">The campaign owner has not uploaded any images, videos, or proof documents yet.</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocs.map((doc, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2">
                                <div className="font-semibold text-indigo-700 text-lg">{doc.title || doc.fileName || 'Document'}</div>
                                <div className="text-xs text-gray-500 mb-1">Type: {doc.type}</div>
                                {doc.type === 'image' && (
                                    <img src={doc.url || doc.fileUrl} alt={doc.title} className="w-full h-48 object-cover rounded mb-2 border" />
                                )}
                                {doc.type === 'video' && (
                                    <video src={doc.url || doc.fileUrl} controls className="w-full h-48 rounded mb-2 border bg-black" />
                                )}
                                {doc.type === 'proof' && doc.description && (
                                    <div className="text-xs text-gray-600 mb-1">{doc.description}</div>
                                )}
                                <div className="text-xs text-gray-500">Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}</div>
                                <a
                                    href={doc.url || doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm text-center w-fit"
                                >
                                    View / Download
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showNotifyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4 text-yellow-700">Send Notification to Campaign Owner</h3>
                        <textarea
                            value={notifyMessage}
                            onChange={e => setNotifyMessage(e.target.value)}
                            placeholder="Enter your message to the campaign owner..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        {notifyFeedback && (
                            <div className="mt-2 text-sm text-center text-green-600">{notifyFeedback}</div>
                        )}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleSendNotification}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium"
                                disabled={notifyLoading || !notifyMessage.trim()}
                            >
                                {notifyLoading ? 'Sending...' : 'Send'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowNotifyModal(false);
                                    setNotifyMessage('');
                                    setNotifyFeedback('');
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CampaignDocumentsAdmin; 