// src/services/subscriptionPricingService.js
// Server-authoritative pricing for "Subscribe & Save" commitments. The client
// NEVER supplies prices or discounts — everything here is recomputed from the
// Product variants and the admin-configured SubscriptionPlan, so a tampered
// payload cannot change what is charged.
const Product = require('../models/Product');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { round2 } = require('./walletService');
const {
  toUtcDateOnly,
  addUtcDays,
  addUtcMonths,
  countDeliveriesInRange,
} = require('../utils/subscriptionUtils');

const normalizeSize = (s) => String(s || '').trim().toLowerCase();

// Default the first delivery to tomorrow (UTC date-only) when not provided.
function defaultStartDate() {
  return addUtcDays(toUtcDateOnly(new Date()), 1);
}

// Validate the requested line items against live Product data and return the
// per-delivery amount plus normalized items ready to persist on a Subscription.
async function resolveItems(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('At least one subscription item is required.');
  }

  const items = [];
  let perDeliveryAmount = 0;

  for (const raw of rawItems) {
    const qty = Number(raw.qty);
    if (!Number.isFinite(qty) || qty < 1) {
      throw new Error('Each subscription item needs a quantity of at least 1.');
    }

    const product = await Product.findById(raw.product);
    if (!product) {
      throw new Error(`Product not found for item: ${raw.product}`);
    }

    const size = raw.size || raw.variantId;
    const variant = (product.variants || []).find((v) => normalizeSize(v.size) === normalizeSize(size));
    if (!variant) {
      throw new Error(`Variant "${size}" not found for product ${product.name}.`);
    }

    const price = round2(variant.price);
    perDeliveryAmount += price * qty;

    items.push({
      product: product._id,
      variantId: variant.size,
      qty,
      price,
    });
  }

  return { items, perDeliveryAmount: round2(perDeliveryAmount) };
}

// Compute the full commitment price for a given schedule + plan. Returns the
// pricing snapshot stored on the subscription and shown to the customer.
async function computeCommitmentPricing({
  items,
  planId,
  planType,
  frequency,
  daysOfWeek,
  startDate,
}) {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error('Selected subscription plan not found.');
  if (!plan.isActive) throw new Error('Selected subscription plan is not available.');

  const { items: resolvedItems, perDeliveryAmount } = await resolveItems(items);

  const start = startDate ? toUtcDateOnly(startDate) : defaultStartDate();
  // The commitment covers `durationMonths` from the start date (inclusive end).
  const endDate = addUtcDays(addUtcMonths(start, plan.durationMonths), -1);

  // A minimal subscription-like object the scheduler can count deliveries for.
  const scheduleConfig = {
    planType,
    frequency,
    daysOfWeek,
    startDate: start,
    skipDates: [],
    pauseUntil: null,
  };

  let totalDeliveries = countDeliveriesInRange(scheduleConfig, start, endDate);
  if (totalDeliveries < 1) totalDeliveries = 1; // never price a zero-delivery term

  const originalPrice = round2(perDeliveryAmount * totalDeliveries);
  const discountPercentage = round2(plan.discountPercentage);
  const discountedPrice = round2(originalPrice * (1 - discountPercentage / 100));
  const discountAmount = round2(originalPrice - discountedPrice);

  return {
    plan,
    items: resolvedItems,
    startDate: start,
    endDate,
    durationMonths: plan.durationMonths,
    pricing: {
      perDeliveryAmount,
      totalDeliveries,
      originalPrice,
      discountPercentage,
      discountedPrice,
    },
    discountAmount,
  };
}

module.exports = { resolveItems, computeCommitmentPricing, defaultStartDate, normalizeSize };
