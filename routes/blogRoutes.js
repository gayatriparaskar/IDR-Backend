// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createBlog, 
    getBlogs, 
    getBlogById, 
    updateBlog, 
    deleteBlog 
} = require('../controllers/blogController');
// const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.route('/')
    .get(getBlogs);

router.route('/:id')
    .get(getBlogById);

// Protected Admin routes
router.route('/')
    .post(createBlog);

router.route('/:id')
    .put(updateBlog)
    .delete(deleteBlog);

module.exports = router;