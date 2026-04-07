const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const createLeadValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit mobile number starting with 6-9'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .withMessage('Status must be one of: new, contacted, qualified, converted, lost')
];

const updateLeadValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit mobile number starting with 6-9'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .withMessage('Status must be one of: new, contacted, qualified, converted, lost'),
  
  body('updateStatus')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .withMessage('Update status must be one of: new, contacted, qualified, converted, lost'),
  
  body('resolveMessage')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolve message cannot exceed 1000 characters')
];

// Public routes (if needed for lead creation from website)
router.post('/', createLeadValidation, createLead);

// Protected routes
// router.use(protect);

router.get('/', getAllLeads);
router.get('/stats', getLeadStats);
router.get('/:id', getLeadById);
router.put('/:id', updateLeadValidation, updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
