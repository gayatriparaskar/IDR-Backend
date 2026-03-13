const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');

// @desc    Create new content (Photo, Video, Tutorial, Event, Webinar)
// @route   POST /api/content
// @access  Private/Admin
exports.createContent = asyncHandler(async (req, res) => {
    const { 
        title, 
        description, 
        contentType, 
        category, 
        date,
        videoUrl,
        duration,
        eventDate,
        eventTime,
        location,
        registrationLink,
        imageUrl,
        tags,
        status,
        isFeatured,
        isTrending
    } = req.body;

    // Validate required fields
    if (!title || !description || !contentType || !category || !date) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Generate slug from title
    const slug = slugify(title, { 
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true
    });

    // Handle thumbnail upload
    let thumbnailUrl = '';
    if (req.file) {
        thumbnailUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.thumbnail) {
        thumbnailUrl = req.body.thumbnail;
    }

    // Create content object
    const contentData = {
        title: title.trim(),
        slug,
        description: description.trim(),
        thumbnail: thumbnailUrl,
        contentType,
        category: category.trim(),
        date: new Date(date),
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
        status: status || 'draft',
        isFeatured: isFeatured === true || isFeatured === 'true',
        isTrending: isTrending === true || isTrending === 'true'
    };

    // Add type-specific fields
    if (contentType === 'video' || contentType === 'tutorial') {
        if (videoUrl) contentData.videoUrl = videoUrl;
        if (duration) contentData.duration = duration;
    }

    if (contentType === 'event' || contentType === 'webinar') {
        if (eventDate) contentData.eventDate = new Date(eventDate);
        if (eventTime) contentData.eventTime = eventTime;
        if (location) contentData.location = location;
        if (registrationLink) contentData.registrationLink = registrationLink;
        if (contentType === 'webinar') contentData.isLive = false;
    }

    if (contentType === 'photo') {
        if (imageUrl) contentData.imageUrl = imageUrl;
    }

    // Set publishedAt if status is published
    if (contentData.status === 'published') {
        contentData.publishedAt = Date.now();
    }

    const content = await Content.create(contentData);

    res.status(201).json({
        success: true,
        data: content
    });
});

// @desc    Get all content with filtering
// @route   GET /api/content
// @access  Public
exports.getAllContent = asyncHandler(async (req, res) => {
    const { 
        contentType, 
        category, 
        status = 'published', 
        isFeatured, 
        isTrending,
    } = req.query;

    // Build query
    const query = {};
    
    if (contentType) query.contentType = contentType;
    if (category) query.category = category;
    // if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (isTrending !== undefined) query.isTrending = isTrending === 'true';

    const contents = await Content.find(query)
        .sort({ createdAt: -1 });

    const total = await Content.countDocuments(query);
    console.log(query,"query");
    console.log(contents,"content");
    res.status(200).json({
        success: true,
        data: contents,
    });
});

// @desc    Get content by slug
// @route   GET /api/content/:slug
// @access  Public
exports.getContentBySlug = asyncHandler(async (req, res) => {
    const content = await Content.findOne({ 
        slug: req.params.slug,
        status: 'published'
    });

    if (!content) {
        res.status(404);
        throw new Error('Content not found');
    }

    res.status(200).json({
        success: true,
        data: content
    });
});

// @desc    Get content by ID
// @route   GET /api/content/getById/:id
// @access  Public
exports.getContentById = asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error('Content not found');
    }

    res.status(200).json({
        success: true,
        data: content
    });
});

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Admin
exports.updateContent = asyncHandler(async (req, res) => {
    const { 
        title, 
        description, 
        category, 
        date,
        videoUrl,
        duration,
        eventDate,
        eventTime,
        location,
        registrationLink,
        imageUrl,
        tags,
        status,
        isFeatured,
        isTrending
    } = req.body;

    const content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error('Content not found');
    }

    // Handle thumbnail update
    let thumbnail = content.thumbnail;
    if (req.file) {
        // Delete old thumbnail
        if (content.thumbnail) {
            const oldImagePath = path.join(__dirname, '..', content.thumbnail);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        thumbnail = `/uploads/${req.file.filename}`;
    } else if (req.body.thumbnail && req.body.thumbnail !== 'undefined') {
        thumbnail = req.body.thumbnail;
    }

    // Create update object
    const updateData = {
        title: title || content.title,
        description: description || content.description,
        thumbnail,
        category: category || content.category,
        date: date ? new Date(date) : content.date,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : content.tags,
        status: status || content.status,
        isFeatured: isFeatured !== undefined ? isFeatured : content.isFeatured,
        isTrending: isTrending !== undefined ? isTrending : content.isTrending
    };

    // Update slug if title changed
    if (title && title !== content.title) {
        updateData.slug = slugify(title, { 
            lower: true,
            remove: /[*+~.()'"!:@]/g,
            strict: true
        });
    }

    // Update type-specific fields
    if (content.contentType === 'video' || content.contentType === 'tutorial') {
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (duration !== undefined) updateData.duration = duration;
    }

    if (content.contentType === 'event' || content.contentType === 'webinar') {
        if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
        if (eventTime !== undefined) updateData.eventTime = eventTime;
        if (location !== undefined) updateData.location = location;
        if (registrationLink !== undefined) updateData.registrationLink = registrationLink;
    }

    if (content.contentType === 'photo') {
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    }

    // Set publishedAt if status changed to published
    if (updateData.status === 'published' && content.status !== 'published') {
        updateData.publishedAt = Date.now();
    }

    const updatedContent = await Content.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedContent
    });
});

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Admin
exports.deleteContent = asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error('Content not found');
    }

    // Delete thumbnail file
    if (content.thumbnail) {
        const imagePath = path.join(__dirname, '..', content.thumbnail);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await content.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
    });
});

// @desc    Get content by type
// @route   GET /api/content/type/:contentType
// @access  Public
exports.getContentByType = asyncHandler(async (req, res) => {
    const { contentType } = req.params;
    const {category } = req.query;

    const query = { 
        contentType,
        status: 'published'
    };

    if (category) query.category = category;

    const contents = await Content.find(query)
        .sort({ createdAt: -1 });

    const total = await Content.countDocuments(query);

    res.status(200).json({
        success: true,
        data: contents,
    });
});

// @desc    Get featured content
// @route   GET /api/content/featured
// @access  Public
exports.getFeaturedContent = asyncHandler(async (req, res) => {
    const { contentType, limit = 5 } = req.query;

    const query = { 
        isFeatured: true,
        status: 'published'
    };

    if (contentType) query.contentType = contentType;

    const contents = await Content.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        data: contents
    });
});

// @desc    Get trending content
// @route   GET /api/content/trending
// @access  Public
exports.getTrendingContent = asyncHandler(async (req, res) => {
    const { contentType, limit = 5 } = req.query;

    const query = { 
        isTrending: true,
        status: 'published'
    };

    if (contentType) query.contentType = contentType;

    const contents = await Content.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        data: contents
    });
});
