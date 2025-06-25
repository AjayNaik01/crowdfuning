import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showKycModal, setShowKycModal] = useState(false);
    const [showKycConfirm, setShowKycConfirm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        targetAmount: '',
        startDate: '',
        endDate: '',
        isVotingEnabled: false,
        votingEndDate: '',
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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
        if (!formData.description.trim()) newErrors.description = 'Campaign description is required';
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

        if (formData.isVotingEnabled && !formData.votingEndDate) {
            newErrors.votingEndDate = 'Voting end date is required when voting is enabled';
        }

        if (formData.isVotingEnabled && formData.votingEndDate && formData.endDate) {
            const votingEnd = new Date(formData.votingEndDate);
            const campaignEnd = new Date(formData.endDate);
            if (votingEnd <= campaignEnd) {
                newErrors.votingEndDate = 'Voting end date must be after campaign end date';
            }
        }

        if (formData.isOrganization && !formData.organizationName.trim()) {
            newErrors.organizationName = 'Organization name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value);
            });
            images.forEach((img, idx) => form.append('images', img));
            videos.forEach((vid, idx) => form.append('videos', vid));

            const response = await fetch('http://localhost:5001/api/campaigns/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            });

            const data = await response.json();

            if (data.success) {
                alert('Campaign created successfully! It is now under review.');
                navigate('/my-campaigns');
            } else {
                // Handle KYC verification error
                if (response.status === 403 && data.message.includes('KYC verification')) {
                    setShowKycConfirm(true);
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

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Campaign</h2>
                        <p className="text-gray-600">Tell your story and start raising funds for your cause</p>
                    </div>

                    {errors.submit && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your campaign title"
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Tell your story, explain your cause, and why people should support you..."
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(category => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Amount *
                                    </label>
                                    <input
                                        type="number"
                                        name="targetAmount"
                                        value={formData.targetAmount}
                                        onChange={handleInputChange}
                                        min="1"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.targetAmount ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter target amount"
                                    />
                                    {errors.targetAmount && <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Campaign Duration */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Campaign Duration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Voting System */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Voting System (Optional)</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isVotingEnabled"
                                        checked={formData.isVotingEnabled}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Enable voting system for transparency
                                    </label>
                                </div>

                                {formData.isVotingEnabled && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Voting End Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="votingEndDate"
                                            value={formData.votingEndDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.votingEndDate ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.votingEndDate && <p className="mt-1 text-sm text-red-600">{errors.votingEndDate}</p>}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Donors can vote on fund usage after campaign ends
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Organization Details */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Organization Details (Optional)</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isOrganization"
                                        checked={formData.isOrganization}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        This campaign is for an organization
                                    </label>
                                </div>

                                {formData.isOrganization && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Organization Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="organizationName"
                                                value={formData.organizationName}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.organizationName ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Enter organization name"
                                            />
                                            {errors.organizationName && <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Organization Details
                                            </label>
                                            <textarea
                                                name="organizationDetails"
                                                value={formData.organizationDetails}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Tell us about your organization..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Media Uploads */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Media Uploads</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Images
                                    </label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(img)}
                                                    alt={`preview-${idx}`}
                                                    className="h-16 w-16 object-cover rounded border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleAddImageClick}
                                            className="h-16 w-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded hover:bg-gray-100 focus:outline-none"
                                            title="Add Image"
                                        >
                                            <span className="text-3xl text-gray-400 font-bold">+</span>
                                        </button>
                                        <input
                                            type="file"
                                            name="images"
                                            accept="image/*"
                                            multiple
                                            ref={imageInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                                {/* Videos */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Videos
                                    </label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {videos.map((vid, idx) => (
                                            <div key={idx} className="relative group">
                                                <video
                                                    src={URL.createObjectURL(vid)}
                                                    controls
                                                    className="h-16 w-24 object-cover rounded border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVideo(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleAddVideoClick}
                                            className="h-16 w-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded hover:bg-gray-100 focus:outline-none"
                                            title="Add Video"
                                        >
                                            <span className="text-3xl text-gray-400 font-bold">+</span>
                                        </button>
                                        <input
                                            type="file"
                                            name="videos"
                                            accept="video/*"
                                            multiple
                                            ref={videoInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/my-campaigns')}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateCampaign; 