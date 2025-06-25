const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Campaign = require('../models/Campaign');
const { authenticateToken } = require('../middleware/auth');

// Submit a report for a campaign (authenticated users)
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const { campaignId, reason } = req.body;

        // Validate required fields
        if (!campaignId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Campaign ID and reason are required'
            });
        }

        // Check if campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Create the report
        const report = new Report({
            campaignId,
            reporterId: req.user.userId,
            reporterName: req.user.name,
            reason: reason.trim()
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: {
                report: {
                    id: report._id,
                    campaignId: report.campaignId,
                    reason: report.reason,
                    status: report.status,
                    createdAt: report.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
});

// Submit an anonymous report for a campaign
router.post('/submit-anonymous', async (req, res) => {
    try {
        const { campaignId, reason } = req.body;

        // Validate required fields
        if (!campaignId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Campaign ID and reason are required'
            });
        }

        // Check if campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Create the report
        const report = new Report({
            campaignId,
            reporterId: null,
            reporterName: 'Anonymous',
            reason: reason.trim()
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: {
                report: {
                    id: report._id,
                    campaignId: report.campaignId,
                    reason: report.reason,
                    status: report.status,
                    createdAt: report.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
});

// Get reports for a campaign (admin only)
router.get('/campaign/:campaignId', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { campaignId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        const query = { campaignId };
        if (status) {
            query.status = status;
        }

        const reports = await Report.find(query)
            .populate('reporterId', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            data: {
                reports,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Get all reports (admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { page = 1, limit = 10, status } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const reports = await Report.find(query)
            .populate('campaignId', 'title creator')
            .populate('reporterId', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            data: {
                reports,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Update report status (admin only)
router.patch('/:reportId', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { reportId } = req.params;
        const { status, adminNotes } = req.body;

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Update report
        report.status = status || report.status;
        report.adminNotes = adminNotes || report.adminNotes;
        report.reviewedBy = req.user.userId;
        report.reviewedAt = new Date();

        await report.save();

        res.json({
            success: true,
            message: 'Report updated successfully',
            data: {
                report: {
                    id: report._id,
                    status: report.status,
                    adminNotes: report.adminNotes,
                    reviewedBy: report.reviewedBy,
                    reviewedAt: report.reviewedAt
                }
            }
        });

    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report'
        });
    }
});

module.exports = router; 