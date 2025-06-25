import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DonationForm = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        donorName: '',
        paymentMethod: 'upi',
        upiId: '',
        message: '',
        isAnonymous: false
    });
    const [errors, setErrors] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchCampaign();
        checkUserAuth();
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

    const checkUserAuth = () => {
        const token = localStorage.getItem('token');
        if (token) {
            // Decode token to get user info (simplified)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
                setFormData(prev => ({
                    ...prev,
                    donorName: payload.name || ''
                }));
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    };

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }

        if (!formData.donorName.trim()) {
            newErrors.donorName = 'Please enter your name';
        }

        if (formData.paymentMethod === 'upi' && !formData.upiId.trim()) {
            newErrors.upiId = 'UPI ID is required for UPI payments';
        }

        if (formData.upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(formData.upiId)) {
            newErrors.upiId = 'Please enter a valid UPI ID';
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
                    ...formData,
                    campaignId,
                    amount: parseFloat(formData.amount)
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Thank you for your donation! Your contribution will make a difference.');
                navigate(`/campaign/${campaignId}`);
            } else {
                setErrors({ submit: data.message });
            }
        } catch (error) {
            setErrors({ submit: 'Failed to process donation. Please try again.' });
        } finally {
            setIsSubmitting(false);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
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
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Campaign Details */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Details</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                                <p className="text-gray-600 mt-2">{campaign.description}</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Raised: {formatCurrency(campaign.currentAmount)}</span>
                                    <span>{Math.round(calculateProgress(campaign.currentAmount, campaign.targetAmount))}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    Goal: {formatCurrency(campaign.targetAmount)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Created by:</span>
                                    <p className="font-medium">{campaign.creator?.name || 'Anonymous'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Category:</span>
                                    <p className="font-medium capitalize">{campaign.category.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Donation Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Donation</h2>

                        {errors.submit && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600">{errors.submit}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Donation Amount *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="0.01"
                                        className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                            </div>

                            {/* Donor Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    name="donorName"
                                    value={formData.donorName}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.donorName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter your name"
                                />
                                {errors.donorName && <p className="mt-1 text-sm text-red-600">{errors.donorName}</p>}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="upi">UPI</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="net_banking">Net Banking</option>
                                    <option value="wallet">Digital Wallet</option>
                                </select>
                            </div>

                            {/* UPI ID */}
                            {formData.paymentMethod === 'upi' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        UPI ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="upiId"
                                        value={formData.upiId}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.upiId ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="example@upi"
                                    />
                                    {errors.upiId && <p className="mt-1 text-sm text-red-600">{errors.upiId}</p>}
                                </div>
                            )}

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message (Optional)
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Leave a message of support..."
                                />
                            </div>

                            {/* Anonymous Donation */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isAnonymous"
                                    checked={formData.isAnonymous}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Make this donation anonymous
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : `Donate ${formatCurrency(formData.amount || 0)}`}
                            </button>
                        </form>

                        {/* Security Notice */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-md">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-gray-900">Secure Payment</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationForm; 