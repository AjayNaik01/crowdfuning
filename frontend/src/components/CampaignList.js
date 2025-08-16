import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CampaignList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorMessage, setDonorMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [showPublicReviewModal, setShowPublicReviewModal] = useState(false);

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
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchCampaigns();
        fetchUserCampaigns();
        loadRazorpayScript();
    }, [currentPage, searchQuery, selectedCategory]);

    useEffect(() => {
        if (localStorage.getItem('showPublicReviewModal') === 'true') {
            setShowPublicReviewModal(true);
            localStorage.removeItem('showPublicReviewModal');
        }
    }, []);

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

    // Donation modal functions
    const openDonationModal = (campaign) => {
        setSelectedCampaign(campaign);
        setDonationAmount('');
        setDonorName('');
        setDonorMessage('');
        setIsAnonymous(false);
        setShowDonationModal(true);
    };

    const closeDonationModal = () => {
        setShowDonationModal(false);
        setSelectedCampaign(null);
        setDonationAmount('');
        setDonorName('');
        setDonorMessage('');
        setIsAnonymous(false);
    };

    const handleDonate = async (e) => {
        e.preventDefault();
        if (!donationAmount || !donorName) {
            alert('Please fill in all required fields');
            return;
        }

        setIsDonating(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Step 1: Create Razorpay order
            const orderResponse = await fetch('http://localhost:5001/api/donations/create-order', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: parseFloat(donationAmount),
                    campaignId: selectedCampaign._id
                })
            });

            const orderData = await orderResponse.json();
            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create payment order');
            }

            // Step 2: Initialize Razorpay payment
            const options = {
                key: orderData.data.key,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: 'CrowdFund',
                description: `Donation for ${selectedCampaign.title}`,
                order_id: orderData.data.orderId,
                handler: async function (response) {
                    try {
                        // Step 3: Verify payment on backend
                        const verifyResponse = await fetch('http://localhost:5001/api/donations/verify-payment', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                campaignId: selectedCampaign._id,
                                donorName: donorName,
                                message: donorMessage,
                                isAnonymous: isAnonymous
                            })
                        });

                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            closeDonationModal();
                            // Refresh the page to update campaign amounts
                            await fetchCampaigns();
                            const latestCampaign = campaigns.find(c => c._id === selectedCampaign._id) || selectedCampaign;
                            console.log('Checking modal condition:', {
                                votingEnabled: latestCampaign?.votingEnabled,
                                voting: latestCampaign?.voting,
                                proofDocument: latestCampaign?.proofDocument,
                                latestCampaign
                            });
                            if (
                                (latestCampaign?.votingEnabled || latestCampaign?.voting === true) &&
                                (!latestCampaign?.proofDocument || (Array.isArray(latestCampaign.proofDocument) && latestCampaign.proofDocument.length === 0))
                            ) {
                                localStorage.setItem('showPublicReviewModal', 'true');
                                setShowPublicReviewModal(true);
                            }
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert('Payment verification failed. Please contact support if amount was deducted.');
                    }
                },
                prefill: {
                    name: donorName,
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#4F46E5'
                },
                modal: {
                    ondismiss: function () {
                        setIsDonating(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Error making donation:', error);
            alert(error.message || 'Failed to process donation. Please try again.');
        } finally {
            setIsDonating(false);
        }
    };

    // Load Razorpay script
    const loadRazorpayScript = () => {
        if (window.Razorpay) return; // Already loaded

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
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
                                <h1 className="text-xl font-bold text-gray-900">Cr0wdFund</h1>
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
                                    <Link
                                        to="/create-campaign"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Start a Campaign
                                    </Link>
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
                                                            <p className="text-sm font-medium text-gray-900 capitalize">
                                                                {user.kycStatus === 'PENDING' ? 'Under Review' : (user.kycStatus?.replace('_', ' ') || 'Not Submitted')}
                                                            </p>
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
                                                        <Link
                                                            to="/notifications"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            Notifications
                                                        </Link>
                                                        <Link
                                                            to="/donations-history"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            Donation History
                                                        </Link>
                                                        <Link
                                                            to="/kyc"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            Complete KYC
                                                        </Link>
                                                        <Link
                                                            to="/kyc-status"
                                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                        >
                                                            KYC Status
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
                            <div
                                key={campaign._id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 flex flex-col cursor-pointer group"
                                onClick={() => navigate(`/campaign/${campaign._id}`)}
                                tabIndex={0}
                                role="button"
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/campaign/${campaign._id}`); }}
                                style={{ outline: 'none' }}
                            >
                                {/* Campaign Image */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    {campaign.images && campaign.images.length > 0 ? (
                                        <img
                                            src={getImageUrl(campaign.images[0])}
                                            alt={campaign.title}
                                            className="w-full h-full object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-lg">No Image</div>
                                    )}
                                    {/* Category Tags */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded bg-orange-50 text-orange-600 border border-orange-200`}>{categories.find(c => c.value === campaign.category)?.label || 'Other'}</span>
                                        {campaign.isOrganization && <span className="px-2 py-1 text-xs font-semibold rounded bg-pink-50 text-pink-600 border border-pink-200">Foundation</span>}
                                    </div>
                                </div>
                                {/* Card Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold text-blue-900 mb-1 line-clamp-2">{campaign.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <span className="flex items-center gap-1">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {campaign.creator?.name ? campaign.creator.name.charAt(0).toUpperCase() : 'U'}
                                            </span>
                                            {campaign.isOrganization && campaign.organizationName ? campaign.organizationName : (campaign.creator?.name || 'Unknown')}
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                                            {getDaysLeft(campaign.endDate)} Days left
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-12 bg-yellow-100 text-yellow-700 text-xs font-bold rounded px-2 py-0.5 text-center">
                                                {Math.round(calculateProgress(campaign.currentAmount, campaign.targetAmount))}%
                                            </div>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-2 bg-yellow-400 rounded-full transition-all duration-300"
                                                    style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold mt-auto pt-2 border-t border-gray-100">
                                        <span className="text-gray-700">Raised: <span className="text-blue-700">{formatCurrency(campaign.currentAmount)}</span></span>
                                        <span className="text-gray-500">Goal: <span className="text-orange-600">{formatCurrency(campaign.targetAmount)}</span></span>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={e => { e.stopPropagation(); openDonationModal(campaign); }}
                                            className="flex-1 bg-orange-500 text-white text-center py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                                        >
                                            Donate
                                        </button>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(`${window.location.origin}/campaign/${campaign._id}`);
                                                // Optionally, show a temporary confirmation (alert or toast)
                                                alert('Link copied!');
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-lg font-semibold hover:bg-gray-200 transition border border-gray-300"
                                        >
                                            Share
                                        </button>
                                    </div>
                                </div>
                                {campaign.status === 'public_review_pending' && (
                                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-3 rounded flex items-center gap-2">
                                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                                        <div>
                                            <div className="font-semibold">
                                                {campaign.isVotingEnabled ? 'Public Review Pending' : 'Proof Documents Pending'}
                                            </div>
                                            <div className="text-sm">
                                                {campaign.isVotingEnabled
                                                    ? 'The campaigner needs to upload proof documents before public review can begin. You will be notified when the review is ready.'
                                                    : 'The campaigner needs to upload proof documents for admin verification. This helps ensure transparency and legitimacy of the campaign.'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
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

            {/* Donation Modal */}
            {showDonationModal && selectedCampaign && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Make a Donation</h3>
                            <button
                                onClick={closeDonationModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">{selectedCampaign.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{selectedCampaign.description}</p>
                            <div className="text-sm text-gray-500">
                                Goal: {formatCurrency(selectedCampaign.targetAmount)} |
                                Raised: {formatCurrency(selectedCampaign.currentAmount)}
                            </div>
                        </div>

                        {!user ? (
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">Please login to make a donation</p>
                                <Link
                                    to="/login"
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleDonate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Donation Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message (Optional)
                                    </label>
                                    <textarea
                                        value={donorMessage}
                                        onChange={(e) => setDonorMessage(e.target.value)}
                                        placeholder="Leave a message of support..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                                        Make donation anonymous
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeDonationModal}
                                        className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDonating}
                                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isDonating ? 'Processing...' : `Donate ${donationAmount ? formatCurrency(parseFloat(donationAmount)) : ''}`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {showPublicReviewModal && selectedCampaign && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-xl shadow-xl max-w-md w-full mx-4 flex flex-col items-center">
                        <svg className="w-10 h-10 text-yellow-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                        <div className="font-bold text-lg mb-2">
                            {selectedCampaign.isVotingEnabled ? 'Public Review Pending' : 'Proof Documents Pending'}
                        </div>
                        <div className="text-sm mb-4 text-center">
                            {selectedCampaign.isVotingEnabled
                                ? 'The campaigner needs to upload proof documents before public review can begin. You will be notified when the review is ready.'
                                : 'The campaigner needs to upload proof documents for admin verification. This helps ensure transparency and legitimacy of the campaign.'
                            }
                        </div>
                        <button onClick={() => setShowPublicReviewModal(false)} className="mt-2 px-6 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignList; 