const { logAudit } = require('../utils/auditLogService');

// Middleware to automatically log admin actions
const auditAdminAction = (action) => {
    return async (req, res, next) => {
        // Store original send method
        const originalSend = res.send;

        // Override send method to capture response
        res.send = function (data) {
            // Restore original send
            res.send = originalSend;

            // Log the action if it was successful
            try {
                const responseData = typeof data === 'string' ? JSON.parse(data) : data;
                if (responseData && responseData.success) {
                    logAudit({
                        action: action,
                        actor: {
                            _id: req.admin?._id || req.admin?.adminId,
                            name: req.admin?.name || 'Admin',
                            email: req.admin?.email,
                            role: req.admin?.role
                        },
                        target: {
                            _id: req.params.id || req.params.userId || req.params.adminId || req.body.id,
                            type: action.split('_')[0], // e.g., 'campaign', 'user', 'kyc'
                            name: req.body.name || req.body.title || req.body.email || 'Target',
                            email: req.body.email
                        },
                        details: {
                            method: req.method,
                            url: req.originalUrl,
                            body: req.body,
                            params: req.params,
                            response: responseData
                        },
                        ip: req.ip || req.connection.remoteAddress
                    });
                }
            } catch (error) {
                console.error('Audit logging error:', error);
            }

            // Call original send
            return originalSend.call(this, data);
        };

        next();
    };
};

module.exports = { auditAdminAction }; 