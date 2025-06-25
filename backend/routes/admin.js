const express = require('express');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Get admin dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
        const totalRegularUsers = await User.countDocuments({ role: 'user' });
        const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });

        // Get campaign statistics
        const totalCampaigns = await Campaign.countDocuments();
        const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
        const pendingCampaigns = await Campaign.countDocuments({ status: 'pending_review' });
        const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });

        // Get donation statistics
        const totalDonations = await Donation.countDocuments({ paymentStatus: 'completed' });
        const totalAmountRaised = await Donation.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Get recent activities
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role kycStatus createdAt');

        const recentCampaigns = await Campaign.find()
            .populate('creator', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title status category createdAt');

        const recentDonations = await Donation.find({ paymentStatus: 'completed' })
            .populate('campaign', 'title')
            .populate('donor', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('amount donorName createdAt');

        res.json({
            success: true,
            data: {
                statistics: {
                    users: {
                        total: totalUsers,
                        admins: totalAdmins,
                        regularUsers: totalRegularUsers,
                        pendingKYC
                    },
                    campaigns: {
                        total: totalCampaigns,
                        active: activeCampaigns,
                        pending: pendingCampaigns,
                        completed: completedCampaigns
                    },
                    donations: {
                        total: totalDonations,
                        amountRaised: totalAmountRaised[0]?.total || 0
                    }
                },
                recentActivities: {
                    users: recentUsers,
                    campaigns: recentCampaigns,
                    donations: recentDonations
                }
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data'
        });
    }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, role, kycStatus, search } = req.query;

        const query = {};
        if (role) query.role = role;
        if (kycStatus) query.kycStatus = kycStatus;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password -otp -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Get all campaigns (admin only)
router.get('/campaigns', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category, search } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const campaigns = await Campaign.find(query)
            .populate('creator', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Campaign.countDocuments(query);

        res.json({
            success: true,
            data: {
                campaigns,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get campaigns'
        });
    }
});

// Get all donations (admin only)
router.get('/donations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, paymentStatus, paymentMethod, search } = req.query;

        const query = {};
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (search) {
            query.$or = [
                { donorName: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }

        const donations = await Donation.find(query)
            .populate('campaign', 'title')
            .populate('donor', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Donation.countDocuments(query);

        res.json({
            success: true,
            data: {
                donations,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get donations'
        });
    }
});

// Update user role (admin only)
router.put('/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const { userId } = req.params;

        if (!['admin', 'super_admin', 'user'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                userId: user._id,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has active campaigns
        const activeCampaigns = await Campaign.countDocuments({
            creator: userId,
            status: { $in: ['active', 'pending_review'] }
        });

        if (activeCampaigns > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with active campaigns'
            });
        }

        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Delete campaign (admin only)
router.delete('/campaigns/:campaignId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check if campaign has donations
        const donationCount = await Donation.countDocuments({ campaign: campaignId });
        if (donationCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete campaign with existing donations'
            });
        }

        await Campaign.findByIdAndDelete(campaignId);

        res.json({
            success: true,
            message: 'Campaign deleted successfully'
        });

    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete campaign'
        });
    }
});

// Approve and release funds for a campaign (admin only)
router.post('/campaigns/:campaignId/release-funds', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        if (campaign.status !== 'awaiting_admin_approval') {
            return res.status(400).json({
                success: false,
                message: 'Campaign is not awaiting admin approval.'
            });
        }
        campaign.status = 'completed';
        campaign.fundsReleased = true;
        await campaign.save();
        res.json({
            success: true,
            message: 'Funds released and campaign marked as completed.',
            data: {
                campaignId: campaign._id,
                status: campaign.status,
                fundsReleased: campaign.fundsReleased
            }
        });
    } catch (error) {
        console.error('Admin release funds error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to release funds.'
        });
    }
});

module.exports = router; 