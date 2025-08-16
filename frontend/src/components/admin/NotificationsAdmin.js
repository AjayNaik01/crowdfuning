import React, { useEffect, useState } from 'react';
import adminFetch from './adminFetch';
import { FaBell, FaPaperPlane } from 'react-icons/fa';

const NOTIFICATION_TYPES = [
    { value: 'admin', label: 'Admin' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'donation', label: 'Donation' },
    { value: 'kyc', label: 'KYC' },
    { value: 'other', label: 'Other' },
    { value: 'voting_document', label: 'Voting Document' },
    { value: 'target_reached', label: 'Target Reached' },
    { value: 'report', label: 'Report' },
];

function NotificationsAdmin() {
    const [recipientType, setRecipientType] = useState('all');
    const [userId, setUserId] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [formError, setFormError] = useState('');
    const [campaignSearch, setCampaignSearch] = useState('');
    const [campaignOptions, setCampaignOptions] = useState([]);
    const [notificationType, setNotificationType] = useState('admin');
    const [successMsg, setSuccessMsg] = useState('');

    // Fetch campaigns for search
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (recipientType !== 'campaignDonors' || !campaignSearch) {
                setCampaignOptions([]);
                return;
            }
            const res = await adminFetch(`http://localhost:5001/api/admin/campaigns?search=${encodeURIComponent(campaignSearch)}`);
            const data = await res.json();
            if (data.success) setCampaignOptions(data.data.campaigns || []);
        };
        fetchCampaigns();
    }, [campaignSearch, recipientType]);

    const handleSend = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMsg('');
        setSending(true);
        let body = { recipientType, message, type: notificationType };
        if (recipientType === 'user') {
            if (userId) body.userId = userId;
            if (userEmail) body.userEmail = userEmail;
            if (!userId && !userEmail) {
                setFormError('Provide user ID or email');
                setSending(false);
                return;
            }
        } else if (recipientType === 'campaignDonors') {
            if (!campaignId) {
                setFormError('Select a campaign');
                setSending(false);
                return;
            }
            body.campaignId = campaignId;
        }
        if (!message) {
            setFormError('Message required');
            setSending(false);
            return;
        }
        const res = await adminFetch('http://localhost:5001/api/admin/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
            setMessage('');
            setUserId('');
            setUserEmail('');
            setCampaignId('');
            setCampaignSearch('');
            setRecipientType('all');
            setNotificationType('admin');
            setSuccessMsg('Notification sent successfully!');
        } else {
            setFormError(data.message || 'Failed to send notification');
        }
        setSending(false);
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-indigo-50 to-emerald-50 flex flex-col items-start">
            <div className="w-full max-w-3xl relative">
                {/* Subtle background icon */}
                <FaBell className="absolute right-8 top-8 text-indigo-100 text-[120px] pointer-events-none select-none hidden md:block" style={{ zIndex: 0 }} />
                <h2 className="text-3xl font-extrabold mb-2 text-indigo-800 tracking-tight flex items-center gap-2 z-10 relative">
                    <FaBell className="text-indigo-600" /> Send Notification
                </h2>
                <p className="mb-8 text-gray-500 z-10 relative">Send a custom notification to all users, a specific user, or all donors of a campaign. Choose the notification type for context.</p>
                <div className="bg-white rounded-2xl shadow-xl p-8 z-10 relative">
                    {successMsg && <div className="mb-4 px-4 py-2 bg-green-100 text-green-800 rounded font-semibold">{successMsg}</div>}
                    <form onSubmit={handleSend} className="flex flex-col gap-6">
                        <div>
                            <label className="block font-semibold mb-1">Notification Type</label>
                            <select value={notificationType} onChange={e => setNotificationType(e.target.value)} className="border rounded px-2 py-1 w-full">
                                {NOTIFICATION_TYPES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Recipient Type</label>
                            <select value={recipientType} onChange={e => setRecipientType(e.target.value)} className="border rounded px-2 py-1 w-full">
                                <option value="all">All Users</option>
                                <option value="user">Specific User</option>
                                <option value="campaignDonors">All Donors of a Campaign</option>
                            </select>
                        </div>
                        {recipientType === 'user' && (
                            <div className="flex gap-2">
                                <input type="text" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} className="border rounded px-2 py-1 w-full" />
                                <span className="self-center text-gray-400">or</span>
                                <input type="email" placeholder="User Email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="border rounded px-2 py-1 w-full" />
                            </div>
                        )}
                        {recipientType === 'campaignDonors' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search campaign by title"
                                    value={campaignSearch}
                                    onChange={e => {
                                        setCampaignSearch(e.target.value);
                                        setCampaignId('');
                                    }}
                                    className="border rounded px-2 py-1 w-full"
                                />
                                {campaignOptions.length > 0 && (
                                    <ul className="border rounded bg-white mt-1 max-h-40 overflow-y-auto shadow">
                                        {campaignOptions.map(c => (
                                            <li
                                                key={c._id}
                                                className={`px-3 py-2 cursor-pointer hover:bg-indigo-100 ${campaignId === c._id ? 'bg-indigo-50 font-semibold' : ''}`}
                                                onClick={() => {
                                                    setCampaignId(c._id);
                                                    setCampaignSearch(c.title);
                                                    setCampaignOptions([]);
                                                }}
                                            >
                                                {c.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        <div>
                            <label className="block font-semibold mb-1">Message</label>
                            <textarea placeholder="Notification message" value={message} onChange={e => setMessage(e.target.value)} className="border rounded px-2 py-1 w-full min-h-[60px]" />
                        </div>
                        {formError && <div className="text-red-600 text-sm">{formError}</div>}
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2" disabled={sending}>
                            <FaPaperPlane /> {sending ? 'Sending...' : 'Send Notification'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default NotificationsAdmin; 