const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const KYCService = require('../utils/kycService');

const router = express.Router();
const kycService = new KYCService();
const upload = kycService.getUploadMiddleware();

// Submit KYC details
router.post('/submit', authenticateToken, [
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('dateOfBirth')
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    body('address')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Address must be between 10 and 200 characters'),
    body('city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('state')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('State must be between 2 and 50 characters'),
    body('country')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Country must be between 2 and 50 characters'),
    body('postalCode')
        .trim()
        .isLength({ min: 3, max: 10 })
        .withMessage('Postal code must be between 3 and 10 characters'),
    body('phoneNumber')
        .trim()
        .matches(/^[+]?[\d\s\-\(\)]+$/)
        .withMessage('Please provide a valid phone number'),
    body('idType')
        .isIn(['aadhar', 'pan', 'passport', 'driving_license'])
        .withMessage('Please select a valid ID type'),
    body('idNumber')
        .trim()
        .isLength({ min: 5, max: 20 })
        .withMessage('ID number must be between 5 and 20 characters'),
    body('idImage')
        .trim()
        .notEmpty()
        .withMessage('ID image is required')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            fullName,
            dateOfBirth,
            address,
            city,
            state,
            country,
            postalCode,
            phoneNumber,
            idType,
            idNumber,
            idImage
        } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if KYC is already submitted
        if (user.kycStatus !== 'not_submitted') {
            return res.status(400).json({
                success: false,
                message: 'KYC has already been submitted'
            });
        }

        // Update user with KYC details
        user.kycDetails = {
            fullName,
            dateOfBirth,
            address,
            city,
            state,
            country,
            postalCode,
            phoneNumber,
            idType,
            idNumber,
            idImage
        };
        user.kycStatus = 'pending';
        // Note: No role change since all users can create campaigns

        await user.save();

        res.json({
            success: true,
            message: 'KYC submitted successfully! Your application is under review.',
            data: {
                kycStatus: user.kycStatus,
                role: user.role
            }
        });

    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit KYC. Please try again.'
        });
    }
});

// Get KYC status
router.get('/status', authenticateToken, async (req, res) => {
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
                kycStatus: user.kycStatus,
                role: user.role,
                kycDetails: user.kycDetails
            }
        });

    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KYC status'
        });
    }
});

// Admin: Get all KYC applications
router.get('/admin/applications', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const kycApplications = await User.find({
            kycStatus: { $in: ['pending', 'approved', 'rejected'] }
        }).select('-password -otp -resetPasswordToken -resetPasswordExpires');

        res.json({
            success: true,
            data: {
                applications: kycApplications
            }
        });

    } catch (error) {
        console.error('Get KYC applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KYC applications'
        });
    }
});

// Admin: Approve/Reject KYC
router.put('/admin/review/:userId', authenticateToken, [
    body('status')
        .isIn(['approved', 'rejected'])
        .withMessage('Status must be either approved or rejected'),
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
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.kycStatus === 'not_submitted') {
            return res.status(400).json({
                success: false,
                message: 'User has not submitted KYC'
            });
        }

        user.kycStatus = status;
        if (status === 'rejected' && reason) {
            user.kycDetails.rejectionReason = reason;
        }

        await user.save();

        res.json({
            success: true,
            message: `KYC ${status} successfully`,
            data: {
                userId: user._id,
                kycStatus: user.kycStatus
            }
        });

    } catch (error) {
        console.error('KYC review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review KYC'
        });
    }
});

// @route   POST /api/kyc/verify
// @desc    Verify KYC documents
// @access  Private
router.post('/verify', authenticateToken, upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'faceImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const { idType = 'AADHAR' } = req.body;

        // Check if files were uploaded
        if (!req.files || !req.files.idCard || !req.files.faceImage) {
            return res.status(400).json({
                success: false,
                message: 'Both ID card and face image are required'
            });
        }

        const idCardFile = req.files.idCard[0];
        const faceImageFile = req.files.faceImage[0];

        // Process KYC verification
        const kycResult = await kycService.processKYC(
            idCardFile.path,
            faceImageFile.path,
            idType
        );

        // Clean up uploaded files
        kycService.cleanupFiles([idCardFile, faceImageFile]);

        if (kycResult.error) {
            return res.status(400).json({
                success: false,
                message: kycResult.error
            });
        }

        // Update user's KYC status in the main database
        if (kycResult.status === 'READY' || kycResult.status === 'COMPLETED') {
            try {
                await User.findByIdAndUpdate(req.user.id, {
                    kycStatus: 'VERIFIED',
                    kycData: {
                        name: kycResult.extracted_info.name,
                        id: kycResult.extracted_info.id,
                        idType: kycResult.extracted_info.id_type,
                        verifiedAt: new Date()
                    }
                });
            } catch (dbError) {
                console.error('Error updating user KYC status:', dbError);
            }
        }

        res.json({
            success: true,
            data: kycResult
        });

    } catch (error) {
        console.error('KYC verification error:', error);
        res.status(500).json({
            success: false,
            message: 'KYC verification failed',
            error: error.message
        });
    }
});

// @route   GET /api/kyc/status
// @desc    Get KYC status for current user
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('kycStatus kycData');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                kycStatus: user.kycStatus || 'NOT_VERIFIED',
                kycData: user.kycData || null
            }
        });

    } catch (error) {
        console.error('KYC status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KYC status',
            error: error.message
        });
    }
});

// @route   GET /api/kyc/status/:userId
// @desc    Get KYC status for a specific user (admin only)
// @access  Private (Admin)
router.get('/status/:userId', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const user = await User.findById(req.params.userId).select('kycStatus kycData name email');

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
                name: user.name,
                email: user.email,
                kycStatus: user.kycStatus || 'NOT_VERIFIED',
                kycData: user.kycData || null
            }
        });

    } catch (error) {
        console.error('KYC status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KYC status',
            error: error.message
        });
    }
});

// @route   POST /api/kyc/check-duplicate
// @desc    Check if a user with given ID already exists in KYC system
// @access  Private
router.post('/check-duplicate', authenticateToken, async (req, res) => {
    try {
        const { idNumber, idType = 'AADHAR' } = req.body;

        if (!idNumber) {
            return res.status(400).json({
                success: false,
                message: 'ID number is required'
            });
        }

        const kycStatus = await kycService.getKYCStatus(idNumber);

        res.json({
            success: true,
            data: {
                isDuplicate: kycStatus.status === 'VERIFIED',
                kycStatus: kycStatus
            }
        });

    } catch (error) {
        console.error('Duplicate check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check for duplicates',
            error: error.message
        });
    }
});

// @route   GET /api/kyc/requirements
// @desc    Get KYC requirements and supported document types
// @access  Public
router.get('/requirements', (req, res) => {
    res.json({
        success: true,
        data: {
            supportedDocuments: [
                {
                    type: 'AADHAR',
                    description: 'Aadhar Card',
                    requirements: [
                        'Clear image of the entire Aadhar card',
                        'All text should be readable',
                        'Face should be clearly visible on the card'
                    ]
                },
                {
                    type: 'PAN',
                    description: 'PAN Card',
                    requirements: [
                        'Clear image of the entire PAN card',
                        'All text should be readable',
                        'Face should be clearly visible on the card'
                    ]
                }
            ],
            faceImageRequirements: [
                'Clear, well-lit photo of your face',
                'Face should be clearly visible',
                'No sunglasses or face coverings',
                'Good quality image (not blurry)'
            ],
            fileRequirements: {
                maxSize: '10MB',
                formats: ['JPEG', 'JPG', 'PNG'],
                dimensions: 'Minimum 300x300 pixels'
            }
        }
    });
});

module.exports = router; 