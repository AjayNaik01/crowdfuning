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
    kycData: {
        name: String,
        id: String,
        idType: {
            type: String,
            enum: ['AADHAR', 'PAN']
        },
        verifiedAt: Date,
        faceVerified: Boolean,
        similarityPercentage: Number
    },
    // Legacy KYC fields for backward compatibility
    kycDetails: {
        fullName: String,
        dateOfBirth: Date,
        address: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        phoneNumber: String,
        idType: {
            type: String,
            enum: ['aadhar', 'pan']
        },
        idNumber: String,
        idImage: String
    },
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

module.exports = mongoose.model('User', userSchema); 