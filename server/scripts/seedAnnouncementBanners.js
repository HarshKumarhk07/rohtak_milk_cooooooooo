// scripts/seedAnnouncementBanners.js
// Seeds the default rotating announcement banners. Idempotent: re-running will
// NOT duplicate a banner whose message already exists.
//
//   Run:  npm run seed:banners    (from /server)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const AnnouncementBanner = require('../models/AnnouncementBanner');

const DEFAULT_BANNERS = [
  { message: 'Get the Subscription', link: '/subscribe', displayOrder: 1 },
  { message: 'Get Fresh Milk Products Daily At Your Doorstep', link: '', displayOrder: 2 },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const banner of DEFAULT_BANNERS) {
      const existing = await AnnouncementBanner.findOne({ message: banner.message });
      if (existing) {
        console.log(`• Skipped (exists): "${existing.message}"`);
        continue;
      }
      const created = await AnnouncementBanner.create({ ...banner, isActive: true });
      console.log(`✓ Created banner: "${created.message}"`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
})();
