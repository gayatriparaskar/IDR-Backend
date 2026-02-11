const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a blog name'],
        trim: true,
        maxlength: [100, 'Blog name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a blog description'],
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Please provide a blog image']
    },
    createdBy: {
       type:String,
       required:[true, 'Please provide a user Name']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields
});

// Create text index for search functionality
blogSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
