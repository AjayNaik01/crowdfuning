import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

const PlatformHeader = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [platformSettings, setPlatformSettings] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await fetch('http://localhost:5001/api/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) setUser(data.data);
            } catch (error) {
                setUser(null);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/platform-settings/');
                const data = await response.json();
                if (data.success) setPlatformSettings(data.data);
            } catch (error) {
                setPlatformSettings(null);
            }
        };
        fetchSettings();
    }, []);

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                                style={{ backgroundColor: platformSettings?.primaryColor || '#4f46e5' }}
                                onClick={() => navigate('/campaigns')}
                            >
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-3">
                            <h1
                                className="text-xl font-bold text-gray-900 cursor-pointer"
                                onClick={() => navigate('/campaigns')}
                            >
                                {platformSettings?.platformName || 'CrowdFund'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user && (user.kycStatus === 'VERIFIED' || ['admin', 'super_admin'].includes(user.role)) && (
                            <button
                                onClick={() => navigate('/create-campaign')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Create New Campaign
                            </button>
                        )}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfile(!showProfile)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                                >
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">{user.name || user.email}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showProfile && createPortal(
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50" style={{ position: 'fixed', top: 60, right: 10, zIndex: 99999 }}>
                                        <div className="p-4">
                                            <div className="flex items-center mb-4">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-lg font-medium text-indigo-600">
                                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                                    <div className="mt-1">
                                                        {user?.kycStatus === 'VERIFIED' && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                KYC Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/my-campaigns'); setShowProfile(false); }}>My Campaigns</button>
                                                <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/donation-history'); setShowProfile(false); }}>Donation History</button>
                                                <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/notifications'); setShowProfile(false); }}>Notifications</button>
                                                {user?.kycStatus !== 'VERIFIED' && user?.kycStatus !== 'PENDING' && !['admin', 'super_admin'].includes(user?.role) && (
                                                    <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/kyc'); setShowProfile(false); }}>Complete KYC</button>
                                                )}
                                            </div>
                                            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Start a Campaign
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PlatformHeader; 