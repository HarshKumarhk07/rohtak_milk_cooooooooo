// src/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Literal routes first so they are never shadowed by '/:id' params.
router.post('/preview', protect, ctrl.previewSubscription);
router.get('/mine', protect, ctrl.getMySubscriptions);

// Admin oversight.
router.get('/', protect, admin, ctrl.getAllSubscriptions);

// Create + payment lifecycle.
router.post('/', protect, ctrl.createSubscription);
router.post('/:id/verify-payment', protect, ctrl.verifySubscriptionPayment);
router.post('/:id/cancel', protect, ctrl.cancelSubscription);

module.exports = router;
