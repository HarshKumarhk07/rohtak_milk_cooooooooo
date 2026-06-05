// src/controllers/subscriptionPlanController.js
const SubscriptionPlan = require('../models/SubscriptionPlan');

// @desc    Public: list ACTIVE plans (for the subscribe checkout) in display order
// @route   GET /api/subscription-plans
// @access  Public
exports.getActivePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1, durationMonths: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: list ALL plans (active + inactive)
// @route   GET /api/subscription-plans/admin
// @access  Private/Admin
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({}).sort({ displayOrder: 1, durationMonths: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: create a plan
// @route   POST /api/subscription-plans
// @access  Private/Admin
exports.createPlan = async (req, res) => {
  try {
    const { name, durationMonths, discountPercentage, isActive, displayOrder } = req.body;

    if (!name || durationMonths === undefined) {
      return res.status(400).json({ message: 'name and durationMonths are required.' });
    }
    const months = Number(durationMonths);
    const discount = Number(discountPercentage);
    if (!Number.isFinite(months) || months < 1) {
      return res.status(400).json({ message: 'durationMonths must be a positive number.' });
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'discountPercentage must be between 0 and 100.' });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      durationMonths: months,
      discountPercentage: discount,
      isActive: isActive !== undefined ? !!isActive : true,
      displayOrder: Number(displayOrder) || 0,
      createdBy: req.user?._id,
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Failed to create subscription plan:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Admin: update a plan (name, duration, discount, status, order)
// @route   PUT /api/subscription-plans/:id
// @access  Private/Admin
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Subscription plan not found.' });

    const { name, durationMonths, discountPercentage, isActive, displayOrder } = req.body;

    if (name !== undefined) plan.name = String(name).trim();
    if (durationMonths !== undefined) {
      const months = Number(durationMonths);
      if (!Number.isFinite(months) || months < 1) {
        return res.status(400).json({ message: 'durationMonths must be a positive number.' });
      }
      plan.durationMonths = months;
    }
    if (discountPercentage !== undefined) {
      const discount = Number(discountPercentage);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return res.status(400).json({ message: 'discountPercentage must be between 0 and 100.' });
      }
      plan.discountPercentage = discount;
    }
    if (isActive !== undefined) plan.isActive = !!isActive;
    if (displayOrder !== undefined) plan.displayOrder = Number(displayOrder) || 0;

    const updated = await plan.save();
    res.json(updated);
  } catch (error) {
    console.error('Failed to update subscription plan:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Admin: delete a plan
// @route   DELETE /api/subscription-plans/:id
// @access  Private/Admin
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Subscription plan not found.' });
    res.json({ message: 'Subscription plan deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete subscription plan:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
