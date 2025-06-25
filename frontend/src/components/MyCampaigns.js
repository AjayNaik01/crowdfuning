import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const MyCampaigns = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState(null);
    const [deletingCampaign, setDeletingCampaign] = useState(null);

    useEffect(() => {
        fetchMyCampaigns();
        fetchDebugInfo();
    }, []);

    const fetchMyCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

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
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await fetch('http://localhost:5001/api/campaigns/debug/all-campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setDebugInfo({
                    ...data.data,
                    localStorageUser: user
                });
            }
        } catch (error) {
            console.error('Debug fetch error:', error);
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }

        setDeletingCampaign(campaignId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Refresh the campaign list to get updated data
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
        // If the path already starts with http, return as is
        if (imagePath.startsWith('http')) return imagePath;
        // Otherwise, construct the full URL
        return `http://localhost:5001${imagePath}`;
    };

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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
                        <p className="text-gray-600 mt-2">Manage and track your fundraising campaigns</p>
                    </div>
                    <Link
                        to="/create-campaign"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                    >
                        Create New Campaign
                    </Link>
                </div>

                {/* Debug Information */}
                {debugInfo && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Information</h3>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <p><strong>Current User ID:</strong> {debugInfo.currentUserId}</p>
                            <p><strong>LocalStorage User ID:</strong> {debugInfo.localStorageUser?.userId}</p>
                            <p><strong>Total Campaigns in DB:</strong> {debugInfo.totalCampaigns}</p>
                            <p><strong>Campaigns Shown:</strong> {campaigns.length}</p>
                            <p><strong>Campaigns You Own:</strong> {debugInfo.campaigns.filter(c => c.isOwnedByCurrentUser).length}</p>
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer font-medium">All Campaigns in Database</summary>
                            <div className="mt-2 space-y-1">
                                {debugInfo.campaigns.map((campaign, index) => (
                                    <div key={index} className="text-xs p-2 bg-white rounded border">
                                        <p><strong>Title:</strong> {campaign.title}</p>
                                        <p><strong>Creator ID:</strong> {campaign.creatorId}</p>
                                        <p><strong>You Own:</strong> {campaign.isOwnedByCurrentUser ? '✅ Yes' : '❌ No'}</p>
                                        <p><strong>Status:</strong> {campaign.status}</p>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {/* Campaigns Grid */}
                {campaigns.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                        <p className="text-gray-600 mb-6">Start your fundraising journey by creating your first campaign.</p>
                        <Link
                            to="/create-campaign"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                        >
                            Create Your First Campaign
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                        <span>{getDaysLeft(campaign.endDate)} days left</span>
                                        <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
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
                                            to={`/campaign/${campaign._id}/edit`}
                                            className="flex-1 bg-gray-300 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        {canDeleteCampaign(campaign) && (
                                            <button
                                                onClick={() => handleDeleteCampaign(campaign._id)}
                                                disabled={deletingCampaign === campaign._id}
                                                className="flex-1 bg-red-600 text-white text-center py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingCampaign === campaign._id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Delete status info */}
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

                                    {/* Status-specific actions */}
                                    {campaign.status === 'pending_review' && (
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <p className="text-sm text-yellow-800">
                                                Your campaign is under review. We'll notify you once it's approved.
                                            </p>
                                        </div>
                                    )}

                                    {campaign.status === 'rejected' && campaign.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-sm text-red-800">
                                                <strong>Rejection Reason:</strong> {campaign.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Statistics */}
                {campaigns.length > 0 && (
                    <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{campaigns.length}</div>
                                <div className="text-sm text-gray-600">Total Campaigns</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {campaigns.filter(c => c.status === 'active').length}
                                </div>
                                <div className="text-sm text-gray-600">Active Campaigns</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(campaigns.reduce((sum, c) => sum + c.currentAmount, 0))}
                                </div>
                                <div className="text-sm text-gray-600">Total Raised</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {campaigns.filter(c => c.status === 'completed').length}
                                </div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCampaigns; 