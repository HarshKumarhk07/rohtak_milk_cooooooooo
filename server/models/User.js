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
  role: { type: String, enum: ['customer', 'admin', 'delivery'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  otpAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

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