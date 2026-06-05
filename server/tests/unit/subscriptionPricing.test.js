const test = require('node:test');
const assert = require('node:assert/strict');
const {
  countDeliveriesInRange,
  toUtcDateOnly,
  addUtcMonths,
  addUtcDays,
} = require('../../utils/subscriptionUtils');

// Helper to build the start/end of a commitment term the way the pricing
// service does (durationMonths from start, inclusive end).
function term(startISO, durationMonths) {
  const start = toUtcDateOnly(startISO);
  const end = addUtcDays(addUtcMonths(start, durationMonths), -1);
  return { start, end };
}

test('daily plan over 1 month counts ~30 deliveries', () => {
  const { start, end } = term('2026-01-01', 1);
  const count = countDeliveriesInRange({ planType: 'daily', startDate: start }, start, end);
  // Jan has 31 days; inclusive term is Jan 1 → Jan 31 = 31 deliveries.
  assert.equal(count, 31);
});

test('alternate_day plan over 1 month counts roughly half', () => {
  const { start, end } = term('2026-01-01', 1);
  const count = countDeliveriesInRange(
    { planType: 'alternate_day', frequency: 2, startDate: start },
    start,
    end
  );
  assert.ok(count >= 15 && count <= 16, `expected ~15-16, got ${count}`);
});

test('weekly plan (Mon/Wed/Fri) over 1 month counts ~12-14', () => {
  const { start, end } = term('2026-01-01', 1);
  const count = countDeliveriesInRange(
    { planType: 'weekly', daysOfWeek: [1, 3, 5], startDate: start },
    start,
    end
  );
  assert.ok(count >= 12 && count <= 14, `expected ~12-14, got ${count}`);
});

test('monthly plan over 3 months counts 3 deliveries', () => {
  const { start, end } = term('2026-01-15', 3);
  const count = countDeliveriesInRange({ planType: 'monthly', startDate: start }, start, end);
  assert.equal(count, 3);
});

test('countDeliveriesInRange returns 0 for an inverted range', () => {
  const start = toUtcDateOnly('2026-01-10');
  const end = toUtcDateOnly('2026-01-01');
  assert.equal(countDeliveriesInRange({ planType: 'daily', startDate: start }, start, end), 0);
});
