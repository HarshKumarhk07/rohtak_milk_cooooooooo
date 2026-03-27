

const User = require('../models/User');
const otpService = require('../services/otpService');
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

    // Lockout check for admins (5 times OTP limit)
    if (user.role === 'admin' && user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: 'Too many attempts. Please try after 10 minutes' });
    }

    if (user.role === 'admin') {
      // Admin must provide BOTH otp and secretCode
      const isOtpValid = user.resetPasswordOTP && user.resetPasswordOTP === otp && user.resetPasswordExpires > Date.now();
      const isSecretValid = secretCode && secretCode === process.env.ADMIN_SECRET_CODE;

      if (!isOtpValid || !isSecretValid) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 5) {
          user.lockUntil = Date.now() + 10 * 60 * 1000; // 10 mins lock
          await user.save();
          try {
            await otpService.sendLockoutEmail(user.email);
          } catch (mailErr) {
            console.error('Failed to send lockout email', mailErr);
          }
          return res.status(403).json({ message: 'Too many attempts. Locked for 10 minutes' });
        }
        await user.save();
        return res.status(400).json({ message: 'Invalid OTP or Secret Code' });
      }
      
      // Reset attempts on success
      user.otpAttempts = 0;
    } else {
      // Standard customer check
      if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password, secretCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Lockout check for admins (5 times limit)
    if (user.role === 'admin' && user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: 'Too many attempts. Please try after 10 minutes' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      if (user.role === 'admin') {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + 10 * 60 * 1000; // 10 mins lock
          await user.save();
          
          // Send notification email
          try {
            await otpService.sendLockoutEmail(user.email);
          } catch (mailErr) {
            console.error('Failed to send lockout email', mailErr);
          }

          return res.status(403).json({ message: 'Too many attempts. Locked for 10 minutes' });
        }
        await user.save();
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Admin secret code check - Step 2
    if (user.role === 'admin') {
      if (!secretCode) {
        // Return a special status code indicating that we need the secret code
        return res.status(202).json({ 
          message: 'Password correct. Please enter Admin Secret Code to continue.', 
          needsSecretCode: true 
        });
      }

      if (secretCode !== process.env.ADMIN_SECRET_CODE) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + 10 * 60 * 1000; // 10 mins lock
          await user.save();
          try { await otpService.sendLockoutEmail(user.email); } catch (e) {}
          return res.status(403).json({ message: 'Too many attempts. Locked for 10 minutes' });
        }
        await user.save();
        return res.status(400).json({ message: 'Invalid Admin Secret Code' });
      }
    }

    // Reset attempts on successful login
    if (user.role === 'admin') {
      user.loginAttempts = 0;
      user.otpAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
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

