const Query = require('../models/Query');
const { validationResult } = require('express-validator');

// @desc    Create a new query
// @route   POST /api/queries
// @access  Public
exports.createQuery = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const query = await Query.create(req.body);

        res.status(201).json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all queries (with pagination and search)
// @route   GET /api/queries
// @access  Private/Admin
exports.getQueries = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const result = await Query.getPaginatedQueries(page, limit, search, status);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single query
// @route   GET /api/queries/:id
// @access  Private/Admin
exports.getQuery = async (req, res, next) => {
    try {
        const query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        res.status(200).json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update query status
// @route   PUT /api/queries/:id/status
// @access  Private/Admin
exports.updateQueryStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        const query = await Query.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!query) {
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        res.status(200).json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to query
// @route   POST /api/queries/:id/respond
// @access  Private/Admin
exports.respondToQuery = async (req, res, next) => {
    try {
        const { message } = req.body;
        
        const query = await Query.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    'response.message': message,
                    'response.respondedAt': new Date(),
                    'response.respondedBy': req.user ? req.user.id : null,
                    status: 'resolved'
                } 
            },
            { new: true, runValidators: true }
        );

        if (!query) {
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        // Here you would typically send an email to the user
        // with the response message

        res.status(200).json({
            success: true,
            data: query
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete query
// @route   DELETE /api/queries/:id
// @access  Private/Admin
exports.deleteQuery = async (req, res, next) => {
    try {
        const query = await Query.findByIdAndDelete(req.params.id);

        if (!query) {
            return res.status(404).json({
                success: false,
                error: 'Query not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};