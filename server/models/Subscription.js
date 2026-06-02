const mongoose = require('mongoose');
const {
  calculateInitialDeliveryDate,
  calculateNextDeliveryDate,
  shouldSkipDeliveryDate,
  toUtcDateOnly,
} = require('../utils/subscriptionUtils');

const subscriptionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const billingSchema = new mongoose.Schema({
  billingCycle: {
    type: String,
    enum: ['prepaid', 'postpaid'],
    default: 'prepaid',
  },
  razorpaySubscriptionId: { type: String },
  razorpayPlanId: { type: String },
  lastBilledAt: { type: Date },
  paymentFailedCount: { type: Number, default: 0, min: 0 },
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: {
    type: [subscriptionItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'At least one subscription item is required.',
    },
    required: true,
  },
  planType: {
    type: String,
    enum: ['daily', 'alternate_day', 'weekly', 'monthly', 'custom'],
    required: true,
  },
  frequency: {
    type: Number,
    min: 1,
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6,
  }],
  deliverySlot: {
    type: String,
    enum: ['morning', 'evening'],
    required: true,
  },
  startDate: { type: Date, required: true },
  nextDeliveryDate: { type: Date, required: true },
  skipDates: [{ type: Date }],
  pauseUntil: { type: Date },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active',
    index: true,
  },
  billing: {
    type: billingSchema,
    default: () => ({}),
  },
  paymentMethodRef: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  cancellationReason: { type: String },
}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1, nextDeliveryDate: 1 });
subscriptionSchema.index({ nextDeliveryDate: 1, status: 1 });
subscriptionSchema.index({ 'billing.razorpaySubscriptionId': 1 }, { sparse: true });

subscriptionSchema.path('items').validate(function validateSubscriptionItems(items) {
  return Array.isArray(items) && items.length > 0;
}, 'At least one subscription item is required.');

subscriptionSchema.pre('validate', function normalizeSubscriptionDates(next) {
  if (this.startDate) {
    this.startDate = toUtcDateOnly(this.startDate);
  }

  if (this.nextDeliveryDate) {
    this.nextDeliveryDate = toUtcDateOnly(this.nextDeliveryDate);
  } else if (this.startDate) {
    this.nextDeliveryDate = calculateInitialDeliveryDate(this);
  }

  if (Array.isArray(this.skipDates)) {
    this.skipDates = this.skipDates.map((date) => toUtcDateOnly(date));
  }

  if (this.pauseUntil) {
    this.pauseUntil = toUtcDateOnly(this.pauseUntil);
  }

  next();
});

subscriptionSchema.methods.isPaused = function isPaused(referenceDate = new Date()) {
  if (this.status !== 'paused') {
    return false;
  }

  if (!this.pauseUntil) {
    return true;
  }

  return toUtcDateOnly(this.pauseUntil).getTime() >= toUtcDateOnly(referenceDate).getTime();
};

subscriptionSchema.methods.hasSkippedDate = function hasSkippedDate(candidateDate) {
  return shouldSkipDeliveryDate(this, candidateDate);
};

subscriptionSchema.methods.getNextDeliveryPreview = function getNextDeliveryPreview(referenceDate = new Date()) {
  return calculateNextDeliveryDate(this, referenceDate);
};

subscriptionSchema.methods.recalculateNextDeliveryDate = function recalculateNextDeliveryDate(referenceDate = new Date()) {
  this.nextDeliveryDate = calculateNextDeliveryDate(this, referenceDate);
  return this.nextDeliveryDate;
};

subscriptionSchema.methods.isDeliveryDueOn = function isDeliveryDueOn(candidateDate) {
  if (!candidateDate || !this.nextDeliveryDate) {
    return false;
  }

  return toUtcDateOnly(candidateDate).getTime() === toUtcDateOnly(this.nextDeliveryDate).getTime();
};

subscriptionSchema.statics.planTypes = Object.freeze(['daily', 'alternate_day', 'weekly', 'monthly', 'custom']);

module.exports = mongoose.model('Subscription', subscriptionSchema);