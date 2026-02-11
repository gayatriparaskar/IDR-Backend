const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('fs');
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
    check('title', 'Title is required').not().isEmpty().trim().escape(),
    check('description', 'Description is required').not().isEmpty().trim().escape(),
    check('propertyType', 'Property type is required').isIn(['Residential', 'Commercial', 'Industrial', 'Land', 'Other']),
    check('status', 'Status is required').isIn(['For Sale', 'For Rent', 'Sold', 'Rented']),
    check('price', 'Price is required and must be a number').isNumeric(),
    check('priceSuffix', 'Price suffix is required').isIn(['month', 'week', 'day', 'sqft', 'total']),
    check('area.value', 'Area value is required').isNumeric(),
    check('area.unit', 'Area unit is required').isIn(['sqft', 'sqm', 'marla', 'kanal', 'acre', 'hectare']),
    check('bedrooms', 'Bedrooms must be a number').optional().isInt({ min: 0 }),
    check('bathrooms', 'Bathrooms must be a number').optional().isInt({ min: 0 }),
    check('garages', 'Garages must be a number').optional().isInt({ min: 0 }),
    check('yearBuilt', 'Year built must be a valid year').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 }),
    check('address', 'Address is required').not().isEmpty(),
    check('features', 'Features must be an array').optional().isArray(),
    check('floorPlans', 'Floor plans must be an array').optional().isArray(),
    check('videoTour', 'Video tour must be a valid URL').optional().isURL(),
    check('virtualTour', 'Virtual tour must be a valid URL').optional().isURL(),
    check('isFeatured', 'isFeatured must be a boolean').optional().isBoolean()
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