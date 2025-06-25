import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditCampaign = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [campaign, setCampaign] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);

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
        fetchCampaign();
        fetchDebugInfo();
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:5001/api/campaigns/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                const campaignData = data.data.campaign;
                setCampaign(campaignData);

                setFormData({
                    title: campaignData.title || '',
                    description: campaignData.description || '',
                    category: campaignData.category || '',
                    targetAmount: campaignData.targetAmount || '',
                    startDate: campaignData.startDate ? new Date(campaignData.startDate).toISOString().split('T')[0] : '',
                    endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString().split('T')[0] : '',
                    isVotingEnabled: campaignData.isVotingEnabled || false,
                    votingEndDate: campaignData.votingEndDate ? new Date(campaignData.votingEndDate).toISOString().split('T')[0] : '',
                    isOrganization: campaignData.isOrganization || false,
                    organizationName: campaignData.organizationName || '',
                    organizationDetails: campaignData.organizationDetails || ''
                });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to load campaign' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDebugInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await fetch(`http://localhost:5001/api/campaigns/debug/ownership/${id}`, {
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key] !== '' && formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await fetch(`http://localhost:5001/api/campaigns/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                setMessage({
                    type: 'success',
                    text: 'Campaign updated successfully! Redirecting...'
                });
                setTimeout(() => navigate('/my-campaigns'), 2000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update campaign' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Network error. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading campaign data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Campaign</h2>
                        <p className="text-gray-600">Update your campaign details below</p>
                    </div>

                    {/* Debug Information */}
                    {debugInfo && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Information</h3>
                            <div className="text-sm text-yellow-700 space-y-1">
                                <p><strong>Campaign Creator ID:</strong> {debugInfo.campaignCreatorId}</p>
                                <p><strong>Current User ID:</strong> {debugInfo.currentUserId}</p>
                                <p><strong>Are Equal:</strong> {debugInfo.areEqual ? '✅ Yes' : '❌ No'}</p>
                                <p><strong>LocalStorage User ID:</strong> {debugInfo.localStorageUser?.userId}</p>
                                <p><strong>Campaign Title:</strong> {debugInfo.campaign?.title}</p>
                            </div>
                        </div>
                    )}

                    {message.text && (
                        <div className={`rounded-md p-4 mb-6 ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaign Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={6}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    id="targetAmount"
                                    name="targetAmount"
                                    value={formData.targetAmount}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isVotingEnabled"
                                name="isVotingEnabled"
                                checked={formData.isVotingEnabled}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isVotingEnabled" className="ml-2 block text-sm text-gray-900">
                                Enable voting system
                            </label>
                        </div>

                        {formData.isVotingEnabled && (
                            <div>
                                <label htmlFor="votingEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Voting End Date
                                </label>
                                <input
                                    type="date"
                                    id="votingEndDate"
                                    name="votingEndDate"
                                    value={formData.votingEndDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isOrganization"
                                name="isOrganization"
                                checked={formData.isOrganization}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isOrganization" className="ml-2 block text-sm text-gray-900">
                                This is an organization campaign
                            </label>
                        </div>

                        {formData.isOrganization && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        id="organizationName"
                                        name="organizationName"
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="organizationDetails" className="block text-sm font-medium text-gray-700 mb-2">
                                        Organization Details
                                    </label>
                                    <textarea
                                        id="organizationDetails"
                                        name="organizationDetails"
                                        rows={3}
                                        value={formData.organizationDetails}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => navigate('/my-campaigns')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Updating...' : 'Update Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCampaign; 