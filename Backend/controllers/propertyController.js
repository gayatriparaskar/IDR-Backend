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
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            title, description, propertyType, status, price, priceSuffix,
            area, bedrooms, bathrooms, garages, yearBuilt, address,
            features, floorPlans, videoTour, virtualTour, isFeatured
        } = req.body;

        // Parse JSON fields
        const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
        const featuresArray = features ? (typeof features === 'string' ? JSON.parse(features) : features) : [];
        const floorPlansArray = floorPlans ? (typeof floorPlans === 'string' ? JSON.parse(floorPlans) : floorPlans) : [];

        // Handle file uploads
        const images = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                images.push({
                    url: `/uploads/properties/${file.filename}`,
                    isFeatured: index === 0 // First image is featured by default
                });
            });
        }

        // Create property
        const property = await Property.create({
            title,
            description,
            propertyType,
            status,
            price,
            priceSuffix,
            area: typeof area === 'string' ? JSON.parse(area) : area,
            bedrooms,
            bathrooms,
            garages,
            yearBuilt,
            address: addressObj,
            features: featuresArray,
            floorPlans: floorPlansArray,
            videoTour,
            virtualTour,
            isFeatured,
            images,
            createdBy: req.user.id
        });

        const createdProperty = await Property.findById(property._id).populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: createdProperty
        });

    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
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
        const { 
            search, propertyType, status, minPrice, maxPrice, 
            bedrooms, bathrooms, city, featured 
        } = req.query;

        const query = {};

        // Search by title or description
        if (search) {
            query.$text = { $search: search };
        }

        // Filter by property type
        if (propertyType) {
            query.propertyType = propertyType;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Bedrooms filter
        if (bedrooms) {
            query.bedrooms = { $gte: Number(bedrooms) };
        }

        // Bathrooms filter
        if (bathrooms) {
            query.bathrooms = { $gte: Number(bathrooms) };
        }

        // City filter
        if (city) {
            query['address.city'] = new RegExp(city, 'i');
        }

        // Featured filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        const result = await Property.getPaginatedProperties(query, page, limit);

        res.status(200).json({
            success: true,
            ...result
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
        const property = await Property.findOne({
            $or: [
                { _id: req.params.id },
                { slug: req.params.id }
            ]
        }).populate('createdBy', 'name email phone');

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
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
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
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            return res.status(404).json({
                success: false,
                error: 'Property not found'
            });
        }

        // Handle file uploads
        const newImages = [...property.images];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                newImages.push({
                    url: `/uploads/properties/${file.filename}`,
                    isFeatured: false
                });
            });
        }

        // Update property
        const {
            title, description, propertyType, status, price, priceSuffix,
            area, bedrooms, bathrooms, garages, yearBuilt, address,
            features, floorPlans, videoTour, virtualTour, isFeatured,
            featuredImageIndex
        } = req.body;

        // Update fields
        if (title) property.title = title;
        if (description) property.description = description;
        if (propertyType) property.propertyType = propertyType;
        if (status) property.status = status;
        if (price) property.price = price;
        if (priceSuffix) property.priceSuffix = priceSuffix;
        if (area) property.area = typeof area === 'string' ? JSON.parse(area) : area;
        if (bedrooms) property.bedrooms = bedrooms;
        if (bathrooms) property.bathrooms = bathrooms;
        if (garages) property.garages = garages;
        if (yearBuilt) property.yearBuilt = yearBuilt;
        if (address) property.address = typeof address === 'string' ? JSON.parse(address) : address;
        if (features) property.features = typeof features === 'string' ? JSON.parse(features) : features;
        if (floorPlans) property.floorPlans = typeof floorPlans === 'string' ? JSON.parse(floorPlans) : floorPlans;
        if (videoTour) property.videoTour = videoTour;
        if (virtualTour) property.virtualTour = virtualTour;
        if (isFeatured !== undefined) property.isFeatured = isFeatured;

        // Update featured image if specified
        if (featuredImageIndex !== undefined && newImages[featuredImageIndex]) {
            newImages.forEach((img, idx) => {
                img.isFeatured = idx === Number(featuredImageIndex);
            });
        }

        property.images = newImages;
        await property.save();

        const updatedProperty = await Property.findById(property._id).populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: updatedProperty
        });

    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
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