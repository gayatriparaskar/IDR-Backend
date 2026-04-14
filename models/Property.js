const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Property name is required'],
        trim: true
    },
    images: [{
        url: { type: String, required: true },
        isFeatured: { type: Boolean, default: false }
    }],
    description: {
        type: String,
        required: [true, 'Property description is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'coming soon', 'live'],
        default: 'draft'
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: false },
        country: { type: String, default: 'India' },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    features: [{
        name: { type: String, required: false },
        value: { type: String, required: false }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
propertySchema.index({ name: 'text', description: 'text', 'address.city': 1, 'address.state': 1 });

// Virtual for featured image
propertySchema.virtual('featuredImage').get(function() {
    const featured = this.images.find(img => img.isFeatured);
    return featured ? featured.url : (this.images[0]?.url || '');
});

module.exports = mongoose.model('Property', propertySchema);