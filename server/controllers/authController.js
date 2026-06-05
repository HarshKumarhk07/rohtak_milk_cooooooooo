

const User = require('../models/User');
const otpService = require('../services/otpService');
const adminSecurity = require('../services/adminSecurityService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory store for OTPs
const otpStore = {};

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

exports.requestOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Already registered user, please login' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    await otpService.sendOTP(email, otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] && otpStore[email] == otp) {
    delete otpStore[email];
    res.status(200).json({ message: 'OTP verified' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
};

exports.signup = async (req, res) => {
  const { name, email, password, phone, role, secretCode } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Already registered user, please login' });
    }

    const userRole = role || 'customer';

    user = new User({ name, email, password, phone, role: userRole });
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      token: accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await otpService.sendOTP(email, otp);
    res.status(200).json({ message: 'OTP sent to your email', role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, secretCode, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      // NOTE: a locked admin is still allowed to RESET their password — the
      // reset link in the security-alert email is the legitimate escape hatch.
      // The lock only blocks login, never the reset itself.
      const isOtpValid = user.resetPasswordOTP && user.resetPasswordOTP === otp && user.resetPasswordExpires > Date.now();
      const isSecretValid = secretCode && secretCode === process.env.ADMIN_SECRET_CODE;

      if (!isOtpValid || !isSecretValid) {
        // A bad reset attempt escalates the same lockout as login/passkey.
        const result = await adminSecurity.recordFailedAttempt({ user, req, kind: 'password' });
        if (result.locked) {
          return res.status(403).json({
            message: adminSecurity.lockedMessage(user),
            locked: true,
            lockLevel: result.lockLevel,
            remainingMs: result.remainingMs,
          });
        }
        return res.status(400).json({
          message: 'Invalid OTP or Secret Code',
          attemptsRemaining: result.attemptsRemaining,
        });
      }
    } else {
      // Standard customer check — customers are NEVER locked out.
      if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    if (user.role === 'admin') {
      // Successful reset fully clears the lockout (attempts + lockUntil + level)
      // and grants immediate login — no waiting period.
      await adminSecurity.resetLockState(user, { resetLevel: true, save: false });
      await user.save();
      await adminSecurity.logEvent({ user, eventType: 'PASSWORD_RESET', req, lockLevel: 0, details: 'Password reset; lockout cleared' });
    } else {
      await user.save();
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password, secretCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isAdmin = user.role === 'admin';

    // ── Admin lock gate ──────────────────────────────────────────────────
    // Block login (NOT password reset) while the progressive lock is active.
    // Customers/delivery users are never locked, so this only runs for admins.
    if (isAdmin && adminSecurity.isLocked(user)) {
      await adminSecurity.logEvent({ user, eventType: 'FAILED_LOGIN', req, details: 'Attempt while locked' });
      return res.status(403).json({
        message: adminSecurity.lockedMessage(user),
        locked: true,
        lockLevel: user.lockLevel || 0,
        remainingMs: adminSecurity.remainingLockMs(user),
      });
    }

    // ── Step 1: password ────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (isAdmin) {
        const result = await adminSecurity.recordFailedAttempt({ user, req, kind: 'password' });
        if (result.locked) {
          return res.status(403).json({
            message: adminSecurity.lockedMessage(user),
            locked: true,
            lockLevel: result.lockLevel,
            remainingMs: result.remainingMs,
          });
        }
        return res.status(400).json({ message: 'Invalid credentials', attemptsRemaining: result.attemptsRemaining });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ── Step 2: admin secret passkey ────────────────────────────────────
    if (isAdmin) {
      if (!secretCode) {
        return res.status(202).json({
          message: 'Password correct. Please enter Admin Secret Code to continue.',
          needsSecretCode: true,
        });
      }

      if (secretCode !== process.env.ADMIN_SECRET_CODE) {
        // Same progressive lockout applies to passkey failures (logged as PASSKEY_*).
        const result = await adminSecurity.recordFailedAttempt({ user, req, kind: 'passkey' });
        if (result.locked) {
          return res.status(403).json({
            message: adminSecurity.lockedMessage(user),
            locked: true,
            lockLevel: result.lockLevel,
            remainingMs: result.remainingMs,
          });
        }
        return res.status(400).json({ message: 'Invalid Admin Secret Code', attemptsRemaining: result.attemptsRemaining });
      }
    }

    // ── Success ─────────────────────────────────────────────────────────
    if (isAdmin) {
      await adminSecurity.resetLockState(user, { resetLevel: true });
      await adminSecurity.logEvent({ user, eventType: 'SUCCESSFUL_LOGIN', req, lockLevel: 0, details: 'Login successful' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token: accessToken,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh endpoint
exports.refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAccessToken = generateAccessToken(user);
    res.json({ token: newAccessToken });
  });
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

