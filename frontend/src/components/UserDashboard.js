import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Share from './Share';
// import Notifications from './Notifications';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareCampaign, setShareCampaign] = useState(null);
    const [showDonationsModal, setShowDonationsModal] = useState(false);
    const [donations, setDonations] = useState([]);
    const [donationsLoading, setDonationsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user data from backend to get latest kycStatus
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await fetch('http://localhost:5001/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    // fallback to localStorage if needed
                    const userData = localStorage.getItem('user');
                    if (userData) setUser(JSON.parse(userData));
                }
            } catch (error) {
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
            }
        };
        fetchUser();
        fetchUserCampaigns();
    }, [navigate]);

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
                setCampaigns(data.data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDonations = async () => {
        setDonationsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5001/api/donations/user-donations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setDonations(data.data.donations);
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setDonationsLoading(false);
        }
    };

    const openDonationsModal = () => {
        setShowDonationsModal(true);
        fetchUserDonations();
    };

    const closeDonationsModal = () => {
        setShowDonationsModal(false);
        setDonations([]);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'pending_review': return 'text-yellow-600 bg-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'completed': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
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
                                <h1 className="text-xl font-bold text-gray-900">CrowdFund</h1>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/campaigns"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Browse Campaigns
                            </Link>
                            <Link
                                to="/donations-history"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                onClick={() => console.log('Header Donation History link clicked')}
                            >
                                Donation History
                            </Link>
                            <div className="relative">
                                <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
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
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header >

            {/* Main Content */}
            < div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >
                {/* KYC Alert */}
                {
                    user && user.kycStatus !== 'VERIFIED' && (
                        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center">
                            <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-yellow-800 font-medium">Your KYC is incomplete. Please complete your KYC to access all features.</span>
                        </div>
                    )
                }
                {/* Welcome Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome back, {user.name || 'User'}!
                            </h2>
                            <p className="text-gray-600">
                                Ready to make a difference? Start a new campaign or support others.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/create-campaign"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300"
                            >
                                Start a Campaign
                            </Link>
                            <Link
                                to="/campaigns"
                                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-6 py-3 rounded-lg font-medium transition duration-300"
                            >
                                Browse Campaigns
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {campaigns.filter(c => c.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {campaigns.filter(c => c.status === 'pending_review').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={openDonationsModal}>
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">My Donations</p>
                                <p className="text-2xl font-bold text-gray-900">View All</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                My Campaigns
                            </button>
                            <button
                                onClick={() => navigate('/notifications')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notifications'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Notifications
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Overview</h3>
                                <p className="text-gray-600 mb-4">
                                    Welcome to your dashboard. Here you can manage your campaigns and track your contributions.
                                </p>
                                <div className="flex space-x-3">
                                    <Link
                                        to="/donations-history"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => console.log('Overview tab Donation History link clicked')}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        View Donation History
                                    </Link>
                                </div>
                            </div>
                        )}
                        {activeTab === 'campaigns' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">My Campaigns</h3>
                                    <Link
                                        to="/create-campaign"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                                    >
                                        Create New Campaign
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Campaign
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Raised
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Goal
                                                </th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {campaigns.map((campaign) => (
                                                <tr key={campaign._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img className="h-10 w-10 rounded-full object-cover" src={`http://localhost:5001${campaign.imageUrl}`} alt={campaign.title} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                                                                <div className="text-sm text-gray-500">Ends on {new Date(campaign.endDate).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                                                            {campaign.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{campaign.currentAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ₹{campaign.goalAmount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link to={`/campaign/${campaign._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</Link>
                                                        <Link to={`/campaign/${campaign._id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                                        <button
                                                            onClick={() => {
                                                                setShareCampaign(campaign);
                                                                setShareModalOpen(true);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Share
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >
            {shareModalOpen && shareCampaign && (
                <Share
                    campaignId={shareCampaign._id}
                    title={shareCampaign.title}
                    onClose={() => setShareModalOpen(false)}
                />
            )}

            {/* Donations History Modal */}
            {
                showDonationsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">My Donation History</h3>
                                <button
                                    onClick={closeDonationsModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {donationsLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Loading your donations...</p>
                                    </div>
                                ) : donations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No donations yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">Start supporting campaigns by making your first donation.</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => {
                                                    closeDonationsModal();
                                                    navigate('/campaigns');
                                                }}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                Browse Campaigns
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Donations: <span className="font-semibold text-gray-900">{donations.length}</span></p>
                                                <p className="text-xs text-gray-500">
                                                    {donations.filter(d => d.isAnonymous).length} anonymous • {donations.filter(d => !d.isAnonymous).length} public
                                                </p>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Campaign
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {donations.map((donation) => (
                                                        <tr key={donation._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-8 w-8">
                                                                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                                            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {donation.campaign?.title || 'Campaign'}
                                                                        </div>
                                                                        {donation.isAnonymous && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                Anonymous
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-green-700">
                                                                    {formatCurrency(donation.amount)}
                                                                </div>
                                                                {donation.message && (
                                                                    <div className="text-sm text-gray-500 mt-1">
                                                                        "{donation.message}"
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(donation.createdAt)}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Completed
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                                <button
                                                                    onClick={() => {
                                                                        closeDonationsModal();
                                                                        navigate(`/campaign/${donation.campaign?._id}`);
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    View Campaign
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserDashboard; 