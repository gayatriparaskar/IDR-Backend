// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createUser, 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser,
    registerAdmin,
    updateUserRole,
    getDashboardStats,
    suspendUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register-admin', registerAdmin); // For initial admin setup

// Protected routes (all users)
router.use(protect); // All routes below require authentication

router.route('/')
    .get(admin, getUsers) // Admin only
    .post(admin, createUser); // Admin only

router.route('/:id')
    .get(admin, getUserById) // Admin only
    .put(admin, updateUser) // Admin only
    .delete(admin, deleteUser); // Admin only

// Admin specific routes
router.put('/:id/role', admin, updateUserRole); // Update user role
router.put('/:id/suspend', admin, suspendUser); // Suspend/Unsuspend user
router.get('/dashboard/stats', admin, getDashboardStats); // Dashboard statistics

module.exports = router;