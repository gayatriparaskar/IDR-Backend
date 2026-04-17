// controllers/userController.js
const userModal = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // Build query
    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
        ];
    }

    if (role) {
        query.role = role;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        userModal.find(query)
            .select('-password')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit),
        userModal.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
        success: true,
        count: total,
        pagination: {
            page,
            limit,
            totalPages,
            total
        },
        data: users
    });
});

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await userModal.findById(req.params.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, minimumInvestment, role, status } = req.body;

    let user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (minimumInvestment !== undefined) user.minimumInvestment = minimumInvestment;
    if (role && ['user', 'admin', 'team'].includes(role)) user.role = role;
    if (status && ['active', 'inactive', 'suspended'].includes(status)) user.status = status;

    const updatedUser = await user.save();

    res.status(200).json({
        success: true,
        data: updatedUser
    });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Admin cannot delete their own account');
    }

    await user.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Register admin user
// @route   POST /api/users/register-admin
// @access  Public (for initial admin setup)
exports.registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, minimumInvestment, password, adminKey } = req.body;

    // Verify admin key for initial setup
    if (adminKey !== process.env.ADMIN_REGISTER_KEY) {
        res.status(403);
        throw new Error('Invalid admin registration key');
    }

    // Check if user already exists
    const existingUser = await userModal.findOne({ email });
    if (existingUser) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    // Create admin user
    const user = await userModal.create({
        name,
        email,
        phoneNumber,
        minimumInvestment,
        password,
        role: 'admin'
    });

    // Generate token
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
        success: true,
        token,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['user', 'admin', 'team'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role');
    }

    const user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Admin cannot change their own role');
    }

    user.role = role;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Get admin dashboard stats
// @route   GET /api/users/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const Property = require('../models/Property');
    const Query = require('../models/Query');
    const Blog = require('../models/blogModal');
    
    const [
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        recentUsers,
        totalInvestment,
        totalProperties,
        totalQueries,
        totalBlogs,
        totalTeamMembers
    ] = await Promise.all([
        userModal.countDocuments(),
        userModal.countDocuments({ role: 'admin' }),
        userModal.countDocuments({ role: 'user' }),
        userModal.find().sort('-createdAt').limit(5),
        userModal.aggregate([
            { $group: { _id: null, totalInvestment: { $sum: '$minimumInvestment' } }
        }]),
        Property.countDocuments(),
        Query.countDocuments(),
        Blog.countDocuments(),
        userModal.countDocuments({ role: { $in: ['admin', 'team'] } })
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalAdmins,
            totalRegularUsers,
            recentUsers,
            totalInvestment: totalInvestment[0]?.totalInvestment || 0,
            totalProperties,
            totalQueries,
            totalBlogs,
            totalTeamMembers,
            stats: {
                adminPercentage: totalUsers > 0 ? ((totalAdmins / totalUsers) * 100).toFixed(1) : 0,
                userPercentage: totalUsers > 0 ? ((totalRegularUsers / totalUsers) * 100).toFixed(1) : 0
            }
        }
    });
});

// @desc    Suspend/Unsuspend user
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin
exports.suspendUser = asyncHandler(async (req, res) => {
    const { suspended } = req.body;

    const user = await userModal.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Admin cannot suspend their own account');
    }

    user.status = suspended ? 'suspended' : 'active';
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});