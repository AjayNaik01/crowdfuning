import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Share from './Share';

const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showProfile, setShowProfile] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [openShareId, setOpenShareId] = useState(null);
    const shareMenuRef = useRef(null);
    const navigate = useNavigate();
    const [copiedId, setCopiedId] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareCampaign, setShareCampaign] = useState(null);

    const categories = [
        { value: 'disaster_recovery', label: 'Disaster Recovery' },
        { value: 'education', label: 'Education' },
        { value: 'sports', label: 'Sports' },
        { value: 'business', label: 'Business' },
        { value: 'medical', label: 'Medical' },
        { value: 'community', label: 'Community' },
        { value: 'environment', label: 'Environment' },
        { value: 'arts', label: 'Arts' },
        { value: 'technology', label: 'Technology' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        // Fetch user from backend for latest kycStatus
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
                    console.log('API Response:', data);
                    console.log('User data from API:', data.data?.user);
                    console.log('KYC Status from API:', data.data?.user?.kycStatus);
                    setUser(data.data?.user);
                    // Update localStorage with fresh user data
                    localStorage.setItem('user', JSON.stringify(data.data?.user));
                } else {
                    console.log('API Response not ok:', response.status, response.statusText);
                    const userData = localStorage.getItem('user');
                    if (userData) setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
            }
        };
        fetchUser();
        fetchCampaigns();
        fetchUserCampaigns();
    }, [currentPage, searchQuery, selectedCategory]);

    // Add focus event listener to refresh user data when tab becomes active
    useEffect(() => {
        const handleFocus = () => {
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
                    }
                } catch (error) {
                    console.error('Error fetching user on focus:', error);
                }
            };
            fetchUser();
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Only show KYC alert if user is not verified
    const showKycAlert = user && user.kycStatus !== 'VERIFIED' && !['admin', 'super_admin'].includes(user.role);

    console.log('KYC Alert Debug:', {
        user: user,
        kycStatus: user?.kycStatus,
        role: user?.role,
        showKycAlert: showKycAlert,
        condition1: user && user.kycStatus !== 'VERIFIED',
        condition2: !['admin', 'super_admin'].includes(user?.role)
    });

    useEffect(() => {
        if (showKycAlert) {
            const timer = setTimeout(() => {
                setShowKycModal(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showKycAlert]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 12
            });

            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategory) params.append('category', selectedCategory);

            const response = await fetch(`http://localhost:5001/api/campaigns?${params}`);
            const data = await response.json();

            if (data.success) {
                setCampaigns(data.data.campaigns);
                setTotalPages(data.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5001/api/campaigns/user/my-campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserCampaigns(data.data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching user campaigns:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchCampaigns();
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const calculateProgress = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    const getDaysLeft = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getCategoryColor = (category) => {
        const colors = {
            disaster_recovery: 'bg-red-100 text-red-800',
            education: 'bg-blue-100 text-blue-800',
            sports: 'bg-green-100 text-green-800',
            business: 'bg-purple-100 text-purple-800',
            medical: 'bg-pink-100 text-pink-800',
            community: 'bg-yellow-100 text-yellow-800',
            environment: 'bg-emerald-100 text-emerald-800',
            arts: 'bg-indigo-100 text-indigo-800',
            technology: 'bg-gray-100 text-gray-800',
            other: 'bg-slate-100 text-slate-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        // If the path already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath;
        // Otherwise, construct the full URL
        return `http://localhost:5001${imagePath}`;
    };

    // Close share menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
                setOpenShareId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* KYC Modal Popup */}
            {showKycModal && showKycAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full flex flex-col items-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
                        <p className="text-gray-600 text-sm mb-4 text-center">
                            You need to complete KYC verification before you can create campaigns. This helps ensure transparency and trust in our platform.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowKycModal(false); navigate('/kyc'); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Complete KYC Now
                            </button>
                            <button
                                onClick={() => setShowKycModal(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                {/* KYC Notification Banner */}
                {user && user.kycStatus !== 'VERIFIED' && !['admin', 'super_admin'].includes(user.role) && (
                    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p className="text-sm text-yellow-800">
                                    Complete your KYC verification to create campaigns and access all features.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/kyc')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                            >
                                Complete KYC
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-xl font-bold text-gray-900">CrowdFund</h1>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-8">
                            <form onSubmit={handleSearch} className="flex">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search campaigns..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    className="px-4 py-2 border-t border-b border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    {user.kycStatus === 'VERIFIED' || ['admin', 'super_admin'].includes(user.role) ? (
                                        <Link
                                            to="/create-campaign"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Start a Campaign
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowKycModal(true);
                                            }}
                                            className="bg-gray-400 cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                                            title="Complete KYC verification to create campaigns"
                                        >
                                            Start a Campaign
                                        </button>
                                    )}
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

                                        {/* Profile Dropdown */}
                                        {showProfile && (
                                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                                <div className="p-4">
                                                    <div className="flex items-center mb-4">
                                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <span className="text-lg font-medium text-indigo-600">
                                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                            {/* KYC Status Badge */}
                                                            <div className="mt-1">
                                                                {user.kycStatus === 'VERIFIED' ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                        KYC Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                        </svg>
                                                                        KYC Required
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Stats Cards */}
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <p className="text-xs text-gray-600">My Campaigns</p>
                                                            <p className="text-lg font-bold text-gray-900">{userCampaigns.length}</p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <p className="text-xs text-gray-600">KYC Status</p>
                                                            <div className="flex items-center">
                                                                <p className="text-sm font-medium text-gray-900 capitalize">
                                                                    {user.kycStatus?.replace('_', ' ') || 'Not Submitted'}
                                                                </p>
                                                                {user.kycStatus === 'VERIFIED' && (
                                                                    <svg className="w-4 h-4 ml-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="space-y-2 mb-4">
                                                        <Link
                                                            to="/my-campaigns"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            My Campaigns
                                                        </Link>
                                                        {user.kycStatus !== 'VERIFIED' && !['admin', 'super_admin'].includes(user.role) && (
                                                            <Link
                                                                to="/kyc"
                                                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                            >
                                                                Complete KYC
                                                            </Link>
                                                        )}
                                                        {user.kycStatus && user.kycStatus !== 'VERIFIED' && (
                                                            <Link
                                                                to="/kyc-status"
                                                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                            >
                                                                KYC Status
                                                            </Link>
                                                        )}
                                                        <Link
                                                            to="/donations"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            Donation History
                                                        </Link>
                                                        <Link
                                                            to="/notifications"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            Notifications
                                                        </Link>
                                                    </div>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                                    >
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Amazing Causes</h1>
                    <p className="text-lg text-gray-600">Support campaigns that matter to you</p>
                </div>

                {/* Campaigns Grid */}
                {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria or browse all categories.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {campaigns.map(campaign => (
                            <div key={campaign._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* Campaign Image */}
                                <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 relative">
                                    {campaign.images && campaign.images.length > 0 && (
                                        <img
                                            src={getImageUrl(campaign.images[0])}
                                            alt={campaign.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    )}
                                    <div
                                        className="w-full h-full flex items-center justify-center text-white text-lg font-medium absolute inset-0"
                                        style={{
                                            display: campaign.images && campaign.images.length > 0 ? 'none' : 'flex',
                                            zIndex: 1
                                        }}
                                    >
                                        {campaign.title}
                                    </div>
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(campaign.category)}`}>
                                            {categories.find(c => c.value === campaign.category)?.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Campaign Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {campaign.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {campaign.description}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Raised: {formatCurrency(campaign.currentAmount)}</span>
                                            <span>{Math.round(calculateProgress(campaign.currentAmount, campaign.targetAmount))}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Goal: {formatCurrency(campaign.targetAmount)}
                                        </div>
                                    </div>

                                    {/* Campaign Info */}
                                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                        <span>By {campaign.isOrganization && campaign.organizationName ? campaign.organizationName : (campaign.creator?.name || 'Anonymous')}</span>
                                        <span>{getDaysLeft(campaign.endDate)} days left</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        <Link
                                            to={`/campaign/${campaign._id}`}
                                            className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={`/donate/${campaign._id}`}
                                            className={`flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${(campaign.status === 'awaiting_admin_approval' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount) ? 'pointer-events-none opacity-50' : 'hover:bg-green-700'}`}
                                            tabIndex={(campaign.status === 'awaiting_admin_approval' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount) ? -1 : 0}
                                            aria-disabled={campaign.status === 'awaiting_admin_approval' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount}
                                        >
                                            {(campaign.status === 'awaiting_admin_approval' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount) ? 'Goal Reached' : 'Donate'}
                                        </Link>
                                        <button
                                            className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                            onClick={() => { setShareCampaign(campaign); setShareModalOpen(true); }}
                                            title="Share campaign"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                            </svg>
                                            Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 border rounded-md text-sm font-medium ${currentPage === page
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>

            {/* Close dropdown when clicking outside */}
            {showProfile && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfile(false)}
                ></div>
            )}

            <Share open={shareModalOpen} onClose={() => setShareModalOpen(false)} campaign={shareCampaign} />
        </div>
    );
};

export default CampaignsPage; 