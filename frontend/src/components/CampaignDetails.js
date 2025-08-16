import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Share from './Share';
import DocumentVerificationForm from './DocumentVerificationForm';
import Slider from 'react-slick';
import { FaChevronLeft, FaChevronRight, FaPlay, FaArrowLeft } from 'react-icons/fa';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PlatformHeader from './PlatformHeader';

// Custom styles for slider
const sliderStyles = `
  .slick-dots {
    bottom: -50px !important;
  }
  .slick-dots li {
    margin: 0 8px !important;
  }
  .slick-dots li button:before {
    display: none !important;
  }
  .slick-dots li.slick-active button {
    transform: scale(1.2) !important;
  }
  .slick-arrow {
    opacity: 0.9 !important;
  }
  .slick-arrow:hover {
    opacity: 1 !important;
  }
`;

const CampaignDetails = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorMessage, setDonorMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [user, setUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [visibleVerificationForm, setVisibleVerificationForm] = useState(false);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showPublicReviewModal, setShowPublicReviewModal] = useState(false);
    const [showThankYouModal, setShowThankYouModal] = useState(false);

    // --- Media slider video control ---
    const sliderRef = useRef();
    const [playingVideo, setPlayingVideo] = useState(null);
    const handleMediaPlay = (idx) => {
        setPlayingVideo(idx);
    };
    const handleMediaPause = () => {
        setPlayingVideo(null);
    };

    // Accordion state
    const [commentsOpen, setCommentsOpen] = useState(true);

    // New states for video control
    const [videoPlaying, setVideoPlaying] = useState([]);
    const [videoMuted, setVideoMuted] = useState([]);
    const [videoProgress, setVideoProgress] = useState([]);
    const videoRefs = useRef([]);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    // Combine images and videos for the slider as objects with type and url
    const media = [
        ...((campaign?.images || []).map(url => ({ type: 'image', url }))),
        ...((campaign?.videos || []).map(url => ({ type: 'video', url })))
    ];
    // Media filter toggle state
    const [mediaFilter, setMediaFilter] = useState('all'); // 'all', 'image', 'video'
    // Filtered media for the slider
    const filteredMedia = mediaFilter === 'all' ? media : media.filter(m => m.type === mediaFilter);

    useEffect(() => {
        fetchCampaign();
        fetchDonations();
        fetchComments();
        loadRazorpayScript();

        // Fetch user data
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    const userData = localStorage.getItem('user');
                    if (userData) setUser(JSON.parse(userData));
                    return;
                }

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
                console.error('Error fetching user:', error);
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
            }
        };

        fetchUser();
    }, [campaignId]);

    useEffect(() => {
        if (campaign) {
            console.log('Campaign status:', campaign.status); // Debug
            // The following logic for showPublicReviewModal is removed as per the edit hint.
            // if (campaign.status === 'public_review_pending') {
            //     setShowPublicReviewModal(true);
            // }
        }
    }, [campaign]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('showPublicReviewModal') === '1') {
            setShowPublicReviewModal(true);
            params.delete('showPublicReviewModal');
            window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
        }
    }, []);

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

    const loadRazorpayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

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

    const handleUploadSuccess = (updatedCampaign) => {
        setCampaign(updatedCampaign);
        setVisibleVerificationForm(false);

        // Show success alert
        alert('✅ Verification documents uploaded successfully! Your documents have been submitted for review.');
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

    // Replace fetchComments with backend API call
    const fetchComments = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}/comments`);
            const data = await response.json();
            if (data.success) {
                setComments(data.data);
            } else {
                setComments([]);
            }
        } catch (error) {
            setComments([]);
        }
    };

    // Replace handleComment with backend API call
    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You must be logged in to comment.');
                setIsSubmittingComment(false);
                return;
            }
            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: newComment })
            });
            const data = await response.json();
            if (data.success) {
                setComments(prev => [data.data, ...prev]);
                setNewComment('');
            } else {
                alert(data.message || 'Failed to submit comment');
            }
        } catch (error) {
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

    const isDonationDisabled = campaign && (
        campaign.status === 'completed' ||
        campaign.fundsReleased === true ||
        campaign.currentAmount >= campaign.targetAmount
    );

    const isCampaignCreator = user && campaign && campaign.creator && user.userId === campaign.creator._id;

    const isUserDonor = user && donations.some(d => {
        if (!d.donor) return false;
        if (typeof d.donor === 'string') return d.donor === user.userId;
        if (typeof d.donor === 'object') return d.donor._id === user.userId || d.donor === user.userId;
        return false;
    });

    console.log('isUserDonor:', isUserDonor);
    console.log('User:', user);
    console.log('Donations:', donations);
    console.log('ProofDocuments:', campaign && campaign.proofDocuments);

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

    if (!campaign) return null;

    // New handlers for video control
    const handlePlayPause = idx => {
        const video = videoRefs.current[idx];
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    };
    const handleMuteToggle = idx => {
        setVideoMuted(muted => {
            const newMuted = [...muted];
            newMuted[idx] = !newMuted[idx];
            if (videoRefs.current[idx]) videoRefs.current[idx].muted = newMuted[idx];
            return newMuted;
        });
    };
    const handleVideoPlay = idx => {
        setVideoPlaying(p => {
            const arr = [];
            for (let i = 0; i < media.length; i++) arr[i] = false;
            arr[idx] = true;
            return arr;
        });
        // Optionally pause slider auto-play here
    };
    const handleVideoPause = idx => {
        setVideoPlaying(p => {
            const arr = [...p];
            arr[idx] = false;
            return arr;
        });
    };
    const handleTimeUpdate = idx => {
        const video = videoRefs.current[idx];
        if (video) {
            setVideoProgress(progress => {
                const arr = [...progress];
                arr[idx] = (video.currentTime / video.duration) * 100;
                return arr;
            });
        }
    };
    const openImageModal = (imgPath) => {
        setModalImage(imgPath);
        setImageModalOpen(true);
    };
    const closeImageModal = () => {
        setImageModalOpen(false);
        setModalImage(null);
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
                    campaignId: campaignId
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
                description: `Donation for ${campaign.title}`,
                order_id: orderData.data.orderId,
                handler: async function (response) {
                    try {
                        const verificationData = {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            campaignId: campaignId,
                            donorName: donorName,
                            message: donorMessage,
                            isAnonymous: isAnonymous
                        };

                        // Step 3: Verify payment on backend
                        const verifyResponse = await fetch('http://localhost:5001/api/donations/verify-payment', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(verificationData)
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            setShowDonationModal(false);
                            // Fetch the latest campaign data and use it for the modal check
                            const response = await fetch(`http://localhost:5001/api/campaigns/${campaignId}`);
                            const data = await response.json();
                            if (data.success) {
                                setCampaign(data.data.campaign);
                                const latestCampaign = data.data.campaign;
                                if (
                                    latestCampaign?.isVotingEnabled === true &&
                                    (!latestCampaign?.proofDocuments || (Array.isArray(latestCampaign.proofDocuments) && latestCampaign.proofDocuments.length === 0))
                                ) {
                                    window.location.href = `/campaign/${campaignId}?showPublicReviewModal=1`;
                                } else if (latestCampaign?.isVotingEnabled === false) {
                                    setShowThankYouModal(true);
                                }
                            }
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }
                    } catch (error) {
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
            alert(error.message || 'Failed to process donation. Please try again.');
        } finally {
            setIsDonating(false);
        }
    };

    const openDonationModal = () => {
        setDonorName(user?.name || '');
        setShowDonationModal(true);
    };

    return (
        <div>
            {/* Stylish Back Button - Top Left with Margin */}
            <PlatformHeader />
            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Media Section */}
                    <div className="bg-white rounded-2xl shadow p-4">
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setMediaFilter('all')} className={`px-3 py-1 rounded-full text-sm font-medium ${mediaFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                            <button onClick={() => setMediaFilter('image')} className={`px-3 py-1 rounded-full text-sm font-medium ${mediaFilter === 'image' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Images</button>
                            <button onClick={() => setMediaFilter('video')} className={`px-3 py-1 rounded-full text-sm font-medium ${mediaFilter === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Videos</button>
                        </div>
                        <Slider
                            ref={sliderRef}
                            dots={true}
                            infinite={true}
                            speed={700}
                            fade={true}
                            autoplay={filteredMedia.some(m => m.type === 'video')}
                            autoplaySpeed={5000}
                            slidesToShow={1}
                            slidesToScroll={1}
                            arrows={true}
                            nextArrow={
                                <button
                                    className="slick-arrow slick-next bg-white/90 hover:bg-white text-gray-800 rounded-full p-5 shadow-xl focus-visible:outline-indigo-500 absolute right-4 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-200 hover:scale-110 hover:shadow-2xl"
                                    role="button"
                                    aria-label="Next media"
                                >
                                    <FaChevronRight className="w-7 h-7" />
                                </button>
                            }
                            prevArrow={
                                <button
                                    className="slick-arrow slick-prev bg-white/90 hover:bg-white text-gray-800 rounded-full p-5 shadow-xl focus-visible:outline-indigo-500 absolute left-4 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-200 hover:scale-110 hover:shadow-2xl"
                                    role="button"
                                    aria-label="Previous media"
                                >
                                    <FaChevronLeft className="w-7 h-7" />
                                </button>
                            }
                            className="w-full h-full"
                            beforeChange={(oldIndex, newIndex) => {
                                // Pause any playing video when changing slides
                                const videos = document.querySelectorAll('video');
                                videos.forEach(video => {
                                    if (!video.paused) {
                                        video.pause();
                                        setPlayingVideo(null);
                                    }
                                });
                            }}
                            afterChange={current => setCurrentSlide(current)}
                            appendDots={dots => (
                                <div
                                    className="absolute left-1/2 z-50 flex gap-4 items-center"
                                    style={{ bottom: '5%' }}
                                >
                                    {dots}
                                </div>
                            )}
                            customPaging={i => (
                                <button
                                    className={
                                        i === currentSlide
                                            ? 'w-6 h-6 bg-indigo-600 rounded-full'
                                            : 'w-4 h-4 bg-white border border-gray-300 rounded-full'
                                    }
                                    aria-label={`Go to slide ${i + 1}`}
                                    tabIndex={0}
                                />
                            )}
                        >
                            {filteredMedia.length === 0 ? (
                                <div className="flex items-center justify-center w-full h-80 text-gray-400 text-lg">No media found.</div>
                            ) : filteredMedia.map((item, idx) => (
                                <div key={idx} className="relative w-full h-80 lg:h-[400px] flex items-center justify-center bg-black">
                                    {/* Media Type Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.type === 'video'
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                            }`}>
                                            {item.type === 'video' ? (
                                                <>
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                                    </svg>
                                                    Video
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Image
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    {item.type === 'video' ? (
                                        <div className="relative w-full h-full flex items-center justify-center group">
                                            <video
                                                ref={el => videoRefs.current[idx] = el}
                                                src={`http://localhost:5001${item.url}`}
                                                className="object-contain w-full h-full"
                                                controls={false}
                                                muted={videoMuted[idx]}
                                                onPlay={() => handleVideoPlay(idx)}
                                                onPause={() => handleVideoPause(idx)}
                                                onEnded={() => handleVideoPause(idx)}
                                                onTimeUpdate={() => handleTimeUpdate(idx)}
                                                tabIndex={0}
                                                aria-label="Campaign video"
                                            />
                                            {/* Play/Pause Overlay */}
                                            {!videoPlaying[idx] && (
                                                <button
                                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all"
                                                    onClick={() => handlePlayPause(idx)}
                                                    role="button"
                                                    aria-label="Play video"
                                                    tabIndex={0}
                                                >
                                                    <FaPlay className="text-white text-6xl drop-shadow-lg" />
                                                </button>
                                            )}
                                            {videoPlaying[idx] && (
                                                <button
                                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all"
                                                    onClick={() => handlePlayPause(idx)}
                                                    role="button"
                                                    aria-label="Pause video"
                                                    tabIndex={0}
                                                >
                                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <rect x="6" y="4" width="4" height="16" rx="2" />
                                                        <rect x="14" y="4" width="4" height="16" rx="2" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Mute/Unmute Button */}
                                            <button
                                                className="absolute bottom-4 right-4 bg-black/60 rounded-full p-3 text-white hover:bg-black/80 z-50 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all duration-200 hover:scale-110"
                                                onClick={() => handleMuteToggle(idx)}
                                                aria-label={videoMuted[idx] ? 'Unmute video' : 'Mute video'}
                                            >
                                                {videoMuted[idx] ? (
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                )}
                                            </button>
                                            {/* Progress Bar */}
                                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-700/50">
                                                <div
                                                    className="h-2 bg-blue-500 transition-all duration-300"
                                                    style={{ width: `${videoProgress[idx] || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={`http://localhost:5001${item.url}`}
                                            alt={`Campaign media ${idx + 1}`}
                                            className="object-cover w-full h-full cursor-pointer"
                                            tabIndex={0}
                                            aria-label={`Campaign image ${idx + 1}`}
                                            onClick={() => openImageModal(item.url)}
                                        />
                                    )}
                                </div>
                            ))}
                        </Slider>
                    </div>

                    {/* Donations */}
                    <div className="bg-white rounded-2xl shadow p-4 max-h-60 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Recent Donations ({donations.length})
                        </h2>
                        <div className="space-y-4 flex-1">
                            {donations.length > 0 ? (
                                donations.map((donation, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                                {(donation.donorName || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{donation.donorName || 'Anonymous'}</p>
                                                {donation.message && (
                                                    <p className="text-sm text-gray-600 mt-1">"{donation.message}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 text-lg">{formatCurrency(donation.amount)}</p>
                                            <p className="text-xs text-gray-500">{new Date(donation.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 flex-1 flex flex-col justify-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500">No donations yet. Be the first to donate!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {/* Campaign Info */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                        {/* Urgent Badge */}
                        {campaign.isUrgent && (
                            <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Urgent Need
                                </span>
                            </div>
                        )}
                        {/* Title */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 my-5 text-center mx-auto w-full" style={{ maxWidth: '90%' }}>{campaign.title}</h1>
                        {/* Progress Section */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Raised: {formatCurrency(campaign.currentAmount || 0)}</span>
                                        <span>{Math.round(calculateProgress(campaign.currentAmount || 0, campaign.targetAmount || 1))}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${calculateProgress(campaign.currentAmount || 0, campaign.targetAmount || 1)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Goal: {formatCurrency(campaign.targetAmount || 0)}</span>
                                        <span>{getDaysLeft(campaign.endDate || new Date())} days left</span>
                                    </div>
                                </div>
                                <button
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    onClick={openDonationModal}
                                    disabled={isDonationDisabled}
                                >
                                    {isDonationDisabled ? 'Goal Reached' : 'Donate Now'}
                                </button>
                            </div>
                        </div>
                        {/* Campaign Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{donations.length}</div>
                                <div className="text-sm text-gray-600">Supporters</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{getDaysLeft(campaign.endDate || new Date())}</div>
                                <div className="text-sm text-gray-600">Days Left</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{getCategoryLabel(campaign.category || 'other')}</div>
                                <div className="text-sm text-gray-600">Category</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{campaign.creator?.name || 'Anonymous'}</div>
                                <div className="text-sm text-gray-600">Creator</div>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <button
                                className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-3 px-6 rounded-xl font-medium hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                onClick={() => setShareModalOpen(true)}
                            >
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                Share Campaign
                            </button>
                            {user && (
                                <button
                                    className="flex-1 bg-white border border-red-200 text-red-700 py-3 px-6 rounded-xl font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    onClick={() => setShowReportModal(true)}
                                >
                                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Report
                                </button>
                            )}
                        </div>
                    </div>
                    {/* About */}
                    <div className="bg-white rounded-2xl shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Campaign</h2>
                        <div className="prose prose-lg max-w-none text-gray-700 break-words flex-1 overflow-y-auto">
                            <p className="leading-relaxed">{campaign.description || 'No description available.'}</p>
                        </div>
                    </div>
                    {/* Comments Section */}
                    <div className="bg-white rounded-2xl shadow p-6 mt-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span role="img" aria-label="comments">💬</span> Comments
                        </h2>
                        {user ? (
                            <form onSubmit={handleComment} className="mb-6 flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    disabled={isSubmittingComment}
                                    maxLength={300}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                                    disabled={isSubmittingComment || !newComment.trim()}
                                >
                                    {isSubmittingComment ? 'Posting...' : 'Post'}
                                </button>
                            </form>
                        ) : (
                            <div className="mb-6 text-gray-600">Please <Link to="/login" className="text-indigo-600 underline">login</Link> to comment.</div>
                        )}
                        <div className="space-y-4 max-h-72 overflow-y-auto">
                            {comments.length === 0 ? (
                                <div className="text-gray-500 text-center">No comments yet. Be the first to comment!</div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment._id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-lg">
                                            {comment.userName ? comment.userName[0].toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">{comment.userName || 'User'}</div>
                                            <div className="text-gray-700 text-sm whitespace-pre-line">{comment.text}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {/* Donation Modal */}
            {showDonationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white/60 backdrop-blur-lg border border-indigo-100 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative flex flex-col" style={{ minHeight: '340px' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-indigo-700">Make a Donation</h3>
                            <button
                                onClick={() => setShowDonationModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-4 p-4 bg-white/80 rounded-xl border border-indigo-50 shadow">
                            <h4 className="font-semibold text-indigo-900 text-lg text-center">{campaign.title}</h4>
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
                                    onClick={() => setShowDonationModal(false)}
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
            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-up">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl border border-red-200">
                        <h3 className="text-lg font-bold text-red-700 mb-4">Report Campaign</h3>
                        <form onSubmit={handleReport}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Report
                                </label>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Please describe why you are reporting this campaign..."
                                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows={4}
                                    required
                                    aria-label="Reason for report"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus-visible:outline-indigo-500"
                                    role="button"
                                    aria-label="Cancel report"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReport}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 focus-visible:outline-indigo-500"
                                    role="button"
                                    aria-label="Submit report"
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
            {/* Image Modal */}
            {imageModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="relative max-w-3xl w-full">
                        <img src={`http://localhost:5001${modalImage}`} alt="Full" className="w-full h-auto rounded-xl shadow-lg" />
                        <button onClick={closeImageModal} className="absolute top-2 right-2 bg-white/80 rounded-full p-2 text-gray-700 hover:bg-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            {/* Public Review Pending Modal */}
            {showPublicReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 flex flex-col items-center border border-gray-100">
                        {/* Close button */}
                        <button
                            onClick={() => setShowPublicReviewModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {/* Info icon */}
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 mt-2">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                            </svg>
                        </div>
                        {/* Title */}
                        <div className="text-2xl font-bold text-blue-700 mb-2 text-center">
                            {campaign.isVotingEnabled ? 'Public Review Pending' : 'Proof Documents Pending'}
                        </div>
                        {/* Description */}
                        <div className="text-gray-600 text-base text-center mb-6">
                            {campaign.isVotingEnabled
                                ? 'The campaigner needs to upload proof documents before public review can begin. You will be notified when the review is ready.'
                                : 'The campaigner needs to upload proof documents for admin verification. This helps ensure transparency and legitimacy of the campaign.'
                            }
                        </div>
                        {/* Got it button */}
                        <button
                            onClick={() => setShowPublicReviewModal(false)}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition"
                        >
                            Got it
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
        </div>
    );
};

export default CampaignDetails; 