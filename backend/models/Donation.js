const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    donorName: {
        type: String,
        required: [true, 'Donor name is required']
    },
    amount: {
        type: Number,
        required: [true, 'Donation amount is required'],
        min: [1, 'Donation amount must be at least 1']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        enum: ['upi', 'card', 'net_banking', 'wallet', 'razorpay']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    upiId: {
        type: String
    },
    message: {
        type: String,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    paymentId: {
        type: String,
        required: false // Should be set for Razorpay payments
    }
});

// Generate transaction ID before saving
donationSchema.pre('save', function (next) {
    if (!this.transactionId) {
        this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Donation', donationSchema); 