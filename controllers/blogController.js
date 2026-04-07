const Blog = require('../models/blogModal');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = asyncHandler(async (req, res) => {
    const { 
        title, 
        content, 
        summary, 
        authorName, 
        category, 
        tags, 
        featuredImage, 
        galleryImages, 
        status, 
        isFeatured, 
        isTrending,
        publishedAt,
        readingTime
    } = req.body;
     console.log(title,"blog title");
     console.log("Files received:", req.files);
     console.log("Content array:", content);
     
    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400);
        throw new Error('Please provide a valid title');
    }

    // Handle content - check if it's structured or simple
let contentArray = [];

if (Array.isArray(content)) {
    contentArray = content.map((item, index) => ({
        heading: item.heading || `Section ${index + 1}`,
        content: item.content || '',
        image: item.image || '',
        order: item.order ?? index
    }));
} 
else if (typeof content === 'string') {
    try {
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
            contentArray = parsed.map((item, index) => ({
                heading: item.heading || `Section ${index + 1}`,
                content: item.content || '',
                image: '',
                order: item.order ?? index
            }));
        } else {
            throw new Error();
        }
    } catch (err) {
        res.status(400);
        throw new Error('Invalid content format');
    }
}
else {
    res.status(400);
    throw new Error('Please provide valid content');
}


// ✅ 2. 👇 YAHI ADD KARNA HAI (IMPORTANT)
if (req.files && req.files.contentImages) {  
    contentArray = contentArray.map((item, index) => ({  
        ...item,  
        image: req.files.contentImages[index]  
            ? `/uploads/${req.files.contentImages[index].filename}`  
            : item.image || ''  
    }));  
}

// Also handle individual content images sent as 'image' field
// if (req.files && req.files.image) {
//     contentArray = contentArray.map((item, index) => {
//         const imageFile = req.files.image.find((file, fileIndex) => fileIndex === index);
//         if (imageFile) {
//             return {
//                 ...item,
//                 image: `/uploads/${imageFile.filename}`
//             };
//         }
//         return item;
//     });
// }

    // Generate slug from title
    const slug = slugify(title.trim(), { 
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true
    });

    // Handle tags - ensure it's always an array
    let tagsArray = [];
    if (tags) {
        tagsArray = Array.isArray(tags) 
            ? tags 
            : tags.split(',').map(tag => tag.trim());
    }

    // Handle featuredImage from uploaded files
    let featuredImageUrl = '';
    
    // Handle featuredImage from req.files (for upload.fields)
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
        featuredImageUrl = `/uploads/${req.files.featuredImage[0].filename}`;
    } else if (req.file) {
        // Fallback for upload.single
        featuredImageUrl = `/uploads/${req.file.filename}`;
    } else if (featuredImage && typeof featuredImage === 'string') {
        // If using direct URL
        featuredImageUrl = featuredImage.trim();
    }

    // If no featured image is provided and it's required
    if (!featuredImageUrl) {
        res.status(400);
        throw new Error('Please provide a featured image');
    }

    console.log("req.body", req.body);
    console.log("req.files", req.files);

    const blog = await Blog.create({
        title: title.trim(),
        slug,
        content: contentArray, // Use the structured content array
        summary: summary ? summary.trim() : '',
        authorName: authorName ? authorName.trim() : '',
        category: category ? category.trim() : '',
        tags: tagsArray,
        featuredImage: featuredImageUrl,
        galleryImages: Array.isArray(galleryImages) 
            ? galleryImages 
            : (galleryImages ? [galleryImages] : []),
        status: status === 'published' ? 'published' : 'draft',
        isFeatured: Boolean(isFeatured),
        isTrending: Boolean(isTrending),
        publishedAt: status === 'published' && !publishedAt ? Date.now() : publishedAt,
        readingTime: readingTime || Math.ceil(
            // Calculate reading time from structured content
            Array.isArray(content) 
                ? content.map(c => c.content).join(' ').split(/\s+/).length 
                : content.split(/\s+/).length
            / 200
        )
    });

    res.status(201).json({
        success: true,
        data: blog
    });
});

// @desc    Get all blogs with filtering
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res) => {
    const { 
        status, 
        category, 
        tag, 
        isFeatured, 
        isTrending,
        search,
        sort = '-createdAt',
        limit = 10,
        page = 1
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (isFeatured) query.isFeatured = isFeatured === 'true';
    if (isTrending) query.isTrending = isTrending === 'true';
    if (search) {
        query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
        success: true,
        count: blogs.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: blogs
    });
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = asyncHandler(async (req, res) => {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Increment view count
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    res.status(200).json({
        success: true,
        data: blog
    });
});

// @desc    Update blog
// @route   PUT /api/blogs/updateBlog/:id
// @access  Private/Admin
exports.updateBlog = asyncHandler(async (req, res) => {
    const { 
        title, 
        content, 
        summary, 
        authorName, 
        category, 
        tags, 
        galleryImages, 
        status, 
        isFeatured, 
        isTrending,
        publishedAt,
        readingTime
    } = req.body;

    // Try to find blog by ID
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Handle file upload if a new image is provided
    let featuredImage = blog.featuredImage;
    
    // Handle featuredImage from req.files (for upload.fields)
    if (req.files && req.files.featuredImage && req.files.featuredImage.length > 0) {
        // Delete old image if it exists
        if (blog.featuredImage) {
            const oldImagePath = path.join(__dirname, '..', blog.featuredImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        // Set new image path
        featuredImage = `/uploads/${req.files.featuredImage[0].filename}`;
    } else if (req.file) {
        // Fallback for upload.single
        // Delete old image if it exists
        if (blog.featuredImage) {
            const oldImagePath = path.join(__dirname, '..', blog.featuredImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        // Set new image path
        featuredImage = `/uploads/${req.file.filename}`;
    } else if (req.body.featuredImage && req.body.featuredImage !== 'undefined') {
        // If featuredImage is provided as a string (URL)
        featuredImage = req.body.featuredImage;
    }

    // Handle content - check if it's structured or simple
    let contentArray = [];
    if (content !== undefined && content !== null) {
        if (Array.isArray(content)) {
            // Structured content with headings
            contentArray = content;
        } else if (typeof content === 'string') {
            // Check if it's a JSON string representation of array
            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    contentArray = parsed;
                } else {
                    // Simple content - convert to structured format
                    contentArray = [{
                        heading: "Main Content",
                        content: content,
                        order: 0
                    }];
                }
            } catch (error) {
                // Not a JSON string, treat as simple content
                contentArray = [{
                    heading: "Main Content",
                    content: content,
                    order: 0
                }];
            }
        } else if (typeof content === 'object' && content !== null) {
            // Handle case where content comes as object (not string)
            contentArray = Array.isArray(content) ? content : [];
        }
    }

    // Handle content images if uploaded (for update)
    if (req.files && req.files.contentImages) {  
        contentArray = contentArray.map((item, index) => ({  
            ...item,  
            image: req.files.contentImages[index]  
                ? `/uploads/${req.files.contentImages[index].filename}`  
                : item.image || ''  
        }));  
    }

    // Also handle individual content images sent as 'image' field (for update)
    if (req.files && req.files.image) {
        contentArray = contentArray.map((item, index) => {
            const imageFile = req.files.image.find((file, fileIndex) => fileIndex === index);
            if (imageFile) {
                return {
                    ...item,
                    image: `/uploads/${imageFile.filename}`
                };
            }
            return item;
        });
    }

    // Create update object
    const updateData = {
        title: title || blog.title,
        content: contentArray.length > 0 ? contentArray : blog.content,
        summary: summary !== undefined ? summary : blog.summary,
        authorName: authorName || blog.authorName,
        category: category || blog.category,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : blog.tags,
        featuredImage,
        galleryImages: galleryImages ? (Array.isArray(galleryImages) ? galleryImages : [galleryImages]) : blog.galleryImages,
        status: status || blog.status,
        isFeatured: isFeatured !== undefined ? isFeatured : blog.isFeatured,
        isTrending: isTrending !== undefined ? isTrending : blog.isTrending,
        publishedAt: publishedAt || blog.publishedAt,
        readingTime: readingTime || blog.readingTime || Math.ceil(
            // Calculate reading time from structured content
            contentArray.length > 0 
                ? contentArray.map(c => c.content).join(' ').split(/\s+/).length 
                : (blog.content && Array.isArray(blog.content)) 
                    ? blog.content.map(c => c.content).join(' ').split(/\s+/).length 
                    : (typeof blog.content === 'string' ? blog.content.split(/\s+/).length : 0)
            / 200
        )
    };

    // If title changed, update slug
    if (title && title !== blog.title) {
        updateData.slug = slugify(title, { 
            lower: true,
            remove: /[*+~.()'"!:@]/g,
            strict: true
       
        });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: updatedBlog
    });
    
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get blog categories
// @route   GET /api/blogs/categories
// @access  Public
exports.getBlogCategories = asyncHandler(async (req, res) => {
    const categories = await Blog.distinct('category');
    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Get blog tags
// @route   GET /api/blogs/tags
// @access  Public
exports.getBlogTags = asyncHandler(async (req, res) => {
    const tags = await Blog.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
        success: true,
        count: tags.length,
        data: tags
    });
});

// @desc    Get related blogs
// @route   GET /api/blogs/:slug/related
// @access  Public
exports.getRelatedBlogs = asyncHandler(async (req, res) => {
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    const relatedBlogs = await Blog.find({
        _id: { $ne: blog._id },
        $or: [
            { category: blog.category },
            { tags: { $in: blog.tags } }
        ],
        status: 'published'
    })
    .sort({ createdAt: -1 })
    .limit(3);

    res.status(200).json({
        success: true,
        count: relatedBlogs.length,
        data: relatedBlogs
    });
});

exports.getAllBlogs = asyncHandler(async (req, res) => {
    try {
        const allBlogs = await Blog.find().sort('-createdAt');
        console.log(allBlogs, "all blogs");
        res.status(200).json({
            success: true,
            count: allBlogs.length,
            data: allBlogs
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({
            success: false,
            error: "Error fetching blogs",
            message: error.message
        });
    }
});

// @desc    Get single blog by ID
// @route   GET /api/blogs/getById/:id
// @access  Public
exports.getBlogById = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    res.status(200).json({
        success: true,
        data: blog
    });
});