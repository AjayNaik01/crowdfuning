import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaBullseye, FaPhotoVideo, FaCogs, FaEye } from 'react-icons/fa';
import PlatformHeader from './PlatformHeader';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showKycModal, setShowKycModal] = useState(false);
    const [showKycConfirm, setShowKycConfirm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        category: '',
        targetAmount: '',
        startDate: '',
        endDate: '',
        isVotingEnabled: false,
        isOrganization: false,
        organizationName: '',
        organizationDetails: ''
    });
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef();
    const videoInputRef = useRef();
    const [activeField, setActiveField] = useState(0);
    const step1Fields = [
        {
            name: 'title',
            label: 'Campaign Title *',
            type: 'text',
            maxLength: 100,
            icon: <FaInfoCircle />,
            autoFocus: true
        },
        {
            name: 'description',
            label: 'Description *',
            type: 'textarea',
            maxLength: 2000,
            icon: null,
            autoFocus: false
        },
        {
            name: 'location',
            label: 'Location *',
            type: 'text',
            maxLength: 100,
            icon: null,
            autoFocus: false
        }
    ];

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

    // Auto-enable voting for campaigns over 50,000
    useEffect(() => {
        const target = parseFloat(formData.targetAmount);
        if (!isNaN(target) && target >= 50000) {
            setFormData(prev => ({
                ...prev,
                isVotingEnabled: true
            }));
        }
    }, [formData.targetAmount]);

    // Check KYC status on component mount
    useEffect(() => {
        const checkKYCStatus = async () => {
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
                    const userData = data.data?.user;
                    setUser(userData);

                    // Check if user has completed KYC
                    if (userData.kycStatus !== 'VERIFIED' && !['admin', 'super_admin'].includes(userData.role)) {
                        setShowKycModal(true);
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error checking KYC status:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        checkKYCStatus();
    }, [navigate]);

    // Show loading while checking KYC
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Show KYC modal if user hasn't completed KYC
    if (showKycModal) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
                    <p className="text-gray-600 text-sm mb-6">
                        You need to complete KYC verification before you can create campaigns. This helps ensure transparency and trust in our platform.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/kyc')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Complete KYC Now
                        </button>
                        <button
                            onClick={() => navigate('/campaigns')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // KYC Confirmation Dialog
    if (showKycConfirm) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
                    <p className="text-gray-600 text-sm mb-6">
                        You need to complete KYC verification to create campaigns. Would you like to complete KYC now?
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => {
                                setShowKycConfirm(false);
                                navigate('/kyc');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Complete KYC Now
                        </button>
                        <button
                            onClick={() => setShowKycConfirm(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAddImageClick = () => {
        imageInputRef.current.click();
    };

    const handleAddVideoClick = () => {
        videoInputRef.current.click();
    };

    const handleRemoveImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleRemoveVideo = (idx) => {
        setVideos(prev => prev.filter((_, i) => i !== idx));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'images') {
            setImages(prev => [...prev, ...Array.from(files)]);
        } else if (name === 'videos') {
            setVideos(prev => [...prev, ...Array.from(files)]);
        }
    };

    // Step-based validation
    const validateStep = () => {
        const newErrors = {};
        if (currentStep === 1) {
            if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
            if (!formData.description.trim()) newErrors.description = 'Campaign description is required';
            if (!formData.location.trim()) newErrors.location = 'Location is required';
        } else if (currentStep === 2) {
            if (!formData.category) newErrors.category = 'Category is required';
            if (!formData.targetAmount || formData.targetAmount <= 0) newErrors.targetAmount = 'Valid target amount is required';
            if (!formData.startDate) newErrors.startDate = 'Start date is required';
            if (!formData.endDate) newErrors.endDate = 'End date is required';
            if (formData.startDate && formData.endDate) {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                const now = new Date();
                if (start < now) newErrors.startDate = 'Start date cannot be in the past';
                if (end <= start) newErrors.endDate = 'End date must be after start date';
            }
        } else if (currentStep === 3) {
            if (images.length === 0 && videos.length === 0) {
                newErrors.media = 'Please upload at least one image or video';
            }
        } else if (currentStep === 4) {
            if (formData.isOrganization && !formData.organizationName.trim()) {
                newErrors.organizationName = 'Organization name is required';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Step navigation handlers
    const handleNext = (e) => {
        e && e.preventDefault();
        setCurrentStep((prev) => Math.min(prev + 1, 5));
    };
    const handleBack = (e) => {
        e && e.preventDefault();
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Only submit on last step
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (currentStep !== 5) {
            handleNext();
            return;
        }
        if (!validateStep()) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'isVotingEnabled' || key === 'isOrganization') return;
                form.append(key, value);
            });
            form.append('isVotingEnabled', formData.isVotingEnabled ? 'true' : 'false');
            form.append('isOrganization', formData.isOrganization ? 'true' : 'false');
            images.forEach((img) => form.append('images', img));
            videos.forEach((vid) => form.append('videos', vid));
            const response = await fetch('http://localhost:5001/api/campaigns/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            });
            const data = await response.json();
            if (data.success) {
                alert(`Campaign "${formData.title}" created successfully!\n\nYour campaign is now under review by our team. You'll receive a notification once it's approved.\n\nCampaign ID: ${data.data.campaignId}\nStatus: ${data.data.status}`);
                navigate('/my-campaigns');
            } else {
                if (response.status === 403 && data.message.includes('KYC verification')) {
                    setShowKycConfirm(true);
                } else if (response.status === 400 && data.errors) {
                    // Map backend errors to fields and steps
                    const fieldStepMap = {
                        title: 1,
                        description: 1,
                        location: 1,
                        category: 2,
                        targetAmount: 2,
                        startDate: 2,
                        endDate: 2,
                        images: 3,
                        videos: 3,
                        isVotingEnabled: 4,
                        isOrganization: 4,
                        organizationName: 4,
                        organizationDetails: 4
                    };
                    const newErrors = {};
                    let firstStepWithError = null;
                    data.errors.forEach(err => {
                        newErrors[err.field] = err.message;
                        const step = fieldStepMap[err.field];
                        if (firstStepWithError === null || (step && step < firstStepWithError)) {
                            firstStepWithError = step;
                        }
                    });
                    setErrors(newErrors);
                    if (firstStepWithError && firstStepWithError !== currentStep) {
                        setCurrentStep(firstStepWithError);
                    }
                } else {
                    setErrors({ submit: data.message });
                }
            }
        } catch (error) {
            setErrors({ submit: 'Failed to create campaign. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Futuristic stepper config
    const stepper = [
        { label: 'Basic Info', icon: <FaInfoCircle /> },
        { label: 'Goals', icon: <FaBullseye /> },
        { label: 'Media', icon: <FaPhotoVideo /> },
        { label: 'Settings', icon: <FaCogs /> },
        { label: 'Preview', icon: <FaEye /> },
    ];
    const stepPercent = ((currentStep - 1) / (stepper.length - 1)) * 100;

    // Modern, animated, floating label step content
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {/* Title */}
                        <div className="relative col-span-1 flex flex-col justify-center">
                            <div className="flex items-center w-full">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 flex items-center justify-center" style={{ fontSize: '1.1rem' }}>
                                    <FaInfoCircle />
                                </span>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`block pl-10 pr-16 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.title ? 'border-red-400' : ''}`}
                                    placeholder=" "
                                    autoComplete="off"
                                    maxLength={100}
                                    aria-label="Campaign Title"
                                    style={{ minHeight: '3.5rem' }}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{formData.title.length}/100</span>
                            </div>
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-10 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Campaign Title *
                            </label>
                            {errors.title && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.title}</span>}
                        </div>
                        {/* Description */}
                        <div className="relative col-span-1 flex flex-col justify-center">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={5}
                                className={`block px-4 pr-16 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all resize-none h-24 ${errors.description ? 'border-red-400' : ''}`}
                                placeholder=" "
                                maxLength={2000}
                                aria-label="Description"
                                style={{ minHeight: '3.5rem' }}
                            />
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Description *
                            </label>
                            <span className="absolute right-4 top-4 text-xs text-gray-400 select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{formData.description.length}/2000</span>
                            {errors.description && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.description}</span>}
                        </div>
                        {/* Location */}
                        <div className="relative col-span-1 md:col-span-2 flex flex-col justify-center">
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={`block px-4 pr-16 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.location ? 'border-red-400' : ''}`}
                                placeholder=" "
                                autoComplete="off"
                                maxLength={100}
                                aria-label="Location"
                                style={{ minHeight: '3.5rem' }}
                            />
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Location *
                            </label>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{formData.location.length}/100</span>
                            {errors.location && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.location}</span>}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {/* Category */}
                        <div className="relative col-span-1">
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all"
                                placeholder=" "
                                aria-label="Category"
                            >
                                <option value="">Select category</option>
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>{category.label}</option>
                                ))}
                            </select>
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Category *
                            </label>
                            {errors.category && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.category}</span>}
                        </div>
                        {/* Target Amount */}
                        <div className="relative col-span-1">
                            <input
                                type="number"
                                name="targetAmount"
                                value={formData.targetAmount}
                                onChange={handleInputChange}
                                min="1"
                                className={`block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.targetAmount ? 'border-red-400' : ''}`}
                                placeholder=" "
                                aria-label="Target Amount"
                            />
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Target Amount (₹) *
                            </label>
                            {errors.targetAmount && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.targetAmount}</span>}
                            {votingStatus && (<span className={`mt-1 text-xs ${votingStatus.color}`}>{votingStatus.message}</span>)}
                        </div>
                        {/* Start Date */}
                        <div className="relative col-span-1">
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                className={`block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.startDate ? 'border-red-400' : ''}`}
                                placeholder=" "
                                aria-label="Start Date"
                            />
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                Start Date *
                            </label>
                            {errors.startDate && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.startDate}</span>}
                        </div>
                        {/* End Date */}
                        <div className="relative col-span-1">
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className={`block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-white/80 rounded-xl border border-gray-200 shadow appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.endDate ? 'border-red-400' : ''}`}
                                placeholder=" "
                                aria-label="End Date"
                            />
                            <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                End Date *
                            </label>
                            {errors.endDate && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.endDate}</span>}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-fade-in w-full flex flex-col items-center justify-center">
                        <div className="w-full max-w-3xl bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-100 p-8 flex flex-col gap-10 items-center relative overflow-visible">
                            <div className="w-full flex flex-col md:flex-row gap-10 md:gap-16 items-start justify-center">
                                {/* Images Upload */}
                                <div className="flex-1 w-full flex flex-col items-center">
                                    <div className="relative w-full">
                                        <input
                                            type="file"
                                            name="images"
                                            accept="image/*"
                                            multiple
                                            ref={imageInputRef}
                                            onChange={handleFileChange}
                                            className="peer input-modern-file"
                                            style={{ minHeight: '4.5rem', cursor: 'pointer', opacity: 0, position: 'absolute', inset: 0, zIndex: 2 }}
                                        />
                                        <div
                                            className="input-modern-file flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all duration-200 relative z-1"
                                            onClick={handleAddImageClick}
                                            style={{ minHeight: '4.5rem' }}
                                        >
                                            <span className="text-3xl text-blue-400"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></span>
                                            <span className="label-modern">Upload Images</span>
                                            <span className="text-xs text-blue-400 animate-pulse">Drag & drop or click to select</span>
                                        </div>
                                    </div>
                                    {/* Previews */}
                                    {images.length > 0 && (
                                        <div className="w-full mt-4 flex gap-3 overflow-x-auto pb-2">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative group animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                                    <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="w-24 h-24 object-cover rounded-xl border border-blue-200 shadow-md transition-transform hover:scale-105" />
                                                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base opacity-80 group-hover:opacity-100 shadow-lg" title="Remove">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Videos Upload */}
                                <div className="flex-1 w-full flex flex-col items-center">
                                    <div className="relative w-full">
                                        <input
                                            type="file"
                                            name="videos"
                                            accept="video/*"
                                            multiple
                                            ref={videoInputRef}
                                            onChange={handleFileChange}
                                            className="peer input-modern-file"
                                            style={{ minHeight: '4.5rem', cursor: 'pointer', opacity: 0, position: 'absolute', inset: 0, zIndex: 2 }}
                                        />
                                        <div
                                            className="input-modern-file flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all duration-200 relative z-1"
                                            onClick={handleAddVideoClick}
                                            style={{ minHeight: '4.5rem' }}
                                        >
                                            <span className="text-3xl text-blue-400"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polygon points="10 9 15 12 10 15 10 9"></polygon><rect x="2" y="2" width="20" height="5" rx="2" ry="2"></rect></svg></span>
                                            <span className="label-modern">Upload Videos</span>
                                            <span className="text-xs text-blue-400 animate-pulse">Drag & drop or click to select</span>
                                        </div>
                                    </div>
                                    {/* Previews */}
                                    {videos.length > 0 && (
                                        <div className="w-full mt-4 flex gap-3 overflow-x-auto pb-2">
                                            {videos.map((vid, idx) => (
                                                <div key={idx} className="relative group animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                                    <video src={URL.createObjectURL(vid)} controls className="w-28 h-24 object-cover rounded-xl border border-blue-200 shadow-md transition-transform hover:scale-105" />
                                                    <button type="button" onClick={() => handleRemoveVideo(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base opacity-80 group-hover:opacity-100 shadow-lg" title="Remove">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {errors.media && <span className="mt-2 text-xs text-red-600">{errors.media}</span>}
                        </div>
                        {/* Modern styles for input-modern, label-modern, input-modern-file, and fade-in */}
                        <style>{`
                            .animate-fade-in {
                                animation: fadeIn 0.6s cubic-bezier(.4,0,.2,1);
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(30px) scale(0.98); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                            .input-modern-file {
                                width: 100%;
                                padding: 1.1rem 1rem 0.5rem 1rem;
                                border-radius: 1rem;
                                border: 2px solid #e0e7ef;
                                background: rgba(255,255,255,0.7);
                                font-size: 1rem;
                                outline: none;
                                transition: border 0.2s, box-shadow 0.2s;
                                box-shadow: 0 2px 8px 0 rgba(30,64,175,0.04);
                                position: relative;
                                z-index: 1;
                            }
                            .input-modern-file:focus {
                                border-color: #2563eb;
                                box-shadow: 0 4px 16px 0 rgba(37,99,235,0.08);
                            }
                            .label-modern {
                                position: absolute;
                                left: 1.1rem;
                                top: 1.1rem;
                                color: #64748b;
                                font-size: 1rem;
                                pointer-events: none;
                                background: transparent;
                                transition: all 0.2s;
                                z-index: 10;
                            }
                        `}</style>
                    </div>
                );
            case 4:
                return (
                    <div className="animate-fade-in flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="isVotingEnabled"
                                checked={formData.isVotingEnabled}
                                onChange={handleInputChange}
                                disabled={parseFloat(formData.targetAmount) >= 50000}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition"
                                aria-label="Enable voting"
                            />
                            <label className="text-base text-gray-700 select-none">Enable voting system for transparency</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="isOrganization"
                                checked={formData.isOrganization}
                                onChange={handleInputChange}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition"
                                aria-label="Organization"
                            />
                            <label className="text-base text-gray-700 select-none">This campaign is for an organization</label>
                        </div>
                        {formData.isOrganization && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="organizationName"
                                        value={formData.organizationName}
                                        onChange={handleInputChange}
                                        className={`block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all ${errors.organizationName ? 'border-red-400' : ''}`}
                                        placeholder=" "
                                        autoComplete="off"
                                        maxLength={100}
                                        aria-label="Organization Name"
                                    />
                                    <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                        Organization Name *
                                    </label>
                                    {errors.organizationName && <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.organizationName}</span>}
                                </div>
                                <div className="relative md:col-span-2">
                                    <textarea
                                        name="organizationDetails"
                                        value={formData.organizationDetails}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="block px-4 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 peer transition-all resize-none h-20"
                                        placeholder=" "
                                        maxLength={500}
                                        aria-label="Organization Details"
                                    />
                                    <label className="absolute text-base text-gray-500 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 bg-white px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 pointer-events-none">
                                        Organization Details
                                    </label>
                                    <span className="mt-1 text-xs text-gray-500">{formData.organizationDetails.length}/500 characters</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 5:
                return (
                    <section className="w-full px-2 md:px-8 animate-fade-in mt-12 max-w-[80vw] mx-auto">
                        {/* Cover Image */}
                        {images.length > 0 && (
                            <div className="w-full mb-8">
                                <img src={URL.createObjectURL(images[0])} alt="Campaign Cover" className="w-full max-h-96 object-cover rounded-2xl shadow-lg border border-indigo-100" />
                            </div>
                        )}
                        {/* Title and Meta */}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-900 mb-2">{formData.title}</h1>
                        <div className="flex flex-wrap gap-6 items-center text-gray-500 mb-6 text-lg">
                            <span className="flex items-center gap-2"><svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243A8 8 0 1117.657 16.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{formData.location}</span>
                            <span className="flex items-center gap-2"><svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{formData.startDate} - {formData.endDate}</span>
                        </div>
                        {/* Description as paragraphs */}
                        <div className="prose prose-indigo max-w-none mb-10 text-lg">
                            {formData.description.split('\n').map((para, idx) => (
                                <p key={idx}>{para}</p>
                            ))}
                        </div>
                        {/* Media Gallery */}
                        {(images.length > 1 || videos.length > 0) && (
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-indigo-700 mb-4">Gallery</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {images.slice(1).map((img, idx) => (
                                        <img key={idx} src={URL.createObjectURL(img)} alt={`img-${idx + 1}`} className="w-full h-40 object-cover rounded-xl border border-indigo-100 shadow" />
                                    ))}
                                    {videos.map((vid, idx) => (
                                        <video key={idx} src={URL.createObjectURL(vid)} controls className="w-full h-40 object-cover rounded-xl border border-indigo-100 shadow" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                            {/* Goals Card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 md:p-8 relative">
                                <button type="button" onClick={() => setCurrentStep(2)} className="absolute top-4 right-4 text-indigo-500 hover:text-indigo-700 text-sm font-semibold transition">Edit</button>
                                <h3 className="font-bold text-lg text-indigo-700 mb-4">Goals</h3>
                                <div className="space-y-2 text-base">
                                    <div><span className="font-semibold text-indigo-900">Category:</span> <span className="text-gray-800">{formData.category}</span></div>
                                    <div><span className="font-semibold text-indigo-900">Target Amount:</span> <span className="text-gray-800">₹{formData.targetAmount}</span></div>
                                    <div><span className="font-semibold text-indigo-900">Start Date:</span> <span className="text-gray-800">{formData.startDate}</span></div>
                                    <div><span className="font-semibold text-indigo-900">End Date:</span> <span className="text-gray-800">{formData.endDate}</span></div>
                                </div>
                            </div>
                            {/* Settings Card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 md:p-8 relative">
                                <button type="button" onClick={() => setCurrentStep(4)} className="absolute top-4 right-4 text-indigo-500 hover:text-indigo-700 text-sm font-semibold transition">Edit</button>
                                <h3 className="font-bold text-lg text-indigo-700 mb-4">Settings</h3>
                                <div className="space-y-2 text-base">
                                    <div><span className="font-semibold text-indigo-900">Voting Enabled:</span> <span className="text-gray-800">{formData.isVotingEnabled ? 'Yes' : 'No'}</span></div>
                                    <div><span className="font-semibold text-indigo-900">Organization:</span> <span className="text-gray-800">{formData.isOrganization ? 'Yes' : 'No'}</span></div>
                                    {formData.isOrganization && <div><span className="font-semibold text-indigo-900">Organization Name:</span> <span className="text-gray-800">{formData.organizationName}</span></div>}
                                    {formData.isOrganization && <div><span className="font-semibold text-indigo-900">Organization Details:</span> <span className="text-gray-800">{formData.organizationDetails}</span></div>}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    const getVotingStatus = () => {
        const target = parseFloat(formData.targetAmount);
        if (isNaN(target)) return null;
        if (target >= 50000) {
            return {
                type: 'required',
                message: 'Voting is automatically enabled for campaigns over ₹50,000',
                color: 'text-blue-600'
            };
        } else if (target > 10000) {
            return {
                type: 'recommended',
                message: 'Voting is recommended for campaigns over ₹10,000',
                color: 'text-green-600'
            };
        }
        return null;
    };

    const votingStatus = getVotingStatus();

    return (
        <>
            <PlatformHeader />
            <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center futuristic-bg">
                <div className="w-full max-w-[80vw] mx-auto flex items-center justify-center">
                    <div className="w-full max-w-[80vw] rounded-3xl shadow-2xl bg-white/60 backdrop-blur-lg border border-indigo-100 p-8 relative flex flex-col justify-center">
                        {/* Futuristic Stepper and Progress Bar */}
                        <div className="mx-auto mb-8" style={{ maxWidth: 600 }}>
                            <div className="flex items-center justify-center gap-10 mb-8 relative z-10">
                                {stepper.map((step, idx) => (
                                    <div key={step.label} className="flex-1 flex flex-col items-center relative min-w-[80px]">
                                        <button
                                            type="button"
                                            onClick={() => idx < currentStep - 1 && setCurrentStep(idx + 1)}
                                            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 text-xl shadow-md futuristic-stepper
                                        ${idx + 1 === currentStep
                                                    ? 'bg-white/80 border-indigo-600 text-indigo-700 scale-110 ring-4 ring-indigo-100'
                                                    : idx + 1 < currentStep
                                                        ? 'bg-indigo-100 border-indigo-400 text-indigo-500'
                                                        : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-indigo-50 hover:text-indigo-400'}
                                    `}
                                            aria-label={step.label}
                                            tabIndex={0}
                                        >
                                            {step.icon}
                                        </button>
                                        <span className={`mt-2 text-xs font-semibold transition-colors duration-200 ${idx + 1 === currentStep ? 'text-indigo-700' : idx + 1 < currentStep ? 'text-indigo-400' : 'text-gray-400'}`}>{step.label}</span>
                                        {idx < stepper.length - 1 && (
                                            <div className="absolute top-6 left-1/2 w-full h-1 z-[-1]">
                                                <div className={`h-1 w-full rounded bg-gradient-to-r from-indigo-200 to-indigo-400 transition-all duration-500 ${idx + 1 < currentStep ? 'opacity-100' : 'opacity-30'}`}></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Progress Bar */}
                            <div className="relative top-0 left-0 right-0 h-1 bg-indigo-100 rounded-full z-0">
                                <div
                                    className="h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${stepPercent}%` }}
                                ></div>
                            </div>
                        </div>
                        {errors.submit && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                                <span className="text-red-600">{errors.submit}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mt-8" encType="multipart/form-data">
                            {renderStep()}
                            {/* Sticky Navigation */}
                            <div className="flex justify-between mt-12 gap-4 sticky bottom-0 bg-transparent z-20">
                                <button type="button" onClick={handleBack} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all" disabled={currentStep === 1}>Back</button>
                                {currentStep < stepper.length && (
                                    <button type="button" onClick={handleNext} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">Next</button>
                                )}
                                {currentStep === stepper.length && (
                                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all">{isSubmitting ? 'Creating...' : 'Create Campaign'}</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateCampaign; 