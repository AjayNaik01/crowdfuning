const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTPEmail, generateOTP, isValidEmail } = require('../utils/emailService');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], handleValidationErrors, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user with OTP
        const user = new User({
            name,
            email,
            password,
            otp: {
                code: otp,
                expiresAt: otpExpiry
            }
        });

        // Save user to database
        await user.save();

        // Send OTP email
        try {
            await sendOTPEmail(email, otp, name);

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email for OTP verification.',
                data: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified
                }
            });
        } catch (emailError) {
            // If email sending fails, delete the user and return error
            await User.findByIdAndDelete(user._id);

            return res.status(400).json({
                success: false,
                message: emailError.message || 'Failed to send verification email. Please provide a valid email address.'
            });
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Login user
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email address before logging in. Check your inbox for the verification email.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const userResponse = {
            userId: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                user: userResponse,
                token: token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Request password reset
router.post('/request-password-reset', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email address does not exist'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create reset URL
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`;

        // Send password reset email
        try {
            const transporter = require('nodemailer').createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Password Reset Request - Crowdfunding Platform',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                        <p>Hello ${user.name},</p>
                        <p>You requested a password reset for your crowdfunding platform account.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                        </div>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this password reset, please ignore this email.</p>
                        <p>Best regards,<br>Crowdfunding Team</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            res.json({
                success: true,
                message: 'Password reset email sent successfully! Please check your inbox.'
            });
        } catch (emailError) {
            // Clear reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return res.status(400).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request. Please try again.'
        });
    }
});

// Reset password
router.post('/reset-password', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], handleValidationErrors, async (req, res) => {
    try {
        const { token, email, password } = req.body;

        // Find user by email and reset token
        const user = await User.findOne({
            email: email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful! You can now login with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userResponse = {
            userId: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});

// Verify OTP
router.post('/verify-otp', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be a 6-digit number')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check if OTP exists and is not expired
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.'
            });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (user.otp.code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Mark email as verified and clear OTP
        user.isEmailVerified = true;
        user.otp = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed. Please try again.'
        });
    }
});

// Resend OTP
router.post('/resend-otp', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        user.otp = {
            code: otp,
            expiresAt: otpExpiry
        };
        await user.save();

        // Send new OTP email
        try {
            await sendOTPEmail(email, otp, user.name);

            res.json({
                success: true,
                message: 'New OTP sent successfully! Please check your email.'
            });
        } catch (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError.message || 'Failed to send OTP. Please provide a valid email address.'
            });
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP. Please try again.'
        });
    }
});

module.exports = router; 