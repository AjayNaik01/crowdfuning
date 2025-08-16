import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlider from './ImageSlider';
import img1 from '../img/image1.jpg';
import img2 from '../img/image.jpg';
import img3 from '../img/image6.webp';
import img4 from '../img/image4.jpg';
import Footer from './Footer';
import Navbar from './Navbar';

// CountUpOnView component
function CountUpOnView({ end, duration = 2000, prefix = '', suffix = '', decimals = 0 }) {
    const [count, setCount] = useState(0);
    const ref = useRef();
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        function handleScroll() {
            if (!ref.current || hasAnimated) return;
            const rect = ref.current.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                setHasAnimated(true);
            }
        }
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasAnimated]);

    useEffect(() => {
        if (!hasAnimated) return;
        let start = 0;
        const startTime = performance.now();
        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = start + (end - start) * progress;
            setCount(progress === 1 ? end : value);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }, [hasAnimated, end, duration]);

    return (
        <span ref={ref}>
            {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </span>
    );
}

const LandingPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [stats, setStats] = useState({
        totalAmountRaised: 0,
        totalDonors: 0,
        totalCampaigns: 0,
        totalCountries: 0,
        activeCampaigns: 0 // Add this for possible future use
    });
    const [loadingStats, setLoadingStats] = useState(true);

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
        // Fetch statistics from backend
        async function fetchStats() {
            setLoadingStats(true);
            try {
                const res = await fetch('/api/statistics');
                const data = await res.json();
                if (data.success && data.data) {
                    setStats({
                        ...data.data,
                        activeCampaigns: data.data.activeCampaigns || 0
                    });
                }
            } catch (err) {
                // Optionally handle error
            } finally {
                setLoadingStats(false);
            }
        }
        fetchStats();
    }, []);

    useEffect(() => {
        const observer = new window.IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('.fade-in-up-on-view').forEach(el => {
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log('Search:', searchQuery, 'Category:', selectedCategory);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {/* Image Slider */}
            <div className="w-full" style={{ height: 'calc(100vh - 4rem)' }}>
                <ImageSlider
                    slides={[
                        { image: img1, text: '“The best way to find yourself is to lose yourself in the service of others.”' },
                        { image: img2, text: '“No one has ever become poor by giving.”' },
                        { image: img3, text: '“We make a living by what we get, but we make a life by what we give.”' },
                        { image: img4, text: '“Charity brings to life again those who are spiritually dead.”' },
                    ]}
                    autoSlideInterval={4500}
                    className="w-full h-full"
                />
            </div>
            {/* Statistics Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {loadingStats ? '...' : <CountUpOnView end={stats.totalAmountRaised} duration={2000} prefix="$" suffix={stats.totalAmountRaised >= 1e9 ? 'B+' : stats.totalAmountRaised >= 1e6 ? 'M+' : '+'} decimals={0} />}
                            </div>
                            <div className="text-gray-600">Raised Worldwide</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {loadingStats ? '...' : <CountUpOnView end={stats.totalDonors} duration={2000} suffix={stats.totalDonors >= 1e6 ? 'M+' : stats.totalDonors >= 1e3 ? 'K+' : '+'} decimals={0} />}
                            </div>
                            <div className="text-gray-600">Donors</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {loadingStats ? '...' : <CountUpOnView end={stats.totalCampaigns} duration={2000} suffix={stats.totalCampaigns >= 1e6 ? 'M+' : stats.totalCampaigns >= 1e3 ? 'K+' : '+'} decimals={0} />}
                            </div>
                            <div className="text-gray-600">Campaigns</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-indigo-600 mb-2">
                                {loadingStats ? '...' : <CountUpOnView end={stats.activeCampaigns} duration={2000} suffix={stats.activeCampaigns >= 1e6 ? 'M+' : stats.activeCampaigns >= 1e3 ? 'K+' : '+'} decimals={0} />}
                            </div>
                            <div className="text-gray-600">Active Campaigns</div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Features Section */}
            <div className="fade-in-up-on-view">
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
            </div>
            {/* How It Works Section */}
            <div className="fade-in-up-on-view">
                <section id="how-it-works" className="py-20 bg-white">
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
            </div>
            {/* Success Stories Section */}
            {/* <section className="py-20 bg-gray-50">
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
            </section> */}

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
            <section>
                <Footer />
            </section>

        </div>
    );
};

export default LandingPage; 