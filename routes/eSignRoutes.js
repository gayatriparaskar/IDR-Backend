const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
    createESign,
    esignWebhook,
    getESignStatus
} = require('../controllers/eSignController');
const { protect} = require('../middleware/authMiddleware');
const { verifyESignAuth, checkWhitelistedIP } = require('../middleware/eSignAuth');

// Validation rules
const eSignValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit mobile number starting with 6-9'),
    
    body('aadharNumber')
        .trim()
        .notEmpty()
        .withMessage('Aadhar number is required')
        .matches(/^\d{12}$/)
        .withMessage('Please enter a valid 12-digit Aadhar number'),
    
    body('panNumber')
        .trim()
        .notEmpty()
        .withMessage('PAN number is required')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i)
        .withMessage('Please enter a valid PAN number (e.g., ABCDE1234F)'),
    
    body('llpName')
        .trim()
        .notEmpty()
        .withMessage('LLP name is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('LLP name must be between 3 and 200 characters'),
    
    body('llpId')
        .trim()
        .notEmpty()
        .withMessage('LLP ID is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('LLP ID must be between 3 and 50 characters')
];

// Routes
router.post('/', eSignValidation, createESign);
router.post('/webhook', esignWebhook);
router.get('/:id', getESignStatus);

module.exports = router;
