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
        user.kycStatus = 'PENDING';
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

// @route   POST /api/kyc/verify
// @desc    Verify KYC documents
// @access  Private
router.post('/verify', authenticateToken, upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'faceImage', maxCount: 1 }
]), (req, res, next) => {
    console.log('KYC req.body:', req.body);
    console.log('KYC req.files:', req.files);
    next();
}, async (req, res) => {
    try {
        const { idType = 'AADHAR', name, dob, gender, aadhaar_number, father_name, pan_number, phone, address, accountNumber, ifsc, bankName } = req.body;

        // Check if files were uploaded
        if (!req.files || !req.files.idCard || !req.files.faceImage) {
            return res.status(400).json({
                success: false,
                message: 'Both ID card and face image are required'
            });
        }

        const idCardFile = req.files.idCard[0];
        const faceImageFile = req.files.faceImage[0];

        // Check for duplicate ID numbers
        if (idType === 'AADHAR' && aadhaar_number) {
            console.log('Checking for duplicate Aadhaar number:', aadhaar_number);

            // Check if another user has used this Aadhaar number
            const existingUser = await User.findOne({
                'kycData.aadhaar_number': aadhaar_number,
                _id: { $ne: req.user.userId } // Exclude current user
            });

            console.log('Existing user with same Aadhaar:', existingUser ? existingUser._id : 'None found');

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'This Aadhaar number has already been used for KYC verification by another user. Please use a different ID or contact support if this is an error.'
                });
            }

            // Check if current user has already submitted this Aadhaar number
            const currentUser = await User.findById(req.user.userId);
            const hasUsedAadhaar = currentUser.kycData && currentUser.kycData.some(kyc =>
                kyc.aadhaar_number === aadhaar_number
            );

            console.log('Current user has used this Aadhaar:', hasUsedAadhaar);

            if (hasUsedAadhaar) {
                return res.status(400).json({
                    success: false,
                    message: 'Please try after 24 hours. Its under manual review, check back after some time as admin may verify your KYC manually.'
                });
            }
        } else if (idType === 'PAN' && pan_number) {
            console.log('Checking for duplicate PAN number:', pan_number);

            // Check if another user has used this PAN number
            const existingUser = await User.findOne({
                'kycData.pan_number': pan_number,
                _id: { $ne: req.user.userId } // Exclude current user
            });

            console.log('Existing user with same PAN:', existingUser ? existingUser._id : 'None found');

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'This PAN number has already been used for KYC verification by another user. Please use a different ID or contact support if this is an error.'
                });
            }

            // Check if current user has already submitted this PAN number
            const currentUser = await User.findById(req.user.userId);
            const hasUsedPAN = currentUser.kycData && currentUser.kycData.some(kyc =>
                kyc.pan_number === pan_number
            );

            console.log('Current user has used this PAN:', hasUsedPAN);

            if (hasUsedPAN) {
                return res.status(400).json({
                    success: false,
                    message: 'Please try after 24 hours. If urgent, check back after some time as admin may verify your KYC manually.'
                });
            }
        }

        // Prepare fields for KYCService
        let fields = {};
        if (idType === 'PAN') {
            fields = {
                name: name || '',
                dob: dob || '',
                father_name: father_name || '',
                pan_number: pan_number || ''
            };
        } else {
            fields = {
                name: name || '',
                dob: dob || '',
                gender: gender || '',
                aadhaar_number: aadhaar_number || ''
            };
        }

        // Process KYC verification
        const kycResult = await kycService.processKYC(
            idCardFile.path,
            faceImageFile.path,
            idType,
            fields
        );

        // Parse result string for status
        const resultStr = typeof kycResult === 'string' ? kycResult : (kycResult.result || '');
        let status = 'FAILED';
        if (resultStr.includes('✅') && !resultStr.includes('❌')) {
            status = 'VERIFIED';
        } else if (resultStr.includes('✅')) {
            status = 'FAILED';
        }

        // Format dob to dd/mm/yyyy if present
        let formattedDob = fields.dob || '';
        if (formattedDob) {
            const d = new Date(formattedDob);
            if (!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                formattedDob = `${day}/${month}/${year}`;
            }
        }
        // Debug logging
        const userId = req.user.userId;
        console.log('KYC Verification Debug:', {
            userId,
            userIdType: typeof userId,
            status,
            resultStr,
            fields
        });
        // Build the KYC record to store
        const kycRecord = {
            idType,
            name: fields.name || '',
            dob: formattedDob,
            gender: fields.gender || '',
            aadhaar_number: fields.aadhaar_number || '',
            father_name: fields.father_name || '',
            pan_number: fields.pan_number || '',
            phone: phone || '',
            address: address || '',
            accountNumber: accountNumber || '',
            ifsc: ifsc || '',
            bankName: bankName || '',
            idCardImage: idCardFile.filename || idCardFile.path,
            faceImage: faceImageFile.filename || faceImageFile.path,
            verifiedAt: new Date(),
            status,
            verificationResult: resultStr
        };
        // Push the record to kycData array, and update kycStatus:
        // - If AI status is VERIFIED, set kycStatus to VERIFIED
        // - If AI status is FAILED (or anything else), set kycStatus to PENDING for manual review
        const update = status === 'VERIFIED'
            ? { $push: { kycData: kycRecord }, $set: { kycStatus: 'VERIFIED' } }
            : { $push: { kycData: kycRecord }, $set: { kycStatus: 'PENDING' } };
        const updateResult = await User.findByIdAndUpdate(userId, update, { new: true });
        console.log('MongoDB update result:', updateResult, 'Type of _id in DB:', updateResult?._id ? typeof updateResult._id : 'N/A');

        // Simulate AI delay
        setTimeout(() => {
            res.json({
                success: true,
                data: { status, result: resultStr }
            });
        }, 10000);

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
        const user = await User.findById(req.user.userId).select('kycStatus kycData');

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
        const currentUser = await User.findById(req.user.userId);
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

        let query = {};
        if (idType === 'AADHAR') {
            query = { 'kycData.aadhaar_number': idNumber };
        } else if (idType === 'PAN') {
            query = { 'kycData.pan_number': idNumber };
        }

        const existingUsers = await User.find(query).select('_id name email kycStatus kycData');

        res.json({
            success: true,
            data: {
                idNumber,
                idType,
                existingUsers: existingUsers.map(user => ({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    kycStatus: user.kycStatus,
                    kycData: user.kycData
                })),
                count: existingUsers.length
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

// @route   GET /api/kyc/debug-duplicates
// @desc    Debug endpoint to see all KYC data in database
// @access  Private (Admin)
router.get('/debug-duplicates', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const allUsers = await User.find({ 'kycData.0': { $exists: true } }).select('_id name email kycStatus kycData');

        res.json({
            success: true,
            data: {
                totalUsersWithKYC: allUsers.length,
                users: allUsers.map(user => ({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    kycStatus: user.kycStatus,
                    kycData: user.kycData
                }))
            }
        });

    } catch (error) {
        console.error('Debug duplicates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug data',
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