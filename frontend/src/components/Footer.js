import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const [platformSettings, setPlatformSettings] = useState(null);

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
        <div>
            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: platformSettings?.primaryColor || '#4f46e5' }}>
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold">{platformSettings?.platformName || 'CrowdFund'}</h3>
                            </div>
                            <p className="text-gray-400">
                                {platformSettings?.tagline || 'Making dreams come true, one campaign at a time.'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Navigation</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/register" className="hover:text-white">Start a Campaign</Link></li>
                                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                                <li><Link to="/campaigns" className="hover:text-white" onClick={e => { if (window.location.pathname === '/campaigns') { e.preventDefault(); window.scrollTo(0, 0); window.location.reload(); } }}>Browse Campaigns</Link></li>
                                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Connect</h4>
                            <div className="flex flex-col space-y-2">
                                {platformSettings?.socialLinks?.facebook && (
                                    <a href={platformSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>
                                )}
                                {platformSettings?.socialLinks?.twitter && (
                                    <a href={platformSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white">Twitter</a>
                                )}
                                {platformSettings?.socialLinks?.instagram && (
                                    <a href={platformSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
                                )}
                                {platformSettings?.socialLinks?.linkedin && (
                                    <a href={platformSettings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 {platformSettings?.platformName || 'CrowdFund'}. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer
