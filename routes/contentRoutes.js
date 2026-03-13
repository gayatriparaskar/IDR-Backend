const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
    createContent,
    getAllContent,
    getContentBySlug,
    getContentById,
    updateContent,
    deleteContent,
    getContentByType,
    getFeaturedContent,
    getTrendingContent
} = require('../controllers/contentController');

// Public routes
router.route('/')
    .get(getAllContent)
    .post(upload.single('thumbnail'), createContent);

router.get('/getById/:id', getContentById);
router.get('/type/:contentType', getContentByType);
router.get('/featured', getFeaturedContent);
router.get('/trending', getTrendingContent);

// Get content by slug (must be after /type/:contentType)
router.get('/:slug', getContentBySlug);

// Protected/Admin routes
router.put('/:id', upload.single('thumbnail'), updateContent);
router.delete('/:id', deleteContent);

module.exports = router;
