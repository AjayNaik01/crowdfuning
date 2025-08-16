const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

commentSchema.index({ campaignId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema); 