const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'super_admin', 'user'],
        default: 'user'
    },
    kycStatus: {
        type: String,
        enum: ['NOT_VERIFIED', 'VERIFIED', 'PENDING', 'FAILED'],
        default: 'NOT_VERIFIED'
    },
    kycData: [
        {
            idType: {
                type: String,
                enum: ['AADHAR', 'PAN']
            },
            name: String,
            dob: String,
            gender: String, // Aadhaar only
            aadhaar_number: String, // Aadhaar only
            father_name: String, // PAN only
            pan_number: String, // PAN only
            idCardImage: String, // filename or path
            faceImage: String, // filename or path
            verifiedAt: Date,
            status: String, // e.g. VERIFIED, FAILED
            verificationResult: String // raw result string from E-KYC-API
        }
    ],
    otp: {
        code: String,
        expiresAt: Date
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Add indexes for KYC data fields to improve duplicate ID check performance
userSchema.index({ 'kycData.aadhaar_number': 1 });
userSchema.index({ 'kycData.pan_number': 1 });

module.exports = mongoose.model('User', userSchema); 