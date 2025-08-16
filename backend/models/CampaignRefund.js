const mongoose = require('mongoose');

const campaignRefundSchema = new mongoose.Schema({
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    withdrawal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Withdrawal',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    refundDetails: [{
        donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
        amount: Number,
        status: { type: String, enum: ['pending', 'refunded', 'failed'], default: 'pending' },
        error: String,
        processedAt: Date
    }]
});

module.exports = mongoose.model('CampaignRefund', campaignRefundSchema); 