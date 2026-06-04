// src/controllers/walletController.js
const walletService = require('../services/walletService');

// @desc    Get the logged-in user's wallet (balance, totals, transaction history)
// @route   GET /api/wallet
// @access  Private
exports.getMyWallet = async (req, res) => {
  try {
    const summary = await walletService.getWalletSummary(req.user._id);
    res.json(summary);
  } catch (error) {
    console.error('Failed to load wallet:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
