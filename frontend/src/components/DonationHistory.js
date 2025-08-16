import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PlatformHeader from './PlatformHeader';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFileDownload } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import DonationReceipt from './DonationReceipt';

const DonationHistory = () => {
    console.log('DonationHistory component rendered');
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);
    const receiptRef = useRef();
    const [receiptData, setReceiptData] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        console.log('DonationHistory: useEffect triggered');
        fetchUserDonations();
        // Fetch user profile
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
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        }
        if (showProfile) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfile]);

    const fetchUserDonations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5001/api/donations/user-donations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            const data = await response.json();
            if (data.success) {
                setDonations(data.data.donations || []);
            } else {
                setError('Failed to fetch donations');
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    };

    const handleDownloadReceipt = async (donation) => {
        setReceiptData({ donation, user });
        setDownloading(true);
        setTimeout(async () => {
            const input = receiptRef.current;
            if (!input) return;
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ unit: 'px', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = Math.min(canvas.width, pageWidth - 80);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 40, 40, imgWidth, imgHeight);
            pdf.save(`DonationReceipt_${donation._id}.pdf`);
            setDownloading(false);
            setReceiptData(null);
        }, 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <PlatformHeader />
            {/* Hidden receipt for PDF generation */}
            {downloading && receiptData && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                    <DonationReceipt ref={receiptRef} donation={receiptData.donation} user={receiptData.user} />
                </div>
            )}
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Donation History</h1>
                    <p className="mt-2 text-gray-600">Track all your contributions and support for various campaigns</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                        <span className="text-red-800 font-medium">{error}</span>
                        <button onClick={fetchUserDonations} className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium ml-3">
                            Try Again
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">All Donations</h2>
                    </div>

                    {donations.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-gray-900">No donations yet</h3>
                            <p className="mt-2 text-gray-600">Start supporting campaigns by making your first donation.</p>
                            <Link to="/campaigns" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                Browse Campaigns
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {donations.map((donation) => (
                                        <tr key={donation._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {donation.campaign?.title || 'Campaign'}
                                                    <button
                                                        className="ml-2 text-indigo-500 hover:text-indigo-700 p-1"
                                                        title="Download Receipt"
                                                        onClick={() => handleDownloadReceipt(donation)}
                                                    >
                                                        <FaFileDownload size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-green-700">₹{donation.amount}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(donation.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Completed
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DonationHistory; 