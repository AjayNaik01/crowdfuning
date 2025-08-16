const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { authenticateAdminToken } = require('../middleware/authAdmin');

// Submit a report for a campaign (authenticated users)
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
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
router.get('/campaign/:campaignId', authenticateAdminToken, async (req, res) => {
    try {
        // Check if admin is authenticated
        if (!req.admin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
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
router.get('/', authenticateAdminToken, async (req, res) => {
    try {
        // Check if admin is authenticated
        if (!req.admin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        const { page = 1, limit = 10, status } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        const reports = await Report.find(query)
            .populate('campaignId', 'title category creator')
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

// Test route to update report without notifications (for debugging)
router.patch('/:reportId/test', authenticateAdminToken, async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { reportId } = req.params;
        const { status, adminNotes } = req.body;

        console.log('=== TEST REPORT UPDATE ===');
        console.log('Report ID:', reportId);
        console.log('Status:', status);
        console.log('Admin Notes:', adminNotes);

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Update report
        let dbStatus;
        if (status === 'rejected' || status === 'dismissed') {
            dbStatus = 'dismissed';
        } else if (status === 'resolved') {
            dbStatus = 'resolved';
        } else {
            dbStatus = status || report.status;
        }

        console.log('Test route - Status mapping:', { original: status, mapped: dbStatus });
        report.status = dbStatus;
        report.adminNotes = adminNotes || report.adminNotes;
        report.reviewedBy = req.admin._id;
        report.reviewedAt = new Date();

        await report.save();

        res.json({
            success: true,
            message: 'Test report update successful',
            data: {
                report: {
                    id: report._id,
                    status: report.status,
                    adminNotes: report.adminNotes
                }
            }
        });
    } catch (error) {
        console.error('Test report update error:', error);
        res.status(500).json({
            success: false,
            message: 'Test report update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update report status (admin only)
router.patch('/:reportId', authenticateAdminToken, async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { reportId } = req.params;
        const { status, adminNotes } = req.body;

        console.log('=== UPDATING REPORT ===');
        console.log('Report ID:', reportId);
        console.log('Request body:', req.body);

        // Validate report ID
        if (!reportId) {
            return res.status(400).json({
                success: false,
                message: 'Report ID is required'
            });
        }

        const report = await Report.findById(reportId).populate({
            path: 'campaignId',
            select: 'title creator',
            populate: { path: 'creator', select: 'name email' }
        }).populate('reporterId', 'name email');
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        console.log('Found report:', {
            id: report._id,
            status: report.status,
            campaignId: report.campaignId?._id,
            campaignTitle: report.campaignId?.title,
            reporterId: report.reporterId
        });

        // Update report status - use consistent values
        let dbStatus;
        if (status === 'rejected' || status === 'dismissed') {
            dbStatus = 'dismissed';
        } else if (status === 'resolved') {
            dbStatus = 'resolved';
        } else {
            dbStatus = status || report.status;
        }

        console.log('Status mapping:', { original: status, mapped: dbStatus });
        report.status = dbStatus;
        report.adminNotes = adminNotes || report.adminNotes;
        report.reviewedBy = req.admin._id;
        report.reviewedAt = new Date();

        console.log('Updating report with status:', dbStatus);
        await report.save();
        console.log('Report saved successfully');

        // Always send notifications on resolve
        if (dbStatus === 'resolved') {
            const creatorMsg = `A report for your campaign "${report.campaignId?.title}" has been resolved by admin.`;
            const reporterMsg = `Your report for campaign "${report.campaignId?.title}" has been resolved.`;
            const notifications = [];

            // Send notification to reporter (if not anonymous)
            if (report.reporterId) {
                try {
                    const reporterNotification = new Notification({
                        user: report.reporterId._id,
                        type: 'report',
                        message: reporterMsg,
                        campaign: report.campaignId?._id
                    });
                    notifications.push(reporterNotification);
                    // Send email to reporter
                    if (report.reporterId.email) {
                        const { sendEmail } = require('../utils/emailService');
                        await sendEmail(report.reporterId.email, 'Your Report Resolved', `<p>Hello ${report.reporterId.name},</p><p>${reporterMsg}</p>`);
                    }
                } catch (error) {
                    console.error('Error creating reporter notification/email:', error);
                }
            }

            // Send notification to campaign creator
            if (report.campaignId?.creator && report.campaignId.creator.email) {
                try {
                    const creatorNotification = new Notification({
                        user: report.campaignId.creator._id,
                        type: 'report',
                        message: creatorMsg,
                        campaign: report.campaignId._id
                    });
                    notifications.push(creatorNotification);
                    // Send email to creator
                    const { sendEmail } = require('../utils/emailService');
                    await sendEmail(report.campaignId.creator.email, 'Report Resolved on Your Campaign', `<p>Hello ${report.campaignId.creator.name},</p><p>${creatorMsg}</p>`);
                } catch (error) {
                    console.error('Error creating creator notification/email:', error);
                }
            }

            // Save all notifications
            if (notifications.length > 0) {
                try {
                    await Notification.insertMany(notifications);
                } catch (error) {
                    console.error('Error saving notifications:', error);
                }
            }
        }

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
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to update report',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router; 