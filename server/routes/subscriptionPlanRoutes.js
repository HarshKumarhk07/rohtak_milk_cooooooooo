// src/routes/subscriptionPlanRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionPlanController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public — active plans for the subscribe checkout.
router.get('/', ctrl.getActivePlans);

// Admin management.
router.get('/admin', protect, admin, ctrl.getAllPlans);
router.post('/', protect, admin, ctrl.createPlan);
router.put('/:id', protect, admin, ctrl.updatePlan);
router.delete('/:id', protect, admin, ctrl.deletePlan);

module.exports = router;
