// scripts/seedSubscriptionPlans.js
// Seeds the four default "Subscribe & Save" commitment plans. Idempotent:
// re-running upserts by durationMonths and will NOT create duplicates. Existing
// plans are left untouched if already present (so admin edits are preserved).
//
//   Run:  npm run seed:plans     (from /server)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const DEFAULT_PLANS = [
  { name: 'Monthly Plan', durationMonths: 1, discountPercentage: 0, displayOrder: 1 },
  { name: 'Quarterly Plan', durationMonths: 3, discountPercentage: 5, displayOrder: 2 },
  { name: 'Half-Yearly Plan', durationMonths: 6, discountPercentage: 10, displayOrder: 3 },
  { name: 'Yearly Plan', durationMonths: 12, discountPercentage: 12, displayOrder: 4 },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const plan of DEFAULT_PLANS) {
      const existing = await SubscriptionPlan.findOne({ durationMonths: plan.durationMonths });
      if (existing) {
        console.log(`• Skipped (exists): ${existing.name} (${existing.durationMonths}m)`);
        continue;
      }
      const created = await SubscriptionPlan.create({ ...plan, isActive: true });
      console.log(`✓ Created: ${created.name} — ${created.durationMonths}m @ ${created.discountPercentage}% off`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
})();
