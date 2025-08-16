import React, { useState, useEffect } from 'react';
import adminFetch from './adminFetch';

function AdminRoles() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        role: 'admin'
    });
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await adminFetch('/api/admin/admins');
            if (response.status === 403) {
                setForbidden(true);
                setAdmins([]);
                setMessage('');
                return;
            }
            const data = await response.json();
            if (data.success) {
                setAdmins(data.data);
            } else {
                setMessage('Failed to load admins');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            setMessage('Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();

        if (!createForm.name || !createForm.email) {
            setMessage('Name and email are required');
            return;
        }

        try {
            const response = await adminFetch('/api/admin/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createForm)
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Admin created successfully! Credentials sent to email.');
                setShowCreateForm(false);
                setCreateForm({
                    name: '',
                    email: '',
                    role: 'admin'
                });
                fetchAdmins(); // Refresh the list
            } else {
                setMessage(data.message || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            setMessage('Failed to create admin');
        }
    };

    const handleToggleAdminStatus = async (adminId, currentStatus) => {
        try {
            const response = await adminFetch(`/api/admin/admins/${adminId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            const data = await response.json();
            if (data.success) {
                setMessage(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
                fetchAdmins(); // Refresh the list
            } else {
                setMessage(data.message || 'Failed to update admin status');
            }
        } catch (error) {
            console.error('Error updating admin status:', error);
            setMessage('Failed to update admin status');
        }
    };

    const handleDeleteAdmin = async (adminId, adminName) => {
        if (!window.confirm(`Are you sure you want to delete admin "${adminName}"?`)) {
            return;
        }

        try {
            const response = await adminFetch(`/api/admin/admins/${adminId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Admin deleted successfully!');
                fetchAdmins(); // Refresh the list
            } else {
                setMessage(data.message || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            setMessage('Failed to delete admin');
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin':
                return 'bg-red-100 text-red-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    if (forbidden) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center mx-auto">
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
                    <p className="text-gray-700 text-lg">You do not have permission to access this page.<br />Only super admins can manage admins.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-emerald-50 flex flex-col overflow-x-hidden">
            <div className="flex justify-between items-center p-8">
                <h2 className="text-3xl font-extrabold text-indigo-800 tracking-tight">Admin Management</h2>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                    Add New Admin
                </button>
            </div>

            {message && (
                <div className={`mx-8 mb-4 px-4 py-2 rounded font-semibold ${message.includes('successfully')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {message}
                </div>
            )}

            {/* Create Admin Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Create New Admin</h3>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block font-semibold mb-1">Name</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="border rounded px-3 py-2 w-full"
                                    placeholder="Enter admin name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Email</label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="border rounded px-3 py-2 w-full"
                                    placeholder="Enter admin email"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Role</label>
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                                    className="border rounded px-3 py-2 w-full"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                                <strong>Note:</strong> Admin credentials will be automatically generated and sent to the provided email address.
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex-1"
                                >
                                    Create Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admins List */}
            <div className="px-8 pb-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h3 className="text-xl font-bold mb-6 text-indigo-700">Admin Users</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold">Admin Name</th>
                                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-sm font-medium text-indigo-600">
                                                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{admin.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{admin.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                                                {admin.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(admin.isActive)}`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleAdminStatus(admin._id, admin.isActive)}
                                                    className={`px-3 py-1 rounded text-xs font-medium ${admin.isActive
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    disabled={admin.role === 'super_admin'} // Cannot deactivate super admin
                                                >
                                                    {admin.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                                                    disabled={admin.role === 'super_admin'} // Cannot delete super admin
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {admins.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No admin users found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminRoles; 