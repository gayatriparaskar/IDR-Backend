const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  generateAnnexure,
  downloadAnnexure
} = require('../controllers/annexureController');

// @route   POST /api/generate-annexure
// @desc    Generate annexure PDF
// @access  Public
router.post('/generate-annexure', [
  check('investorName', 'Investor name is required').not().isEmpty(),
  check('investorId', 'Investor ID is required').not().isEmpty(),
  check('panAadhaar', 'PAN/Aadhaar is required').not().isEmpty(),
  check('propertyId', 'Property ID is required').not().isEmpty(),
  check('propertyName', 'Property name is required').not().isEmpty(),
  check('investAmount', 'Investment amount is required').not().isEmpty()
], generateAnnexure);

// @route   GET /api/download/:id
// @desc    Download annexure PDF
// @access  Public
router.get('/download/:id', downloadAnnexure);

module.exports = router;