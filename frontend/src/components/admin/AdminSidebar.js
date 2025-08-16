import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const menu = [
    {
        label: 'Dashboard',
        icon: '',
        path: '/admin',
    },
    {
        label: 'Campaigns',
        icon: '',
        path: '/admin/campaigns'
    },
    {
        label: 'KYC Requests',
        icon: '',
        path: '/admin/kyc',
    },
    {
        label: 'Withdrawals',
        icon: '',
        path: '/admin/withdrawals'
    },
    {
        label: 'Refunds',
        icon: '',
        path: '/admin/refunds'
    },
    {
        label: 'Users',
        icon: '',
        path: '/admin/users'
    },
    {
        label: 'Donations',
        icon: '',
        path: '/admin/donations'
    },
    {
        label: 'Notifications',
        icon: '',
        path: '/admin/notifications',
    },
    {
        label: 'Reports/Comments',
        icon: '',
        children: [
            { label: 'All Reports', path: '/admin/reports' },
            { label: 'All Comments', path: '/admin/reports/comments' },
        ],
    },

    {
        label: 'Analytics',
        icon: '',
        children: [
            { label: 'Platform Stats', path: '/admin/analytics' },
            { label: 'Export Data', path: '/admin/analytics/export' },
        ],
    },

    {
        label: 'Settings',
        icon: '',
        children: [
            { label: 'Platform Settings', path: '/admin/settings' },
            { label: 'Admin Roles', path: '/admin/settings/roles' },
        ],
    },
    {
        label: 'Audit Logs',
        icon: '',
        path: '/admin/audit-logs',
    },
];

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openSections, setOpenSections] = useState({});

    const toggleSection = (label) => {
        setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const handleLogout = async () => {
        try {
            // Call logout API to log the event
            const token = localStorage.getItem('adminToken');
            if (token) {
                await fetch('http://localhost:5001/api/admin/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            localStorage.removeItem('adminToken');
            navigate('/');
        }
    };

    return (
        <aside className="h-screen w-64 bg-white border-r flex flex-col shadow-lg sticky top-0">
            <div className="h-16 flex items-center justify-center font-bold text-2xl text-indigo-700 border-b">CrowdAdmin</div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {menu.map((item) => (
                        <li key={item.label}>
                            {item.children ? (
                                <div>
                                    <button
                                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-indigo-50 transition ${openSections[item.label] ? 'font-semibold' : ''}`}
                                        onClick={() => toggleSection(item.label)}
                                    >
                                        <span className="mr-3 text-lg">{item.icon}</span>
                                        <span className="flex-1">{item.label}</span>
                                        <span className="text-black">{openSections[item.label] ? '▼' : '▸'}</span>
                                    </button>
                                    {openSections[item.label] && (
                                        <ul className="ml-8 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <li key={child.label}>
                                                    <Link
                                                        to={child.path}
                                                        className={`block px-3 py-1 rounded hover:bg-indigo-100 transition ${location.pathname === child.path ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 rounded hover:bg-indigo-50 transition ${location.pathname === item.path ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                                >
                                    <span className="mr-3 text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="border-t p-4">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold transition">
                    <span>🚪</span> Logout
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar; 