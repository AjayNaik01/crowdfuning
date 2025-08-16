const express = require('express');
const { body } = require('express-validator');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const { sendOTPEmail, sendDonorNotificationEmail } = require('../utils/emailService');
const Comment = require('../models/Comment');

const router = express.Router();

// Test DELETE route
router.delete('/test', (req, res) => {
    console.log('=== TEST DELETE ROUTE CALLED ===');
    res.json({ success: true, message: 'Test DELETE route working' });
});

// Multer storage for images
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/campaigns/images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
    }
});
// Multer storage for videos
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/campaigns/videos'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'vid-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, path.join(__dirname, '../uploads/campaigns/images'));
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, path.join(__dirname, '../uploads/campaigns/videos'));
        } else {
            cb(new Error('Invalid file type'), null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        if (file.mimetype.startsWith('image/')) {
            cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, 'vid-' + uniqueSuffix + path.extname(file.originalname));
        } else {
            cb(new Error('Invalid file type'), null);
        }
    }
});

// Multer configuration for proof documents
const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/proofs');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.params.campaignId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

const proofFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('File type not supported. Please upload an image, video, or PDF.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 50 } // 50 MB limit
});

const uploadProof = multer({
    storage: proofStorage,
    fileFilter: proofFileFilter,
    limits: { fileSize: 1024 * 1024 * 100 } // 100 MB limit for proofs
});

// Create a new campaign
router.post('/create', authenticateToken, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('location')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Location is required and must be less than 100 characters'),
    body('description')
        .trim()
        .isLength({ min: 50, max: 2000 })
        .withMessage('Description must be between 50 and 2000 characters'),
    body('category')
        .isIn(['disaster_recovery', 'education', 'sports', 'business', 'medical', 'community', 'environment', 'arts', 'technology', 'other'])
        .withMessage('Please select a valid category'),
    body('targetAmount')
        .isFloat({ min: 1 })
        .withMessage('Target amount must be at least 1'),
    body('startDate')
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('isVotingEnabled')
        .optional()
        .isBoolean()
        .withMessage('Voting enabled must be a boolean'),
    body('isOrganization')
        .optional()
        .isBoolean()
        .withMessage('Organization must be a boolean'),
    body('organizationName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Organization name cannot exceed 100 characters'),
    body('organizationDetails')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Organization details cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has completed KYC (required for all users to create campaigns)
        if (user.kycStatus !== 'VERIFIED' && !['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You must complete KYC verification to create campaigns. Please complete your KYC verification first.'
            });
        }

        const {
            title,
            location,
            description,
            category,
            targetAmount,
            startDate,
            endDate,
            isVotingEnabled,
            isOrganization,
            organizationName,
            organizationDetails
        } = req.body;

        // File paths
        const imagePaths = (req.files['images'] || []).map(f => '/uploads/campaigns/images/' + f.filename);
        const videoPaths = (req.files['videos'] || []).map(f => '/uploads/campaigns/videos/' + f.filename);

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Auto-enable voting for campaigns >= 50,000
        const autoVotingEnabled = parseFloat(targetAmount) >= 50000;

        const campaign = new Campaign({
            creator: user._id,
            title,
            location,
            description,
            category,
            targetAmount,
            startDate: start,
            endDate: end,
            images: imagePaths,
            videos: videoPaths,
            isVotingEnabled: autoVotingEnabled || isVotingEnabled || false,
            votingEndDate: (autoVotingEnabled || isVotingEnabled) ? new Date(endDate) : null,
            isOrganization: isOrganization || false,
            organizationName: isOrganization ? organizationName : null,
            organizationDetails: isOrganization ? organizationDetails : null,
            status: 'pending_review'
        });

        await campaign.save();

        res.status(201).json({
            success: true,
            message: 'Campaign created successfully! It is now under review.',
            data: {
                campaignId: campaign._id,
                status: campaign.status
            }
        });

    } catch (error) {
        console.error('Campaign creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create campaign. Please try again.'
        });
    }
});

// Get all active campaigns (public)
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;

        const query = {
            status: 'active' // Only active campaigns (deleted campaigns won't be active anyway)
        };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const campaigns = await Campaign.find(query)
            .populate('creator', 'name')
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

// Debug route to list all campaigns
router.get('/debug/all-campaigns', authenticateToken, async (req, res) => {
    try {
        const allCampaigns = await Campaign.find({})
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });

        const currentUserId = req.user.userId.toString();

        const campaignsWithOwnership = allCampaigns.map(campaign => ({
            _id: campaign._id,
            title: campaign.title,
            creator: campaign.creator,
            creatorId: campaign.creator._id ? campaign.creator._id.toString() : campaign.creator.toString(),
            isOwnedByCurrentUser: (campaign.creator._id ? campaign.creator._id.toString() : campaign.creator.toString()) === currentUserId,
            status: campaign.status,
            createdAt: campaign.createdAt
        }));

        res.json({
            success: true,
            data: {
                currentUserId: currentUserId,
                totalCampaigns: allCampaigns.length,
                campaigns: campaignsWithOwnership
            }
        });

    } catch (error) {
        console.error('Debug all campaigns error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug failed'
        });
    }
});

// Debug route to test ownership
router.get('/debug/ownership/:campaignId', authenticateToken, async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        const campaignCreatorId = campaign.creator.toString();
        const currentUserId = req.user.userId.toString();

        res.json({
            success: true,
            data: {
                campaignId: campaignId,
                campaignCreatorId: campaignCreatorId,
                currentUserId: currentUserId,
                areEqual: campaignCreatorId === currentUserId,
                campaignCreatorType: typeof campaign.creator,
                currentUserIdType: typeof req.user.userId,
                campaign: {
                    _id: campaign._id,
                    title: campaign.title,
                    creator: campaign.creator
                },
                user: {
                    userId: req.user.userId,
                    email: req.user.email,
                    name: req.user.name
                }
            }
        });

    } catch (error) {
        console.error('Debug ownership error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug failed'
        });
    }
});

// Get user's campaigns
router.get('/user/my-campaigns', authenticateToken, async (req, res) => {
    try {
        console.log('=== MY CAMPAIGNS DEBUG ===');
        console.log('User ID from token:', req.user.userId);
        console.log('User ID type:', typeof req.user.userId);
        console.log('User email:', req.user.email);
        console.log('User name:', req.user.name);

        const campaigns = await Campaign.find({
            creator: req.user.userId,
            status: { $ne: 'deleted' } // Exclude deleted campaigns
        })
            .sort({ createdAt: -1 });

        console.log('Found campaigns count:', campaigns.length);
        campaigns.forEach((campaign, index) => {
            console.log(`Campaign ${index + 1}:`, {
                id: campaign._id,
                title: campaign.title,
                creator: campaign.creator,
                creatorType: typeof campaign.creator,
                status: campaign.status
            });
        });
        console.log('========================');

        res.json({
            success: true,
            data: {
                campaigns
            }
        });

    } catch (error) {
        console.error('Get user campaigns error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get your campaigns'
        });
    }
});

// Delete campaign (soft delete - change status to deleted)
router.delete('/:id', authenticateToken, async (req, res) => {
    console.log('=== DELETE ROUTE CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Campaign ID:', req.params.id);
    console.log('User ID from token:', req.user.userId);
    console.log('========================');

    try {
        const campaignId = req.params.id;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find campaign and verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check ownership
        const campaignCreatorId = campaign.creator.toString();
        const currentUserId = req.user.userId.toString();

        if (campaignCreatorId !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own campaigns'
            });
        }

        // Check if campaign can be deleted based on status
        const deletableStatuses = ['draft', 'pending_review', 'rejected', 'completed'];
        if (!deletableStatuses.includes(campaign.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete campaign with status '${campaign.status}'. Only campaigns with status 'draft', 'pending_review', 'rejected', or 'completed' can be deleted.`
            });
        }

        // Check if any funds have been received
        if (campaign.currentAmount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete campaign that has received funds. Please contact support if you need to cancel a funded campaign.'
            });
        }

        // Soft delete - change status to deleted
        campaign.status = 'deleted';
        await campaign.save();

        res.json({
            success: true,
            message: 'Campaign deleted successfully!',
            data: {
                campaignId: campaignId,
                status: campaign.status
            }
        });

    } catch (error) {
        console.error('Campaign deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete campaign. Please try again.'
        });
    }
});

// Get vote status for a user on a campaign
router.get('/:id/vote-status', authenticateToken, async (req, res) => {
    try {
        const campaignId = req.params.id;
        const userId = req.user.userId;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Check if user has voted
        const userVote = campaign.votes.find(vote => vote.voter.toString() === userId);

        res.json({
            success: true,
            data: {
                hasVoted: !!userVote,
                userVote: userVote ? userVote.vote : null,
                voteComment: userVote ? userVote.comment : null,
                votedAt: userVote ? userVote.votedAt : null
            }
        });

    } catch (error) {
        console.error('Vote status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vote status'
        });
    }
});

// Get single campaign by ID
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('creator', 'name email');

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        res.json({
            success: true,
            data: {
                campaign
            }
        });

    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get campaign'
        });
    }
});

// Vote on campaign (if voting is enabled)
router.post('/:id/vote', authenticateToken, [
    body('vote')
        .isIn(['approve', 'reject'])
        .withMessage('Vote must be either approve or reject'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { vote, comment } = req.body;
        const campaignId = req.params.id;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        if (!campaign.isVotingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Voting is not enabled for this campaign'
            });
        }

        // Check if voting period has ended
        if (campaign.votingEndDate && new Date() > campaign.votingEndDate) {
            return res.status(400).json({
                success: false,
                message: 'Voting period has ended'
            });
        }

        // Check if user has already voted
        const existingVote = campaign.votes.find(v => v.voter.toString() === req.user.userId);
        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted on this campaign'
            });
        }

        // Add vote
        campaign.votes.push({
            voter: req.user.userId,
            vote,
            comment
        });

        // Calculate vote results
        campaign.calculateVoteResults();
        await campaign.save();

        res.json({
            success: true,
            message: 'Vote submitted successfully',
            data: {
                voteResults: campaign.voteResults
            }
        });

    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit vote'
        });
    }
});

// Admin: Get all campaigns for review
router.get('/admin/review', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const campaigns = await Campaign.find({
            status: { $in: ['pending_review', 'rejected'] }
        })
            .populate('creator', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                campaigns
            }
        });

    } catch (error) {
        console.error('Get campaigns for review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get campaigns for review'
        });
    }
});

// Admin: Approve/Reject campaign
router.put('/admin/review/:id', authenticateToken, [
    body('status')
        .isIn(['active', 'rejected'])
        .withMessage('Status must be either active or rejected'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const admin = await User.findById(req.user.userId);
        if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { status, reason } = req.body;
        const campaignId = req.params.id;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        campaign.status = status;
        if (status === 'rejected' && reason) {
            campaign.rejectionReason = reason;
        }

        await campaign.save();

        res.json({
            success: true,
            message: `Campaign ${status} successfully`,
            data: {
                campaignId: campaign._id,
                status: campaign.status
            }
        });

    } catch (error) {
        console.error('Campaign review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review campaign'
        });
    }
});

// Update campaign
router.put('/:id', authenticateToken, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 50, max: 2000 })
        .withMessage('Description must be between 50 and 2000 characters'),
    body('category')
        .optional()
        .isIn(['disaster_recovery', 'education', 'sports', 'business', 'medical', 'community', 'environment', 'arts', 'technology', 'other'])
        .withMessage('Please select a valid category'),
    body('targetAmount')
        .optional()
        .isFloat({ min: 1 })
        .withMessage('Target amount must be at least 1'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid start date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date'),
    body('isVotingEnabled')
        .optional()
        .isBoolean()
        .withMessage('Voting enabled must be a boolean'),
    body('isOrganization')
        .optional()
        .isBoolean()
        .withMessage('Organization must be a boolean'),
    body('organizationName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Organization name cannot exceed 100 characters'),
    body('organizationDetails')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Organization details cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const campaignId = req.params.id;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find campaign and verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Simple ownership check - compare ObjectIds directly
        const campaignCreatorId = campaign.creator.toString();
        const currentUserId = req.user.userId.toString();

        console.log('=== OWNERSHIP DEBUG ===');
        console.log('Campaign ID:', campaignId);
        console.log('Campaign creator ID:', campaignCreatorId);
        console.log('Current user ID:', currentUserId);
        console.log('Campaign creator type:', typeof campaign.creator);
        console.log('Campaign creator value:', campaign.creator);
        console.log('User ID from token:', req.user.userId);
        console.log('User ID type:', typeof req.user.userId);
        console.log('Are they equal?', campaignCreatorId === currentUserId);
        console.log('========================');

        if (campaignCreatorId !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: `You can only edit your own campaigns. Campaign creator: ${campaignCreatorId}, Your ID: ${currentUserId}`
            });
        }

        // Handle file uploads
        const newImagePaths = (req.files['images'] || []).map(f => '/uploads/campaigns/images/' + f.filename);
        const newVideoPaths = (req.files['videos'] || []).map(f => '/uploads/campaigns/videos/' + f.filename);

        // Auto-enable voting for campaigns >= 50,000
        const autoVotingEnabledUpdate = parseFloat(req.body.targetAmount || campaign.targetAmount) >= 50000;
        campaign.isVotingEnabled = autoVotingEnabledUpdate || req.body.isVotingEnabled || false;
        campaign.votingEndDate = (autoVotingEnabledUpdate || req.body.isVotingEnabled) ? new Date(req.body.endDate || campaign.endDate) : null;

        // Update campaign fields
        campaign.title = req.body.title || campaign.title;
        campaign.description = req.body.description || campaign.description;
        campaign.category = req.body.category || campaign.category;
        campaign.targetAmount = req.body.targetAmount || campaign.targetAmount;
        campaign.startDate = req.body.startDate ? new Date(req.body.startDate) : campaign.startDate;
        campaign.endDate = req.body.endDate ? new Date(req.body.endDate) : campaign.endDate;
        campaign.isOrganization = req.body.isOrganization || false;
        campaign.organizationName = req.body.isOrganization ? req.body.organizationName : null;
        campaign.organizationDetails = req.body.isOrganization ? req.body.organizationDetails : null;
        campaign.images = newImagePaths || campaign.images;
        campaign.videos = newVideoPaths || campaign.videos;

        await campaign.save();

        res.json({
            success: true,
            message: 'Campaign updated successfully',
            data: {
                campaignId: campaign._id,
                status: campaign.status
            }
        });

    } catch (error) {
        console.error('Campaign update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update campaign'
        });
    }
});

// Upload verification document for a campaign and notify donors if voting is enabled
router.post(
    '/:campaignId/upload-document',
    authenticateToken,
    uploadProof.single('document'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { description } = req.body;
            const file = req.file;

            if (!file || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'File and description are required',
                });
            }

            // Find the campaign
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign not found',
                });
            }

            // Only the campaign creator can upload documents
            if (campaign.creator.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to upload documents for this campaign',
                });
            }

            // Add the proof document
            campaign.proofDocuments.push({
                title: file.originalname,
                description,
                fileUrl: `/uploads/proofs/${file.filename}`,
                type: 'voting_document',
                uploadedAt: new Date(),
            });
            await campaign.save();

            // If voting is enabled and there is at least one proof document, notify all donors
            if (campaign.isVotingEnabled && campaign.proofDocuments.length > 0) {
                // Find all unique donors for this campaign
                const donations = await Donation.find({ campaign: campaignId }).populate('donor', 'email name');
                const donorIds = [...new Set(donations.map((d) => d.donor && d.donor._id && d.donor._id.toString()).filter(Boolean))];
                const donorInfos = donations
                    .map((d) => d.donor && d.donor.email ? { email: d.donor.email, name: d.donor.name } : null)
                    .filter(Boolean);

                const notificationText = `A new document has been uploaded for the campaign "${campaign.title}". Please review the document and cast your vote.`;

                // Create a notification and send email for each donor
                for (const donorInfo of donorInfos) {
                    // Find the userId for notification
                    const user = await User.findOne({ email: donorInfo.email });
                    if (user) {
                        await Notification.create({
                            user: user._id,
                            type: 'voting_document',
                            message: notificationText,
                            campaign: campaignId,
                            document: {
                                title: file.originalname,
                                fileUrl: `/uploads/proofs/${file.filename}`
                            },
                            createdAt: new Date(),
                            read: false,
                        });
                        // Send custom donor notification email with exact content
                        try {
                            await sendDonorNotificationEmail(
                                donorInfo.email,
                                donorInfo.name || 'Donor',
                                {
                                    type: 'Voting Document',
                                    campaignTitle: campaign.title,
                                    documentTitle: file.originalname,
                                    documentUrl: `${req.protocol}://${req.get('host')}/uploads/proofs/${file.filename}`,
                                    message: notificationText,
                                    date: new Date().toLocaleDateString(),
                                    voteUrl: `${req.protocol}://${req.get('host')}/campaigns/${campaignId}`
                                }
                            );
                        } catch (e) {
                            console.error('Failed to send donor notification email:', e.message);
                        }
                    }
                }
            }

            res.json({
                success: true,
                message: 'Document uploaded and notifications sent to donors (if applicable)',
                data: campaign.proofDocuments[campaign.proofDocuments.length - 1],
            });
        } catch (error) {
            console.error('Upload document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload document',
            });
        }
    }
);

// Get comments for a campaign (move above dynamic :campaignId route)
router.get('/:campaignId/comments', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const comments = await Comment.find({ campaignId })
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
        res.json({ success: true, data: comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
});

// Add a comment to a campaign (authenticated users only)
router.post('/:campaignId/comments', authenticateToken, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }
        const comment = new Comment({
            campaignId,
            userId: req.user.userId,
            userName: req.user.name,
            text: text.trim()
        });
        await comment.save();
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

module.exports = router;