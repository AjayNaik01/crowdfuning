const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['campaign', 'donation', 'kyc', 'admin', 'other', 'voting_document', 'target_reached', 'report'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipient: { type: String }, // For admin display: user email, 'All', or campaign title
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: false
    },
    document: {
        title: String,
        fileUrl: String
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 