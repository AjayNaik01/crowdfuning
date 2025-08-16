// MyCampaigns page for /my-campaigns
// Ready for further edits as requested by the user
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DocumentVerificationForm from './DocumentVerificationForm';
import Share from './Share';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Tooltip } from 'react-tooltip';
import { createPortal } from 'react-dom';

const MyCampaigns = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState(null);
    const [deletingCampaign, setDeletingCampaign] = useState(null);
    const [visibleVerificationForm, setVisibleVerificationForm] = useState(null);
    const [user, setUser] = useState(null);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [withdrawalLoading, setWithdrawalLoading] = useState(false);
    const [showWithdrawalsModal, setShowWithdrawalsModal] = useState(false);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
    const [campaignWithdrawals, setCampaignWithdrawals] = useState({});
    const [showProfile, setShowProfile] = useState(false);
    const [showKycModal, setShowKycModal] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareCampaign, setShareCampaign] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchMyCampaigns();
        fetchDebugInfo();
        fetchUser();
        fetchMyWithdrawals(); // Fetch withdrawals on page load
    }, [token]);

    useEffect(() => {
        if (campaigns.length > 0) {
            campaigns.forEach(campaign => {
                fetchCampaignWithdrawals(campaign._id);
            });
        }
    }, [campaigns]);

    const fetchMyCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/campaigns/user/my-campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setCampaigns(data.data.campaigns);
            } else {
                console.error('Failed to fetch campaigns:', data.message);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDebugInfo = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/campaigns/debug/all-campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setDebugInfo({
                    ...data.data,
                    localStorageUser: JSON.parse(localStorage.getItem('user') || '{}')
                });
            }
        } catch (error) {
            console.error('Debug fetch error:', error);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/user/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setUser(data.data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }

        setDeletingCampaign(campaignId);

        try {
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                await fetchMyCampaigns();
                alert('Campaign deleted successfully!');
            } else {
                alert(data.message || 'Failed to delete campaign');
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Network error. Please try again.');
        } finally {
            setDeletingCampaign(null);
        }
    };

    const canDeleteCampaign = (campaign) => {
        const deletableStatuses = ['draft', 'pending_review', 'rejected', 'completed'];
        return deletableStatuses.includes(campaign.status) && campaign.currentAmount === 0;
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending_review':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryLabel = (category) => {
        const categories = {
            disaster_recovery: 'Disaster Recovery',
            education: 'Education',
            sports: 'Sports',
            business: 'Business',
            medical: 'Medical',
            community: 'Community',
            environment: 'Environment',
            arts: 'Arts',
            technology: 'Technology',
            other: 'Other'
        };
        return categories[category] || category;
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5001${imagePath}`;
    };

    const handleUploadSuccess = (updatedCampaign) => {
        setCampaigns(prevCampaigns =>
            prevCampaigns.map(c => c._id === updatedCampaign._id ? updatedCampaign : c)
        );
        setVisibleVerificationForm(null);
        alert('✅ Verification documents uploaded successfully! Your documents have been submitted for review.');
    };

    const fetchCampaignWithdrawals = async (campaignId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/withdrawals/campaign/${campaignId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('fetchCampaignWithdrawals:', { campaignId, response: data }); // Debug log: API response
            if (data.success) {
                setCampaignWithdrawals(prev => {
                    const updated = { ...prev, [campaignId]: data.data.withdrawals };
                    console.log('setCampaignWithdrawals update:', updated); // Debug log: state update
                    return updated;
                });
            }
        } catch (error) {
            setCampaignWithdrawals(prev => ({ ...prev, [campaignId]: [] }));
            console.error('fetchCampaignWithdrawals error:', { campaignId, error }); // Debug log: error
        }
    };

    const handleDirectWithdrawal = async (campaign) => {
        const withdrawalsForCampaign = campaignWithdrawals[campaign._id] || [];
        const totalWithdrawn = withdrawalsForCampaign
            .filter(w => w.status === 'pending' || w.status === 'approved')
            .reduce((sum, w) => sum + w.amount, 0);
        const availableAmount = campaign.currentAmount - totalWithdrawn;
        if (availableAmount <= 0) {
            alert('No funds available for withdrawal.');
            return;
        }
        try {
            const response = await fetch('http://localhost:5001/api/withdrawals/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    campaignId: campaign._id,
                    amount: Number(availableAmount),
                    reason: 'Auto withdrawal request'
                })
            });
            const data = await response.json();
            if (data.success) {
                alert('Withdrawal request submitted successfully!');
                fetchMyCampaigns();
            } else {
                alert(data.message || 'Failed to submit withdrawal request.');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    };

    const fetchMyWithdrawals = async () => {
        setWithdrawalsLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/withdrawals/my-withdrawals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setWithdrawals(data.data.withdrawals);
            } else {
                setWithdrawals([]);
            }
        } catch (error) {
            setWithdrawals([]);
        } finally {
            setWithdrawalsLoading(false);
        }
    };

    const openWithdrawalsModal = () => {
        setShowWithdrawalsModal(true);
        fetchMyWithdrawals();
    };

    const closeWithdrawalsModal = () => setShowWithdrawalsModal(false);

    const handleCancelWithdrawal = async (withdrawalId) => {
        const reason = prompt('Enter a reason for cancelling (optional):');
        try {
            const response = await fetch(`http://localhost:5001/api/withdrawals/cancel/${withdrawalId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelReason: reason })
            });
            const data = await response.json();
            if (data.success) {
                alert('Withdrawal request cancelled.');
                fetchMyWithdrawals();
            } else {
                alert(data.message || 'Failed to cancel request.');
            }
        } catch (error) {
            alert('Network error.');
        }
    };

    // KYC alert logic
    const showKycAlert = user && user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && !['admin', 'super_admin'].includes(user.role);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your campaigns...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                {/* KYC Notification Banner */}
                {showKycAlert && (
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
                                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center" onClick={() => navigate('/campaigns')}>
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-xl font-bold text-gray-900" onClick={() => navigate('/campaigns')}>CrowdFund</h1>
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
                                <>
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
            </header >
            {/* Profile Dropdown Portal */}
            {
                showProfile && createPortal(
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
                                    {/* KYC Status Badge */}
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
                            {/* Quick Actions */}
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
                )
            }
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
                        <p className="text-gray-600 mt-2">Manage and track your fundraising campaigns</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={openWithdrawalsModal}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            All Requests
                        </button>
                    </div>
                </div>

                {campaigns.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                        <p className="text-gray-600 mb-6">Start your fundraising journey by creating your first campaign.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map(campaign => {
                            // Use the full withdrawals array to check for approved withdrawal for this campaign
                            const anyApprovedWithdrawal = withdrawals.some(w => {
                                const statusMatch = w.status && w.status.trim().toLowerCase() === 'approved';
                                const campaignIdMatch = (w.campaign === campaign._id) || (w.campaign?._id === campaign._id);
                                return statusMatch && campaignIdMatch;
                            });
                            const totalWithdrawn = campaignWithdrawals[campaign._id] || []
                                .filter(w => w.status === 'pending' || w.status === 'approved')
                                .reduce((sum, w) => sum + w.amount, 0);
                            const availableAmount = campaign.currentAmount - totalWithdrawn;
                            const isWithdrawDisabled = availableAmount <= 0;

                            // Withdraw button logic
                            const now = new Date();
                            const endDate = new Date(campaign.endDate);
                            const isTargetMet = campaign.currentAmount >= campaign.targetAmount;
                            const isDocumentUploaded = campaign.proofDocuments && campaign.proofDocuments.length > 0;
                            const isCampaignEnded = now > endDate;
                            let canWithdraw = false;
                            let withdrawTooltip = '';
                            if (!campaign.isVotingEnabled) {
                                // Non-voting campaign logic
                                if (isDocumentUploaded && (isCampaignEnded || isTargetMet)) {
                                    canWithdraw = true;
                                } else {
                                    canWithdraw = false;
                                    if (!isDocumentUploaded) {
                                        withdrawTooltip = 'Submit proof document to enable withdrawal.';
                                    } else if (!isCampaignEnded && !isTargetMet) {
                                        withdrawTooltip = 'Withdrawal allowed only after campaign ends or target is met.';
                                    }
                                }
                            } else {
                                // Voting campaign logic (existing)
                                const votingResult = campaign.voteResults && campaign.voteResults.totalVotes > 0
                                    ? (campaign.voteResults.approveCount / campaign.voteResults.totalVotes) * 100
                                    : 0;
                                if (campaign.currentAmount >= campaign.targetAmount && votingResult > 50) {
                                    canWithdraw = true;
                                } else if (isCampaignEnded && votingResult > 50) {
                                    canWithdraw = true;
                                } else if (votingResult <= 50) {
                                    withdrawTooltip = 'Withdrawals allowed only if voting result is more than 50%';
                                } else if (campaign.currentAmount < campaign.targetAmount && !isCampaignEnded) {
                                    withdrawTooltip = 'Target not met or campaign not ended';
                                }
                            }

                            // Find the latest withdrawal for this campaign from campaignWithdrawals (withdrawal collection)
                            const latestWithdrawal = campaignWithdrawals[campaign._id] && campaignWithdrawals[campaign._id].length > 0 ? campaignWithdrawals[campaign._id].reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b) : null;
                            const hideWithdrawButton = latestWithdrawal && (latestWithdrawal.status === 'approved' || latestWithdrawal.status === 'rejected');
                            const withdrawalStatusColors = {
                                approved: 'bg-green-100 text-green-700',
                                rejected: 'bg-red-100 text-red-700',
                                pending: 'bg-yellow-100 text-yellow-800',
                                cancelled: 'bg-gray-100 text-gray-500',
                            };

                            // Only show success message and Share if any withdrawal is approved
                            if (anyApprovedWithdrawal) {
                                return (
                                    <div key={campaign._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-700">
                                                    {getCategoryLabel(campaign.category)}
                                                </span>
                                            </div>
                                            <div className="absolute top-3 right-3 z-10">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                                    {campaign.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                                {campaign.title}
                                            </h3>
                                            <p className="text-gray-600 mb-4 line-clamp-3">
                                                {campaign.description}
                                            </p>
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                    <span>Raised: {formatCurrency(Math.min(campaign.currentAmount, campaign.targetAmount))}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 flex items-center justify-between">
                                                    <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                                <span>{getDaysLeft(campaign.endDate)} days left</span>
                                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {/* Improved success message and Share button */}
                                            <div className="flex items-center justify-center w-full px-4 py-3 mb-3 rounded-md bg-green-100 border border-green-200 text-green-800 font-semibold text-sm">
                                                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Funds have been successfully released to your account.
                                            </div>
                                            <button
                                                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-medium transition"
                                                onClick={() => { setShareModalOpen(true); setShareCampaign(campaign); }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 20v.01M20 12v.01M12 4v.01M7.05 7.05l.01.01M16.95 7.05l.01.01M16.95 16.95l.01.01M7.05 16.95l.01.01" />
                                                </svg>
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={campaign._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-90 text-gray-700">
                                                {getCategoryLabel(campaign.category)}
                                            </span>
                                        </div>
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                                {campaign.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {campaign.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                            {campaign.description}
                                        </p>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Raised: {formatCurrency(Math.min(campaign.currentAmount, campaign.targetAmount))}</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center justify-between">
                                                <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                            <span>{getDaysLeft(campaign.endDate)} days left</span>
                                            <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        {/* Action Buttons and Notifications */}
                                        {hideWithdrawButton ? (
                                            latestWithdrawal && (
                                                <span className={`flex-1 px-4 py-2 rounded-md text-center font-semibold text-sm ${withdrawalStatusColors[latestWithdrawal.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {latestWithdrawal.status.charAt(0).toUpperCase() + latestWithdrawal.status.slice(1)}
                                                </span>
                                            )
                                        ) : (
                                            <>
                                                <div className="flex gap-2 mb-4">
                                                    {user && user.userId === campaign.creator && (
                                                        <button
                                                            className="flex-1 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
                                                            onClick={() => navigate(`/campaign/${campaign._id}/edit`)}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {hideWithdrawButton ? (
                                                        latestWithdrawal && (
                                                            <span className={`flex-1 px-4 py-2 rounded-md text-center font-semibold text-sm ${withdrawalStatusColors[latestWithdrawal.status] || 'bg-gray-100 text-gray-700'}`}>
                                                                {latestWithdrawal.status.charAt(0).toUpperCase() + latestWithdrawal.status.slice(1)}
                                                            </span>
                                                        )
                                                    ) : (
                                                        <button
                                                            className="flex-1 px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white font-semibold transition"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!canWithdraw) {
                                                                    alert(withdrawTooltip);
                                                                    return;
                                                                }
                                                                handleDirectWithdrawal(campaign);
                                                            }}
                                                            disabled={!canWithdraw}
                                                            title={withdrawTooltip}
                                                        >
                                                            Claim Amount
                                                        </button>
                                                    )}
                                                </div>
                                                {canDeleteCampaign(campaign) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign._id); }}
                                                        disabled={deletingCampaign === campaign._id}
                                                        className="flex-1 bg-red-600 text-white text-center w-full py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {deletingCampaign === campaign._id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                )}
                                                {/* Cannot delete notification */}
                                                {!canDeleteCampaign(campaign) && campaign.status !== 'active' && (
                                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                        <p className="text-sm text-blue-800">
                                                            <strong>Cannot delete:</strong>
                                                            {campaign.currentAmount > 0
                                                                ? ' Campaign has received funds.'
                                                                : ` Campaign status is '${campaign.status}'.`
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {/* Upload Documents button for all campaigns */}
                                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setVisibleVerificationForm(visibleVerificationForm === campaign._id ? null : campaign._id); }}
                                                        className="text-green-600 hover:underline"
                                                    >
                                                        {visibleVerificationForm === campaign._id ? 'Cancel Upload' : 'Upload Documents'}
                                                    </button>
                                                </div>
                                                {visibleVerificationForm === campaign._id && (
                                                    <DocumentVerificationForm
                                                        campaignId={campaign._id}
                                                        token={token}
                                                        onUploadSuccess={handleUploadSuccess}
                                                    />
                                                )}
                                                {campaign.isVotingEnabled && campaign.proofDocuments && campaign.proofDocuments.length === 0 && (
                                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                                        <p className="text-sm text-red-800">
                                                            No verification documents uploaded yet. Please upload verification data.
                                                        </p>
                                                    </div>
                                                )}
                                                {campaign.isVotingEnabled && campaign.proofDocuments && campaign.proofDocuments.length > 0 && (
                                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                                        <p className="text-sm text-green-800">
                                                            ✅ Verification documents uploaded successfully!
                                                        </p>
                                                    </div>
                                                )}
                                                {/* Share Button */}
                                                <button
                                                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-medium transition"
                                                    onClick={() => { setShareModalOpen(true); setShareCampaign(campaign); }}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 20v.01M20 12v.01M12 4v.01M7.05 7.05l.01.01M16.95 7.05l.01.01M16.95 16.95l.01.01M7.05 16.95l.01.01" />
                                                    </svg>
                                                    Share
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {
                showWithdrawalsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">All Requests</h3>
                                    <div className="flex gap-2 items-center">
                                        <button onClick={closeWithdrawalsModal} className="text-gray-400 hover:text-gray-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {withdrawalsLoading ? (
                                    <div className="text-center py-8">Loading...</div>
                                ) : withdrawals.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No withdrawal requests found.</div>
                                ) : (
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="px-3 py-2 text-left">Campaign</th>
                                                <th className="px-3 py-2 text-left">Amount</th>
                                                <th className="px-3 py-2 text-left">Status</th>
                                                <th className="px-3 py-2 text-left">Date</th>
                                                <th className="px-3 py-2 text-left">Rejection Reason</th>
                                                <th className="px-3 py-2 text-left"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.map(w => (
                                                <tr key={w._id || w.id} className="border-b">
                                                    <td className="px-3 py-2">{w.campaign?.title || '-'}</td>
                                                    <td className="px-3 py-2">{formatCurrency(w.amount)}</td>
                                                    <td className="px-3 py-2 capitalize">{w.status}
                                                        {(w.status === 'rejected' || w.status === 'cancelled') && w.rejectionReason && (
                                                            <span title={w.rejectionReason} className="ml-1 cursor-pointer text-blue-500">&#9432;</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">{new Date(w.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2">
                                                        {w.rejectionReason ? (
                                                            <span className="text-red-600 font-medium">{w.rejectionReason}</span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {w.status === 'pending' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCancelWithdrawal(w._id || w.id); }}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Share Modal */}
            <Share open={shareModalOpen} onClose={() => setShareModalOpen(false)} campaign={shareCampaign} />
        </div >
    );
};

export default MyCampaigns; 