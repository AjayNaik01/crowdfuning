import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Share from './Share';

const CampaignDetails = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorMessage, setDonorMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [isDonating, setIsDonating] = useState(false);
    const [user, setUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    useEffect(() => {
        fetchCampaign();
        fetchDonations();
        fetchComments();
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [campaignId]);

    const fetchCampaign = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}`);
            const data = await response.json();
            if (data.success) {
                setCampaign(data.data.campaign);
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

    const fetchDonations = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/donations/campaign/${campaignId}`);
            const data = await response.json();
            if (data.success) {
                setDonations(data.data.donations);
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
        }
    };

    const fetchComments = async () => {
        // TODO: Implement comments API
        setComments([
            { id: 1, user: 'John Doe', comment: 'This is an amazing cause!', date: '2025-06-24' },
            { id: 2, user: 'Jane Smith', comment: 'I hope this campaign reaches its goal!', date: '2025-06-24' }
        ]);
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

            const response = await fetch('http://localhost:5001/api/donations/donate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    campaignId,
                    amount: parseFloat(donationAmount),
                    donorName: isAnonymous ? 'Anonymous' : donorName,
                    message: donorMessage,
                    isAnonymous,
                    paymentMethod,
                    upiId: paymentMethod === 'upi' ? upiId : null
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Thank you for your donation! Your contribution will make a difference.');
                setDonationAmount('');
                setDonorName('');
                setDonorMessage('');
                setIsAnonymous(false);
                setUpiId('');
                fetchDonations(); // Refresh donations
                fetchCampaign(); // Refresh campaign to update current amount
            } else {
                alert(data.message || 'Failed to process donation');
            }
        } catch (error) {
            console.error('Error making donation:', error);
            alert('Failed to process donation. Please try again.');
        } finally {
            setIsDonating(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            // TODO: Implement comment submission API
            const comment = {
                id: Date.now(),
                user: user?.name || 'Anonymous',
                comment: newComment,
                date: new Date().toISOString().split('T')[0]
            };
            setComments(prev => [comment, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to submit comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason.trim()) {
            alert('Please provide a reason for reporting');
            return;
        }

        setIsSubmittingReport(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            // Choose endpoint based on authentication
            const endpoint = token ? '/api/reports/submit' : '/api/reports/submit-anonymous';

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`http://localhost:5001${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    campaignId,
                    reason: reportReason.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Thank you for your report. We will review it and take appropriate action.');
                setReportReason('');
                setShowReportModal(false);
            } else {
                alert(data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setIsSubmittingReport(false);
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
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper to check if donations are allowed
    const isDonationDisabled = campaign && (
        campaign.status === 'awaiting_admin_approval' ||
        campaign.status === 'completed' ||
        campaign.fundsReleased === true ||
        campaign.currentAmount >= campaign.targetAmount
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading campaign...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex items-center space-x-2 text-sm text-gray-500">
                        <li><Link to="/" className="hover:text-indigo-600">Home</Link></li>
                        <li>/</li>
                        <li><Link to="/campaigns" className="hover:text-indigo-600">Campaigns</Link></li>
                        <li>/</li>
                        <li className="text-gray-900">{campaign.title}</li>
                    </ol>
                </nav>

                {/* Campaign Header */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                    {/* Hero Image */}
                    <div className="relative h-96 bg-gradient-to-br from-indigo-400 to-purple-500">
                        {campaign.images && campaign.images.length > 0 && (
                            <img
                                src={`http://localhost:5001${campaign.images[0]}`}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                            <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                    {campaign.status.replace('_', ' ')}
                                </span>
                                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white bg-opacity-20">
                                    {getCategoryLabel(campaign.category)}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
                            <p className="text-lg opacity-90">By {campaign.creator?.name || 'Anonymous'}</p>
                        </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-indigo-600">{formatCurrency(campaign.currentAmount)}</div>
                                <div className="text-sm text-gray-600">Raised</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{formatCurrency(campaign.targetAmount)}</div>
                                <div className="text-sm text-gray-600">Goal</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{donations.length}</div>
                                <div className="text-sm text-gray-600">Donors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">{getDaysLeft(campaign.endDate)}</div>
                                <div className="text-sm text-gray-600">Days Left</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>{Math.round(calculateProgress(campaign.currentAmount, campaign.targetAmount))}% funded</span>
                                <span>{formatCurrency(campaign.currentAmount)} of {formatCurrency(campaign.targetAmount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => document.getElementById('donate-section').scrollIntoView({ behavior: 'smooth' })}
                                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                disabled={isDonationDisabled}
                            >
                                {isDonationDisabled ? 'Goal Reached' : 'Donate Now'}
                            </button>
                            <button
                                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                onClick={() => setShareModalOpen(true)}
                                title="Share campaign"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                                Share
                            </button>
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="flex-1 border-2 border-red-600 text-red-600 py-3 px-6 rounded-lg font-medium hover:bg-red-600 hover:text-white transition-colors"
                            >
                                Report Campaign
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Campaign Description */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Campaign</h2>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        {campaign.images && campaign.images.length > 1 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Images</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {campaign.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer"
                                            onClick={() => {
                                                setActiveImageIndex(index);
                                                setShowImageModal(true);
                                            }}
                                        >
                                            <img
                                                src={`http://localhost:5001${image}`}
                                                alt={`Campaign image ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Video Gallery */}
                        {campaign.videos && campaign.videos.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Videos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {campaign.videos.map((video, index) => (
                                        <div key={index} className="relative">
                                            <video
                                                controls
                                                className="w-full h-48 object-cover rounded-lg"
                                                src={`http://localhost:5001${video}`}
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Donations */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Donations</h2>
                            {donations.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No donations yet. Be the first to donate!</p>
                            ) : (
                                <div className="space-y-4">
                                    {donations.slice(0, 10).map((donation, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium">
                                                        {donation.donorName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(donation.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">{formatCurrency(donation.amount)}</p>
                                                {donation.message && (
                                                    <p className="text-sm text-gray-600 mt-1">"{donation.message}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments & Support</h2>

                            {/* Add Comment */}
                            <form onSubmit={handleComment} className="mb-6">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts and support..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingComment || !newComment.trim()}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="border-b border-gray-200 pb-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-gray-600 text-sm font-medium">
                                                    {comment.user.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-medium text-gray-900">{comment.user}</span>
                                                    <span className="text-sm text-gray-500">{comment.date}</span>
                                                </div>
                                                <p className="text-gray-700">{comment.comment}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Donation Form */}
                        <div id="donate-section" className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Make a Donation</h2>
                            {isDonationDisabled ? (
                                <div className="text-center text-green-600 font-semibold text-lg py-8">
                                    This campaign has reached its goal and is no longer accepting donations.
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                            min="1"
                                            disabled={isDonationDisabled}
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                            disabled={isDonationDisabled}
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            rows={3}
                                            disabled={isDonationDisabled}
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="anonymous"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled={isDonationDisabled}
                                        />
                                        <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                                            Make donation anonymous
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            disabled={isDonationDisabled}
                                        >
                                            <option value="upi">UPI</option>
                                            <option value="card">Credit/Debit Card</option>
                                            <option value="net_banking">Net Banking</option>
                                            <option value="wallet">Digital Wallet</option>
                                        </select>
                                    </div>
                                    {paymentMethod === 'upi' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                UPI ID
                                            </label>
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                placeholder="Enter UPI ID"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                disabled={isDonationDisabled}
                                            />
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isDonating || isDonationDisabled}
                                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {isDonating ? 'Processing...' : `Donate ${donationAmount ? formatCurrency(parseFloat(donationAmount)) : ''}`}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Campaign Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Campaign Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-500">Created by:</span>
                                    <p className="font-medium">{campaign.creator?.name || 'Anonymous'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Category:</span>
                                    <p className="font-medium">{getCategoryLabel(campaign.category)}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Start Date:</span>
                                    <p className="font-medium">{new Date(campaign.startDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">End Date:</span>
                                    <p className="font-medium">{new Date(campaign.endDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                        {campaign.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Organization Info */}
                        {campaign.isOrganization && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Organization</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500">Name:</span>
                                        <p className="font-medium">{campaign.organizationName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Details:</span>
                                        <p className="text-sm">{campaign.organizationDetails}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && campaign.images && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 text-white text-2xl z-10"
                        >
                            ×
                        </button>
                        <img
                            src={`http://localhost:5001${campaign.images[activeImageIndex]}`}
                            alt={`Campaign image ${activeImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                        />
                        {campaign.images.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between p-4">
                                <button
                                    onClick={() => setActiveImageIndex(prev => prev === 0 ? campaign.images.length - 1 : prev - 1)}
                                    className="bg-black bg-opacity-50 text-white p-2 rounded-full"
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={() => setActiveImageIndex(prev => prev === campaign.images.length - 1 ? 0 : prev + 1)}
                                    className="bg-black bg-opacity-50 text-white p-2 rounded-full"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Report Campaign</h3>
                        <form onSubmit={handleReport}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Report
                                </label>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Please describe why you are reporting this campaign..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReport}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <Share open={shareModalOpen} onClose={() => setShareModalOpen(false)} campaign={campaign} />
        </div>
    );
};

export default CampaignDetails; 