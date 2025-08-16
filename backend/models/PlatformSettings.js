const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    platformName: {
        type: String,
        default: 'CrowdFunding Platform',
        required: true
    },
    supportEmail: {
        type: String,
        default: 'support@example.com',
        required: true
    },
    primaryColor: {
        type: String,
        default: '#4f46e5',
        required: true
    },
    platformLogo: {
        type: String,
        default: ''
    },
    platformFees: {
        type: Number,
        default: 5,
        min: 0,
        max: 100,
        required: true
    },
    enableUserRegistration: {
        type: Boolean,
        default: true,
        required: true
    },
    socialLinks: {
        facebook: {
            type: String,
            default: 'https://facebook.com/yourpage'
        },
        twitter: {
            type: String,
            default: 'https://twitter.com/yourprofile'
        },
        instagram: {
            type: String,
            default: 'https://instagram.com/yourprofile'
        },
        linkedin: {
            type: String,
            default: 'https://linkedin.com/company/yourcompany'
        }
    },
    categories: [{
        name: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
platformSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema); 