const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const { protect, authorize } = require('../middleware/auth');
const {
    createTeamMember,
    getTeamMembers,
    getTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getDepartments
} = require('../controllers/teamMemberController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'team');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'team-member-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, png, jpg, gif)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Validation middleware
const validateTeamMember = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('phone', 'Please include a valid phone number').matches(/^[0-9]{10}$/),
    check('position', 'Position is required').not().isEmpty().trim().escape(),
    check('description', 'Description must be a string').optional().trim().escape(),
    check('department', 'Department must be a string').optional().trim().escape(),
    check('skills', 'Skills must be a comma-separated list').optional().trim()
];

// Public routes
router.get('/', getTeamMembers);
router.get('/departments', getDepartments);
router.get('/:id', getTeamMember);

// Protected routes (admin only)
// router.use(protect);
// router.use(authorize('admin'));

router.post(
    '/', 
    upload.single('image'),
    validateTeamMember,
    createTeamMember
);

router.put(
    '/:id',
    upload.single('image'),
    validateTeamMember,
    updateTeamMember
);

router.delete('/:id', deleteTeamMember);

module.exports = router;