// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Password is required only for accounts that don't sign in via a federated
  // provider (e.g. Google). Google users authenticate through Firebase and
  // therefore have no local password.
  password: {
    type: String,
    required: function () {
      return !this.firebaseUid;
    },
  },
  // Firebase UID for Google (federated) accounts. Sparse + unique so that
  // multiple password-only users (without this field) don't collide.
  firebaseUid: { type: String, unique: true, sparse: true },
  // Profile photo URL (populated from Google photoURL for Google users).
  avatar: { type: String },
  phone: { type: String },
  // Saved default delivery address, editable from the profile page and used to
  // prefill subscription / order checkout.
  address: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
  },
  role: { type: String, enum: ['customer', 'admin', 'delivery'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  // Legacy counters (kept for backward compatibility with existing documents).
  loginAttempts: { type: Number, default: 0 },
  otpAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  // ---- Admin progressive-lockout security (admins only; see adminSecurityService) ----
  // failedAttempts counts consecutive wrong password/passkey attempts since the
  // last successful login or unlock. lockLevel is the escalation tier reached so
  // far (0 = never locked, 1 = 15m, 2 = 30m, 3 = 1h, 4 = 2h, 5+ = 24h). These are
  // only ever touched for users with role === 'admin'.
  failedAttempts: { type: Number, default: 0 },
  lockLevel: { type: Number, default: 0 },

  // Wallet balance (in INR). Credited on admin order cancellations and debited
  // when the customer pays with wallet. Never updated directly from the client
  // — only via the server-side wallet service so it cannot be manipulated.
  walletBalance: { type: Number, default: 0, min: 0 },

  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    pincode: { type: String }
  }],
}, { timestamps: true });



userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);