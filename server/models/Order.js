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
        size: { type: String, required: true },
        // Per-item lifecycle status. Existing orders (created before this field
        // existed) read as undefined and are treated as CONFIRMED by the UI.
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'OUT_OF_STOCK', 'DELIVERED', 'CANCELLED'],
            default: 'CONFIRMED'
        },
        // Per-item refund guard — once true the item can never be refunded again.
        refunded: { type: Boolean, default: false },
        refundAmount: { type: Number, default: 0 }
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

    // ---- Wallet refund tracking ----
    // `walletRefunded` guards a FULL order cancellation refund (once true the
    // whole order can't be cancel-refunded again). Per-item out-of-stock
    // refunds are guarded individually by orderItems[].refunded.
    walletRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number, default: 0 }, // cumulative amount refunded
    refundStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
    refundReason: { type: String },
    refundedItems: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
        quantity: { type: Number },
        refundAmount: { type: Number }
    }],
    refundedAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },

    // ---- Wallet / hybrid payment tracking (set at checkout) ----
    // walletAmountUsed  = wallet amount RESERVED for this order (intended).
    // razorpayAmount    = remaining amount to be charged via Razorpay.
    // walletDebited     = becomes true ONLY once the wallet is actually charged
    //                     (immediately for wallet-only; after Razorpay success
    //                     for hybrid). Guards against double deductions.
    // razorpayPaid      = amount actually captured via Razorpay (set on verify).
    walletAmountUsed: { type: Number, default: 0 },
    razorpayAmount: { type: Number, default: 0 },
    walletDebited: { type: Boolean, default: false },
    razorpayPaid: { type: Number, default: 0 },
    paymentBreakdown: {
        walletUsed: { type: Number, default: 0 },
        razorpayPaid: { type: Number, default: 0 },
        method: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
