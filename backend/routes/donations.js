const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Make a donation
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
        // If goal reached or exceeded, set status to awaiting_admin_approval
        if (campaign.currentAmount >= campaign.targetAmount && campaign.status === 'active') {
            campaign.status = 'awaiting_admin_approval';
        }
        await campaign.save();

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

// Get user's donations (authenticated)
router.get('/user/my-donations', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const donations = await Donation.find({
            donor: req.user.userId,
            paymentStatus: 'completed'
        })
            .populate('campaign', 'title category')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Donation.countDocuments({
            donor: req.user.userId,
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
        console.error('Get user donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get your donations'
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