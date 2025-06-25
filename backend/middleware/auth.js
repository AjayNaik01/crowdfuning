const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('=== AUTH DEBUG ===');
        console.log('Decoded token:', decoded);
        console.log('User ID from token:', decoded.userId);
        console.log('User ID type:', typeof decoded.userId);

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('Found user:', {
            _id: user._id,
            email: user.email,
            name: user.name
        });

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email address'
            });
        }

        // Add user to request object
        req.user = {
            userId: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        };

        console.log('Request user object:', req.user);
        console.log('==================');

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = {
    authenticateToken
}; 