const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    actor: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
        name: String,
        email: String,
        role: String
    },
    target: { type: mongoose.Schema.Types.Mixed }, // Allow any object for target
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('AuditLog', auditLogSchema); 