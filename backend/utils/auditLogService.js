const AuditLog = require('../models/AuditLog');

async function logAudit({ action, actor, target, details, ip }) {
    try {
        await AuditLog.create({
            action,
            actor,
            target,
            details,
            ip
        });
    } catch (err) {
        console.error('Failed to log audit action:', err);
    }
}

module.exports = { logAudit }; 