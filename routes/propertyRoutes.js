const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createProperty,
    getProperties,
    getProperty,
    updateProperty,
    deleteProperty,
    getPropertyTypes,
    getPropertyStatuses,
    getFeaturedProperties,
    getPropertiesByType
} = require('../controllers/propertyController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'properties');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, png, jpg, gif, webp)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 20 // Max 20 files
    },
    fileFilter: fileFilter
});

// Validation middleware
const validateProperty = [
    check('name', 'Property name is required').not().isEmpty().trim().escape(),
    check('description', 'Description is required').not().isEmpty().trim().escape(),
    check('address', 'Address is required').not().isEmpty(),
    check('features', 'Features must be an array').optional().custom((value) => {
        if (!value) return true;
        try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            return Array.isArray(parsed);
        } catch {
            return false;
        }
    })
];

// Public routes
router.get('/', getProperties);
router.get('/types', getPropertyTypes);
router.get('/statuses', getPropertyStatuses);
router.get('/featured', getFeaturedProperties);
router.get('/type/:type', getPropertiesByType);
router.get('/:id', getProperty);

// Protected routes (admin only)
// router.use(protect);
// router.use(authorize('admin'));

router.post(
    '/', 
    upload.array('images', 20),
    validateProperty,
    createProperty
);

router.put(
    '/:id',
    upload.array('images', 20),
    validateProperty,
    updateProperty
);

router.delete('/:id', deleteProperty);

module.exports = router;