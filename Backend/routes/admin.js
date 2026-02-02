const express = require('express');
const router = express.Router();
const path = require('path');
// const { protect, authorize } = require('../middleware/auth');

// Admin routes
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

router.get('/queries', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/queries.html'));
});

// Add more admin routes as needed

module.exports = router;