import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlatformHeader from './PlatformHeader';

const notificationTypeBadge = (type) => {
    const badgeMap = {
        campaign: 'bg-indigo-100 text-indigo-700',
        donation: 'bg-green-100 text-green-700',
        kyc: 'bg-yellow-100 text-yellow-700',
        admin: 'bg-red-100 text-red-700',
        voting_document: 'bg-blue-100 text-blue-700',
        target_reached: 'bg-purple-100 text-purple-700',
        report: 'bg-orange-100 text-orange-700',
        other: 'bg-gray-100 text-gray-700',
    };
    const labelMap = {
        campaign: 'Campaign',
        donation: 'Donation',
        kyc: 'KYC',
        admin: 'Admin',
        voting_document: 'Voting Document',
        target_reached: 'Target Reached',
        report: 'Report',
        other: 'Info',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${badgeMap[type] || badgeMap.other}`}>
            {labelMap[type] || 'INFO'}
        </span>
    );
};

const notificationTypeIcon = (type) => {
    switch (type) {
        case 'campaign':
            return (
                <span className="inline-block w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </span>
            );
        case 'donation':
            return (
                <span className="inline-block w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                </span>
            );
        case 'kyc':
            return (
                <span className="inline-block w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </span>
            );
        case 'report':
            return (
                <span className="inline-block w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
            );
        case 'admin':
            return (
                <span className="inline-block w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
            );
        case 'voting_document':
            return (
                <span className="inline-block w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                    </svg>
                </span>
            );
        case 'target_reached':
            return (
                <span className="inline-block w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
            );
        default:
            return (
                <span className="inline-block w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </span>
            );
    }
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localRead, setLocalRead] = useState({});
    const [showProfile, setShowProfile] = useState(false);
    const [user, setUser] = useState(null);
    const profileRef = useRef(null);
    const navigate = useNavigate();

    // Fetch user profile on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await fetch('http://localhost:5001/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.data?.user);
                    localStorage.setItem('user', JSON.stringify(data.data?.user));
                } else {
                    const userData = localStorage.getItem('user');
                    if (userData) setUser(JSON.parse(userData));
                }
            } catch (error) {
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
            }
        };
        fetchUser();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        }
        if (showProfile) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfile]);

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            console.log('=== FRONTEND: Fetching notifications ===');
            const response = await fetch('http://localhost:5001/api/user/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Frontend: Notifications response status:', response.status);
            const data = await response.json();
            console.log('Frontend: Notifications response data:', data);
            if (data.success) {
                console.log('Frontend: Setting notifications:', data.data);
                setNotifications(data.data);
                console.log('Frontend: Notifications state updated');
            } else {
                console.log('Frontend: Failed to fetch notifications');
                setError('Failed to fetch notifications.');
            }
        } catch (err) {
            console.error('Frontend: Error fetching notifications:', err);
            setError('Failed to fetch notifications.');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Animation: fade-in for notifications
    useEffect(() => {
        if (notifications.length > 0) {
            notifications.forEach((n, i) => {
                setTimeout(() => {
                    document.getElementById(`notif-card-${n._id}`)?.classList.add('opacity-100', 'translate-y-0');
                }, 100 * i);
            });
        }
    }, [notifications]);

    const handleToggleRead = (id) => {
        setLocalRead((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleReviewAndVote = (notification) => {
        if (notification.campaign && notification.campaign._id) {
            // Navigate to campaign review page for voting
            navigate(`/campaign/${notification.campaign._id}/review`);
        } else if (notification.campaign) {
            // If campaign is just a string/ID
            navigate(`/campaign/${notification.campaign}/review`);
        } else {
            // Fallback to campaigns list
            navigate('/campaigns');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-gray-500 mb-4">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <PlatformHeader />

            {/* Main Content */}
            <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
                </div>
                {notifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <ul className="space-y-6">
                        {notifications.map((notification) => {
                            const isRead = localRead[notification._id] ?? notification.read;
                            return (
                                <li
                                    key={notification._id}
                                    id={`notif-card-${notification._id}`}
                                    className={`transition-all duration-300 opacity-0 translate-y-4 hover:scale-[1.02] hover:shadow-lg bg-white rounded-xl p-6 flex items-center gap-4 border ${isRead ? 'border-gray-200' : 'border-indigo-200'} shadow-sm group`}
                                    style={{ minHeight: 120 }}
                                >
                                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                        {notificationTypeIcon(notification.type)}
                                        {notificationTypeBadge(notification.type)}
                                        <button
                                            onClick={() => handleToggleRead(notification._id)}
                                            className={`mt-2 text-xs px-2 py-1 rounded transition font-semibold border ${isRead ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600' : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 hover:text-indigo-900'}`}
                                        >
                                            {isRead ? 'Mark as Unread' : 'Mark as Read'}
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* Campaign title clickable */}
                                        {notification.campaign && (
                                            <p className="text-indigo-700 font-semibold mb-1 text-center text-lg">
                                                Campaign: {notification.campaign._id ? (
                                                    <Link
                                                        to={`/campaigns/${notification.campaign._id}`}
                                                        className="underline hover:text-indigo-900 transition"
                                                    >
                                                        {notification.campaign.title || notification.campaign._id}
                                                    </Link>
                                                ) : (
                                                    <span>{notification.campaign.title || notification.campaign}</span>
                                                )}
                                            </p>
                                        )}
                                        {/* Document info */}
                                        {notification.document && notification.document.fileUrl && (
                                            <div className="mb-1 text-center">
                                                <span className="text-gray-800">Document: </span>
                                                <a
                                                    href={notification.document.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline hover:text-blue-800 transition font-medium"
                                                >
                                                    {notification.document.title || 'View Document'}
                                                </a>
                                            </div>
                                        )}
                                        <p className="text-gray-900 font-medium text-center mb-2">{notification.message}</p>
                                        <p className="text-xs text-gray-500 text-center">{new Date(notification.createdAt).toLocaleDateString()}</p>

                                        {/* Review and Vote Button for voting_document notifications */}
                                        {notification.type === 'voting_document' && (
                                            <div className="mt-3 text-center">
                                                <button
                                                    onClick={() => handleReviewAndVote(notification)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center mx-auto gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Review and Vote
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Notifications;