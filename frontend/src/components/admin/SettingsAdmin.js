import React, { useState, useEffect } from 'react';
import adminFetch from './adminFetch';

function SettingsAdmin() {
    const [settings, setSettings] = useState({
        platformName: 'CrowdFunding Platform',
        supportEmail: 'support@example.com',
        primaryColor: '#4f46e5',
        platformLogo: '',
        platformFees: 5,
        enableUserRegistration: true,
        socialLinks: {
            facebook: 'https://facebook.com/yourpage',
            twitter: 'https://twitter.com/yourprofile',
            instagram: 'https://instagram.com/yourprofile',
            linkedin: 'https://linkedin.com/company/yourcompany'
        },
        categories: []
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await adminFetch('/api/platform-settings/admin');
            if (response.status === 403) {
                setForbidden(true);
                setMessage('');
                return;
            }
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
                if (data.data.platformLogo) {
                    setLogoPreview(`http://localhost:5001${data.data.platformLogo}`);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        setMessage('');

        try {
            const response = await adminFetch('/api/platform-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Settings saved successfully!');
            } else {
                setMessage(data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            setMessage('Please select a logo file');
            return;
        }

        const formData = new FormData();
        formData.append('logo', logoFile);

        try {
            const response = await adminFetch('/api/platform-settings/upload-logo', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    platformLogo: data.data.logoUrl
                }));
                setLogoPreview(`http://localhost:5001${data.data.logoUrl}`);
                setMessage('Logo uploaded successfully!');
                setLogoFile(null);
            } else {
                setMessage(data.message || 'Failed to upload logo');
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            setMessage('Failed to upload logo');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            setMessage('Please enter a category name');
            return;
        }

        try {
            const response = await adminFetch('/api/platform-settings/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCategory.trim() })
            });

            const data = await response.json();
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    categories: data.data
                }));
                setNewCategory('');
                setMessage('Category added successfully!');
            } else {
                setMessage(data.message || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            setMessage('Failed to add category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            const response = await adminFetch(`/api/platform-settings/categories/${categoryId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    categories: data.data
                }));
                setMessage('Category deleted successfully!');
            } else {
                setMessage(data.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            setMessage('Failed to delete category');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center mx-auto">
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
                    <p className="text-gray-700 text-lg">You do not have permission to access this page.<br />Only super admins can manage platform settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-emerald-50 flex flex-col overflow-x-hidden">
            <h2 className="text-3xl font-extrabold mb-8 text-indigo-800 tracking-tight pl-8 pt-8">Platform Settings</h2>

            {message && (
                <div className={`mx-8 mb-4 px-4 py-2 rounded font-semibold ${message.includes('successfully')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {message}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 w-full px-8 pb-8">
                {/* Platform Settings Card */}
                <div className="flex-1 max-w-[600px] bg-white rounded-2xl shadow-xl p-8 flex flex-col relative min-w-[320px]">
                    <form className="flex flex-col gap-6 flex-1" onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }}>
                        <div>
                            <label className="block font-semibold mb-1">Platform Name</label>
                            <input
                                type="text"
                                value={settings.platformName}
                                onChange={e => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                className="border rounded px-2 py-1 w-full"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Support Email</label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                className="border rounded px-2 py-1 w-full"
                            />
                        </div>
                        {/* Social Links Section */}
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-indigo-700 mb-2">Social Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-1">Facebook</label>
                                    <input
                                        type="url"
                                        value={settings.socialLinks.facebook}
                                        onChange={e => setSettings(prev => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">Twitter</label>
                                    <input
                                        type="url"
                                        value={settings.socialLinks.twitter}
                                        onChange={e => setSettings(prev => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="https://twitter.com/yourprofile"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">Instagram</label>
                                    <input
                                        type="url"
                                        value={settings.socialLinks.instagram}
                                        onChange={e => setSettings(prev => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="https://instagram.com/yourprofile"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-1">LinkedIn</label>
                                    <input
                                        type="url"
                                        value={settings.socialLinks.linkedin}
                                        onChange={e => setSettings(prev => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="https://linkedin.com/company/yourcompany"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sticky Save Button */}
                        <div className="sticky bottom-0 bg-white pt-4 pb-2 z-10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 w-full font-bold text-lg shadow transition disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Categories/Tags Card */}
                <div className="flex-1 max-w-[600px] bg-white rounded-2xl shadow-xl p-8 min-w-[320px]">
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 tracking-tight">Categories / Tags</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Add new category/tag"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add</button>
                    </form>
                    <ul className="divide-y divide-indigo-50">
                        {settings.categories.length === 0 && <li className="py-4 text-gray-400">No categories/tags yet.</li>}
                        {settings.categories.map(cat => (
                            <li key={cat._id} className="flex items-center justify-between py-2">
                                <span className="text-gray-800 font-medium">{cat.name}</span>
                                <button
                                    onClick={() => handleDeleteCategory(cat._id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700 text-sm"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default SettingsAdmin; 