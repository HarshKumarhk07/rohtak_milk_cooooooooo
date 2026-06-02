const test = require('node:test');
const assert = require('node:assert/strict');

const Subscription = require('../../models/Subscription');

test('subscription schema exposes the expected indexes', () => {
  const indexes = Subscription.schema.indexes();
  const indexKeys = indexes.map(([fields]) => JSON.stringify(fields));

  assert.ok(indexKeys.includes(JSON.stringify({ user: 1, status: 1, nextDeliveryDate: 1 })));
  assert.ok(indexKeys.includes(JSON.stringify({ nextDeliveryDate: 1, status: 1 })));
  assert.ok(indexKeys.includes(JSON.stringify({ 'billing.razorpaySubscriptionId': 1 })));
});

test('subscription plan types are fixed and ordered', () => {
  assert.deepEqual(Subscription.planTypes, ['daily', 'alternate_day', 'weekly', 'monthly', 'custom']);
});

test('subscription instance methods are defined on the schema', () => {
  assert.equal(typeof Subscription.prototype.recalculateNextDeliveryDate, 'function');
  assert.equal(typeof Subscription.prototype.isPaused, 'function');
  assert.equal(typeof Subscription.prototype.hasSkippedDate, 'function');
  assert.equal(typeof Subscription.prototype.getNextDeliveryPreview, 'function');
});

test('subscription model can be instantiated with the Phase 1 fields', () => {
  const subscription = new Subscription({
    user: '64b4d61b0d00000000000001',
    items: [
      {
        product: '64b4d61b0d00000000000002',
        qty: 1,
        price: 65,
      },
    ],
    planType: 'daily',
    deliverySlot: 'morning',
    startDate: '2026-06-02T00:00:00Z',
  });

  assert.equal(subscription.status, 'active');
  assert.equal(subscription.billing.billingCycle, 'prepaid');
  assert.equal(subscription.billing.paymentFailedCount, 0);
  assert.equal(subscription.items.length, 1);
});