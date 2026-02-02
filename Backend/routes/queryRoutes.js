const express = require('express');
const router = express.Router();
const {
    createQuery,
    getQueries,
    getQuery,
    updateQueryStatus,
    respondToQuery,
    deleteQuery
} = require('../controllers/queryController');
const {
    createQueryValidation,
    updateStatusValidation,
    respondToQueryValidation
} = require('../middleware/validators/queryValidators');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/', createQueryValidation, createQuery);

// Protected routes (admin only)
// router.use(protect);
// router.use(authorize('admin'));

router.get('/', getQueries);
router.get('/:id', getQuery);
router.put('/:id/status', updateStatusValidation, updateQueryStatus);
router.post('/:id/respond', respondToQueryValidation, respondToQuery);
router.delete('/:id', deleteQuery);

module.exports = router;