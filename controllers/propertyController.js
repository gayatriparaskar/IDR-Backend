const Property = require('../models/Property');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private/Admin
exports.createProperty = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Remove uploaded files if validation fails
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
            }
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            name, description, address, features, category
        } = req.body;

        // Parse JSON fields
        const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
        const featuresArray = features ? (typeof features === 'string' ? JSON.parse(features) : features) : [];

        // Handle file uploads - support both formats
        const images = [];
        
        // Handle frontend format: imageFeatured_0, imageFeatured_1, etc.
        if (req.files) {
            // Find all image files and their featured status
            const imageFiles = Object.keys(req.files).filter(key => key.startsWith('imageFeatured_'));
            
            imageFiles.forEach((key, index) => {
                const file = req.files[key];
                if (file && file.length > 0) {
                    const featuredStatus = key.includes('_0') ? true : false;
                    images.push({
                        url: `/uploads/properties/${file[0].filename}`,
                        isFeatured: featuredStatus
                    });
                }
            });
        }

        // Fallback to standard format if no files found
        if (images.length === 0 && req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                images.push({
                    url: `/uploads/properties/${file.filename}`,
                    isFeatured: index === 0 // First image is featured by default
                });
            });
        }

        // Create property
        const property = await Property.create({
            name,
            description,
            images,
            address: addressObj,
            features: featuresArray,
            category
        });

        const createdProperty = await Property.findById(property._id);
         console.log(createdProperty,"Create")
        res.status(201).json({
            success: true,
            data: createdProperty
        });

    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }
        next(error);
    }
};

// @desc    Get all properties (with pagination and filters)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const { search, city } = req.query;

        const query = {};

        // Search by name or description
        if (search) {
            query.$text = { $search: search };
        }

        // City filter
        if (city) {
            query['address.city'] = new RegExp(city, 'i');
        }

        const skip = (page - 1) * limit;

        const [properties, total] = await Promise.all([
            Property.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Property.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            properties,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get single property by ID or slug
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }

        res.status(200).json({
            success: true,
            data: property
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private/Admin
exports.updateProperty = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
            }
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        let property = await Property.findById(req.params.id);

        if (!property) {
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
            }
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }

        // Update property
        const {
            name, description, status, address, features,
            deletedImages, // Array of image URLs to delete
            featuredImageIndex,category
        } = req.body;

        // Parse JSON fields
        const addressObj = address ? (typeof address === 'string' ? JSON.parse(address) : address) : property.address;
        const featuresArray = features ? (typeof features === 'string' ? JSON.parse(features) : features) : property.features;

        // Handle image deletions
        let newImages = [...property.images];
        if (deletedImages) {
            const imagesToDelete = typeof deletedImages === 'string' ? JSON.parse(deletedImages) : deletedImages;
            
            // Delete files from filesystem
            imagesToDelete.forEach(imageUrl => {
                const imagePath = path.join(__dirname, '..', 'public', imageUrl);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
            
            // Remove from images array
            newImages = newImages.filter(img => !imagesToDelete.includes(img.url));
        }

        // Handle new file uploads - support both formats
        if (req.files) {
            // Handle frontend format: imageFeatured_0, imageFeatured_1, etc.
            const imageFiles = Object.keys(req.files).filter(key => key.startsWith('imageFeatured_'));
            
            imageFiles.forEach((key, index) => {
                const file = req.files[key];
                if (file && file.length > 0) {
                    const featuredStatus = key.includes('_0') ? true : false;
                    newImages.push({
                        url: `/uploads/properties/${file[0].filename}`,
                        isFeatured: featuredStatus
                    });
                }
            });
            
            // Fallback to standard format if no files found
            if (imageFiles.length === 0 && req.files.length > 0) {
                req.files.forEach((file, index) => {
                    newImages.push({
                        url: `/uploads/properties/${file.filename}`,
                        isFeatured: false
                    });
                });
            }
        }

        // Update fields
        if (name) property.name = name;
        if (description) property.description = description;
        if (category) property.category = category;
        if (status) property.status = status;
        if (address) property.address = addressObj;
        if (features) property.features = featuresArray;

        // Update featured image if specified
        if (featuredImageIndex !== undefined && newImages[featuredImageIndex]) {
            newImages.forEach((img, idx) => {
                img.isFeatured = idx === Number(featuredImageIndex);
            });
        }

        property.images = newImages;
        await property.save();

        const updatedProperty = await Property.findById(property._id);

        res.status(200).json({
            success: true,
            data: updatedProperty
        });

    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }
        next(error);
    }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private/Admin
exports.deleteProperty = async (req, res, next) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }

        // Delete associated images
        property.images.forEach(image => {
            const imagePath = path.join(__dirname, '..', 'public', image.url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        // Delete floor plan images
        property.floorPlans.forEach(plan => {
            if (plan.image) {
                const floorPlanPath = path.join(__dirname, '..', 'public', plan.image);
                if (fs.existsSync(floorPlanPath)) {
                    fs.unlinkSync(floorPlanPath);
                }
            }
        });

        await property.remove();

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get property types
// @route   GET /api/properties/types
// @access  Public
exports.getPropertyTypes = async (req, res, next) => {
    try {
        const types = await Property.schema.path('propertyType').enumValues;
        res.status(200).json({
            success: true,
            data: types
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get property statuses
// @route   GET /api/properties/statuses
// @access  Public
exports.getPropertyStatuses = async (req, res, next) => {
    try {
        const statuses = await Property.schema.path('status').enumValues;
        res.status(200).json({
            success: true,
            data: statuses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured properties
// @route   GET /api/properties/featured
// @access  Public
exports.getFeaturedProperties = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const properties = await Property.find({ isFeatured: true, isActive: true })
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('title price priceSuffix address images slug');

        res.status(200).json({
            success: true,
            data: properties
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get properties by type
// @route   GET /api/properties/type/:type
// @access  Public
exports.getPropertiesByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const limit = parseInt(req.query.limit) || 6;
        
        const properties = await Property.find({ 
            propertyType: type,
            isActive: true 
        })
        .limit(limit)
        .sort({ isFeatured: -1, createdAt: -1 })
        .select('title price priceSuffix address images slug propertyType status');

        res.status(200).json({
            success: true,
            data: properties
        });
    } catch (error) {
        next(error);
    }
};