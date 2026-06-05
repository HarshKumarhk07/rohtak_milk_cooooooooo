// src/controllers/adminSecurityController.js
const User = require('../models/User');
const AdminSecurityLog = require('../models/AdminSecurityLog');
const adminSecurity = require('../services/adminSecurityService');

// @desc    Security logs (filterable + paginated)
// @route   GET /api/admin-security/logs?email=&eventType=&page=&limit=
// @access  Private/Admin
exports.getLogs = async (req, res) => {
  try {
    const { email, eventType } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const filter = {};
    if (email) filter.email = new RegExp(email.trim(), 'i');
    if (eventType) filter.eventType = eventType;

    const [logs, total] = await Promise.all([
      AdminSecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminSecurityLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Failed to fetch security logs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Currently locked admin accounts
// @route   GET /api/admin-security/locked
// @access  Private/Admin
exports.getLockedAccounts = async (req, res) => {
  try {
    const now = new Date();
    const accounts = await User.find({ role: 'admin', lockUntil: { $gt: now } })
      .select('name email failedAttempts lockLevel lockUntil');

    res.json(accounts.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      failedAttempts: u.failedAttempts || 0,
      lockLevel: u.lockLevel || 0,
      lockUntil: u.lockUntil,
      remainingMs: adminSecurity.remainingLockMs(u),
    })));
  } catch (error) {
    console.error('Failed to fetch locked accounts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    All admin accounts with their current security state (failed attempts,
//          lock level, lock status) — drives the dashboard overview.
// @route   GET /api/admin-security/accounts
// @access  Private/Admin
exports.getAdminAccounts = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('name email failedAttempts lockLevel lockUntil');

    res.json(admins.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      failedAttempts: u.failedAttempts || 0,
      lockLevel: u.lockLevel || 0,
      lockUntil: u.lockUntil,
      isLocked: adminSecurity.isLocked(u),
      remainingMs: adminSecurity.remainingLockMs(u),
    })));
  } catch (error) {
    console.error('Failed to fetch admin accounts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Manually unlock an admin account (clears attempts + lock + level)
// @route   POST /api/admin-security/unlock/:userId
// @access  Private/Admin
exports.unlockAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'Only admin accounts use the security lock system.' });
    }

    await adminSecurity.resetLockState(user, { resetLevel: true });
    await adminSecurity.logEvent({
      user,
      eventType: 'ACCOUNT_UNLOCKED',
      req,
      lockLevel: 0,
      details: `Manually unlocked by ${req.user?.email || 'admin'}`,
    });

    res.json({ message: 'Account unlocked successfully.', userId: user._id });
  } catch (error) {
    console.error('Failed to unlock account:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
