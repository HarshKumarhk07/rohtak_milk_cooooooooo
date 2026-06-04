// src/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        size: { type: String, required: true }
    }],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true }
    },
    customerLocation: {
        latitude: { type: Number, },
        longitude: { type: Number, }
    },
    customerInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    status: { type: String, enum: ['pending', 'out for delivery', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, required: true, default: 'Razorpay' },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String }
    },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    isCancelled: { type: Boolean, required: true, default: false }, // New 
    // field
    isReplaced: { type: Boolean, default: false }, // New field
    isReturned: { type: Boolean, default: false },// New field for clarity
    deliveredAt: { type: Date },
    expectedDeliveryDate: { type: Date },
    deliveryWindowStart: { type: Date },
    deliveryWindowEnd: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ---- Wallet refund tracking (set when an admin cancels & refunds) ----
    // `walletRefunded` is the single source of truth that guards against
    // duplicate refunds — once true, the order can never be refunded again.
    walletRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },

    // ---- Wallet / hybrid payment tracking (set at checkout) ----
    // How much of this order was paid from the customer's wallet vs Razorpay.
    walletAmountUsed: { type: Number, default: 0 },
    razorpayAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
