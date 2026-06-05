// src/models/AnnouncementBanner.js
// Drives the rotating announcement bar at the top of the site (the strip that
// used to be a hardcoded green marquee in the Header). Admins manage these from
// the dashboard so marketing copy can change without a deploy.
const mongoose = require('mongoose');

const announcementBannerSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true },
  // Optional click-through (e.g. "/subscribe"). When set the banner becomes a link.
  link: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  // Lower numbers rotate first.
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

announcementBannerSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('AnnouncementBanner', announcementBannerSchema);
