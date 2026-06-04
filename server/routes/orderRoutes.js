// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/', protect, orderController.createOrder);
router.post('/:id/razorpay', protect, orderController.createRazorpayOrder);
router.post('/:id/verify-payment', protect, orderController.verifyPayment);
router.get('/myorders', protect, orderController.getMyOrders);
router.get('/status', orderController.getOrderStatus);


router.get('/completed', protect, admin, orderController.getCompletedOrders);


router.get('/unassigned', protect, admin, orderController.getUnassignedOrders);
router.get('/assigned', protect, admin, orderController.getAssignedOrders);

router.get('/cancelled', protect, admin, orderController.getCancelledOrders);

router.post('/revert-status', protect, admin, orderController.revertOrderStatus);

// Admin-only: cancel an order and refund the full amount to the user's wallet.
// Customers (role !== 'admin') are rejected by the `admin` middleware with 403,
// so a user cannot cancel/refund even by calling the API directly.
router.post('/:id/cancel-refund', protect, admin, orderController.adminCancelAndRefund);


module.exports = router;