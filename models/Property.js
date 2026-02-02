const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Property description is required'],
        trim: true
    },
    propertyType: {
        type: String,
        required: [true, 'Property type is required'],
        enum: ['Residential', 'Commercial', 'Industrial', 'Land', 'Other'],
        default: 'Residential'
    },
    status: {
        type: String,
        enum: ['For Sale', 'For Rent', 'Sold', 'Rented'],
        default: 'For Sale'
    },
    price: {
        type: Number,
        required: [true, 'Property price is required'],
        min: [0, 'Price cannot be negative']
    },
    priceSuffix: {
        type: String,
        default: 'month',
        enum: ['month', 'week', 'day', 'sqft', 'total']
    },
    area: {
        value: { type: Number, required: true },
        unit: { 
            type: String, 
            enum: ['sqft', 'sqm', 'marla', 'kanal', 'acre', 'hectare'],
            default: 'sqft'
        }
    },
    bedrooms: {
        type: Number,
        min: [0, 'Bedrooms cannot be negative']
    },
    bathrooms: {
        type: Number,
        min: [0, 'Bathrooms cannot be negative']
    },
    garages: {
        type: Number,
        min: [0, 'Garages cannot be negative']
    },
    yearBuilt: {
        type: Number,
        min: [1000, 'Invalid year'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'India' },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    features: [{
        name: { type: String, required: true },
        value: { type: String, required: true }
    }],
    images: [{
        url: { type: String, required: true },
        isFeatured: { type: Boolean, default: false }
    }],
    floorPlans: [{
        name: { type: String, required: true },
        description: { type: String },
        size: { type: String },
        rooms: { type: Number },
        bathrooms: { type: Number },
        price: { type: Number },
        image: { type: String }
    }],
    videoTour: {
        type: String
    },
    virtualTour: {
        type: String
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug from title before saving
propertySchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    next();
});

// Indexes for better query performance
propertySchema.index({ title: 'text', description: 'text', 'address.city': 1, 'address.state': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ propertyType: 1, status: 1 });

// Virtual for featured image
propertySchema.virtual('featuredImage').get(function() {
    const featured = this.images.find(img => img.isFeatured);
    return featured ? featured.url : (this.images[0]?.url || '');
});

// Static method to get paginated properties
propertySchema.statics.getPaginatedProperties = async function(query = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
        this.find(query)
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name email')
            .lean(),
        this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        properties,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
};

module.exports = mongoose.model('Property', propertySchema);