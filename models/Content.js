const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    thumbnail: {
        type: String,
        required: [true, 'Please provide a thumbnail image']
    },
    contentType: {
        type: String,
        required: [true, 'Please specify content type'],
        enum: ['photo', 'video', 'tutorial', 'event', 'webinar']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category']
    },
    date: {
        type: Date,
        required: [true, 'Please provide a date']
    },
    // For Videos and Tutorials
    videoUrl: {
        type: String
    },
    duration: {
        type: String // e.g., "10:30", "2h 15m"
    },
    // For Events & Webinars
    eventDate: {
        type: Date
    },
    eventTime: {
        type: String
    },
    location: {
        type: String
    },
    registrationLink: {
        type: String
    },
    isLive: {
        type: Boolean,
        default: false
    },
    // For Photos
    imageUrl: {
        type: String
    },
    // Common fields
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isTrending: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate slug from title before saving
contentSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        const slugify = require('slugify');
        this.slug = slugify(this.title, {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
            strict: true
        });
    }
    next();
});

module.exports = mongoose.model('Content', contentSchema);
