const mongoose = require('mongoose');
const crypto = require('crypto');

const eSignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    aadharNumber: {
        type: String,
        required: [true, 'Aadhar number is required'],
        trim: true,
        match: [/^\d{12}$/, 'Please enter a valid 12-digit Aadhar number']
    },
    phone:{
        type:String,
        required:[true,'Enter your Phone Number']
    },
    email:{
        type:String,
        required:[true,'Enter your Email'],
    },
    panNumber: {
        type: String,
        required: [true, 'PAN number is required'],
        trim: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    },
    llpName: {
        type: String,
        required: [true, 'LLP name is required'],
        trim: true
    },
    llpId: {
        type: String,
        required: [true, 'LLP ID is required'],
        trim: true
    },
    dateTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Security Fields - using environment secrets
    authToken: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const secret = process.env.AUTH_TOKEN_SECRET || 'default-auth-secret';
            const timestamp = Date.now().toString();
            const random = crypto.randomBytes(16).toString('hex');
            return crypto.createHmac('sha256', secret)
                .update(timestamp + random)
                .digest('hex');
        }
    },
    privateSalt: {
        type: String,
        required: true,
        default: function() {
            const saltSecret = process.env.PRIVATE_SALT_SECRET || 'default-salt-secret';
            const timestamp = Date.now().toString();
            const random = crypto.randomBytes(8).toString('hex');
            return crypto.createHmac('sha256', saltSecret)
                .update(timestamp + random)
                .digest('hex').substring(0, 32);
        }
    },
    whitelistedIPs: [{
        type: String,
        trim: true
    }],
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationCode: {
        type: String,
        trim: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isAadharVerified: {
        type: Boolean,
        default: false
    },
    isPanVerified: {
        type: Boolean,
        default: false
    },
    digitalSignature: {
        type: String, // Base64 encoded signature or signed PDF URL
        trim: true
    },
    signedAt: {
        type: Date
    },
    documents: [{
        type: String, // Document URLs
        trim: true
    }],
    remarks: {
        type: String,
        trim: true
    },
    
    // External E-Sign Integration Fields
    documentUrl: {
        type: String,
        trim: true
    },
    externalRequestId: {
        type: String,
        trim: true
    },
    externalStatus: {
        type: String,
        trim: true
    },
    externalProvider: {
        type: String,
        default: 'legality.com',
        trim: true
    },
    callbackReceived: {
        type: Boolean,
        default: false
    },
    
    // Additional Security Fields
    lastAccessedAt: {
        type: Date
    },
    accessCount: {
        type: Number,
        default: 0
    },
    failedAttempts: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockReason: {
        type: String,
        trim: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            const days = parseInt(process.env.ESIGN_EXPIRY_DAYS) || 30;
            return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});

// Add text index for search
eSignSchema.index({ 
    name: 'text', 
    aadharNumber: 'text', 
    panNumber: 'text', 
    llpName: 'text',
    llpId: 'text'
});

// Static method to get paginated e-sign requests
eSignSchema.statics.getPaginatedESigns = async function(page = 1, limit = 10, search = '', status = '') {
    const query = {};
    
    if (search) {
        query.$text = { $search: search };
    }
    
    if (status) {
        query.status = status;
    }

    const skip = (page - 1) * limit;

    const [eSigns, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        eSigns,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
        }
    };
};

module.exports = mongoose.model('ESign', eSignSchema);
