// src/services/walletService.js
// Centralised, server-only wallet logic. The wallet balance is NEVER written
// from a controller or the client directly — every change goes through these
// functions so amounts are validated and a WalletTransaction is always logged.
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

// Money is stored in INR with up to 2 decimals. Round defensively to avoid
// floating-point drift accumulating in the balance.
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Credit the user's wallet and log a CREDIT transaction.
 * Balance is incremented atomically with $inc.
 */
async function creditWallet({ userId, orderId, productId, amount, reason }) {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Wallet credit amount must be a positive number');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: value } },
    { new: true }
  );
  if (!user) throw new Error('User not found for wallet credit');

  const balanceAfter = round2(user.walletBalance);
  const txn = await WalletTransaction.create({
    user: userId,
    order: orderId,
    product: productId,
    amount: value,
    type: 'CREDIT',
    reason,
    balanceAfter,
  });

  console.log(`[Wallet] CREDIT ₹${value} -> user ${userId} (reason: ${reason}). New balance ₹${balanceAfter}`);
  return { user, txn, balanceAfter };
}

/**
 * Debit the user's wallet and log a DEBIT transaction.
 * Uses a conditional atomic update so the balance can never go negative even
 * under concurrent requests (the update only matches when balance >= amount).
 */
async function debitWallet({ userId, orderId, productId, amount, reason }) {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Wallet debit amount must be a positive number');
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: value } },
    { $inc: { walletBalance: -value } },
    { new: true }
  );
  if (!user) {
    throw new Error('Insufficient wallet balance');
  }

  const balanceAfter = round2(user.walletBalance);
  const txn = await WalletTransaction.create({
    user: userId,
    order: orderId,
    product: productId,
    amount: value,
    type: 'DEBIT',
    reason,
    balanceAfter,
  });

  console.log(`[Wallet] DEBIT ₹${value} -> user ${userId} (reason: ${reason}). New balance ₹${balanceAfter}`);
  return { user, txn, balanceAfter };
}

/** Get the current balance for a user. */
async function getBalance(userId) {
  const user = await User.findById(userId).select('walletBalance');
  return round2(user?.walletBalance || 0);
}

/** Build the full wallet summary (balance, totals and history). */
async function getWalletSummary(userId) {
  const [user, transactions] = await Promise.all([
    User.findById(userId).select('walletBalance'),
    WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber totalPrice status')
      .populate('product', 'name'),
  ]);

  const totalCredits = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    balance: round2(user?.walletBalance || 0),
    totalCredits: round2(totalCredits),
    totalDebits: round2(totalDebits),
    transactions,
  };
}

module.exports = { creditWallet, debitWallet, getBalance, getWalletSummary, round2 };
