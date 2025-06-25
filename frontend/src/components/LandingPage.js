import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

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

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log('Search:', searchQuery, 'Category:', selectedCategory);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
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
                                <h1 className="text-xl font-bold text-gray-900">CrowdFund</h1>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-8">
                            <form onSubmit={handleSearch} className="flex">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search campaigns..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border-t border-b border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Search
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center space-x-4">
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
                                Start a Campaign
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-indigo-50 to-purple-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                            Fund Your Dreams,
                            <span className="text-indigo-600"> Change the World</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Join millions of people who are making a difference. Start your fundraising campaign today and turn your ideas into reality.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                            >
                                Start Your Campaign
                            </Link>
                            <Link
                                to="/campaigns"
                                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                            >
                                Explore Campaigns
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">$15B+</div>
                            <div className="text-gray-600">Raised Worldwide</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">50M+</div>
                            <div className="text-gray-600">Donors</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">2M+</div>
                            <div className="text-gray-600">Campaigns</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">150+</div>
                            <div className="text-gray-600">Countries</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose CrowdFund?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We provide the tools and support you need to make your fundraising campaign successful.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-lg shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick & Easy Setup</h3>
                            <p className="text-gray-600">
                                Create your campaign in minutes with our simple setup process. Complete KYC verification to start fundraising.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Payments</h3>
                            <p className="text-gray-600">
                                Your donations are protected with bank-level security. Multiple payment options including UPI available.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Transparent Voting</h3>
                            <p className="text-gray-600">
                                Enable voting system for transparency. Donors can verify legitimacy and approve fund usage.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Get started with your fundraising campaign in just three simple steps.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete KYC</h3>
                            <p className="text-gray-600">
                                Sign up, verify your identity with KYC, and get approved to create campaigns.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create & Share</h3>
                            <p className="text-gray-600">
                                Create your campaign with details, images, and videos. Share with your network.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Receive Funds</h3>
                            <p className="text-gray-600">
                                Get donations through secure payments. Enable voting for transparency if needed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Stories Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Success Stories
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            See how others have achieved their goals through crowdfunding.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Medical Treatment Fund</h3>
                                <p className="text-gray-600 mb-4">Raised $50,000 for emergency surgery</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-semibold">Goal Achieved</span>
                                    <span className="text-gray-500">2 weeks ago</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Garden</h3>
                                <p className="text-gray-600 mb-4">Built a sustainable garden for the neighborhood</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-semibold">Goal Achieved</span>
                                    <span className="text-gray-500">1 month ago</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Education Fund</h3>
                                <p className="text-gray-600 mb-4">Helped 100 students with school supplies</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-semibold">Goal Achieved</span>
                                    <span className="text-gray-500">3 weeks ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-indigo-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Start Your Campaign?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of people who are making a difference. Your story matters, and your cause deserves to be heard.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                        >
                            Start Your Campaign
                        </Link>
                        <Link
                            to="/login"
                            className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold transition duration-300"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">CrowdFund</h3>
                            </div>
                            <p className="text-gray-400">
                                Making dreams come true, one campaign at a time.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">For Campaigners</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/register" className="hover:text-white">Start a Campaign</Link></li>
                                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                                <li><a href="#" className="hover:text-white">How It Works</a></li>
                                <li><a href="#" className="hover:text-white">Success Stories</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">For Donors</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/campaigns" className="hover:text-white">Browse Campaigns</Link></li>
                                <li><a href="#" className="hover:text-white">Categories</a></li>
                                <li><a href="#" className="hover:text-white">Gift Cards</a></li>
                                <li><a href="#" className="hover:text-white">Wishlist</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Help Center</a></li>
                                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white">Trust & Safety</a></li>
                                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 CrowdFund. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 