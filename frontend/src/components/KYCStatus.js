import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Utility function to format date to dd/mm/yyyy
function formatDateToDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'object' && dateStr instanceof Date) {
        const day = String(dateStr.getDate()).padStart(2, '0');
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const year = dateStr.getFullYear();
        return `${day}/${month}/${year}`;
    }
    // Try to parse string
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const KYCStatus = () => {
    const navigate = useNavigate();
    const [kycData, setKycData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const fetchKYCStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5001/api/kyc/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setKycData(data.data);

                // Update user data in localStorage with latest KYC status
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, kycStatus: data.data.kycStatus };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                console.error('Failed to fetch KYC status:', data.message);
            }
        } catch (error) {
            console.error('Error fetching KYC status:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add focus event listener to refresh KYC status when tab becomes active
    useEffect(() => {
        const handleFocus = () => {
            fetchKYCStatus();
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'rejected':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'pending':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'rejected':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading KYC status...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">KYC Status</h2>
                        <p className="text-gray-600">Your Know Your Customer verification status</p>
                    </div>

                    {kycData && (
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className={`p-6 rounded-lg border ${getStatusColor(kycData.kycStatus)}`}>
                                <div className="flex items-center justify-center mb-4">
                                    {getStatusIcon(kycData.kycStatus)}
                                </div>
                                <h3 className="text-xl font-semibold text-center mb-2">
                                    {kycData.kycStatus === 'approved' && 'KYC Approved!'}
                                    {kycData.kycStatus === 'pending' && 'KYC Under Review'}
                                    {kycData.kycStatus === 'rejected' && 'KYC Rejected'}
                                    {kycData.kycStatus === 'not_submitted' && 'KYC Not Submitted'}
                                </h3>
                                <p className="text-center text-sm">
                                    {kycData.kycStatus === 'approved' && 'Your KYC has been approved. You can now create campaigns!'}
                                    {kycData.kycStatus === 'pending' && 'Your KYC application is currently under review. We will notify you once it\'s processed.'}
                                    {kycData.kycStatus === 'rejected' && 'Your KYC application was rejected. Please review and resubmit.'}
                                    {kycData.kycStatus === 'not_submitted' && 'You need to complete your KYC to create campaigns.'}
                                </p>
                            </div>

                            {/* KYC Details (only new kycData fields) */}
                            {kycData.kycData && (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Submitted Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <p className="font-medium">{kycData.kycData.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Date of Birth:</span>
                                            <p className="font-medium">{formatDateToDDMMYYYY(kycData.kycData.dob)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">ID Type:</span>
                                            <p className="font-medium capitalize">{kycData.kycData.idType}</p>
                                        </div>
                                        {kycData.kycData.gender && (
                                            <div>
                                                <span className="text-gray-500">Gender:</span>
                                                <p className="font-medium">{kycData.kycData.gender}</p>
                                            </div>
                                        )}
                                        {kycData.kycData.aadhaar_number && (
                                            <div>
                                                <span className="text-gray-500">Aadhaar Number:</span>
                                                <p className="font-medium">{kycData.kycData.aadhaar_number}</p>
                                            </div>
                                        )}
                                        {kycData.kycData.father_name && (
                                            <div>
                                                <span className="text-gray-500">Father Name:</span>
                                                <p className="font-medium">{kycData.kycData.father_name}</p>
                                            </div>
                                        )}
                                        {kycData.kycData.pan_number && (
                                            <div>
                                                <span className="text-gray-500">PAN Number:</span>
                                                <p className="font-medium">{kycData.kycData.pan_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {kycData.kycStatus === 'rejected' && kycData.kycDetails?.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h4>
                                    <p className="text-red-800">{kycData.kycDetails.rejectionReason}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {kycData.kycStatus === 'approved' && (
                                    <button
                                        onClick={() => navigate('/create-campaign')}
                                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        Create Your First Campaign
                                    </button>
                                )}

                                {(kycData.kycStatus === 'rejected' || kycData.kycStatus === 'not_submitted') && (
                                    <button
                                        onClick={() => navigate('/kyc')}
                                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {kycData.kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'}
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate('/campaigns')}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Browse Campaigns
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KYCStatus; 