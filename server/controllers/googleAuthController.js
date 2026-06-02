// server/controllers/googleAuthController.js
// Handles "Continue with Google" sign-in. The client signs in with Firebase,
// then sends the Firebase ID token here. We verify it with the Firebase Admin
// SDK, find-or-create the matching MongoDB user, and issue the SAME JWTs the
// rest of the app already uses (see authController.js) so all existing route
// protection, session handling and the refresh flow keep working unchanged.
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token generation kept identical to authController.js so the JWT architecture
// (payload, secret, expiry) is unchanged for Google users.
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

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Missing Firebase ID token' });
  }

  let decoded;
  try {
    // Verify the Firebase ID token. Throws on invalid/expired/tampered tokens.
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
  }

  try {
    const { uid, email, name, picture } = decoded;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no email' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Match an existing account either by Firebase UID or by email, so we never
    // create a duplicate for a user who already registered with email/password.
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: normalizedEmail }],
    });

    if (user) {
      // Link the Firebase UID to a pre-existing email/password account once.
      let needsSave = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        needsSave = true;
      }
      // Backfill avatar only if we don't already have one.
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      // Create a brand new customer account for this Google user.
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        firebaseUid: uid,
        avatar: picture,
        role: 'customer',
        isVerified: true,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Same refresh-token cookie settings as the email/password login flow.
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
