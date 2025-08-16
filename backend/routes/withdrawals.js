const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');
const Withdrawal = require('../models/Withdrawal');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');

// Request withdrawal for non-voting campaign
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { campaignId, amount, reason } = req.body;
        const userId = req.user.userId;
        if (!campaignId || !amount || !reason) {
            return res.status(400).json({ success: false, message: 'Campaign ID, amount, and reason are required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Withdrawal amount must be greater than 0' });
        }
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        if (campaign.creator.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Only campaign creator can request withdrawals' });
        }
        if (!['active', 'completed'].includes(campaign.status)) {
            return res.status(400).json({ success: false, message: 'Withdrawals can only be requested for active or completed campaigns' });
        }

        // Prevent duplicate withdrawal requests for the same campaign (any user), unless all previous are cancelled or rejected
        const existingPending = await Withdrawal.findOne({
            campaign: campaignId,
            status: 'pending'
        });
        if (existingPending) {
            return res.status(400).json({ success: false, message: 'A pending withdrawal request already exists for this campaign.' });
        }
        // If all previous are cancelled or rejected, allow new request
        // Mark milestone as reached
        const withdrawal = new Withdrawal({
            campaign: campaignId,
            requester: userId,
            amount,
            reason,
            isVotingCampaign: !!campaign.isVotingEnabled,
        });
        await withdrawal.save();
        res.status(201).json({ success: true, message: 'Withdrawal request submitted successfully', data: { withdrawal: { id: withdrawal._id, amount: withdrawal.amount, reason: withdrawal.reason, status: withdrawal.status, createdAt: withdrawal.createdAt } } });
    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get user's withdrawal requests
router.get('/my-withdrawals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const withdrawals = await Withdrawal.find({ requester: userId })
            .populate('campaign', 'title currentAmount targetAmount')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: { withdrawals } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Cancel a pending withdrawal request (by campaigner)
router.patch('/cancel/:withdrawalId', authenticateToken, async (req, res) => {
    try {
        const { withdrawalId } = req.params;
        const { cancelReason } = req.body;
        const userId = req.user.userId;
        console.log('withdrawalId:', withdrawalId);
        console.log('userId:', userId);
        const withdrawal = await Withdrawal.findById(withdrawalId);
        console.log('withdrawal:', withdrawal);
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }
        if (withdrawal.requester.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
        }
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });
        }
        withdrawal.status = 'cancelled';
        if (cancelReason) withdrawal.adminNotes = cancelReason;
        await withdrawal.save();
        res.json({ success: true, message: 'Withdrawal request cancelled', data: { withdrawal } });
    } catch (error) {
        console.error('Cancel withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get withdrawals for a specific campaign
router.get('/campaign/:campaignId', authenticateToken, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const withdrawals = await Withdrawal.find({ campaign: campaignId, isVotingCampaign: false });
        res.json({ success: true, data: { withdrawals } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Test route to confirm router is loaded
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Withdrawals router is loaded and working.' });
});

// Export the router
module.exports = router; 