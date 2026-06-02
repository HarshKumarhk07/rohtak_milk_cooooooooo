require('dotenv').config();

const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const { calculateNextDeliveryDate } = require('../utils/subscriptionUtils');

function buildBackfillUpdate(subscription, referenceDate = new Date()) {
  if (!subscription) {
    throw new Error('A subscription document is required.');
  }

  if (subscription.nextDeliveryDate) {
    return null;
  }

  return {
    nextDeliveryDate: calculateNextDeliveryDate(subscription, referenceDate),
  };
}

async function backfillSubscriptionNextDeliveryDates({
  connectionUri = process.env.MONGODB_URI,
  dryRun = true,
} = {}) {
  if (!connectionUri) {
    throw new Error('MONGODB_URI is required to run the subscription backfill.');
  }

  await mongoose.connect(connectionUri);

  const subscriptions = await Subscription.find({
    $or: [
      { nextDeliveryDate: { $exists: false } },
      { nextDeliveryDate: null },
    ],
  }).lean(false);

  const updates = [];

  for (const subscription of subscriptions) {
    const update = buildBackfillUpdate(subscription);

    if (!update) {
      continue;
    }

    updates.push({
      subscriptionId: subscription._id,
      update,
    });

    if (!dryRun) {
      await Subscription.updateOne({ _id: subscription._id }, { $set: update });
    }
  }

  return updates;
}

async function run() {
  try {
    const dryRun = !process.argv.includes('--write');
    const updates = await backfillSubscriptionNextDeliveryDates({ dryRun });
    console.log(`Backfill ${dryRun ? 'preview' : 'update'} completed for ${updates.length} subscription(s).`);
  } catch (error) {
    console.error('Failed to backfill subscription delivery dates:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  backfillSubscriptionNextDeliveryDates,
  buildBackfillUpdate,
  run,
};