const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userResponse = {
            userId: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            kycStatus: user.kycStatus,
            kycData: user.kycData,
            role: user.role
        };

        console.log('User Profile Debug:', {
            userId: user._id,
            kycStatus: user.kycStatus,
            kycDataLength: user.kycData?.length || 0,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});

// Debug endpoint to check KYC status
router.get('/debug-kyc', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                email: user.email,
                name: user.name,
                kycStatus: user.kycStatus,
                kycData: user.kycData,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Debug KYC error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug info'
        });
    }
});

// Get notifications for the logged-in user
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        console.log('=== FETCHING USER NOTIFICATIONS ===');
        console.log('User ID:', req.user.userId);

        const notifications = await Notification.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('campaign', 'title');

        console.log('Found notifications count:', notifications.length);
        console.log('Notifications:', notifications.map(n => ({
            id: n._id,
            type: n.type,
            message: n.message,
            createdAt: n.createdAt
        })));

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Mark notifications as read
router.post('/notifications/mark-read', authenticateToken, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.userId, read: false }, { read: true });
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
});

// Test route to create a notification (for debugging)
router.post('/notifications/test', authenticateToken, async (req, res) => {
    try {
        console.log('=== TEST NOTIFICATION CREATION ===');
        console.log('User ID:', req.user.userId);

        const testNotification = new Notification({
            user: req.user.userId,
            type: 'report',
            message: 'This is a test notification for debugging purposes.',
            createdAt: new Date()
        });

        const savedNotification = await testNotification.save();
        console.log('Test notification saved:', savedNotification);

        res.json({
            success: true,
            message: 'Test notification created',
            data: savedNotification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ success: false, message: 'Failed to create test notification' });
    }
});

// Alias: Get current user profile at /me (for compatibility)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                kycStatus: user.kycStatus,
                kycData: user.kycData,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve user profile' });
    }
});

module.exports = router;