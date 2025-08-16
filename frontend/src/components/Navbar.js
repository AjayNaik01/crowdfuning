import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [platformSettings, setPlatformSettings] = useState(null);


    const handleHowItWorksClick = (e) => {
        e.preventDefault();
        if (location.pathname === '/') {
            const section = document.getElementById('how-it-works');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/', { replace: false });
            setTimeout(() => {
                const section = document.getElementById('how-it-works');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300); // Wait for navigation and DOM update
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/platform-settings/');
                const data = await response.json();
                if (data.success) setPlatformSettings(data.data);
            } catch (error) {
                setPlatformSettings(null);
            }
        };
        fetchSettings();
    }, []);


    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
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
                            <h1
                                className="text-xl font-bold text-gray-900 cursor-pointer"
                                onClick={() => navigate('/campaigns')}
                            >
                                {platformSettings?.platformName || 'CrowdFund'}
                            </h1>                        </div>
                    </div>
                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                        <a href="#how-it-works" onClick={handleHowItWorksClick} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">How it Works</a>
                        <Link to="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Sign In</Link>
                        <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">Start a Campaign</Link>
                        <Link to="/admin/login" className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition">Admin Login</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 