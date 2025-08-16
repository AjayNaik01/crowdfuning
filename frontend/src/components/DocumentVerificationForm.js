import React, { useState } from 'react';

const DocumentVerificationForm = ({ campaignId, onUploadSuccess, token }) => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!file || !description) {
            setError('Please provide both a file and a description.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('document', file);
        formData.append('description', description);

        try {
            const response = await fetch(`/api/campaigns/${campaignId}/upload-document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload document.');
            }

            setSuccess('Document uploaded successfully!');
            setDescription('');
            setFile(null);
            if (onUploadSuccess) {
                onUploadSuccess(data.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Upload Verification Document</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Document Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows="3"
                        required
                    ></textarea>
                </div>
                <div className="mb-4">
                    <label htmlFor="document" className="block text-sm font-medium text-gray-700">Document File (Image, Video, PDF)</label>
                    <input
                        type="file"
                        id="document"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        accept="image/*,video/*,.pdf"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-2">{success}</p>}
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                >
                    {loading ? 'Uploading...' : 'Upload Document'}
                </button>
            </form>
        </div>
    );
};

export default DocumentVerificationForm; 