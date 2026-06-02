require('dotenv').config();

const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

async function ensureSubscriptionIndexes(connectionUri = process.env.MONGODB_URI) {
  if (!connectionUri) {
    throw new Error('MONGODB_URI is required to run the subscription index migration.');
  }

  await mongoose.connect(connectionUri);
  await Subscription.createCollection();
  await Subscription.syncIndexes();

  return Subscription.schema.indexes();
}

async function run() {
  try {
    const indexes = await ensureSubscriptionIndexes();
    console.log(`Subscription indexes are ready (${indexes.length} definitions).`);
  } catch (error) {
    console.error('Failed to migrate subscription indexes:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  ensureSubscriptionIndexes,
  run,
};