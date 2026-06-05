// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Logged-in user's own profile (name, phone, default delivery address).
router.get('/me', protect, userController.getMe);
router.put('/me', protect, userController.updateMe);

router.get('/delivery-partners', protect, admin, userController.getAllDeliveryPartners);

// Route to get all users (for admin dashboard)
router.get('/', protect, admin, userController.getAllUsers);

// Route to delete a user
router.delete('/:id', protect, admin, userController.deleteUser);

module.exports = router;