// controllers/blogController.js
const Blog = require('../models/blogModal');
const asyncHandler = require('express-async-handler');

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private/Admin
exports.createBlog = asyncHandler(async (req, res) => {
    const { name, description, image, createdBy } = req.body;
    
     // Validate required fields
    if (!name || !description || !image || !createdBy) {
        res.status(400);
        throw new Error('Please provide all required fields: name, description, image, createdBy');
    } 
    const blog = await Blog.create({
        name,
        description,
        image,
        createdBy // Assuming you have user authentication middleware
    });

    res.status(201).json({
        success: true,
        data: blog
    });
});

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find().sort('-createdAt');
    res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs
    });
});

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
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

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
exports.updateBlog = asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;
    
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    blog.name = name || blog.name;
    blog.description = description || blog.description;
    blog.image = image || blog.image;

    const updatedBlog = await blog.save();

    res.status(200).json({
        success: true,
        data: updatedBlog
    });
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
exports.deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    await blog.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});