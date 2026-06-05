// src/models/AdminSecurityLog.js
// Append-only audit trail of admin authentication security events. One document
// is written for every relevant event (failed login, lock, reset, success,
// passkey failure/lock, manual unlock). Powers the Admin Security Dashboard.
const mongoose = require('mongoose');

const ADMIN_SECURITY_EVENTS = [
  'FAILED_LOGIN',
  'ACCOUNT_LOCKED',
  'PASSWORD_RESET',
  'SUCCESSFUL_LOGIN',
  'PASSKEY_FAILURE',
  'PASSKEY_LOCK',
  'ACCOUNT_UNLOCKED', // manual unlock by another admin
];

const adminSecurityLogSchema = new mongoose.Schema({
  // May be null when the attempt used an email that does not resolve to a user.
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, index: true },
  eventType: { type: String, enum: ADMIN_SECURITY_EVENTS, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  // The escalation level in effect at the time of the event (0 = not locked).
  lockLevel: { type: Number, default: 0 },
  // Free-form context, e.g. "Locked for 15 minutes" or the actor who unlocked.
  details: { type: String },
}, { timestamps: true });

adminSecurityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminSecurityLog', adminSecurityLogSchema);
module.exports.ADMIN_SECURITY_EVENTS = ADMIN_SECURITY_EVENTS;
