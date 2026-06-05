// src/controllers/subscriptionController.js
// "Subscribe & Save" checkout. The customer commits to a plan (1/3/6/12 months)
// at a chosen delivery frequency and pays the discounted term price UPFRONT.
// Payment reuses the exact wallet + Razorpay split logic the one-off Order flow
// uses, so the gateway/wallet integrations are untouched and battle-tested.
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const walletService = require('../services/walletService');
const razorpayInstance = require('../config/razorpay');
const { computeCommitmentPricing } = require('../services/subscriptionPricingService');
const { getSchedulePreview } = require('../utils/subscriptionUtils');

const VALID_PLAN_TYPES = ['daily', 'alternate_day', 'weekly', 'monthly', 'custom'];
const VALID_SLOTS = ['morning', 'evening'];

// Resolve the wallet/Razorpay split for an amount, server-side. Mirrors the
// Order checkout so behaviour (and the frontend Razorpay handler) is identical.
async function resolvePaymentSplit({ userId, amount, paymentMethod }) {
  const method = paymentMethod || 'Razorpay';
  let walletAmountUsed = 0;
  let razorpayAmount = walletService.round2(amount);

  if (method === 'Wallet' || method === 'Hybrid') {
    const balance = await walletService.getBalance(userId);
    walletAmountUsed = walletService.round2(Math.min(balance, amount));
    if (method === 'Wallet' && walletAmountUsed < amount) {
      const err = new Error('Insufficient wallet balance for this subscription.');
      err.statusCode = 400;
      throw err;
    }
    razorpayAmount = walletService.round2(amount - walletAmountUsed);
  }

  const fullyPaidByWallet = walletAmountUsed > 0 && razorpayAmount <= 0;
  let resolvedMethod = 'Razorpay';
  if (walletAmountUsed > 0) resolvedMethod = razorpayAmount > 0 ? 'Hybrid' : 'Wallet';

  return { walletAmountUsed, razorpayAmount, fullyPaidByWallet, resolvedMethod };
}

function validateScheduleInput({ planType, deliverySlot, daysOfWeek }) {
  if (!VALID_PLAN_TYPES.includes(planType)) {
    return 'Invalid delivery frequency (planType).';
  }
  if (!VALID_SLOTS.includes(deliverySlot)) {
    return 'Invalid delivery slot. Choose morning or evening.';
  }
  if (planType === 'weekly' && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
    return 'Weekly deliveries require at least one day of the week.';
  }
  return null;
}

// @desc    Preview price + schedule WITHOUT creating anything
// @route   POST /api/subscriptions/preview
// @access  Private
exports.previewSubscription = async (req, res) => {
  try {
    const { items, planId, planType, frequency, daysOfWeek, deliverySlot, startDate } = req.body;

    const scheduleError = validateScheduleInput({ planType, deliverySlot, daysOfWeek });
    if (scheduleError) return res.status(400).json({ message: scheduleError });

    const computed = await computeCommitmentPricing({ items, planId, planType, frequency, daysOfWeek, startDate });

    const schedulePreview = getSchedulePreview(
      { planType, frequency, daysOfWeek, startDate: computed.startDate, skipDates: [], pauseUntil: null },
      computed.startDate,
      5
    );

    res.json({
      plan: {
        _id: computed.plan._id,
        name: computed.plan.name,
        durationMonths: computed.plan.durationMonths,
        discountPercentage: computed.plan.discountPercentage,
      },
      startDate: computed.startDate,
      endDate: computed.endDate,
      pricing: computed.pricing,        // { perDeliveryAmount, totalDeliveries, originalPrice, discountPercentage, discountedPrice }
      discountAmount: computed.discountAmount,
      schedulePreview,
    });
  } catch (error) {
    console.error('Subscription preview failed:', error.message);
    res.status(error.statusCode || 400).json({ message: error.message || 'Failed to preview subscription.' });
  }
};

// @desc    Create a subscription (status pending_payment) + start payment
// @route   POST /api/subscriptions
// @access  Private
exports.createSubscription = async (req, res) => {
  try {
    const {
      items, planId, planType, frequency, daysOfWeek, deliverySlot, startDate, paymentMethod,
      customerInfo, shippingAddress, customerLocation,
    } = req.body;

    const scheduleError = validateScheduleInput({ planType, deliverySlot, daysOfWeek });
    if (scheduleError) return res.status(400).json({ message: scheduleError });

    // A subscription is a recurring delivery — the delivery address & contact are
    // mandatory so admin/delivery staff know where to take the product.
    if (!customerInfo?.name?.trim() || !customerInfo?.phone?.trim()) {
      return res.status(400).json({ message: 'Please provide your name and phone number for delivery.' });
    }
    const pincode = shippingAddress?.postalCode?.trim();
    if (!shippingAddress?.address?.trim() || !/^\d{6}$/.test(pincode || '')) {
      return res.status(400).json({ message: 'Please provide a full delivery address with a valid 6-digit pincode.' });
    }

    // Recompute price + items entirely server-side (ignores any client amounts).
    const computed = await computeCommitmentPricing({ items, planId, planType, frequency, daysOfWeek, startDate });
    const amount = computed.pricing.discountedPrice;
    if (!(amount > 0)) {
      return res.status(400).json({ message: 'Computed subscription amount is invalid.' });
    }

    const split = await resolvePaymentSplit({ userId: req.user._id, amount, paymentMethod });

    const subscription = new Subscription({
      user: req.user._id,
      items: computed.items,
      planType,
      frequency,
      daysOfWeek: planType === 'weekly' ? daysOfWeek : undefined,
      deliverySlot,
      startDate: computed.startDate,
      customerInfo: { name: customerInfo.name.trim(), phone: customerInfo.phone.trim() },
      shippingAddress: {
        address: shippingAddress.address.trim(),
        city: shippingAddress.city?.trim() || '',
        postalCode: pincode,
      },
      customerLocation: (typeof customerLocation?.latitude === 'number' && typeof customerLocation?.longitude === 'number')
        ? { latitude: customerLocation.latitude, longitude: customerLocation.longitude }
        : undefined,
      subscriptionPlan: computed.plan._id,
      durationMonths: computed.durationMonths,
      endDate: computed.endDate,
      status: 'pending_payment',
      pricing: computed.pricing,
      billing: { billingCycle: 'prepaid' },
      payment: {
        status: 'pending',
        method: split.resolvedMethod,
        walletAmountUsed: split.walletAmountUsed,
        razorpayAmount: split.razorpayAmount,
        walletDebited: false,
      },
    });

    const created = await subscription.save();

    // Wallet-only: charge immediately (no gateway step can fail) and activate.
    if (split.fullyPaidByWallet) {
      try {
        await walletService.debitWallet({
          userId: req.user._id,
          amount: split.walletAmountUsed,
          reason: `Wallet payment for Subscription ${created._id}`,
        });
      } catch (debitErr) {
        await Subscription.findByIdAndDelete(created._id);
        return res.status(400).json({ message: debitErr.message || 'Wallet payment failed.' });
      }

      created.payment.walletDebited = true;
      created.payment.status = 'paid';
      created.payment.paidAt = new Date();
      created.status = 'active';
      created.billing.lastBilledAt = new Date();
      await created.save();

      return res.status(201).json({
        subscription: created,
        razorpayOrder: null,
        walletPaid: true,
        walletAmountUsed: split.walletAmountUsed,
        razorpayAmount: 0,
      });
    }

    // Otherwise prepare a Razorpay order for the remaining amount.
    let razorpayOrder = null;
    if (split.razorpayAmount > 0 && razorpayInstance) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: Math.round(split.razorpayAmount * 100),
          currency: 'INR',
          receipt: `sub_${created._id.toString()}`,
        });
        created.payment.razorpayOrderId = rzpOrder.id;
        await created.save();
        razorpayOrder = {
          key_id: process.env.RAZORPAY_KEY_ID?.trim(),
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          id: rzpOrder.id,
        };
      } catch (rzpErr) {
        console.error('Subscription Razorpay prep failed:', rzpErr);
      }
    }

    res.status(201).json({
      subscription: created,
      razorpayOrder,
      walletPaid: false,
      walletAmountUsed: split.walletAmountUsed,
      razorpayAmount: split.razorpayAmount,
    });
  } catch (error) {
    console.error('Subscription creation failed:', error.message);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Verify Razorpay payment, finalize wallet debit, activate subscription
// @route   POST /api/subscriptions/:id/verify-payment
// @access  Private
exports.verifySubscriptionPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');
  if (digest !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    // Only the owner may verify their own subscription payment.
    if (String(subscription.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized for this subscription.' });
    }

    // Idempotent: already paid → return as-is (guards duplicate verify calls).
    if (subscription.payment?.status === 'paid') {
      return res.json({ message: 'Payment already verified', subscription });
    }

    // HYBRID: finalize the wallet portion now that Razorpay succeeded. Claim the
    // debit atomically so two concurrent verifies can't debit the wallet twice.
    if (subscription.payment?.walletAmountUsed > 0) {
      const claimed = await Subscription.findOneAndUpdate(
        { _id: subscription._id, 'payment.walletDebited': { $ne: true } },
        { $set: { 'payment.walletDebited': true } },
        { new: true }
      );

      if (claimed) {
        try {
          await walletService.debitWallet({
            userId: subscription.user,
            amount: subscription.payment.walletAmountUsed,
            reason: `Partial payment for Subscription ${subscription._id}`,
          });
        } catch (debitErr) {
          await Subscription.updateOne({ _id: subscription._id }, { $set: { 'payment.walletDebited': false } });
          console.error('[Subscription Hybrid] Wallet finalize failed:', debitErr.message);
          return res.status(400).json({ message: 'Wallet balance changed; subscription could not be completed. ' + debitErr.message });
        }
      }
    }

    const activated = await Subscription.findByIdAndUpdate(
      subscription._id,
      {
        $set: {
          status: 'active',
          'payment.status': 'paid',
          'payment.razorpayPaymentId': razorpay_payment_id,
          'payment.paidAt': new Date(),
          'billing.lastBilledAt': new Date(),
        },
      },
      { new: true }
    );

    console.log(`[Subscription] ${activated._id} activated. Wallet ₹${activated.payment.walletAmountUsed} + Razorpay ₹${activated.payment.razorpayAmount}.`);
    res.json({ message: 'Subscription activated', subscription: activated });
  } catch (error) {
    console.error('Subscription verification failed:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    List the logged-in user's subscriptions
// @route   GET /api/subscriptions/mine
// @access  Private
exports.getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('subscriptionPlan', 'name durationMonths discountPercentage')
      .populate('items.product', 'name images');
    res.json(subscriptions);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a subscription
// @route   POST /api/subscriptions/:id/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (String(subscription.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for this subscription.' });
    }

    subscription.status = 'cancelled';
    subscription.cancellationReason = req.body?.reason || 'Cancelled by user';
    await subscription.save();
    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: list all subscriptions (oversight)
// @route   GET /api/subscriptions
// @access  Private/Admin
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone address')
      .populate('subscriptionPlan', 'name durationMonths discountPercentage')
      .populate('items.product', 'name');
    res.json(subscriptions);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
