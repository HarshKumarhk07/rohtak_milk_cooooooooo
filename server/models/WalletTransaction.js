// src/models/WalletTransaction.js
const mongoose = require('mongoose');

// A complete, immutable history of every wallet movement. One document is
// written for each CREDIT (e.g. refund on cancellation) or DEBIT (e.g. wallet
// payment at checkout). The `order` + `type` + `reason` combination is used to
// guarantee a refund is only ever credited once per cancelled order.
const walletTransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    // Optional — set for item-level (partial) refunds so the history can show
    // exactly which product was refunded.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    reason: { type: String, required: true },
    // Wallet balance immediately AFTER this transaction was applied. Useful for
    // auditing and for showing a running balance in the wallet history.
    balanceAfter: { type: Number, required: true },
}, { timestamps: true });

// Prevent duplicate refund credits for the same order. A partial unique index
// only applies to refund credits, so multiple DEBITs / non-refund entries for
// the same order are still allowed.
walletTransactionSchema.index(
    { order: 1, type: 1, reason: 1 },
    {
        unique: true,
        partialFilterExpression: { type: 'CREDIT', reason: 'ORDER_CANCELLATION_REFUND' },
    }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
