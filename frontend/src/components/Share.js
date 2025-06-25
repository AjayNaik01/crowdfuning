import React, { useState } from 'react';

const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5001${imagePath}`;
};

const Share = ({ open, onClose, campaign }) => {
    const [copied, setCopied] = useState(false);
    if (!open || !campaign) return null;

    const shareUrl = `${window.location.origin}/campaign/${campaign._id}`;
    const shareText = `${campaign.title}\n${campaign.description}\n${shareUrl}`;
    const imageUrl = campaign.images && campaign.images.length > 0 ? getImageUrl(campaign.images[0]) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 mx-2 animate-fade-in">
                {/* Close Button */}
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {/* Image */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={campaign.title}
                        className="w-full h-48 object-cover rounded-t-2xl"
                        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                    />
                )}
                {/* Content */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{campaign.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 text-center line-clamp-3">{campaign.description}</p>
                    <div className="flex justify-center space-x-4 mb-4">
                        {/* WhatsApp */}
                        <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition"
                            title="Share on WhatsApp"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.93 11.93 0 0012 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.63-.5-5.18-1.44l-.37-.22-3.67.96.98-3.58-.24-.37A9.94 9.94 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.04 2.81 1.19 3 .15.19 2.05 3.13 5.01 4.27.7.3 1.25.48 1.68.61.71.23 1.36.2 1.87.12.57-.09 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" /></svg>
                        </a>
                        {/* Facebook */}
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                            title="Share on Facebook"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5.006 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 17.006 22 12z" /></svg>
                        </a>
                        {/* Twitter/X */}
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500 transition"
                            title="Share on Twitter"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 00-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 01-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 010 21.543a13.94 13.94 0 007.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A10.012 10.012 0 0024 4.557z" /></svg>
                        </a>
                        {/* Telegram */}
                        <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-400 transition"
                            title="Share on Telegram"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9.036 16.569l-.398 3.934c.57 0 .818-.244 1.116-.535l2.675-2.558 5.547 4.053c1.016.561 1.74.266 1.993-.941l3.617-16.93c.33-1.527-.553-2.127-1.54-1.76L2.13 9.75c-1.49.579-1.471 1.406-.254 1.785l4.627 1.444 10.74-6.77c.505-.324.97-.144.59.18" /></svg>
                        </a>
                        {/* Copy Link */}
                        <button
                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }}
                            title="Copy Link"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                        </button>
                    </div>
                    {/* Copy feedback */}
                    {copied && (
                        <div className="text-center text-green-600 text-xs mt-2">Link copied!</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Share;