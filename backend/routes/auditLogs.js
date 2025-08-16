const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticateAdminToken } = require('../middleware/authAdmin');

// Super admin only middleware
const requireSuperAdmin = (req, res, next) => {
    if (!req.admin || req.admin.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Only super admins can view audit logs.'
        });
    }
    next();
};

const router = express.Router();

// Test route to create sample audit logs
router.post('/create-test-logs', authenticateAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const testLogs = [
            {
                actor: { name: 'Test Admin', email: 'admin@test.com' },
                action: 'admin_login',
                target: { name: 'Test Admin', email: 'admin@test.com', type: 'Admin' },
                details: { method: 'POST', url: '/api/admin/login', params: {}, response: { message: 'Login successful' } }
            },
            {
                actor: { name: 'Test Admin', email: 'admin@test.com' },
                action: 'kyc_approve',
                target: { name: 'John Doe', email: 'john@example.com', type: 'User' },
                details: { method: 'PUT', url: '/api/admin/kyc/approve', params: { userId: '123456789' }, response: { message: 'KYC approved' } }
            },
            {
                actor: { name: 'Test Admin', email: 'admin@test.com' },
                action: 'campaign_approve',
                target: { name: 'Charity Campaign', type: 'Campaign' },
                details: { method: 'PUT', url: '/api/admin/campaigns/approve', params: { campaignId: '987654321' }, response: { message: 'Campaign approved' } }
            },
            {
                actor: { name: 'Super Admin', email: 'super@test.com' },
                action: 'admin_create',
                target: { name: 'New Admin', email: 'newadmin@test.com', type: 'Admin' },
                details: { method: 'POST', url: '/api/admin/admins', params: { name: 'New Admin', email: 'newadmin@test.com' }, response: { message: 'Admin created' } }
            },
            {
                actor: { name: 'Super Admin', email: 'super@test.com' },
                action: 'platform_settings_update',
                target: { name: 'Platform Settings', type: 'Platform' },
                details: { method: 'PUT', url: '/api/admin/platform-settings', params: { commissionRate: 5 }, response: { message: 'Settings updated' } }
            }
        ];

        const createdLogs = await AuditLog.insertMany(testLogs);

        res.json({
            success: true,
            message: `Created ${createdLogs.length} test audit logs`,
            data: createdLogs
        });
    } catch (error) {
        console.error('Error creating test audit logs:', error);
        res.status(500).json({ success: false, message: 'Failed to create test audit logs' });
    }
});

// GET /api/audit-logs?actor=&action=&startDate=&endDate=&page=&limit=
router.get('/', authenticateAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const { actor, action, startDate, endDate, page = 1, limit = 20 } = req.query;
        const query = {};

        // Filter by actor email
        if (actor) {
            query['actor.email'] = { $regex: actor, $options: 'i' };
        }

        // Filter by action
        if (action) {
            query.action = action;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
            }
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log('Audit logs query:', JSON.stringify(query, null, 2));
        console.log('Audit logs pagination:', { page, limit, skip });

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await AuditLog.countDocuments(query);

        console.log('Audit logs found:', logs.length, 'Total:', total);
        res.json({
            success: true,
            data: logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
});

module.exports = router; 