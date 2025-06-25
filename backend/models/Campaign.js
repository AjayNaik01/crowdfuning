const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Campaign title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Campaign description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['disaster_recovery', 'education', 'sports', 'business', 'medical', 'community', 'environment', 'arts', 'technology', 'other']
    },
    targetAmount: {
        type: Number,
        required: [true, 'Target amount is required'],
        min: [1, 'Target amount must be at least 1']
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    images: [{
        type: String
    }],
    videos: [{
        type: String
    }],
    isVotingEnabled: {
        type: Boolean,
        default: false
    },
    votingEndDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'rejected', 'deleted', 'awaiting_admin_approval'],
        default: 'draft'
    },
    fundsReleased: {
        type: Boolean,
        default: false
    },
    rejectionReason: {
        type: String
    },
    isOrganization: {
        type: Boolean,
        default: false
    },
    organizationName: {
        type: String
    },
    organizationDetails: {
        type: String
    },
    proofDocuments: [{
        title: String,
        description: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    votes: [{
        voter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        vote: {
            type: String,
            enum: ['approve', 'reject']
        },
        comment: String,
        votedAt: {
            type: Date,
            default: Date.now
        }
    }],
    voteResults: {
        approveCount: {
            type: Number,
            default: 0
        },
        rejectCount: {
            type: Number,
            default: 0
        },
        totalVotes: {
            type: Number,
            default: 0
        }
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

// Update the updatedAt field before saving
campaignSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate vote results
campaignSchema.methods.calculateVoteResults = function () {
    const approveVotes = this.votes.filter(vote => vote.vote === 'approve').length;
    const rejectVotes = this.votes.filter(vote => vote.vote === 'reject').length;

    this.voteResults = {
        approveCount: approveVotes,
        rejectCount: rejectVotes,
        totalVotes: this.votes.length
    };

    return this.voteResults;
};

module.exports = mongoose.model('Campaign', campaignSchema); 