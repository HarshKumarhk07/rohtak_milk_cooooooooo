// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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