const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    image: {
        type: String,
        default: 'default-avatar.jpg'
    },
    description: {
        type: String,
        trim: true
    },
    socialLinks: {
        linkedin: { type: String, trim: true },
        twitter: { type: String, trim: true },
        facebook: { type: String, trim: true },
        instagram: { type: String, trim: true }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    skills: [{
        type: String,
        trim: true
    }],
    department: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
teamMemberSchema.index({ name: 'text', email: 'text', position: 'text', department: 'text' });

// Static method to get paginated team members
teamMemberSchema.statics.getPaginatedMembers = async function(query = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        members,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
};

module.exports = mongoose.model('TeamMember', teamMemberSchema);