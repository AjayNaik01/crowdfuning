const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'processed'],
        default: 'pending'
    },
    adminNotes: String,
    rejectionReason: String,
    adminApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    adminApprovedAt: Date,
    isVotingCampaign: {
        type: Boolean,
        default: false
    },
    // Razorpay payout tracking
    payoutId: String,
    payoutStatus: {
        type: String,
        enum: ['pending', 'processed', 'failed', 'reversed'],
        default: 'pending'
    },
    beneficiaryDetails: {
        accountNumber: String,
        ifsc: String,
        name: String,
        phone: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

withdrawalSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema); 