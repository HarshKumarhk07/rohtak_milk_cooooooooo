// src/routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/announcementController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public — active banners for the rotating top bar.
router.get('/', ctrl.getActiveBanners);

// Admin management.
router.get('/admin', protect, admin, ctrl.getAllBanners);
router.post('/', protect, admin, ctrl.createBanner);
router.put('/:id', protect, admin, ctrl.updateBanner);
router.delete('/:id', protect, admin, ctrl.deleteBanner);

module.exports = router;
