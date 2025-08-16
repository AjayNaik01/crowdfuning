import React, { useState, useEffect } from 'react';

const DocumentViewer = ({ isOpen, onClose, document: documentData }) => {
    const [fileType, setFileType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (documentData && documentData.fileUrl) {
            determineFileType(documentData.fileUrl);
        }
    }, [documentData]);

    const determineFileType = (url) => {
        setLoading(true);
        setError(null);

        const extension = url.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
            setFileType('image');
        } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
            setFileType('video');
        } else if (extension === 'pdf') {
            setFileType('pdf');
        } else {
            setFileType('unknown');
        }

        setLoading(false);
    };

    const getFullFileUrl = (url) => {
        // If the URL is already a full URL, return it as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // If it's a relative path, prepend the backend URL
        return `http://localhost:5001${url}`;
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = getFullFileUrl(documentData.fileUrl);
        link.download = documentData.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !documentData) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {documentData.title}
                            </h3>
                            {documentData.description && (
                                <p className="text-sm text-gray-600 mt-1 truncate">
                                    {documentData.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button
                                onClick={handleDownload}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                                title="Download"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading document...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <p className="text-gray-600">Failed to load document</p>
                                    <button
                                        onClick={() => window.open(getFullFileUrl(documentData.fileUrl), '_blank')}
                                        className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
                                    >
                                        Open in new tab
                                    </button>
                                </div>
                            </div>
                        ) : fileType === 'image' ? (
                            <div className="flex justify-center">
                                <img
                                    src={getFullFileUrl(documentData.fileUrl)}
                                    alt={documentData.title}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                    onError={() => setError(true)}
                                    onLoad={() => setLoading(false)}
                                />
                            </div>
                        ) : fileType === 'video' ? (
                            <div className="flex justify-center">
                                <video
                                    controls
                                    className="max-w-full max-h-full rounded-lg shadow-lg"
                                    onError={() => setError(true)}
                                    onLoadedData={() => setLoading(false)}
                                >
                                    <source src={getFullFileUrl(documentData.fileUrl)} type={`video/${documentData.fileUrl.split('.').pop()}`} />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ) : fileType === 'pdf' ? (
                            <div className="w-full h-96">
                                <iframe
                                    src={`${getFullFileUrl(documentData.fileUrl)}#toolbar=1&navpanes=1&scrollbar=1`}
                                    className="w-full h-full border-0 rounded-lg shadow-lg"
                                    title={documentData.title}
                                    onError={() => setError(true)}
                                    onLoad={() => setLoading(false)}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-600 mb-4">Unsupported file type</p>
                                    <button
                                        onClick={() => window.open(getFullFileUrl(documentData.fileUrl), '_blank')}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Open in new tab
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer; 