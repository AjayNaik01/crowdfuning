const express = require('express');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const CampaignRefund = require('../models/CampaignRefund');
const Comment = require('../models/Comment');
const { authenticateAdminToken } = require('../middleware/authAdmin');
const { auditAdminAction } = require('../middleware/auditMiddleware');
const { createPayout, createContact, createFundAccount, getPayoutDetails, checkAccountBalance, refundPayment } = require('../utils/paymentService');

const router = express.Router();

// Simple test route to verify admin routes are loaded
router.get('/simple-test', (req, res) => {
    console.log('Simple admin test route called');
    res.json({ success: true, message: 'Simple admin routes are working' });
});

// Test route to create audit logs
router.post('/test-audit', authenticateAdminToken, auditAdminAction('test_action'), (req, res) => {
    res.json({ success: true, message: 'Test audit log created' });
});

// Test route to verify admin routes are loaded
router.get('/test', (req, res) => {
    console.log('Admin test route called');
    res.json({ success: true, message: 'Admin routes are working' });
});

// Test route for withdrawals
router.get('/withdrawals-test', (req, res) => {
    console.log('Admin withdrawals test route called');
    res.json({ success: true, message: 'Admin withdrawals routes are working' });
});

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        // req.admin is set by authenticateAdminToken
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        // No need to check User collection for admin
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Get admin dashboard statistics
router.get('/dashboard', authenticateAdminToken, auditAdminAction('dashboard_access'), async (req, res) => {
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
router.get('/users', authenticateAdminToken, requireAdmin, auditAdminAction('users_view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, role, kycStatus, search, all } = req.query;

        // If 'all' parameter is provided, return all users without pagination
        if (all === 'true') {
            const users = await User.find()
                .select('-password -otp -resetPasswordToken -resetPasswordExpires')
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                data: users
            });
        }

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
router.get('/campaigns', authenticateAdminToken, requireAdmin, auditAdminAction('campaigns_view'), async (req, res) => {
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
router.get('/donations', authenticateAdminToken, requireAdmin, async (req, res) => {
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
router.put('/users/:userId/role', authenticateAdminToken, requireAdmin, async (req, res) => {
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
router.delete('/users/:userId', authenticateAdminToken, requireAdmin, async (req, res) => {
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
router.delete('/campaigns/:campaignId', authenticateAdminToken, requireAdmin, async (req, res) => {
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
router.post('/campaigns/:campaignId/release-funds', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        if (campaign.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Campaign is not completed.'
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

// List all users with any KYC status
router.get('/kyc-requests', authenticateAdminToken, async (req, res) => {
    try {
        const users = await User.find({ kycStatus: { $in: ['NOT_VERIFIED', 'VERIFIED', 'PENDING'] } });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch KYC requests' });
    }
});

// Approve KYC
router.put('/kyc/:userId/approve', authenticateAdminToken, auditAdminAction('kyc_approve'), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { kycStatus: 'VERIFIED' });
        res.json({ success: true, message: 'KYC approved' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to approve KYC' });
    }
});

// Reject KYC
router.put('/kyc/:userId/reject', authenticateAdminToken, auditAdminAction('kyc_reject'), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { kycStatus: 'NOT_VERIFIED' });
        res.json({ success: true, message: 'KYC rejected' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reject KYC' });
    }
});

// Get user KYC data for withdrawal approval
router.get('/users/:userId/kyc', authenticateAdminToken, async (req, res) => {
    try {
        console.log('=== KYC ENDPOINT CALLED ===');
        console.log('Fetching KYC data for user:', req.params.userId);
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);

        const user = await User.findById(req.params.userId);
        if (!user) {
            console.log('User not found:', req.params.userId);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('User found:', {
            userId: user._id,
            name: user.name,
            kycStatus: user.kycStatus,
            kycDataLength: user.kycData ? user.kycData.length : 0
        });

        const latestKyc = user.kycData && user.kycData.length > 0 ? user.kycData[user.kycData.length - 1] : null;

        console.log('Latest KYC data:', latestKyc);

        if (!latestKyc) {
            console.log('No KYC data found');
            return res.status(400).json({
                success: false,
                message: 'No KYC data found for user'
            });
        }

        console.log('KYC data details:', {
            accountNumber: latestKyc.accountNumber,
            ifsc: latestKyc.ifsc,
            name: latestKyc.name,
            phone: latestKyc.phone,
            bankName: latestKyc.bankName,
            status: latestKyc.status
        });

        if (!latestKyc.accountNumber || !latestKyc.ifsc) {
            console.log('Missing bank details:', {
                hasAccountNumber: !!latestKyc.accountNumber,
                hasIfsc: !!latestKyc.ifsc,
                accountNumber: latestKyc.accountNumber,
                ifsc: latestKyc.ifsc
            });
            return res.status(400).json({
                success: false,
                message: 'User must complete KYC with bank account details'
            });
        }

        const responseData = {
            accountNumber: latestKyc.accountNumber,
            ifsc: latestKyc.ifsc,
            name: latestKyc.name || user.name,
            phone: latestKyc.phone || user.phone,
            bankName: latestKyc.bankName || '',
            kycStatus: user.kycStatus
        };

        console.log('Returning KYC data:', responseData);

        res.json({
            success: true,
            data: responseData
        });
    } catch (err) {
        console.error('Get user KYC error:', err);
        res.status(500).json({ success: false, message: 'Failed to get user KYC data' });
    }
});

// List all campaigns
router.get('/campaigns', authenticateAdminToken, auditAdminAction('campaigns_list'), async (req, res) => {
    try {
        const campaigns = await Campaign.find().populate('creator', 'name email');
        res.json({ success: true, campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
    }
});

// Approve campaign
router.put('/campaigns/:id/approve', authenticateAdminToken, auditAdminAction('campaign_approve'), async (req, res) => {
    try {
        await Campaign.findByIdAndUpdate(req.params.id, { status: 'active' });
        res.json({ success: true, message: 'Campaign approved' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to approve campaign' });
    }
});

// Reject campaign
router.put('/campaigns/:id/reject', authenticateAdminToken, auditAdminAction('campaign_reject'), async (req, res) => {
    try {
        await Campaign.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        res.json({ success: true, message: 'Campaign rejected' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reject campaign' });
    }
});

// Refactored route: Get all users with optional status filter
router.get('/kyc-users', authenticateAdminToken, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.kycStatus = status;
        }
        const users = await User.find(query);
        const kycUsers = users.map(user => {
            const latestKyc = user.kycData && user.kycData.length > 0 ? user.kycData[user.kycData.length - 1] : {};
            return {
                _id: user._id,
                kycStatus: user.kycStatus,
                name: user.name,
                idType: latestKyc.idType || '',
                kycName: latestKyc.name || '',
                dob: latestKyc.dob || '',
                gender: latestKyc.gender || '',
                aadhaar_number: latestKyc.aadhaar_number || '',
                father_name: latestKyc.father_name || '',
                pan_number: latestKyc.pan_number || '',
                idCardImage: latestKyc.idCardImage || '',
                faceImage: latestKyc.faceImage || '',
                verifiedAt: latestKyc.verifiedAt || '',
                status: latestKyc.status || '',
                verificationResult: latestKyc.verificationResult || ''
            };
        });
        res.json({ success: true, users: kycUsers });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch KYC users' });
    }
});

// Filter campaigns by status (admin)
router.get('/campaigns/pending_review', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const campaigns = await Campaign.find({ status: 'pending_review' })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: { campaigns } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get pending review campaigns' });
    }
});

router.get('/campaigns/active', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const campaigns = await Campaign.find({ status: 'active' })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: { campaigns } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get active campaigns' });
    }
});

router.get('/campaigns/completed', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const campaigns = await Campaign.find({ status: 'completed' })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: { campaigns } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get completed campaigns' });
    }
});

router.get('/campaigns/rejected', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const campaigns = await Campaign.find({ status: 'rejected' })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: { campaigns } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get rejected campaigns' });
    }
});

// 1. List all rejected withdrawals (for Refunds page)
router.get('/refunds/withdrawals/rejected', authenticateAdminToken, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ status: 'rejected' })
            .populate('campaign', 'title creator')
            .populate('requester', 'name email')
            .populate('adminApprovedBy', 'email name');
        res.json({ success: true, data: withdrawals });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch rejected withdrawals' });
    }
});

// 2. Initiate a campaign refund batch for a rejected withdrawal
router.post('/refunds/withdrawals/:withdrawalId/initiate', authenticateAdminToken, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.withdrawalId).populate('campaign');
        if (!withdrawal || withdrawal.status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Withdrawal not found or not rejected' });
        }
        // Prevent duplicate refund batch
        const existing = await CampaignRefund.findOne({ withdrawal: withdrawal._id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Refund batch already exists for this withdrawal' });
        }
        // Gather all completed donations for this campaign
        const donations = await Donation.find({ campaign: withdrawal.campaign._id, paymentStatus: 'completed' });
        const refundDetails = donations.map(d => ({
            donor: d.donor,
            donation: d._id,
            amount: d.amount,
            status: 'pending'
        }));
        const batch = await CampaignRefund.create({
            campaign: withdrawal.campaign._id,
            withdrawal: withdrawal._id,
            refundDetails
        });
        res.json({ success: true, data: batch });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to initiate refund batch' });
    }
});

// 3. Get refund batch status/details (for live progress)
router.get('/refunds/batch/:batchId', authenticateAdminToken, async (req, res) => {
    try {
        const batch = await CampaignRefund.findById(req.params.batchId)
            .populate('campaign', 'title')
            .populate('withdrawal')
            .populate('refundDetails.donor', 'name email')
            .populate('refundDetails.donation');
        if (!batch) return res.status(404).json({ success: false, message: 'Refund batch not found' });
        res.json({ success: true, data: batch });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch refund batch' });
    }
});

// 3.5. Get refund batch by withdrawal ID
router.get('/refunds/withdrawals/:withdrawalId/batch', authenticateAdminToken, async (req, res) => {
    try {
        const batch = await CampaignRefund.findOne({ withdrawal: req.params.withdrawalId })
            .populate('campaign', 'title')
            .populate('withdrawal')
            .populate('refundDetails.donor', 'name email')
            .populate('refundDetails.donation');
        if (!batch) return res.status(404).json({ success: false, message: 'Refund batch not found for this withdrawal' });
        res.json({ success: true, data: batch });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch refund batch' });
    }
});

// 4. Process refunds for a batch (admin triggers this)
router.post('/refunds/batch/:batchId/process', authenticateAdminToken, async (req, res) => {
    try {
        console.log('Processing refund batch:', req.params.batchId);
        const batch = await CampaignRefund.findById(req.params.batchId).populate('refundDetails.donation').populate('campaign');
        if (!batch) return res.status(404).json({ success: false, message: 'Refund batch not found' });
        if (batch.status !== 'pending' && batch.status !== 'partial') {
            return res.status(400).json({ success: false, message: 'Refund batch already processed or in progress' });
        }
        console.log('Batch found, starting processing...');
        batch.status = 'processing';
        await batch.save();
        let success = 0, failed = 0;
        console.log(`Processing ${batch.refundDetails.length} refunds...`);
        for (let detail of batch.refundDetails) {
            if (detail.status === 'refunded') {
                console.log('Skipping already refunded donation');
                continue;
            }
            console.log('Processing donation:', detail.donation);
            const donation = await Donation.findById(detail.donation);
            if (!donation || !donation.paymentId) {
                console.log('No valid paymentId for donation:', detail.donation);
                detail.status = 'failed';
                detail.error = 'No valid paymentId';
                failed++;
                continue;
            }
            console.log('Attempting Razorpay refund for paymentId:', donation.paymentId);
            // Attempt refund via Razorpay with timeout
            const result = await Promise.race([
                refundPayment(donation.paymentId, donation.amount, 'Campaign refund'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Refund timeout after 30 seconds')), 30000)
                )
            ]);
            if (result.success) {
                detail.status = 'refunded';
                detail.error = '';
                donation.paymentStatus = 'refunded';
                await donation.save();
                // Notify donor
                await Notification.create({
                    user: detail.donor,
                    type: 'donation',
                    message: `Your donation to campaign '${batch.campaign.title}' has been refunded.`,
                    campaign: batch.campaign._id
                });
                success++;
            } else {
                console.log('Refund failed:', result.error);
                detail.status = 'failed';
                detail.error = result.error;
                failed++;
            }
            detail.processedAt = new Date();
        }
        // Update batch status
        if (success === batch.refundDetails.length) {
            batch.status = 'completed';
        } else if (success > 0) {
            batch.status = 'partial';
        } else {
            batch.status = 'failed';
        }
        batch.processedAt = new Date();
        await batch.save();
        res.json({ success: true, data: batch });
    } catch (err) {
        console.error('Refund processing error:', err);
        res.status(500).json({ success: false, message: 'Failed to process refund batch', error: err.message });
    }
});

// Approve a withdrawal (admin)
router.put('/withdrawals/:id/approve', authenticateAdminToken, auditAdminAction('withdrawal_approve'), async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id).populate('campaign');
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending withdrawals can be approved' });
        }
        // Optionally: payout logic here
        withdrawal.status = 'approved';
        withdrawal.adminApprovedAt = new Date();
        await withdrawal.save();
        res.json({ success: true, message: 'Withdrawal approved', data: withdrawal });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to approve withdrawal' });
    }
});

// Reject a withdrawal (admin)
router.put('/withdrawals/:id/reject', authenticateAdminToken, auditAdminAction('withdrawal_reject'), async (req, res) => {
    console.log('Reject route hit for ID:', req.params.id);
    const withdrawal = await Withdrawal.findById(req.params.id);
    console.log('Withdrawal found:', withdrawal);
    try {
        const { rejectionReason } = req.body;
        if (!withdrawal) {
            console.log('Withdrawal not found for ID:', req.params.id);
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }
        if (withdrawal.status !== 'pending') {
            console.log('Withdrawal not pending, status:', withdrawal.status);
            return res.status(400).json({ success: false, message: 'Only pending withdrawals can be rejected' });
        }
        withdrawal.status = 'rejected';
        withdrawal.rejectionReason = rejectionReason;
        withdrawal.adminApprovedAt = new Date();
        if (req.admin && req.admin._id) {
            withdrawal.adminApprovedBy = req.admin._id;
        }
        await withdrawal.save();

        // --- Notification logic ---
        // Fetch campaign and creator
        const campaign = await Campaign.findById(withdrawal.campaign);
        if (!campaign) {
            console.warn('Notification: Campaign not found for withdrawal:', withdrawal.campaign);
        }
        const creator = campaign ? await User.findById(campaign.creator) : null;
        if (!creator) {
            console.warn('Notification: Creator not found for campaign:', campaign ? campaign._id : null);
        }
        if (creator && campaign) {
            const Notification = require('../models/Notification');
            const message = `Your withdrawal request for campaign "${campaign.title}" (Amount: ₹${withdrawal.amount}) was rejected. Reason: "${rejectionReason}". Date: ${new Date().toLocaleDateString('en-IN')}`;
            const notificationObj = {
                user: creator._id,
                type: 'admin',
                message,
                recipient: creator.email,
                campaign: campaign._id
            };
            console.log('Creating notification:', notificationObj);
            try {
                await Notification.create(notificationObj);
                console.log('Notification created successfully');
            } catch (notifErr) {
                console.error('Failed to create notification:', notifErr);
            }
            // Optionally, send email
            try {
                const emailService = require('../utils/emailService');
                await emailService.sendEmail(
                    creator.email,
                    'Withdrawal Request Rejected',
                    `<p>Your withdrawal request for campaign <b>${campaign.title}</b> (Amount: ₹${withdrawal.amount}) was <b>rejected</b> by the admin.</p><p><b>Reason:</b> ${rejectionReason}</p><p><b>Date:</b> ${new Date().toLocaleDateString('en-IN')}</p><p>Please review your withdrawal details or contact support for more information.</p>`
                );
                console.log('Rejection email sent to:', creator.email);
            } catch (emailErr) {
                console.error('Failed to send withdrawal rejection email:', emailErr);
            }
        }
        // --- End notification logic ---

        res.json({ success: true, message: 'Withdrawal rejected', data: withdrawal });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reject withdrawal' });
    }
});

// Update: Get all withdrawals (admin) with full campaign info and voting details
router.get('/withdrawals', authenticateAdminToken, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find()
            .populate({
                path: 'campaign',
                select: 'title creator proofDocuments isVotingEnabled voteResults votes',
                populate: [
                    { path: 'creator', select: 'name email' },
                    { path: 'votes.voter', select: 'name email' }
                ]
            })
            .populate('requester', 'name email');
        // Ensure voteResults is always present
        withdrawals.forEach(w => {
            const c = w.campaign;
            if (c && (!c.voteResults || typeof c.voteResults.approveCount !== 'number')) {
                const votes = c.votes || [];
                const approveCount = votes.filter(v => v.vote === 'approve').length;
                const rejectCount = votes.filter(v => v.vote === 'reject').length;
                c.voteResults = {
                    approveCount,
                    rejectCount,
                    totalVotes: votes.length
                };
            }
        });
        res.json({ success: true, data: withdrawals });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
    }
});

// Admin: Get all documents for a campaign, plus voting details
router.get('/campaigns/:campaignId/documents', authenticateAdminToken, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.campaignId)
            .populate('creator', 'name email')
            .populate('votes.voter', 'name email');
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        const documents = campaign.proofDocuments || [];
        res.json({
            success: true,
            data: {
                campaign: {
                    _id: campaign._id,
                    title: campaign.title,
                    category: campaign.category,
                    location: campaign.location,
                    targetAmount: campaign.targetAmount,
                    currentAmount: campaign.currentAmount,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    isOrganization: campaign.isOrganization,
                    organizationName: campaign.organizationName,
                    organizationDetails: campaign.organizationDetails,
                    description: campaign.description,
                    isVotingEnabled: campaign.isVotingEnabled,
                    voteResults: campaign.voteResults,
                    votes: campaign.votes,
                    images: campaign.images || [],
                    videos: campaign.videos || [],
                },
                documents,
                images: campaign.images || [],
                videos: campaign.videos || [],
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch campaign documents' });
    }
});

// Get all comments (admin only, with optional search)
router.get('/comments', authenticateAdminToken, async (req, res) => {
    try {
        const { campaignId, userName, text, startDate, endDate, page = 1, limit = 50 } = req.query;
        const query = {};
        if (campaignId) query.campaignId = campaignId;
        if (userName) query.userName = { $regex: userName, $options: 'i' };
        if (text) query.text = { $regex: text, $options: 'i' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        const comments = await Comment.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('campaignId', 'title')
            .exec();
        const total = await Comment.countDocuments(query);
        res.json({ success: true, data: { comments, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
});

// Delete a comment (admin only)
router.delete('/comments/:commentId', authenticateAdminToken, auditAdminAction('comment_delete'), async (req, res) => {
    try {
        const { commentId } = req.params;
        await Comment.findByIdAndDelete(commentId);
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
});

// Send notification (admin)
router.post('/notifications', authenticateAdminToken, auditAdminAction('notification_send'), async (req, res) => {
    try {
        const { recipientType, userId, userEmail, campaignId, message } = req.body;
        let recipients = [];
        let recipientLabel = '';

        if (!message || !recipientType) {
            return res.status(400).json({ success: false, message: 'Message and recipientType are required' });
        }

        if (recipientType === 'all') {
            recipients = await User.find({}, '_id email');
            recipientLabel = 'All';
        } else if (recipientType === 'user') {
            let user;
            if (userId) {
                user = await User.findById(userId);
            } else if (userEmail) {
                user = await User.findOne({ email: userEmail });
            }
            if (user) {
                recipients = [user];
                recipientLabel = user.email || user._id.toString();
            }
        } else if (recipientType === 'campaignDonors') {
            if (!campaignId) {
                return res.status(400).json({ success: false, message: 'campaignId is required for campaignDonors' });
            }
            const donations = await Donation.find({ campaign: campaignId }).distinct('user');
            recipients = await User.find({ _id: { $in: donations } }, '_id email');
            recipientLabel = `Donors: ${campaignId}`;
            // If no donors found, fallback to all users
            if (!recipients.length) {
                recipients = await User.find({}, '_id email');
                recipientLabel = 'All (fallback from campaign donors)';
            }
        }

        const notifications = recipients.map(user => ({
            user: user._id,
            type: 'admin',
            message,
            recipient: recipientType === 'all' ? 'All' : (recipientType === 'user' ? (user.email || user._id.toString()) : recipientLabel),
        }));

        await Notification.insertMany(notifications);

        res.json({ success: true, message: 'Notification(s) sent' });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
});

// Get all notifications (admin)
router.get('/notifications', authenticateAdminToken, async (req, res) => {
    try {
        const page = Number.isNaN(parseInt(req.query.page)) ? 1 : parseInt(req.query.page);
        const limit = Number.isNaN(parseInt(req.query.limit)) ? 20 : parseInt(req.query.limit);
        const skip = (page - 1) * limit;
        // Fetch all notifications (no type filter)
        const total = await Notification.countDocuments();
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'email');
        res.json({ success: true, data: { notifications, total, totalPages: Math.ceil(total / limit), currentPage: page } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});



// Admin management endpoints (super_admin only)
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

// Check if current admin is super_admin
const requireSuperAdmin = async (req, res, next) => {
    try {
        if (!req.admin || req.admin.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super admin privileges required.'
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

// Get all admins (super_admin only)
router.get('/admins', authenticateAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const admins = await Admin.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: admins
        });

    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admins'
        });
    }
});

// Create new admin (super_admin only)
router.post('/admins', authenticateAdminToken, requireSuperAdmin, auditAdminAction('admin_create'), async (req, res) => {
    try {
        const { name, email, role } = req.body;

        // Validate required fields
        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and role are required'
            });
        }

        // Validate role
        const validRoles = ['admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be admin or super_admin'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        // Generate random password (more secure)
        const generatePassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 12; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log('=== ADMIN CREATION DEBUG ===');
        console.log('Generated password:', password);
        console.log('Password length:', password.length);
        console.log('Hashed password (first 20 chars):', hashedPassword.substring(0, 20) + '...');
        console.log('Creating admin with:', { name, email, role });

        // Create new admin
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword,
            role
        });

        await newAdmin.save();
        console.log('Admin created successfully:', { id: newAdmin._id, email: newAdmin.email });

        // Test password verification
        const testMatch = await bcrypt.compare(password, hashedPassword);
        console.log('Password verification test:', testMatch);
        console.log('=== END ADMIN CREATION DEBUG ===');

        // Send credentials via email
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #1f2937; margin: 0;">Admin Account Created</h2>
                    <p style="color: #6b7280; margin: 8px 0 0 0;">Crowdfunding Platform</p>
                </div>
                
                <div style="background: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
                    <p style="color: #374151; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
                    <p style="color: #374151; margin: 0 0 16px 0;">Your admin account has been successfully created on our crowdfunding platform.</p>
                    
                    <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 16px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">Login Credentials</h3>
                        <p style="color: #374151; margin: 4px 0;"><strong>Email:</strong> ${email}</p>
                        <p style="color: #374151; margin: 4px 0;"><strong>Password:</strong> ${password}</p>
                        <p style="color: #374151; margin: 4px 0;"><strong>Role:</strong> ${role}</p>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin: 16px 0;">
                        <p style="color: #92400e; margin: 0; font-size: 14px;">
                            <strong>Important:</strong> Please change your password after your first login for security purposes.
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px;">
                    <p style="margin: 0;">Best regards,<br><strong>Platform Team</strong></p>
                    <p style="margin: 8px 0 0 0;">Crowdfunding Platform</p>
                </div>
            </div>
        `;

        try {
            await emailService.sendEmail(email, 'Admin Account Created', emailContent);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue even if email fails
        }

        res.json({
            success: true,
            message: 'Admin created successfully. Credentials sent to email.',
            data: {
                _id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin'
        });
    }
});

// Toggle admin status (super_admin only)
router.put('/admins/:adminId/toggle-status', authenticateAdminToken, requireSuperAdmin, auditAdminAction('admin_toggle_status'), async (req, res) => {
    try {
        const { adminId } = req.params;
        const { isActive } = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Prevent deactivating super admin
        if (admin.role === 'super_admin' && !isActive) {
            return res.status(403).json({
                success: false,
                message: 'Cannot deactivate super admin'
            });
        }

        admin.isActive = isActive;
        await admin.save();

        res.json({
            success: true,
            message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive
            }
        });

    } catch (error) {
        console.error('Toggle admin status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update admin status'
        });
    }
});

// Delete admin (super_admin only)
router.delete('/admins/:adminId', authenticateAdminToken, requireSuperAdmin, auditAdminAction('admin_delete'), async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Prevent deleting super admin
        if (admin.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete super admin'
            });
        }

        await Admin.findByIdAndDelete(adminId);

        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete admin'
        });
    }
});

// Notify campaign creator about proof document status
router.post('/campaigns/:id/notify', authenticateAdminToken, requireAdmin, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            console.log('Campaign not found:', req.params.id);
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        const isVoting = campaign.isVotingEnabled;
        const message = isVoting
            ? 'The campaigner has uploaded proof documents for public review. You can now participate in the review process.'
            : 'The campaigner has uploaded proof documents for admin verification. Thank you for your support!';
        const type = isVoting ? 'voting_document' : 'campaign';
        // Notify only the campaign creator
        const notification = {
            user: campaign.creator,
            type,
            message,
            campaign: campaign._id
        };
        await Notification.create(notification);
        console.log(`Notification sent to campaign creator ${campaign.creator} for campaign ${campaign._id}`);
        res.json({ success: true, message: 'Notification sent to campaign creator.' });
    } catch (err) {
        console.error('Notify campaign creator error:', err);
        res.status(500).json({ success: false, message: 'Failed to send notification', error: err.message });
    }
});

module.exports = router; 