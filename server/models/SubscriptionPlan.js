// src/models/SubscriptionPlan.js
// Configurable "Subscribe & Save" commitment plans. These define the BILLING
// COMMITMENT (1 / 3 / 6 / 12 months) and the discount a customer earns for
// committing for that duration. Discounts are NEVER hardcoded in the app — they
// are read from these documents at checkout time so admins can change them from
// the dashboard without a code deploy.
//
// NOTE: this is intentionally separate from a subscription's delivery frequency
// (daily / alternate_day / weekly / monthly) which lives on Subscription.planType.
// A customer chooses BOTH a delivery frequency AND a commitment plan.
const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // Commitment length in months (1 = Monthly, 3 = Quarterly, 6 = Half-Yearly, 12 = Yearly).
  durationMonths: { type: Number, required: true, min: 1 },
  // Percentage discount applied to the order total for committing to this plan.
  discountPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
  isActive: { type: Boolean, default: true },
  // Lower numbers are shown first in the UI.
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Fast lookup of the active plans in display order (the customer-facing list).
subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
