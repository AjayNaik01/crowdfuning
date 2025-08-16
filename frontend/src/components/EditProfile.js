import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPencilAlt } from 'react-icons/fa';
import Navbar from './Navbar';
import Footer from './Footer';

const EditProfile = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Load user data from localStorage or fetch from backend
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setForm({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            bio: userData.bio || '',
        });
        setUser(userData);
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const data = await res.json();
                setStatus('success');
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header - same as CampaignsPage */}
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
                                <h1 className="text-xl font-bold text-gray-900">CrowdFund</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/create-campaign" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">Start a Campaign</Link>
                            {user ? (
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
                                    {showProfile && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50" style={{ position: 'fixed', top: 60, right: 10, zIndex: 99999 }}>
                                            <div className="p-4">
                                                <div className="flex items-center mb-4 relative">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-lg font-medium text-indigo-600">
                                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                                    </div>
                                                    {/* Pencil Icon for Edit Profile */}
                                                    <a href="/profile/edit" className="absolute top-4 right-0 p-2 text-gray-400 hover:text-indigo-600" title="Edit Profile">
                                                        <FaPencilAlt size={18} />
                                                    </a>
                                                </div>
                                                {/* Quick Actions */}
                                                <div className="space-y-2 mb-4">
                                                    <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/my-campaigns'); setShowProfile(false); }}>My Campaigns</button>
                                                    <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/donation-history'); setShowProfile(false); }}>Donation History</button>
                                                    <button className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md" onClick={() => { navigate('/notifications'); setShowProfile(false); }}>Notifications</button>
                                                </div>
                                                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
                    <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Edit Profile</h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={form.name}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="you@example.com"
                                disabled
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                value={form.phone}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="Your Phone Number"
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={3}
                                value={form.bio}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        {status === 'success' && (
                            <div className="text-green-600 text-center mt-2">Profile updated successfully!</div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-600 text-center mt-2">Failed to update profile. Please try again.</div>
                        )}
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EditProfile; 