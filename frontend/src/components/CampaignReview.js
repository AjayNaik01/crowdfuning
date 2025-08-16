import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DocumentViewer from './DocumentViewer';

const CampaignReview = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasDonated, setHasDonated] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [userVote, setUserVote] = useState(null);
    const [voteComment, setVoteComment] = useState('');
    const [isSubmittingVote, setIsSubmittingVote] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [newDocuments, setNewDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
    const [showInitialLoading, setShowInitialLoading] = useState(true);

    useEffect(() => {
        fetchCampaign();
        checkUserStatus();

        // Check if coming from notification with tab parameter
        const urlParams = new URLSearchParams(location.search);
        const tab = urlParams.get('tab');
        if (tab === 'voting') {
            setActiveTab('voting');
        }

        const timer = setTimeout(() => setShowInitialLoading(false), 3000);
        return () => clearTimeout(timer);
    }, [campaignId, location.search]);

    const fetchCampaign = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}`);
            const data = await response.json();
            if (data.success) {
                setCampaign(data.data.campaign);
                // Identify new documents (uploaded in last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const newDocs = data.data.campaign.proofDocuments?.filter(doc =>
                    new Date(doc.uploadedAt) > sevenDaysAgo
                ) || [];
                setNewDocuments(newDocs);
            } else {
                alert('Campaign not found');
                navigate('/campaigns');
            }
        } catch (error) {
            console.error('Error fetching campaign:', error);
            alert('Failed to load campaign');
            navigate('/campaigns');
        } finally {
            setLoading(false);
        }
    };

    const checkUserStatus = async () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const userObj = JSON.parse(userData);
            setUser(userObj);

            // Check if user has donated to this campaign
            try {
                const token = localStorage.getItem('token');
                console.log('Checking donations for campaign:', campaignId);
                const response = await fetch(`http://localhost:5001/api/donations/user/${campaignId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Donations response status:', response.status);
                const data = await response.json();
                console.log('Donations response data:', data);
                if (data.success && data.data.donations.length > 0) {
                    setHasDonated(true);
                }
            } catch (error) {
                console.error('Error checking donation status:', error);
            }

            // Check if user has already voted
            try {
                const token = localStorage.getItem('token');
                console.log('Checking vote status for campaign:', campaignId);
                const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}/vote-status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Vote status response status:', response.status);
                const data = await response.json();
                console.log('Vote status response data:', data);
                if (data.success) {
                    setHasVoted(data.data.hasVoted);
                    setUserVote(data.data.userVote);
                }
            } catch (error) {
                console.error('Error checking vote status:', error);
            }
        }
    };

    const handleVote = async (vote) => {
        if (!user) {
            alert('Please login to vote');
            navigate('/login');
            return;
        }

        if (!hasDonated) {
            alert('You must donate to this campaign before you can vote');
            return;
        }

        if (hasVoted) {
            alert('You have already voted on this campaign');
            return;
        }

        setIsSubmittingVote(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    vote,
                    comment: voteComment
                })
            });

            const data = await response.json();
            if (data.success) {
                setHasVoted(true);
                setUserVote(vote);
                setVoteComment('');
                alert(`Thank you for your ${vote} vote!`);
                fetchCampaign(); // Refresh campaign data to update vote results
            } else {
                alert(data.message || 'Failed to submit vote');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote. Please try again.');
        } finally {
            setIsSubmittingVote(false);
        }
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleViewDocument = (doc) => {
        setSelectedDocument(doc);
        setIsDocumentViewerOpen(true);
    };

    const handleCloseDocumentViewer = () => {
        setIsDocumentViewerOpen(false);
        setSelectedDocument(null);
    };

    if (showInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Please vote and review</h2>
                    <p className="text-gray-600">Loading voting page...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Back to Campaigns
                    </button>
                </div>
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
                            <button
                                onClick={() => navigate('/campaigns')}
                                className="mr-4 text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">Campaign Review & Vote</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to={`/campaigns/${campaignId}`}
                                className="text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md text-sm font-medium transition"
                            >
                                View Full Campaign
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Campaign Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
                            <p className="text-gray-600 mb-4">{campaign.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Category: {getCategoryLabel(campaign.category)}</span>
                                <span>Created: {formatDate(campaign.createdAt)}</span>
                                {campaign.isVotingEnabled && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        Voting Enabled
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(campaign.currentAmount)}
                            </div>
                            <div className="text-sm text-gray-500">
                                of {formatCurrency(campaign.targetAmount)} goal
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Campaign Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Documents
                                {newDocuments.length > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                        {newDocuments.length} New
                                    </span>
                                )}
                            </button>
                            {campaign.isVotingEnabled && (
                                <button
                                    onClick={() => setActiveTab('voting')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'voting'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Voting
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2">Campaign Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Start Date:</span> {formatDate(campaign.startDate)}</div>
                                            <div><span className="font-medium">End Date:</span> {formatDate(campaign.endDate)}</div>
                                            <div><span className="font-medium">Days Left:</span> {getDaysLeft(campaign.endDate)}</div>
                                            <div><span className="font-medium">Status:</span>
                                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {campaign.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2">Creator Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Creator:</span> {campaign.creator?.name || 'Anonymous'}</div>
                                            {campaign.isOrganization && (
                                                <>
                                                    <div><span className="font-medium">Organization:</span> {campaign.organizationName}</div>
                                                    <div><span className="font-medium">Details:</span> {campaign.organizationDetails}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Campaign Images */}
                                {campaign.images && campaign.images.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-4">Campaign Images</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {campaign.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image}
                                                    alt={`Campaign ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Campaign Documents</h3>
                                {campaign.proofDocuments && campaign.proofDocuments.length > 0 ? (
                                    <div className="space-y-4">
                                        {campaign.proofDocuments.map((doc, index) => {
                                            const isNew = newDocuments.some(newDoc => newDoc._id === doc._id);
                                            const fileExtension = doc.fileUrl.split('.').pop()?.toLowerCase();
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension);

                                            return (
                                                <div
                                                    key={index}
                                                    className={`border rounded-lg p-4 ${isNew ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-start space-x-4">
                                                        {/* Document Preview */}
                                                        <div className="flex-shrink-0">
                                                            {isImage ? (
                                                                <img
                                                                    src={`http://localhost:5001${doc.fileUrl}`}
                                                                    alt={doc.title}
                                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'block';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className={`w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center ${isImage ? 'hidden' : ''}`}
                                                                style={{ backgroundColor: fileExtension === 'pdf' ? '#ff4444' : '#666666' }}
                                                            >
                                                                <span className="text-white text-xs font-medium uppercase">
                                                                    {fileExtension || 'doc'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Document Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                                                                {isNew && (
                                                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                                                                        NEW
                                                                    </span>
                                                                )}
                                                                {doc.type === 'voting_document' && (
                                                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                                                                        VOTING DOC
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {doc.description && (
                                                                <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                Uploaded: {formatDate(doc.uploadedAt)}
                                                            </p>
                                                        </div>

                                                        {/* Action Button */}
                                                        <div className="flex-shrink-0">
                                                            <button
                                                                onClick={() => handleViewDocument(doc)}
                                                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition flex items-center space-x-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                <span>View</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No documents uploaded yet.</p>
                                )}
                            </div>
                        )}

                        {/* Voting Tab */}
                        {activeTab === 'voting' && campaign.isVotingEnabled && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Voting Information</h3>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <p>• You must donate to this campaign before you can vote</p>
                                        <p>• Voting helps ensure transparency in fund usage</p>
                                        <p>• Your vote will be recorded anonymously</p>
                                        {campaign.votingEndDate && (
                                            <p>• Voting ends: {formatDate(campaign.votingEndDate)}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Voting Interface */}
                                {!hasDonated ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-yellow-900 mb-2">Donation Required</h3>
                                        <p className="text-yellow-800 mb-4">You must donate to this campaign before you can vote on fund usage.</p>
                                        <button
                                            onClick={() => navigate(`/campaigns/${campaignId}`)}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
                                        >
                                            Go to Campaign to Donate
                                        </button>
                                    </div>
                                ) : hasVoted ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-green-900 mb-2">Vote Submitted</h3>
                                        <p className="text-green-800">Thank you for voting! Your vote: <span className="font-medium">{userVote}</span></p>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-4">Cast Your Vote</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Comment (Optional)
                                                </label>
                                                <textarea
                                                    value={voteComment}
                                                    onChange={(e) => setVoteComment(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    rows="3"
                                                    placeholder="Add a comment about your vote..."
                                                />
                                            </div>
                                            <div className="flex space-x-4">
                                                <button
                                                    onClick={() => handleVote('approve')}
                                                    disabled={isSubmittingVote}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    {isSubmittingVote ? 'Submitting...' : 'Approve Fund Release'}
                                                </button>
                                                <button
                                                    onClick={() => handleVote('reject')}
                                                    disabled={isSubmittingVote}
                                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    {isSubmittingVote ? 'Submitting...' : 'Reject Fund Release'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Document Viewer Modal */}
            <DocumentViewer isOpen={isDocumentViewerOpen} onClose={handleCloseDocumentViewer} document={selectedDocument} />
        </div>
    );
};

export default CampaignReview;