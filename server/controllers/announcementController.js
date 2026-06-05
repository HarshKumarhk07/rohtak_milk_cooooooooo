// src/controllers/announcementController.js
const AnnouncementBanner = require('../models/AnnouncementBanner');

// @desc    Public: active banners in display order (drives the rotating top bar)
// @route   GET /api/announcements
// @access  Public
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await AnnouncementBanner.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json(banners);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: list ALL banners
// @route   GET /api/announcements/admin
// @access  Private/Admin
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await AnnouncementBanner.find({}).sort({ displayOrder: 1, createdAt: 1 });
    res.json(banners);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: create a banner
// @route   POST /api/announcements
// @access  Private/Admin
exports.createBanner = async (req, res) => {
  try {
    const { message, link, isActive, displayOrder } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Banner message is required.' });
    }

    const banner = await AnnouncementBanner.create({
      message: String(message).trim(),
      link: link ? String(link).trim() : '',
      isActive: isActive !== undefined ? !!isActive : true,
      displayOrder: Number(displayOrder) || 0,
      createdBy: req.user?._id,
    });

    res.status(201).json(banner);
  } catch (error) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Admin: update a banner
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateBanner = async (req, res) => {
  try {
    const banner = await AnnouncementBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Announcement not found.' });

    const { message, link, isActive, displayOrder } = req.body;
    if (message !== undefined) {
      if (!String(message).trim()) return res.status(400).json({ message: 'Banner message cannot be empty.' });
      banner.message = String(message).trim();
    }
    if (link !== undefined) banner.link = String(link).trim();
    if (isActive !== undefined) banner.isActive = !!isActive;
    if (displayOrder !== undefined) banner.displayOrder = Number(displayOrder) || 0;

    const updated = await banner.save();
    res.json(updated);
  } catch (error) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Admin: delete a banner
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await AnnouncementBanner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
