import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Share from './Share';
import Footer from './Footer';
import { createPortal } from 'react-dom';
import { FaPencilAlt } from 'react-icons/fa';

// Memoized CampaignsGrid component
const CampaignsGrid = React.memo(function CampaignsGrid({
    campaigns,
    categories,
    getCategoryColor,
    getImageUrl,
    formatCurrency,
    calculateProgress,
    getDaysLeft,
    openDonationModal,
    setShareCampaign,
    setShareModalOpen,
    votingInfoOpen,
    setVotingInfoOpen,
    navigate
}) {
    if (campaigns.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or browse all categories.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map(campaign => (
                <div key={campaign._id}
                    className="bg-white/60 backdrop-blur-lg rounded-3xl border border-blue-100 shadow-xl hover:shadow-2xl transition-shadow relative flex flex-col overflow-hidden group cursor-pointer"
                    style={{ minHeight: '420px' }}
                    onClick={e => {
                        // Prevent navigation if clicking Donate or Share
                        if (
                            e.target.closest('button[data-action="donate"]') ||
                            e.target.closest('button[data-action="share"]')
                        ) return;
                        navigate(`/campaign/${campaign._id}`);
                    }}
                >
                    {/* Voting Enabled Badge */}
                    {campaign.isVotingEnabled && (
                        <div className="absolute top-3 right-3 z-20">
                            <span
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 cursor-pointer border border-blue-200 hover:bg-blue-200 transition"
                                onMouseEnter={() => setVotingInfoOpen(campaign._id)}
                                onMouseLeave={() => setVotingInfoOpen(null)}
                                onClick={() => setVotingInfoOpen(campaign._id)}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19h.01" />
                                </svg>
                                Voting Enabled
                            </span>
                            {votingInfoOpen === campaign._id && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-blue-200 rounded-xl shadow-xl p-4 z-50 animate-fade-in" onMouseEnter={() => setVotingInfoOpen(campaign._id)} onMouseLeave={() => setVotingInfoOpen(null)}>
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19h.01" />
                                        </svg>
                                        <span className="font-semibold text-blue-900">How Voting Works</span>
                                    </div>
                                    <ul className="text-sm text-blue-800 list-disc ml-5 space-y-1">
                                        <li>This campaign uses a voting system for fund release.</li>
                                        <li>When the goal is reached, donors are notified and can review documents.</li>
                                        <li>Donors vote to approve or reject the fund transfer.</li>
                                        <li>If approved by majority, funds are released to the campaigner.</li>
                                        <li>If rejected, funds may be refunded to donors.</li>
                                    </ul>
                                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setVotingInfoOpen(null)} aria-label="Close">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Campaign Image */}
                    <div className="h-44 bg-gradient-to-br from-indigo-200 to-purple-100 relative flex items-center justify-center rounded-t-3xl overflow-hidden">
                        {campaign.images && campaign.images.length > 0 && (
                            <img
                                src={getImageUrl(campaign.images[0])}
                                alt={campaign.title}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        )}
                        <div
                            className="w-full h-full flex items-center justify-center text-indigo-700 text-lg font-semibold absolute inset-0 bg-white/60"
                            style={{ display: campaign.images && campaign.images.length > 0 ? 'none' : 'flex', zIndex: 1 }}
                        >
                            {campaign.title}
                        </div>
                        {/* Category Ellipsis Dots */}
                        <div className="absolute top-3 left-3 z-10 flex space-x-1">
                            {[...Array(3)].map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`inline-block w-2 h-2 rounded-full ${getCategoryColor(campaign.category)}`}
                                    title={categories.find(c => c.value === campaign.category)?.label}
                                ></span>
                            ))}
                        </div>
                    </div>
                    {/* Campaign Content */}
                    <div className="flex-1 flex flex-col p-6 gap-2">
                        <h3 className="text-xl font-semibold text-indigo-900 mb-1 line-clamp-2">{campaign.title}</h3>
                        <p className="text-gray-600 mb-2 line-clamp-3">{campaign.description}</p>
                        {/* Progress Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Raised: {formatCurrency(campaign.currentAmount)}</span>
                                <span>{Math.round(calculateProgress(campaign.currentAmount, campaign.targetAmount))}%</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2 relative">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${campaign.currentAmount >= campaign.targetAmount
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                        : 'bg-indigo-400'
                                        }`}
                                    style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                ></div>
                                {campaign.currentAmount >= campaign.targetAmount && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                                <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
                                {campaign.currentAmount >= campaign.targetAmount && (
                                    <span className="text-green-700 font-medium flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Target Reached!
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Campaign Info */}
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                            <span>By {campaign.isOrganization && campaign.organizationName ? campaign.organizationName : (campaign.creator?.name || 'Anonymous')}</span>
                            <span>{getDaysLeft(campaign.endDate)} days left</span>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-2">
                            <button
                                data-action="donate"
                                onClick={e => { e.stopPropagation(); openDonationModal(campaign); }}
                                disabled={(campaign.status === 'completed' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount)}
                                className={`flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-xl transition-colors font-semibold shadow-sm ${(campaign.status === 'completed' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-indigo-700'
                                    }`}
                            >
                                {(campaign.status === 'completed' || campaign.status === 'completed' || campaign.fundsReleased === true || campaign.currentAmount >= campaign.targetAmount) ? 'Goal Reached' : 'Donate'}
                            </button>
                            <button
                                data-action="share"
                                className="flex items-center bg-white/80 hover:bg-blue-50 text-indigo-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors border border-indigo-100 shadow-sm"
                                onClick={e => { e.stopPropagation(); setShareCampaign(campaign); setShareModalOpen(true); }}
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
    );
});

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
    const [votingInfoOpen, setVotingInfoOpen] = useState(null);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorMessage, setDonorMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'info' });
    const mainContentRef = useRef(null);
    const [showThankYouModal, setShowThankYouModal] = useState(false);

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

    // Fetch user and user campaigns only on mount
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
        fetchUserCampaigns();
        loadRazorpayScript();
    }, []);

    // Fetch campaigns when filters/search/page change
    useEffect(() => {
        fetchCampaigns();
    }, [currentPage, searchQuery, selectedCategory]);

    // Load Razorpay script
    const loadRazorpayScript = () => {
        if (window.Razorpay) return; // Already loaded

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

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

    // Only show KYC alert if user is not verified and not pending
    const showKycAlert = user && user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && !['admin', 'super_admin'].includes(user.role);

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

            if (!response.ok) {
                console.error('Failed to fetch campaigns:', response.status, response.statusText);
                setCampaigns([]);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setCampaigns(data.data.campaigns);
                setTotalPages(data.data.totalPages);
            } else {
                console.error('API returned error:', data);
                setCampaigns([]);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setCampaigns([]);
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
            } else {
                console.error('Failed to fetch user campaigns:', response.status, response.statusText);
                setUserCampaigns([]);
            }
        } catch (error) {
            console.error('Error fetching user campaigns:', error);
            setUserCampaigns([]);
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
        setDonorName(user?.name || '');
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

    const showNotification = (title, message, type = 'info') => {
        setNotificationData({ title, message, type });
        setShowNotificationModal(true);
    };

    const closeNotification = () => {
        setShowNotificationModal(false);
        setNotificationData({ title: '', message: '', type: 'info' });
    };

    const handleDonate = async (e) => {
        e.preventDefault();
        if (!donationAmount) {
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
                            // Fetch the latest campaign data to check for proof documents
                            const campaignRes = await fetch(`http://localhost:5001/api/campaigns/${selectedCampaign._id}`);
                            const campaignData = await campaignRes.json();
                            const latestCampaign = campaignData?.data?.campaign;
                            const proofDocs = latestCampaign?.proofDocuments || [];
                            if (proofDocs.length > 0 && latestCampaign.isVotingEnabled) {
                                navigate(`/campaign/${selectedCampaign._id}/review`);
                            } else {
                                const isVotingEnabled = latestCampaign?.isVotingEnabled;
                                if (isVotingEnabled) {
                                    showNotification(
                                        'Public Review Pending',
                                        'The campaigner needs to upload proof documents before public review can begin. You will be notified when the review is ready.',
                                        'info'
                                    );
                                } else {
                                    setShowThankYouModal(true);
                                }
                                await fetchCampaigns();
                            }
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        showNotification(
                            'Payment Verification Failed',
                            'Payment verification failed. Please contact support if amount was deducted from your account.',
                            'error'
                        );
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
            showNotification(
                'Donation Failed',
                error.message || 'Failed to process donation. Please try again.',
                'error'
            );
        } finally {
            setIsDonating(false);
        }
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

    // Scroll to campaigns list when filters/search change
    useEffect(() => {
        if (mainContentRef.current && (selectedCategory !== '' || searchQuery !== '')) {
            mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedCategory, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                {/* KYC Notification Banner */}
                {user && user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && !['admin', 'super_admin'].includes(user.role) && (
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
                                        {showProfile && createPortal(
                                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50" style={{ position: 'fixed', top: 60, right: 10, zIndex: 99999 }}>
                                                <div className="p-4">
                                                    <div className="flex items-center mb-4 relative">
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
                                                        {/* Pencil Icon for Edit Profile */}
                                                        {/* <a href="/profile/edit" className="absolute top-4 right-0 p-2 text-gray-400 hover:text-indigo-600" title="Edit Profile">
                                                            <FaPencilAlt size={18} />
                                                        </a> */}
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
                                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>
                                                </div>
                                            </div>,
                                            document.body
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={mainContentRef}>
                {/* Page Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Amazing Causes</h1>
                    <p className="text-lg text-gray-600 mb-4">Support campaigns that matter to you</p>
                    {/* Enhanced Search bar and category buttons */}
                    <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-xl mx-auto mt-8">
                            <input
                                type="text"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <button
                            type="button"
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${selectedCategory === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                            onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                        >
                            All
                        </button>
                        {categories.map(category => (
                            <button
                                type="button"
                                key={category.value}
                                className={`px-3 py-1 rounded-full text-sm font-medium border ${selectedCategory === category.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                onClick={() => { setSelectedCategory(category.value); setCurrentPage(1); }}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campaigns Grid */}
                <CampaignsGrid
                    campaigns={campaigns}
                    categories={categories}
                    getCategoryColor={getCategoryColor}
                    getImageUrl={getImageUrl}
                    formatCurrency={formatCurrency}
                    calculateProgress={calculateProgress}
                    getDaysLeft={getDaysLeft}
                    openDonationModal={openDonationModal}
                    setShareCampaign={setShareCampaign}
                    setShareModalOpen={setShareModalOpen}
                    votingInfoOpen={votingInfoOpen}
                    setVotingInfoOpen={setVotingInfoOpen}
                    navigate={navigate}
                />

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

            {/* Donation Modal */}
            {showDonationModal && selectedCampaign && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white/60 backdrop-blur-lg border border-indigo-100 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative flex flex-col" style={{ minHeight: '340px' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-indigo-700">Make a Donation</h3>
                            <button
                                onClick={closeDonationModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-4 p-4 bg-white/80 rounded-xl border border-indigo-50 shadow">
                            <h4 className="font-semibold text-indigo-900 text-lg text-center">{selectedCampaign.title}</h4>
                        </div>
                        <form onSubmit={handleDonate} className="flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        placeholder=" "
                                        className="peer input-modern w-full px-4 py-3 border border-indigo-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base transition"
                                        required
                                    />
                                    <label className="label-modern">Donation Amount (₹)</label>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={donorMessage}
                                        onChange={(e) => setDonorMessage(e.target.value)}
                                        placeholder=" "
                                        rows={3}
                                        className="peer input-modern w-full px-4 py-3 border border-indigo-100 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base transition resize-none"
                                    />
                                    <label className="label-modern">Message (Optional)</label>
                                </div>
                                <div className="flex items-center mb-2">
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
                            </div>
                            <div className="sticky bottom-0 left-0 right-0 pt-6 pb-2 z-10 mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeDonationModal}
                                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDonating}
                                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold shadow transition"
                                >
                                    {isDonating ? 'Processing...' : `Donate ${donationAmount ? formatCurrency(parseFloat(donationAmount)) : ''}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white/60 backdrop-blur-lg border border-blue-100 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
                        <div className="text-center">
                            {/* Icon */}
                            <div className="mb-6">
                                {notificationData.type === 'error' ? (
                                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                ) : notificationData.type === 'success' ? (
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className={`text-xl font-bold mb-4 ${notificationData.type === 'error' ? 'text-red-700' :
                                notificationData.type === 'success' ? 'text-green-700' : 'text-blue-700'
                                }`}>
                                {notificationData.title}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                {notificationData.message}
                            </p>

                            {/* Button */}
                            <button
                                onClick={closeNotification}
                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${notificationData.type === 'error'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : notificationData.type === 'success'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                Got it
                            </button>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={closeNotification}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {showThankYouModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 flex flex-col items-center border border-gray-100">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 mt-2">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold text-green-700 mb-2 text-center">Thank You!</div>
                        <div className="text-gray-600 text-base text-center mb-6">Your donation has been received. We appreciate your support!</div>
                        <button
                            onClick={() => setShowThankYouModal(false)}
                            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            <section>
                <Footer />
            </section>
        </div>
    );
};

export default CampaignsPage; 