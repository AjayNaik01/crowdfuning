const express = require('express');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const router = express.Router();

// GET /api/statistics - Public route for landing page statistics
router.get('/', async (req, res) => {
    try {
        // Total amount raised (sum of all completed donations)
        const totalAmountResult = await Donation.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAmountRaised = totalAmountResult[0]?.total || 0;

        // Total number of unique donors (users who donated at least once)
        const donorIds = await Donation.distinct('donor', { paymentStatus: 'completed' });
        const totalDonors = donorIds.length;

        // Total number of campaigns
        const totalCampaigns = await Campaign.countDocuments();

        // Total number of countries (from campaigns' country field, fallback to users if not present)
        // Try to get unique countries from campaigns first
        let countries = await Campaign.distinct('country');
        if (!countries || countries.length === 0) {
            // Fallback: get from users
            countries = await User.distinct('country');
        }
        // Filter out empty/null/undefined
        const uniqueCountries = countries.filter(Boolean);
        const totalCountries = uniqueCountries.length;

        res.json({
            success: true,
            data: {
                totalAmountRaised,
                totalDonors,
                totalCampaigns,
                totalCountries
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

module.exports = router; 