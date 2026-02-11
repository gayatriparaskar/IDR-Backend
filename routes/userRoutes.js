// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    createUser, 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} = require('../controllers/userController');

// Public routes
router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;