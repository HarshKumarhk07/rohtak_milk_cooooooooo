// src/controllers/orderController.js
require('dotenv').config();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const moment = require('moment');
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings'); // IMPORT SystemSettings
const razorpayInstance = require('../config/razorpay');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const walletService = require('../services/walletService');
const { sendOrderCancelledEmail } = require('../services/emailService');

const REFUND_REASON = 'ORDER_CANCELLATION_REFUND';

exports.getOrderStatus = async (req, res) => {
  const currentTime = moment();
  const currentHour = currentTime.hour();
  if (currentHour < 12 || currentHour >= 18) {
    return res.json({ isOpen: false, reason: 'Order Closed. Orders are only accepted between 12:00 PM and 6:00 PM.' });
  }

  const settings = await SystemSettings.findOne() || { dailyOrderLimit: 50 };
  const startOfDay = moment().startOf('day').toDate();
  const endOfDay = moment().endOf('day').toDate();
  const todayOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });

  if (todayOrderCount >= settings.dailyOrderLimit) {
    return res.json({ isOpen: false, reason: 'Orders Full for Today' });
  }

  return res.json({ isOpen: true, reason: '' });
};

// Generic pincode validation for India (6 digits)
const isValidPincode = (pc) => pc && /^\d{6}$/.test(pc.toString().trim());

const normalizeSize = (size) => size ? size.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim() : '';

exports.createOrder = async (req, res) => {
  // Check Order Timing: 12:00 PM to 6:00 PM (18:00)
  const currentTime = moment();
  const currentHour = currentTime.hour();
  // Temporarily disabling the status check for testing (User request)
  // if (currentHour < 12 || currentHour >= 18) {
  //   return res.status(403).json({ message: 'Orders are only accepted between 12:00 PM and 6:00 PM.' });
  // }

  // Check Daily Order Limit
  const settings = await SystemSettings.findOne() || { dailyOrderLimit: 50 };
  const startOfDay = moment().startOf('day').toDate();
  const endOfDay = moment().endOf('day').toDate();
  const todayOrderCount = await Order.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });

  if (todayOrderCount >= settings.dailyOrderLimit) {
    return res.status(403).json({ message: 'Orders full for today. Please try again tomorrow.' });
  }

  const { orderItems, shippingAddress, totalPrice, customerLocation, customerInfo, paymentMethod } = req.body;

  const hasValidShippingAddress = shippingAddress && shippingAddress.postalCode && isValidPincode(shippingAddress.postalCode);

  const hasValidMapPin = customerLocation &&
    typeof customerLocation.latitude === 'number' &&
    typeof customerLocation.longitude === 'number' &&
    !Number.isNaN(customerLocation.latitude) &&
    !Number.isNaN(customerLocation.longitude);

  if (!hasValidShippingAddress && !hasValidMapPin) {
    return res.status(400).json({ message: 'Please provide a valid 6-digit pincode address OR set your delivery pin on the map.' });
  }

  // Pincode Validation: Only enforce if they provided a manual address but no map pin
  if (shippingAddress && shippingAddress.postalCode) {
    if (!isValidPincode(shippingAddress.postalCode)) {
      return res.status(400).json({ message: 'Delivery not available at your location. Please enter a valid 6-digit pincode.' });
    }
  }

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    const orderNumber = `ORD-${Date.now()}`;
    const validatedOrderItems = [];
    const stockUpdates = []; // applied only after the whole order is validated
    let serverTotal = 0;
    const nextDay = moment().add(1, 'day').startOf('day');
    const deliveryWindowStart = nextDay.clone().hour(10).minute(0).second(0).millisecond(0);
    const deliveryWindowEnd = nextDay.clone().hour(18).minute(0).second(0).millisecond(0);

    // 1) Validate every item and compute the authoritative total server-side
    //    from the line items (so a tampered totalPrice can't be trusted).
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found for item: ${item.name}`);
      }

      const variant = product.variants.find(v => normalizeSize(v.size) === normalizeSize(item.size));
      if (!variant) {
        throw new Error(`Variant not found for product: ${item.name}`);
      }

      if (variant.countInStock < item.qty) {
        throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${variant.countInStock}`);
      }

      const unitPrice = walletService.round2(item.price);
      serverTotal += unitPrice * item.qty;
      stockUpdates.push({ product, variant, qty: item.qty });

      validatedOrderItems.push({
        name: item.name,
        qty: item.qty,
        price: unitPrice,
        product: item.product,
        size: item.size
      });
    }
    serverTotal = walletService.round2(serverTotal);

    // 2) Resolve the payment split server-side. Never trust client amounts.
    const method = paymentMethod || 'Razorpay';
    let walletAmountUsed = 0;
    let razorpayAmount = serverTotal;
    if (method === 'Wallet' || method === 'Hybrid') {
      const balance = await walletService.getBalance(req.user._id);
      walletAmountUsed = walletService.round2(Math.min(balance, serverTotal));
      if (method === 'Wallet' && walletAmountUsed < serverTotal) {
        return res.status(400).json({ message: 'Insufficient wallet balance for this order.' });
      }
      razorpayAmount = walletService.round2(serverTotal - walletAmountUsed);
    }

    const fullyPaidByWallet = walletAmountUsed > 0 && razorpayAmount <= 0;
    const resolvedMethod = walletAmountUsed > 0 ? (razorpayAmount > 0 ? 'Hybrid' : 'Wallet') : 'Razorpay';

    // 3) Decrement stock now that the order has been fully validated.
    for (const u of stockUpdates) {
      u.variant.countInStock -= u.qty;
      await u.product.save();
    }

    const order = new Order({
      orderNumber,
      user: req.user._id,
      orderItems: validatedOrderItems,
      shippingAddress,
      totalPrice: serverTotal,
      customerLocation,
      // CORRECTED: Save customerInfo from the request body
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone
      },
      paymentMethod: resolvedMethod,
      walletAmountUsed,
      razorpayAmount,
      isPaid: fullyPaidByWallet,
      paidAt: fullyPaidByWallet ? Date.now() : undefined,
      paymentResult: fullyPaidByWallet
        ? { id: 'WALLET', status: 'success', update_time: String(Date.now()) }
        : undefined,
      expectedDeliveryDate: nextDay.toDate(),
      deliveryWindowStart: deliveryWindowStart.toDate(),
      deliveryWindowEnd: deliveryWindowEnd.toDate()
    });

    const createdOrder = await order.save();

    // 4) Debit the wallet portion atomically. If it fails, restore stock and
    //    remove the order so nothing is left in an inconsistent state.
    if (walletAmountUsed > 0) {
      try {
        await walletService.debitWallet({
          userId: req.user._id,
          orderId: createdOrder._id,
          amount: walletAmountUsed,
          reason: razorpayAmount > 0 ? 'ORDER_PAYMENT_PARTIAL' : 'ORDER_PAYMENT',
        });
      } catch (debitErr) {
        for (const u of stockUpdates) {
          u.variant.countInStock += u.qty;
          await u.product.save();
        }
        await Order.findByIdAndDelete(createdOrder._id);
        return res.status(400).json({ message: debitErr.message || 'Wallet payment failed.' });
      }
    }

    // 5) Prepare a Razorpay order for the remaining amount (if any).
    let razorpayOrder = null;
    if (razorpayAmount > 0) {
      try {
        if (razorpayInstance) {
          const options = {
            amount: Math.round(razorpayAmount * 100),
            currency: "INR",
            receipt: createdOrder._id.toString()
          };
          const rzpOrder = await razorpayInstance.orders.create(options);
          razorpayOrder = {
            key_id: process.env.RAZORPAY_KEY_ID?.trim(),
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            id: rzpOrder.id,
          };
        }
      } catch (rzpErr) {
        console.error('Initial Razorpay prep failed:', rzpErr);
      }
    }

    res.status(201).json({
      createdOrder,
      razorpayOrder,
      walletPaid: fullyPaidByWallet,
      walletAmountUsed,
      razorpayAmount,
    });
  } catch (error) {
    console.error('Order creation failed:', error.message);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
// exports.createOrder = async (req, res) => {
//     const { orderItems, shippingAddress, totalPrice, customerLocation } = req.body;
//     if (!orderItems || orderItems.length === 0) {
//         return res.status(400).json({ message: 'No order items' });
//     }

//     const session = await mongoose.startSession(); // CORRECTED: Initialize the session
//     session.startTransaction();

//     try {
//         const orderNumber = `ORD-${Date.now()}`;
//         const validatedOrderItems = [];

//         for (const item of orderItems) {
//             const product = await Product.findById(item.product).session(session);
//             if (!product) {
//                 throw new Error(`Product not found for item: ${item.name}`);
//             }

//             const variant = product.variants.find(v => v.size === item.size);
//             if (!variant) {
//                 throw new Error(`Variant not found for product: ${item.name}`);
//             }

//             if (variant.countInStock < item.qty) {
//                 throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${variant.countInStock}`);
//             }

//             // Decrement stock
//             variant.countInStock -= item.qty;
//             await product.save({ session });

//             validatedOrderItems.push({
//                 name: item.name,
//                 qty: item.qty,
//                 price: item.price,
//                 product: item.product,
//                 size: item.size
//             });
//         }

//         const order = new Order({
//             orderNumber,
//             user: req.user._id,
//             orderItems: validatedOrderItems,
//             shippingAddress,
//             totalPrice,
//             customerLocation,
//         });

//         const createdOrder = await order.save({ session });

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json(createdOrder);
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error('Order creation failed:', error.message);
//         res.status(500).json({ message: error.message || 'Server Error' });
//     }
// };


// exports.getCompletedOrders = async (req, res) => {
//   const { month, year } = req.query;
//   let filter = { isDelivered: true };

//   if (month && year) {
//     // Use a more robust date parsing method to handle time zones
//     const startOfMonth = moment().year(year).month(month - 1).startOf('month').toDate();
//     const endOfMonth = moment().year(year).month(month - 1).endOf('month').toDate();

//     console.log('Backend Filter Dates:');
//     console.log('Start of Month (Local Time):', startOfMonth);
//     console.log('End of Month (Local Time):', endOfMonth);

//     filter.deliveredAt = { $gte: startOfMonth, $lte: endOfMonth };
//   }

//   try {
//     const completedOrders = await Order.find(filter)
//       .populate('user', 'name email phone')
//       .populate('assignedTo', 'name email');

//     console.log('Raw data received from DB (pre-filter):', completedOrders.map(order => ({
//       orderId: order.orderNumber,
//       deliveredAt: order.deliveredAt
//     })));

//     res.json(completedOrders);
//   } catch (error) {
//     console.error('Backend Error:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };



exports.createRazorpayOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    const options = {
      amount: Math.round(order.totalPrice * 100),
      currency: "INR",
      receipt: order._id.toString()
    };
    try {
      if (!razorpayInstance) {
        throw new Error('Razorpay is not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
      }
      const razorpayOrder = await razorpayInstance.orders.create(options);

      // Crucially, send the key_id back to the frontend (always use the trimmed env var)
      const responseData = {
        key_id: process.env.RAZORPAY_KEY_ID?.trim(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        id: razorpayOrder.id,
      };

      res.status(201).json(responseData);
    } catch (error) {
      console.error('Razorpay Error:', error);
      const detail = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      res.status(500).json({ message: `Razorpay order creation failed: ${detail}` });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/:id/verify-payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest === razorpay_signature) {
    // Payment is successful, update the order
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'success',
        update_time: Date.now()
      };
      await order.save();
      res.json({ message: 'Payment successful', order });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } else {
    res.status(400).json({ message: 'Invalid signature' });
  }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    // Only show paid orders in My Orders as per user request
    const orders = await Order.find({ user: req.user._id, isPaid: true }).populate('orderItems.product', 'name images').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.revertOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    order.isDelivered = false;
    order.isCancelled = false;
    order.deliveredAt = null; // ✅ Reset deliveredAt
    if (status === 'pending') {
      order.assignedTo = null;
    }
    await order.save();
    res.status(200).json({ message: 'Order status reverted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};





// Unassigned Orders
exports.getUnassignedOrders = async (req, res) => {
  try {
    const unassignedOrders = await Order.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ],
      isDelivered: false,
      isCancelled: false,
      isPaid: true
    })
      .populate('user', 'email name')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(unassignedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Assigned Orders
exports.getAssignedOrders = async (req, res) => {
  try {
    const assignedOrders = await Order.find({
      assignedTo: { $ne: null },
      isDelivered: false,
      isCancelled: false,
      isPaid: true
    })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(assignedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




// Completed Orders
exports.getCompletedOrders = async (req, res) => {
  const { month, year } = req.query;
  let filter = { isDelivered: true };

  if (month && year) {
    const startOfMonth = moment().year(year).month(month - 1).startOf('month').toDate();
    const endOfMonth = moment().year(year).month(month - 1).endOf('month').toDate();
    filter.deliveredAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  try {
    const completedOrders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(completedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin cancels an order (out-of-stock) and refunds the full amount
//          to the customer's wallet. Admin-only. Idempotent — a given order can
//          only ever be refunded once.
// @route   POST /api/orders/:id/cancel-refund
// @access  Private/Admin
exports.adminCancelAndRefund = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  try {
    const order = await Order.findById(id).populate('user', 'name email walletBalance');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!order.user) {
      return res.status(400).json({ message: 'Order has no associated user to refund' });
    }
    if (order.isDelivered) {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled and refunded' });
    }
    if (order.walletRefunded) {
      return res.status(400).json({ message: 'This order has already been refunded to the wallet' });
    }

    // Refund only what the customer actually paid (server-side amounts only):
    //  - fully paid order  -> refund the full total
    //  - hybrid/abandoned  -> refund the wallet portion that was charged
    //  - nothing paid      -> just cancel, never credit money that wasn't paid
    let refundAmount = 0;
    if (order.isPaid) {
      refundAmount = walletService.round2(order.totalPrice);
    } else if (order.walletAmountUsed > 0) {
      refundAmount = walletService.round2(order.walletAmountUsed);
    }

    // Unpaid order: cancel without any wallet credit.
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      const cancelledUnpaid = await Order.findOneAndUpdate(
        { _id: id, isCancelled: false, isDelivered: false },
        {
          $set: {
            status: 'cancelled',
            isCancelled: true,
            cancelledBy: req.user._id,
            cancelReason: reason || 'Product(s) out of stock',
          },
        },
        { new: true }
      );
      try {
        await Delivery.findOneAndUpdate({ order: order._id }, { status: 'cancelled' });
      } catch (_) { /* no-op */ }
      return res.status(200).json({
        message: 'Order cancelled. No payment was made, so nothing was refunded.',
        order: cancelledUnpaid || order,
        refundAmount: 0,
        walletBalance: order.user.walletBalance || 0,
      });
    }

    // Atomically CLAIM the refund. Only one request can flip walletRefunded
    // from false -> true, so concurrent calls can never double-credit.
    const claimedOrder = await Order.findOneAndUpdate(
      { _id: id, walletRefunded: false, isDelivered: false },
      {
        $set: {
          status: 'cancelled',
          isCancelled: true,
          isDelivered: false,
          walletRefunded: true,
          refundAmount,
          refundedAt: new Date(),
          cancelledBy: req.user._id,
          cancelReason: reason || 'Product(s) out of stock',
        },
      },
      { new: true }
    );

    if (!claimedOrder) {
      // Another request already processed the refund in between.
      return res.status(400).json({ message: 'This order has already been refunded to the wallet' });
    }

    let balanceAfter;
    try {
      const result = await walletService.creditWallet({
        userId: order.user._id,
        orderId: order._id,
        amount: refundAmount,
        reason: REFUND_REASON,
      });
      balanceAfter = result.balanceAfter;
    } catch (creditErr) {
      // Roll back the claim so the refund can be retried safely.
      await Order.findByIdAndUpdate(id, {
        $set: {
          walletRefunded: false,
          refundAmount: 0,
          refundedAt: null,
        },
      });
      console.error('[Refund] Wallet credit failed, rolled back claim:', creditErr.message);
      return res.status(500).json({ message: 'Failed to credit wallet. Please try again.' });
    }

    // Keep any linked delivery record in sync so the order leaves active lists.
    try {
      await Delivery.findOneAndUpdate({ order: order._id }, { status: 'cancelled' });
    } catch (delErr) {
      console.error('[Refund] Failed to sync delivery record:', delErr.message);
    }

    console.log(`[Refund] Order ${order.orderNumber} cancelled by admin ${req.user._id}. ₹${refundAmount} credited to user ${order.user._id}. New balance ₹${balanceAfter}`);

    // Send the Brevo email (best-effort — never fail the refund if email fails).
    try {
      await sendOrderCancelledEmail({
        to: order.user.email,
        customerName: order.customerInfo?.name || order.user.name || 'Customer',
        orderNumber: order.orderNumber,
        refundAmount,
        walletBalance: balanceAfter,
      });
    } catch (mailErr) {
      console.error('[Refund] Cancellation email failed (refund still succeeded):', mailErr.message);
    }

    return res.status(200).json({
      message: 'Order cancelled and amount refunded to wallet',
      order: claimedOrder,
      refundAmount,
      walletBalance: balanceAfter,
    });
  } catch (error) {
    console.error('Admin cancel & refund failed:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Cancelled Orders
exports.getCancelledOrders = async (req, res) => {
  const { month, year } = req.query;
  let filter = { isCancelled: true };

  if (month && year) {
    const startOfMonth = moment().month(month - 1).year(year).startOf('month').toDate();
    const endOfMonth = moment().month(month - 1).year(year).endOf('month').toDate();
    filter.updatedAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  try {
    const cancelledOrders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'productId name images'
      });

    res.json(cancelledOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
