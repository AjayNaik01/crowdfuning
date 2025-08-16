const express = require('express');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogService');

const router = express.Router();

// Admin login
router.post('/login', [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('Admin not found for email:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Admin found:', { id: admin._id, email: admin.email, role: admin.role, isActive: admin.isActive });

        // Check if admin is active
        if (!admin.isActive) {
            console.log('Admin account is deactivated:', email);
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        console.log('=== ADMIN LOGIN DEBUG ===');
        console.log('Login attempt for email:', email);
        console.log('Provided password:', password);
        console.log('Provided password length:', password.length);
        console.log('Stored password hash:', admin.password);
        console.log('Attempting password comparison...');
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match result:', isMatch);
        console.log('=== END LOGIN DEBUG ===');

        if (!isMatch) {
            console.log('Password mismatch for admin:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            adminId: admin._id,
            email: admin.email,
            role: admin.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Log successful admin login
        try {
            await logAudit({
                action: 'admin_login',
                actor: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                },
                target: {
                    _id: admin._id,
                    type: 'admin',
                    name: admin.name,
                    email: admin.email
                },
                details: {
                    method: 'POST',
                    url: '/api/admin/auth/login',
                    body: { email: admin.email },
                    response: { success: true, message: 'Login successful' }
                },
                ip: req.ip || req.connection.remoteAddress
            });
        } catch (auditError) {
            console.error('Failed to log admin login:', auditError);
        }

        res.json({
            success: true,
            token,
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin logout (optional - for tracking purposes)
router.post('/logout', async (req, res) => {
    try {
        // Get admin info from token if available
        const authHeader = req.headers['authorization'];
        let adminInfo = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get admin details
                const admin = await Admin.findById(decoded.adminId);
                if (admin) {
                    adminInfo = {
                        _id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role
                    };
                }
            } catch (tokenError) {
                console.log('Token verification failed for logout:', tokenError.message);
            }
        }

        // Log logout event if admin info is available
        if (adminInfo) {
            try {
                await logAudit({
                    action: 'admin_logout',
                    actor: adminInfo,
                    target: {
                        _id: adminInfo._id,
                        type: 'admin',
                        name: adminInfo.name,
                        email: adminInfo.email
                    },
                    details: {
                        method: 'POST',
                        url: '/api/admin/auth/logout',
                        response: { success: true, message: 'Logout successful' }
                    },
                    ip: req.ip || req.connection.remoteAddress
                });
            } catch (auditError) {
                console.error('Failed to log admin logout:', auditError);
            }
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (err) {
        console.error('Admin logout error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 