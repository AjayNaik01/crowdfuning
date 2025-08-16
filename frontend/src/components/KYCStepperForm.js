import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaUniversity, FaIdCard, FaCheckCircle, FaCamera, FaCameraRetro, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

const steps = [
    { label: 'Basic Info', icon: <FaUser /> },
    { label: 'Account Details', icon: <FaUniversity /> },
    { label: 'ID & Face Images', icon: <FaIdCard /> },
    { label: 'Review & Submit', icon: <FaCheckCircle /> },
];

const initialForm = {
    name: '',
    dob: '',
    address: '',
    idType: 'aadhaar',
    gender: '',
    aadhaar_number: '',
    father_name: '',
    pan_number: '',
    phone: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    idImage: null,
    faceImage: null,
};

// Utility to convert dd/mm/yyyy to yyyy-mm-dd (for input type="date")
function parseDDMMYYYYtoISO(ddmmyyyy) {
    if (!ddmmyyyy) return '';
    const [year, month, day] = ddmmyyyy.includes('-') ? ddmmyyyy.split('-') : [null, null, null];
    if (year && month && day) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const [d, m, y] = ddmmyyyy.split('/');
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function KYCStepperForm() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [showVerifiedAnimation, setShowVerifiedAnimation] = useState(false);
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showAdminKYCModal, setShowAdminKYCModal] = useState(false);
    const [showKYCReviewModal, setShowKYCReviewModal] = useState(false);

    // Camera states
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5001/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const userData = responseData.data; // Extract user data from response.data
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    useEffect(() => {
        if (showCamera && videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [showCamera, cameraStream]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setShowProfile(false);
        navigate('/login');
    };

    // Camera functions
    const startCamera = async () => {
        try {
            setCameraError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user' // Use front camera
                }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setShowCamera(true);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraError('Unable to access camera. Please check permissions and try again.');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
        setCameraError('');
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'face-image.jpg', { type: 'image/jpeg' });
                    setForm(prev => ({ ...prev, faceImage: file }));
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const validateStep = () => {
        let err = {};
        if (currentStep === 0) {
            if (!form.name) err.name = 'Name is required';
            if (!form.dob) err.dob = 'Date of Birth is required';
            if (!form.address) err.address = 'Address is required';
            if (!form.idType) err.idType = 'ID Type is required';
            if (!form.phone) err.phone = 'Phone number is required';
            else if (!/^\d{10}$/.test(form.phone)) err.phone = 'Enter a valid 10-digit phone number';
            if (form.idType === 'aadhaar') {
                if (!form.gender) err.gender = 'Gender is required';
                if (!form.aadhaar_number) err.aadhaar_number = 'Aadhaar number is required';
            }
            if (form.idType === 'pan') {
                if (!form.father_name) err.father_name = 'Father name is required';
                if (!form.pan_number) err.pan_number = 'PAN number is required';
            }
        }
        if (currentStep === 1) {
            if (!form.accountNumber) err.accountNumber = 'Account Number is required';
            if (!form.ifsc) err.ifsc = 'IFSC is required';
        }
        if (currentStep === 2) {
            if (!form.idImage) err.idImage = 'ID Image is required';
            if (!form.faceImage) err.faceImage = 'Face Image is required';
        }
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const handleStepClick = (idx) => {
        if (idx < currentStep) setCurrentStep(idx);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!validateStep()) return;
        if (!user) {
            setSubmitMessage({ type: 'error', text: 'User info not loaded. Please wait and try again.' });
            setLoading(false);
            return;
        }
        setLoading(true);
        setSubmitMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitMessage({ type: 'error', text: 'Please login first' });
                return;
            }
            const formDataToSend = new FormData();
            formDataToSend.append('idType', form.idType === 'pan' ? 'PAN' : 'AADHAR');
            formDataToSend.append('name', form.name);
            formDataToSend.append('dob', parseDDMMYYYYtoISO(form.dob));
            formDataToSend.append('phone', form.phone);
            formDataToSend.append('address', form.address);
            formDataToSend.append('accountNumber', form.accountNumber);
            formDataToSend.append('ifsc', form.ifsc);
            formDataToSend.append('bankName', form.bankName);
            formDataToSend.append('idCard', form.idImage);
            formDataToSend.append('faceImage', form.faceImage);
            if (form.idType === 'aadhaar') {
                formDataToSend.append('gender', form.gender);
                formDataToSend.append('aadhaar_number', form.aadhaar_number);
            } else if (form.idType === 'pan') {
                formDataToSend.append('father_name', form.father_name);
                formDataToSend.append('pan_number', form.pan_number);
            }
            const response = await fetch('http://localhost:5001/api/kyc/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });
            if (response.status === 400) {
                setShowKYCReviewModal(true);
                setLoading(false);
                return;
            }
            const data = await response.json();
            if (data.success && data.data.status === 'VERIFIED') {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, kycStatus: 'VERIFIED' };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setShowVerifiedAnimation(true);
                setTimeout(() => {
                    setShowVerifiedAnimation(false);
                    navigate('/campaigns');
                }, 2000); // Show animation for 3 seconds
            } else {
                setSubmitMessage({ type: 'error', text: data.message || 'KYC verification failed. Please check your details and try again.' });
            }
        } catch (error) {
            setSubmitMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
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
                                <button
                                    onClick={() => navigate('/campaigns')}
                                    className="text-xl font-bold text-gray-900 bg-transparent border-none p-0 m-0 cursor-pointer transition hover:text-indigo-600 focus:outline-none"
                                    style={{ outline: 'none' }}
                                >
                                    CrowdFund
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <Link
                                        to="/campaigns"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Browse Campaigns
                                    </Link>
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
                                                    <div className="flex items-center mb-4">
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
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-2 min-h-screen">
                <div className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white/60 backdrop-blur-lg border border-blue-100 p-8 relative overflow-hidden">
                    {/* Stepper and Progress Bar Centered */}
                    <div className="mx-auto" style={{ maxWidth: 600 }}>
                        <div className="flex items-center justify-center gap-12 mb-10 relative z-10">
                            {steps.map((step, idx) => (
                                <div key={step.label} className="flex-1 flex flex-col items-center relative min-w-[80px]">
                                    <button
                                        type="button"
                                        onClick={() => handleStepClick(idx)}
                                        className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 text-xl shadow-md
                                    ${idx === currentStep
                                                ? 'bg-white/80 border-blue-600 text-blue-700 scale-110 ring-4 ring-blue-100'
                                                : idx < currentStep
                                                    ? 'bg-blue-100 border-blue-400 text-blue-500'
                                                    : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-blue-50 hover:text-blue-400'}
                                `}
                                        aria-label={step.label}
                                        tabIndex={0}
                                    >
                                        {step.icon}
                                    </button>
                                    <span className={`mt-2 text-xs font-semibold transition-colors duration-200 ${idx === currentStep ? 'text-blue-700' : idx < currentStep ? 'text-blue-400' : 'text-gray-400'}`}>{step.label}</span>
                                    {idx < steps.length - 1 && (
                                        <div className="absolute top-6 left-1/2 w-full h-1 z-[-1]">
                                            <div className={`h-1 w-full rounded bg-gradient-to-r from-blue-200 to-blue-400 transition-all duration-500 ${idx < currentStep ? 'opacity-100' : 'opacity-30'}`}></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Progress Bar */}
                        <div className="relative top-0 left-0 right-0 h-1 bg-blue-100 rounded-full z-0">
                            <div
                                className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-12">
                        {/* Step 1: Basic Info */}
                        {currentStep === 0 && (
                            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Floating label input */}
                                <div className="relative">
                                    <input type="text" name="name" value={form.name} onChange={handleChange} className={`peer input-modern ${errors.name ? 'border-red-400' : ''}`} autoComplete="off" />
                                    <label className="label-modern">Name</label>
                                    {errors.name && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.name}</p>}
                                </div>
                                <div className="relative">
                                    <input type="date" name="dob" value={form.dob} onChange={handleChange} className={`peer input-modern ${errors.dob ? 'border-red-400' : ''}`} />
                                    <label className="label-modern">Date of Birth</label>
                                    {errors.dob && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.dob}</p>}
                                </div>
                                <div className="relative md:col-span-2">
                                    <textarea name="address" value={form.address} onChange={handleChange} className={`peer input-modern resize-none h-20 ${errors.address ? 'border-red-400' : ''}`} />
                                    <label className="label-modern">Address</label>
                                    {errors.address && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.address}</p>}
                                </div>
                                <div className="relative md:col-span-2">
                                    <input type="text" name="phone" value={form.phone} onChange={handleChange} className={`peer input-modern ${errors.phone ? 'border-red-400' : ''}`} autoComplete="off" maxLength={10} />
                                    <label className="label-modern">Phone Number</label>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.phone}</p>}
                                </div>
                                <div className="relative md:col-span-2">
                                    <select name="idType" value={form.idType} onChange={handleChange} className="peer input-modern pr-8">
                                        <option value="aadhaar">Aadhaar</option>
                                        <option value="pan">PAN</option>
                                    </select>
                                    <label className="label-modern">ID Type</label>
                                    {errors.idType && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.idType}</p>}
                                </div>
                                {/* Aadhaar-specific fields */}
                                {form.idType === 'aadhaar' && (
                                    <>
                                        <div className="relative">
                                            <select name="gender" value={form.gender} onChange={handleChange} className={`peer input-modern ${errors.gender ? 'border-red-400' : ''}`}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <label className="label-modern">Gender</label>
                                            {errors.gender && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.gender}</p>}
                                        </div>
                                        <div className="relative">
                                            <input type="text" name="aadhaar_number" value={form.aadhaar_number} onChange={handleChange} className={`peer input-modern ${errors.aadhaar_number ? 'border-red-400' : ''}`} autoComplete="off" />
                                            <label className="label-modern">Aadhaar Number</label>
                                            {errors.aadhaar_number && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.aadhaar_number}</p>}
                                        </div>
                                    </>
                                )}
                                {/* PAN-specific fields */}
                                {form.idType === 'pan' && (
                                    <>
                                        <div className="relative">
                                            <input type="text" name="father_name" value={form.father_name} onChange={handleChange} className={`peer input-modern ${errors.father_name ? 'border-red-400' : ''}`} autoComplete="off" />
                                            <label className="label-modern">Father Name</label>
                                            {errors.father_name && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.father_name}</p>}
                                        </div>
                                        <div className="relative">
                                            <input type="text" name="pan_number" value={form.pan_number} onChange={handleChange} className={`peer input-modern ${errors.pan_number ? 'border-red-400' : ''}`} autoComplete="off" />
                                            <label className="label-modern">PAN Number</label>
                                            {errors.pan_number && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.pan_number}</p>}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 2: Account Details */}
                        {currentStep === 1 && (
                            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative">
                                    <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} className={`peer input-modern ${errors.accountNumber ? 'border-red-400' : ''}`} autoComplete="off" />
                                    <label className="label-modern">Account Number</label>
                                    {errors.accountNumber && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.accountNumber}</p>}
                                </div>
                                <div className="relative">
                                    <input type="text" name="ifsc" value={form.ifsc} onChange={handleChange} className={`peer input-modern ${errors.ifsc ? 'border-red-400' : ''}`} autoComplete="off" />
                                    <label className="label-modern">IFSC Number</label>
                                    {errors.ifsc && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.ifsc}</p>}
                                </div>
                                <div className="relative md:col-span-2">
                                    <input type="text" name="bankName" value={form.bankName} onChange={handleChange} className="peer input-modern" autoComplete="off" />
                                    <label className="label-modern">Bank Name (optional)</label>
                                </div>
                            </div>
                        )}

                        {/* Step 3: ID & Face Images */}
                        {currentStep === 2 && (
                            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative">
                                    <input type="file" name="idImage" accept="image/*" onChange={handleChange} className={`peer input-modern-file ${errors.idImage ? 'border-red-400' : ''}`} />
                                    <label className="label-modern">Upload {form.idType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Image</label>
                                    {errors.idImage && <p className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">{errors.idImage}</p>}
                                </div>
                                <div className="relative">
                                    <div className="space-y-4">
                                        {/* Face Image Upload Options */}
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                <FaCamera className="w-4 h-4" />
                                                Take Photo
                                            </button>
                                            <div className="relative flex-1">
                                                <input
                                                    type="file"
                                                    name="faceImage"
                                                    accept="image/*"
                                                    onChange={handleChange}
                                                    className={`peer input-modern-file ${errors.faceImage ? 'border-red-400' : ''}`}
                                                    id="faceImageInput"
                                                />
                                                <label htmlFor="faceImageInput" className="label-modern">Upload Face Image</label>
                                            </div>
                                        </div>

                                        {/* Face Image Preview */}
                                        {form.faceImage && (
                                            <div className="relative">
                                                <img
                                                    src={form.faceImage instanceof File ? URL.createObjectURL(form.faceImage) : ''}
                                                    alt="Face Preview"
                                                    className="w-32 h-32 object-cover rounded-full border-2 border-blue-200 shadow-lg mx-auto"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(prev => ({ ...prev, faceImage: null }))}
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        {errors.faceImage && <p className="text-red-500 text-xs mt-1">{errors.faceImage}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Submit */}
                        {currentStep === 3 && (
                            <div className="animate-fade-in px-2 md:px-8">
                                <h3 className="font-bold mb-6 text-lg text-blue-700 text-center">Review Your Information</h3>
                                <div className="space-y-6">
                                    {/* Personal Info Card */}
                                    <div className="bg-white/80 rounded-xl shadow p-4 border border-blue-100 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-blue-900 text-base">Personal Information</span>
                                            <button type="button" onClick={() => setCurrentStep(0)} className="text-blue-600 text-xs underline hover:text-blue-800">Edit</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div><span className="font-medium">Name:</span> {form.name}</div>
                                            <div><span className="font-medium">DOB:</span> {form.dob}</div>
                                            <div className="md:col-span-2"><span className="font-medium">Address:</span> {form.address}</div>
                                            <div><span className="font-medium">Phone:</span> {form.phone}</div>
                                            <div><span className="font-medium">ID Type:</span> {form.idType}</div>
                                            {form.idType === 'aadhaar' && <><div><span className="font-medium">Gender:</span> {form.gender}</div><div><span className="font-medium">Aadhaar Number:</span> {form.aadhaar_number}</div></>}
                                            {form.idType === 'pan' && <><div><span className="font-medium">Father Name:</span> {form.father_name}</div><div><span className="font-medium">PAN Number:</span> {form.pan_number}</div></>}
                                        </div>
                                    </div>
                                    {/* Bank Details Card */}
                                    <div className="bg-white/80 rounded-xl shadow p-4 border border-blue-100 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-blue-900 text-base">Bank Details</span>
                                            <button type="button" onClick={() => setCurrentStep(1)} className="text-blue-600 text-xs underline hover:text-blue-800">Edit</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div><span className="font-medium">Account Number:</span> {form.accountNumber}</div>
                                            <div><span className="font-medium">IFSC:</span> {form.ifsc}</div>
                                            <div className="md:col-span-2"><span className="font-medium">Bank Name:</span> {form.bankName}</div>
                                        </div>
                                    </div>
                                    {/* Documents Card */}
                                    <div className="bg-white/80 rounded-xl shadow p-4 border border-blue-100 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-blue-900 text-base">Documents</span>
                                            <button type="button" onClick={() => setCurrentStep(2)} className="text-blue-600 text-xs underline hover:text-blue-800">Edit</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm items-center">
                                            <div>
                                                <span className="font-medium">ID Image:</span>
                                                {form.idImage ? (
                                                    <div className="mt-2">
                                                        <img
                                                            src={form.idImage instanceof File ? URL.createObjectURL(form.idImage) : ''}
                                                            alt="ID Preview"
                                                            className="w-32 h-20 object-cover rounded border border-blue-200 shadow"
                                                        />
                                                        <div className="text-xs mt-1 text-gray-500">{form.idImage.name}</div>
                                                    </div>
                                                ) : (
                                                    <span className="ml-2 text-gray-400">Not uploaded</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium">Face Image:</span>
                                                {form.faceImage ? (
                                                    <div className="mt-2">
                                                        <img
                                                            src={form.faceImage instanceof File ? URL.createObjectURL(form.faceImage) : ''}
                                                            alt="Face Preview"
                                                            className="w-20 h-20 object-cover rounded-full border border-blue-200 shadow"
                                                        />
                                                        <div className="text-xs mt-1 text-gray-500">{form.faceImage.name}</div>
                                                    </div>
                                                ) : (
                                                    <span className="ml-2 text-gray-400">Not uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Modal for Verified Animation */}
                                {showVerifiedAnimation && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                        <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center justify-center">
                                            <svg className="w-24 h-24 text-green-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="text-2xl font-bold text-green-700 mt-4 animate-fade-in">KYC Verified!</div>
                                        </div>
                                    </div>
                                )}
                                {submitMessage.text && !showVerifiedAnimation && (!submitMessage.text.includes('24 hours') || submitMessage.type !== 'error') && (
                                    <div className={`text-center mt-6 p-3 rounded-lg font-semibold ${submitMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{submitMessage.text}</div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-12 gap-4">
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-2 rounded-xl bg-white/70 border border-blue-200 text-blue-700 font-semibold shadow hover:bg-blue-50 hover:scale-105 transition-all duration-200"
                                >
                                    Back
                                </button>
                            )}
                            {currentStep < steps.length - 1 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="ml-auto px-8 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 hover:scale-105 transition-all duration-200"
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === steps.length - 1 && (
                                <button
                                    type="submit"
                                    className="ml-auto px-8 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-bold shadow-lg hover:from-green-600 hover:to-green-800 hover:scale-105 transition-all duration-200"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Camera Modal */}
                    {showCamera && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Take Face Photo</h3>
                                    <button
                                        onClick={stopCamera}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>

                                {cameraError ? (
                                    <div className="text-center py-8">
                                        <div className="text-red-500 mb-4">
                                            <FaCameraRetro className="w-12 h-12 mx-auto mb-2" />
                                            <p className="text-sm">{cameraError}</p>
                                        </div>
                                        <button
                                            onClick={startCamera}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-64 object-cover"
                                            />
                                            <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none"></div>
                                        </div>

                                        <canvas ref={canvasRef} className="hidden" />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={capturePhoto}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                <FaCamera className="w-4 h-4" />
                                                Capture Photo
                                            </button>
                                            <button
                                                onClick={stopCamera}
                                                className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <div className="text-center text-sm text-gray-600">
                                            <p>Position your face in the center of the frame</p>
                                            <p>Ensure good lighting for better quality</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showAdminKYCModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center justify-center max-w-md w-full relative animate-fade-in">
                                <button
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                                    onClick={() => setShowAdminKYCModal(false)}
                                    aria-label="Close"
                                >
                                    <FaTimes />
                                </button>
                                <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                </svg>
                                <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">KYC Submission Pending</h2>
                                <p className="text-gray-700 text-center mb-6">You can approve and submit this KYC after 24 hours. Please check back later or contact support if you need assistance.</p>
                                <button
                                    className="mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 focus:outline-none"
                                    onClick={() => setShowAdminKYCModal(false)}
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    )}

                    {showKYCReviewModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center justify-center max-w-md w-full relative animate-fade-in">
                                <button
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                                    onClick={() => setShowKYCReviewModal(false)}
                                    aria-label="Close"
                                >
                                    <FaTimes />
                                </button>
                                <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                </svg>
                                <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">KYC Application Under Review</h2>
                                <p className="text-gray-700 text-center mb-6">Admin will review your application. If not verified, please try again after 24 hours.</p>
                                <button
                                    className="mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 focus:outline-none"
                                    onClick={() => setShowKYCReviewModal(false)}
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Animations and Modern Styles */}
                    <style>{`
                    .animate-fade-in {
                        animation: fadeIn 0.6s cubic-bezier(.4,0,.2,1);
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(30px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .input-modern {
                        width: 100%;
                        padding: 1.1rem 1rem 0.5rem 1rem;
                        border-radius: 1rem;
                        border: 2px solid #e0e7ef;
                        background: rgba(255,255,255,0.7);
                        font-size: 1rem;
                        outline: none;
                        transition: border 0.2s, box-shadow 0.2s;
                        box-shadow: 0 2px 8px 0 rgba(30,64,175,0.04);
                    }
                    .input-modern:focus {
                        border-color: #2563eb;
                        box-shadow: 0 4px 16px 0 rgba(37,99,235,0.08);
                    }
                    .input-modern-file {
                        width: 100%;
                        padding: 0.7rem 1rem;
                        border-radius: 1rem;
                        border: 2px solid #e0e7ef;
                        background: rgba(255,255,255,0.7);
                        font-size: 1rem;
                        outline: none;
                        transition: border 0.2s, box-shadow 0.2s;
                        box-shadow: 0 2px 8px 0 rgba(30,64,175,0.04);
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
                    .peer:focus ~ .label-modern,
                    .peer:not(:placeholder-shown):not([type='date']):not([type='file']) ~ .label-modern,
                    .peer:valid ~ .label-modern {
                        top: -0.7rem;
                        left: 0.9rem;
                        font-size: 0.85rem;
                        color: #2563eb;
                        background: #fff;
                        padding: 0 0.3rem;
                        border-radius: 0.5rem;
                        box-shadow: 0 2px 8px 0 rgba(30,64,175,0.04);
                    }
                `}</style>
                </div>
            </div>
        </div>
    );
}

export default KYCStepperForm; 