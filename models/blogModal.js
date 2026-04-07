// models/blogModel.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Please provide a blog title'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: { 
        type: String, 
        unique: true,
        required: true,
        trim: true
    },
    content: [{
        heading: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true
        },
        image:{type:String},
        order: {
            type: Number,
            default: 0
        }
    }],
    summary: {
        type: String,
        maxlength: [500, 'Summary cannot exceed 500 characters']
    },
    authorName: {
        type: String,
        required: [true, 'Please provide author name']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category']
    },
    tags: [{
        type: String,
        trim: true
    }],
    featuredImage: {
        type: String,
        required: [true, 'Please provide a featured image']
    },
    galleryImages: [{
        type: String
    }],
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
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
    readingTime: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create text index for search
blogSchema.index({ 
    title: 'text', 
    'content.heading': 'text',
    'content.content': 'text', 
    summary: 'text',
    authorName: 'text',
    tags: 'text'
});

module.exports = mongoose.model('Blog', blogSchema);