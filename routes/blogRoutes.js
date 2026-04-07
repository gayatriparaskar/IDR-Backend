const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
    createBlog, 
    getBlogBySlug, 
    updateBlog, 
    deleteBlog,
    getBlogCategories,
    getBlogTags,
    getRelatedBlogs,
    getAllBlogs,
    getBlogById
} = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.route('/')
    // .get(getBlogs)
router.post('/',upload.fields([
  { name: "featuredImage", maxCount: 1 },// 👈 ADD THIS
{ name: 'contentImages', maxCount: 20 } // ✅ ADD THIS
]),createBlog);
router.get('/allBlogs', getAllBlogs);
router.get('/getById/:id', getBlogById);

router.get('/categories', getBlogCategories);
router.get('/tags', getBlogTags);

router.route('/:slug')
router.get('/getBlogBySlug/:slug',getBlogBySlug)
router.put('/updateBlog/:id',upload.fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "contentImages", maxCount: 20 },
  { name: "image", maxCount: 20 }
]),updateBlog);
    // .put(protect, admin, updateBlog)
router.delete('/deleteBlog/:id',deleteBlog);

router.get('/:slug/related', getRelatedBlogs);



module.exports = router;