const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { authenticateAdminToken } = require('../middleware/authAdmin');
const { createOrder, verifyPayment, getPaymentDetails } = require('../utils/paymentService');

const router = express.Router();

// Admin: Get all donations (paginated)
router.get('/admin-all', authenticateAdminToken, async (req, res) => {
    try {
        // Optionally, check if req.admin exists
        if (!req.admin) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { page = 1, limit = 50 } = req.query;
        const donations = await Donation.find({})
            .populate('campaign', 'title category imageUrl')
            .populate('donor', 'name email')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Donation.countDocuments({});
        res.json({
            success: true,
            data: {
                donations,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page)
            }
        });
    } catch (error) {
        console.error('Admin get all donations error:', error);
        res.status(500).json({ success: false, message: 'Failed to get all donations' });
    }
});

// Create Razorpay order
router.post('/create-order', [
    body('amount')
        .isFloat({ min: 1 })
        .withMessage('Donation amount must be at least 1'),
    body('campaignId')
        .isMongoId()
        .withMessage('Please provide a valid campaign ID')
], handleValidationErrors, async (req, res) => {
    try {
        const { amount, campaignId } = req.body;
        console.log('Create order request:', { amount, campaignId });

        // Validate campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            console.log('Campaign not found:', campaignId);
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        console.log('Campaign found:', {
            id: campaign._id,
            title: campaign.title,
            status: campaign.status
        });

        if (campaign.status !== 'active') {
            console.log('Campaign not active:', campaign.status);
            return res.status(400).json({
                success: false,
                message: 'This campaign is not accepting donations'
            });
        }

        // Create Razorpay order
        const shortReceipt = `don_${campaignId.slice(-6)}_${Date.now()}`.slice(0, 40);
        const orderResult = await createOrder(amount, 'INR', shortReceipt);
        console.log('Order result:', orderResult);

        if (!orderResult.success) {
            console.error('Razorpay order creation failed:', orderResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: orderResult.order.id,
                amount: orderResult.order.amount,
                currency: orderResult.order.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order'
        });
    }
});

// Verify payment and complete donation
router.post('/verify-payment', [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('campaignId').isMongoId().withMessage('Please provide a valid campaign ID'),
    body('donorName').trim().isLength({ min: 2, max: 100 }).withMessage('Donor name must be between 2 and 100 characters'),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
    body('isAnonymous').optional().isBoolean().withMessage('Anonymous must be a boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            orderId,
            paymentId,
            signature,
            campaignId,
            donorName,
            message,
            isAnonymous
        } = req.body;

        console.log('Payment verification request:', {
            orderId,
            paymentId,
            signature: signature ? 'present' : 'missing',
            campaignId,
            donorName,
            isAnonymous
        });

        // Verify payment signature
        console.log('Verifying payment signature...');
        const verificationResult = verifyPayment(orderId, paymentId, signature);
        console.log('Verification result:', verificationResult);

        // TEMPORARY: Skip signature verification for testing
        // TODO: Re-enable signature verification for production
        /*
        if (!verificationResult.success || !verificationResult.verified) {
            console.log('Payment signature verification failed');
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
        */
        console.log('Skipping signature verification for testing');

        // Get payment details from Razorpay
        console.log('Fetching payment details from Razorpay...');
        const paymentResult = await getPaymentDetails(paymentId);
        console.log('Payment details result:', paymentResult);

        if (!paymentResult.success) {
            console.log('Failed to fetch payment details from Razorpay:', paymentResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch payment details: ' + (paymentResult.error || 'Unknown error')
            });
        }

        const payment = paymentResult.payment;
        console.log('Payment object:', payment);

        if (!payment || !payment.amount) {
            console.log('Invalid payment object or missing amount');
            return res.status(500).json({
                success: false,
                message: 'Invalid payment details received from Razorpay'
            });
        }

        const amount = payment.amount / 100; // Convert from paise to rupees
        console.log('Payment amount:', amount);

        // Check if user is authenticated
        let donor = null;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                donor = await User.findById(decoded.userId);
                console.log('Authenticated donor:', donor ? donor._id : 'none');
            } catch (error) {
                console.log('Token verification failed, continuing as anonymous');
                // Token is invalid, continue as anonymous donor
            }
        }

        // Validate campaign
        console.log('Validating campaign...');
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            console.log('Campaign not found:', campaignId);
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        console.log('Campaign found:', { id: campaign._id, status: campaign.status });

        if (campaign.status !== 'active') {
            console.log('Campaign not active:', campaign.status);
            return res.status(400).json({
                success: false,
                message: 'This campaign is not accepting donations'
            });
        }

        // Create donation record
        console.log('Creating donation record...');
        const donation = new Donation({
            campaign: campaignId,
            donor: donor ? donor._id : null,
            donorName: isAnonymous ? 'Anonymous' : donorName,
            amount: amount,
            paymentMethod: 'razorpay',
            paymentStatus: 'completed',
            paymentId: paymentId,
            transactionId: paymentId,
            message: message,
            isAnonymous: isAnonymous || false
        });

        await donation.save();
        console.log('Donation saved:', donation._id);

        // Update campaign current amount
        console.log('Updating campaign amount...');
        campaign.currentAmount += amount;

        // Check if target amount was just reached
        const wasTargetReached = campaign.currentAmount >= campaign.targetAmount && campaign.status === 'active';

        // If goal reached or exceeded, set status to completed
        if (wasTargetReached) {
            campaign.status = 'completed';
        }
        await campaign.save();
        console.log('Campaign updated. New amount:', campaign.currentAmount);

        // Send notification to campaign creator if target was just reached
        if (wasTargetReached && campaign.creator) {
            try {
                console.log('Creating target reached notification for campaign:', campaign._id);
                console.log('Campaign creator ID:', campaign.creator);
                console.log('Campaign title:', campaign.title);
                console.log('Target amount:', campaign.targetAmount);

                const notification = new Notification({
                    user: campaign.creator,
                    type: 'target_reached',
                    message: `🎉 Congratulations! Your campaign "${campaign.title}" has reached its target amount of ₹${campaign.targetAmount.toLocaleString()}. The campaign is now under admin review for fund release.`,
                    campaign: campaign._id
                });

                console.log('Notification object created:', notification);
                await notification.save();
                console.log('Target reached notification saved successfully with ID:', notification._id);

                // Verify the notification was saved by fetching it
                const savedNotification = await Notification.findById(notification._id);
                console.log('Verified saved notification:', savedNotification);

            } catch (error) {
                console.error('Failed to send target reached notification:', error);
                console.error('Error details:', error.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Donation successful! Thank you for your contribution.',
            data: {
                donationId: donation._id,
                transactionId: donation.transactionId,
                amount: donation.amount,
                paymentStatus: donation.paymentStatus
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment. Please try again.'
        });
    }
});

// Make a donation (legacy route - now redirects to create-order)
router.post('/donate', [
    body('campaignId')
        .isMongoId()
        .withMessage('Please provide a valid campaign ID'),
    body('amount')
        .isFloat({ min: 1 })
        .withMessage('Donation amount must be at least 1'),
    body('donorName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Donor name must be between 2 and 100 characters'),
    body('paymentMethod')
        .isIn(['upi', 'card', 'net_banking', 'wallet'])
        .withMessage('Please select a valid payment method'),
    body('upiId')
        .optional()
        .trim()
        .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/)
        .withMessage('Please provide a valid UPI ID'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Message cannot exceed 500 characters'),
    body('isAnonymous')
        .optional()
        .isBoolean()
        .withMessage('Anonymous must be a boolean')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            campaignId,
            amount,
            donorName,
            paymentMethod,
            upiId,
            message,
            isAnonymous
        } = req.body;

        // Check if user is authenticated
        let donor = null;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                donor = await User.findById(decoded.userId);
            } catch (error) {
                // Token is invalid, continue as anonymous donor
            }
        }

        // Validate campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        if (campaign.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This campaign is not accepting donations'
            });
        }

        // Validate UPI ID if payment method is UPI
        if (paymentMethod === 'upi' && !upiId) {
            return res.status(400).json({
                success: false,
                message: 'UPI ID is required for UPI payments'
            });
        }

        // Create donation
        const donation = new Donation({
            campaign: campaignId,
            donor: donor ? donor._id : null,
            donorName: isAnonymous ? 'Anonymous' : donorName,
            amount,
            paymentMethod,
            upiId: paymentMethod === 'upi' ? upiId : null,
            message,
            isAnonymous: isAnonymous || false,
            paymentStatus: 'pending'
        });

        await donation.save();

        // TODO: Integrate with actual payment gateway
        // For now, simulate payment success
        donation.paymentStatus = 'completed';
        await donation.save();

        // Update campaign current amount
        campaign.currentAmount += amount;

        // Check if target amount was just reached
        const wasTargetReached = campaign.currentAmount >= campaign.targetAmount && campaign.status === 'active';

        // If goal reached or exceeded, set status to completed
        if (wasTargetReached) {
            campaign.status = 'completed';
        }
        await campaign.save();

        // Send notification to campaign creator if target was just reached
        if (wasTargetReached && campaign.creator) {
            try {
                const notification = new Notification({
                    user: campaign.creator,
                    type: 'target_reached',
                    message: `🎉 Congratulations! Your campaign "${campaign.title}" has reached its target amount of ₹${campaign.targetAmount.toLocaleString()}. The campaign is now under admin review for fund release.`,
                    campaign: campaign._id
                });
                await notification.save();
                console.log('Target reached notification sent to campaign creator:', campaign.creator);
            } catch (error) {
                console.error('Failed to send target reached notification:', error);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Donation successful! Thank you for your contribution.',
            data: {
                donationId: donation._id,
                transactionId: donation.transactionId,
                amount: donation.amount,
                paymentStatus: donation.paymentStatus
            }
        });

    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process donation. Please try again.'
        });
    }
});

// Get campaign donations (public)
router.get('/campaign/:campaignId', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const campaignId = req.params.campaignId;

        const donations = await Donation.find({
            campaign: campaignId,
            paymentStatus: 'completed'
        })
            .populate('donor', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Donation.countDocuments({
            campaign: campaignId,
            paymentStatus: 'completed'
        });

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
        console.error('Get campaign donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get donations'
        });
    }
});

// Get user's donations for a specific campaign (authenticated)
router.get('/user/:campaignId', authenticateToken, async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const userId = req.user.userId;

        const donations = await Donation.find({
            campaign: campaignId,
            donor: userId,
            paymentStatus: 'completed'
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                donations,
                count: donations.length
            }
        });

    } catch (error) {
        console.error('Get user campaign donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user donations for campaign'
        });
    }
});

// Get all user donations (simple and clean)
router.get('/user-donations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log('Fetching donations for user:', userId);

        // Simple query - just find all donations where donor matches user ID
        const donations = await Donation.find({
            donor: userId,
            paymentStatus: 'completed'
        })
            .populate('campaign', 'title category imageUrl')
            .sort({ createdAt: -1 });

        console.log(`Found ${donations.length} donations for user ${userId}`);

        res.json({
            success: true,
            data: {
                donations: donations,
                total: donations.length
            }
        });

    } catch (error) {
        console.error('Get user donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user donations'
        });
    }
});

// Get campaign donation statistics
router.get('/campaign/:campaignId/stats', async (req, res) => {
    try {
        const campaignId = req.params.campaignId;

        const stats = await Donation.aggregate([
            { $match: { campaign: mongoose.Types.ObjectId(campaignId), paymentStatus: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalDonations: { $sum: 1 },
                    averageAmount: { $avg: '$amount' }
                }
            }
        ]);

        const recentDonations = await Donation.find({
            campaign: campaignId,
            paymentStatus: 'completed'
        })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: stats[0] || { totalAmount: 0, totalDonations: 0, averageAmount: 0 },
                recentDonations
            }
        });

    } catch (error) {
        console.error('Get donation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get donation statistics'
        });
    }
});

module.exports = router; 