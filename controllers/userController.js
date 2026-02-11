// controllers/userController.js
const userModal = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
exports.createUser = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, minimumInvestment } = req.body;

    const user = await userModal.create({
        name,
        email,
        phoneNumber,
        minimumInvestment
    });

    res.status(201).json({
        success: true,
        data: user
    });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await userModal.find().sort('-createdAt');
    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await userModal.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
exports.updateUser = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, minimumInvestment } = req.body;
    
    let user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.minimumInvestment = minimumInvestment || user.minimumInvestment;

    const updatedUser = await user.save();

    res.status(200).json({
        success: true,
        data: updatedUser
    });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    await user.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});