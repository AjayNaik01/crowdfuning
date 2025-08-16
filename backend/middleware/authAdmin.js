const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authenticateAdminToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Debug log

        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            console.log('Admin not found for ID:', decoded.adminId); // Debug log
            return res.status(403).json({ success: false, message: 'Invalid admin' });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
        }

        console.log('Admin found:', { id: admin._id, email: admin.email, role: admin.role }); // Debug log

        req.admin = admin;
        req.user = { userId: admin._id }; // Add this for compatibility
        next();
    } catch (err) {
        console.error('Token verification error:', err); // Debug log
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

const requireAdmin = async (req, res, next) => {
    if (!req.admin) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

module.exports = { authenticateAdminToken, requireAdmin }; 