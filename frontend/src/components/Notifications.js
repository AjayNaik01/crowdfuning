import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to view your notifications.');
            setLoading(false);
            return;
        }
        fetch('/api/user/notifications', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotifications(data.data);
                } else {
                    setError('Failed to fetch notifications.');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch notifications.');
                setLoading(false);
            });
    }, []);

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
                <Link to="/login" className="text-indigo-600 hover:underline">Go to Login</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <Link to="/user-dashboard" className="text-indigo-600 hover:underline text-sm">Back to Dashboard</Link>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    {notifications.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <p>No notifications yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {notifications.map((notification) => (
                                <li key={notification._id} className={`py-4 flex items-start space-x-4 ${notification.read ? '' : 'bg-indigo-50'}`}>
                                    <div className="flex-shrink-0">
                                        {notification.type === 'campaign' && (
                                            <span className="inline-block w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </span>
                                        )}
                                        {notification.type === 'donation' && (
                                            <span className="inline-block w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </span>
                                        )}
                                        {notification.type === 'kyc' && (
                                            <span className="inline-block w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </span>
                                        )}
                                        {notification.type === 'admin' && (
                                            <span className="inline-block w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-medium mb-1">{notification.message}</p>
                                        <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications; 