const test = require('node:test');
const assert = require('node:assert/strict');

const Subscription = require('../../models/Subscription');
const { ensureSubscriptionIndexes } = require('../../scripts/migrate-add-subscription-indexes');
const { backfillSubscriptionNextDeliveryDates, buildBackfillUpdate } = require('../../scripts/backfill-subscription-next-delivery');

test('backfill helper returns null when nextDeliveryDate already exists', () => {
  const result = buildBackfillUpdate({ nextDeliveryDate: '2026-06-02T00:00:00Z' });
  assert.equal(result, null);
});

test('backfill helper calculates a next delivery date when missing', () => {
  const result = buildBackfillUpdate({
    planType: 'daily',
    startDate: '2026-06-02T00:00:00Z',
    deliverySlot: 'morning',
    items: [{ product: '64b4d61b0d00000000000002', qty: 1, price: 65 }],
    billing: {},
  }, '2026-06-02T00:00:00Z');

  assert.equal(result.nextDeliveryDate.toISOString(), '2026-06-03T00:00:00.000Z');
});

test('subscription index script exposes the same schema indexes without touching the database', () => {
  const indexes = Subscription.schema.indexes();
  assert.ok(Array.isArray(indexes));
  assert.ok(indexes.length >= 3);
});

test('index migration and backfill functions validate required connection strings', async () => {
  await assert.rejects(() => ensureSubscriptionIndexes(''), /MONGODB_URI is required/);
  await assert.rejects(() => backfillSubscriptionNextDeliveryDates({ connectionUri: '' }), /MONGODB_URI is required/);
});