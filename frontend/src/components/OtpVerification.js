import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const OtpVerification = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [countdown, setCountdown] = useState(0);
    const [email, setEmail] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        // Get email from localStorage
        const storedEmail = localStorage.getItem('verificationEmail');
        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            // If no email found, redirect to register
            navigate('/register');
        }
    }, [navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleOtpChange = (index, value) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5001/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otpString
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({
                    type: 'success',
                    text: 'Email verified successfully! Redirecting to login...'
                });

                // Clear stored email
                localStorage.removeItem('verificationEmail');

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.message || 'OTP verification failed' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5001/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({
                    type: 'success',
                    text: 'OTP resent successfully! Please check your email.'
                });
                setCountdown(60); // Start 60-second countdown
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to resend OTP' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) {
        return null; // Will redirect to register
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Verify your email
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We've sent a verification code to
                    </p>
                    <p className="text-center text-sm font-medium text-indigo-600">
                        {email}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Message Display */}
                    {message.text && (
                        <div className={`rounded-md p-4 ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* OTP Input Fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Enter 6-digit verification code
                            </label>
                            <div className="flex justify-center space-x-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-10 text-center text-lg font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading || countdown > 0}
                                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Resending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                            </button>
                            <Link
                                to="/register"
                                className="text-sm text-gray-600 hover:text-gray-500 text-center"
                            >
                                ← Back to registration
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtpVerification; 