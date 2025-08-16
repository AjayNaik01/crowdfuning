const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateAdminToken, requireAdmin } = require('../middleware/authAdmin');
const { auditAdminAction } = require('../middleware/auditMiddleware');
const PlatformSettings = require('../models/PlatformSettings');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/platform/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Add requireSuperAdmin middleware
const requireSuperAdmin = (req, res, next) => {
    console.log('[requireSuperAdmin] Called for:', req.admin ? req.admin.email : 'No admin');
    if (!req.admin || req.admin.role !== 'super_admin') {
        console.log('[requireSuperAdmin] Access denied. Role:', req.admin ? req.admin.role : 'none');
        return res.status(403).json({
            success: false,
            message: 'Access Denied: You do not have permission to access this page. Only super admins can manage platform settings.'
        });
    }
    console.log('[requireSuperAdmin] Access granted. Role:', req.admin.role);
    next();
};

// Get platform settings (public route)
router.get('/', async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform settings'
        });
    }
});

// Get platform settings (admin route)
router.get('/admin', authenticateAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform settings'
        });
    }
});

// Update platform settings
router.put('/', authenticateAdminToken, requireSuperAdmin, auditAdminAction('platform_settings_update'), async (req, res) => {
    try {
        const {
            platformName,
            supportEmail,
            primaryColor,
            platformFees,
            enableUserRegistration,
            socialLinks
        } = req.body;

        let settings = await PlatformSettings.getSettings();

        // Update settings
        settings.platformName = platformName || settings.platformName;
        settings.supportEmail = supportEmail || settings.supportEmail;
        settings.primaryColor = primaryColor || settings.primaryColor;
        settings.platformFees = platformFees !== undefined ? platformFees : settings.platformFees;
        settings.enableUserRegistration = enableUserRegistration !== undefined ? enableUserRegistration : settings.enableUserRegistration;

        if (socialLinks) {
            settings.socialLinks = {
                ...settings.socialLinks,
                ...socialLinks
            };
        }

        settings.updatedAt = new Date();
        settings.updatedBy = req.user.userId;

        await settings.save();

        res.json({
            success: true,
            message: 'Platform settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Error updating platform settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update platform settings'
        });
    }
});

// Upload platform logo
router.post('/upload-logo', authenticateAdminToken, requireSuperAdmin, auditAdminAction('platform_logo_upload'), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const settings = await PlatformSettings.getSettings();
        settings.platformLogo = `/uploads/platform/${req.file.filename}`;
        settings.updatedAt = new Date();
        settings.updatedBy = req.user.userId;

        await settings.save();

        res.json({
            success: true,
            message: 'Logo uploaded successfully',
            data: {
                logoUrl: settings.platformLogo
            }
        });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload logo'
        });
    }
});

// Add category
router.post('/categories', authenticateAdminToken, requireSuperAdmin, auditAdminAction('platform_category_add'), async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const settings = await PlatformSettings.getSettings();

        // Check if category already exists
        const existingCategory = settings.categories.find(
            cat => cat.name.toLowerCase() === name.toLowerCase()
        );

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

        settings.categories.push({ name: name.trim() });
        settings.updatedAt = new Date();
        settings.updatedBy = req.user.userId;

        await settings.save();

        res.json({
            success: true,
            message: 'Category added successfully',
            data: settings.categories
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add category'
        });
    }
});

// Delete category
router.delete('/categories/:categoryId', authenticateAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const { categoryId } = req.params;

        const settings = await PlatformSettings.getSettings();

        // Find and remove the category
        const categoryIndex = settings.categories.findIndex(
            cat => cat._id.toString() === categoryId
        );

        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        settings.categories.splice(categoryIndex, 1);
        settings.updatedAt = new Date();
        settings.updatedBy = req.user.userId;

        await settings.save();

        res.json({
            success: true,
            message: 'Category deleted successfully',
            data: settings.categories
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
});

// Get categories (public route)
router.get('/categories', async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({
            success: true,
            data: settings.categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

module.exports = router; 