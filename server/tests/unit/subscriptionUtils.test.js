const test = require('node:test');
const assert = require('node:assert/strict');

const {
  addUtcDays,
  addUtcMonths,
  buildDeliverySlotWindow,
  calculateInitialDeliveryDate,
  calculateNextDeliveryDate,
  getBaseNextDeliveryDate,
  getPlanFrequencyDays,
  getSchedulePreview,
  isSameUtcDay,
  normalizeWeekDays,
  shouldSkipDeliveryDate,
  toUtcDateOnly,
} = require('../../utils/subscriptionUtils');

test('toUtcDateOnly strips time to UTC midnight', () => {
  const date = toUtcDateOnly('2026-06-02T18:45:00Z');
  assert.equal(date.toISOString(), '2026-06-02T00:00:00.000Z');
});

test('isSameUtcDay detects same calendar day in UTC', () => {
  assert.equal(isSameUtcDay('2026-06-02T01:00:00Z', '2026-06-02T23:59:59Z'), true);
  assert.equal(isSameUtcDay('2026-06-02T01:00:00Z', '2026-06-03T00:00:00Z'), false);
});

test('addUtcDays and addUtcMonths preserve UTC day semantics', () => {
  assert.equal(addUtcDays('2026-06-02T00:00:00Z', 3).toISOString(), '2026-06-05T00:00:00.000Z');
  assert.equal(addUtcMonths('2026-01-31T00:00:00Z', 1).toISOString(), '2026-02-28T00:00:00.000Z');
});

test('normalizeWeekDays returns a stable filtered set', () => {
  assert.deepEqual(normalizeWeekDays([6, 1, 1, 9, -1, 0]), [0, 1, 6]);
});

test('getPlanFrequencyDays falls back safely', () => {
  assert.equal(getPlanFrequencyDays({ planType: 'alternate_day' }), 2);
  assert.equal(getPlanFrequencyDays({ planType: 'alternate_day', frequency: 4 }), 4);
  assert.equal(getPlanFrequencyDays({ planType: 'custom', frequency: 3 }), 3);
});

test('daily plan computes the next day after the reference date', () => {
  const subscription = { planType: 'daily', startDate: '2026-06-02T00:00:00Z' };
  const next = calculateNextDeliveryDate(subscription, '2026-06-02T00:00:00Z');
  assert.equal(next.toISOString(), '2026-06-03T00:00:00.000Z');
});

test('initial delivery date can land on the configured start date', () => {
  const subscription = { planType: 'daily', startDate: '2026-06-02T00:00:00Z' };
  const initial = calculateInitialDeliveryDate(subscription);
  assert.equal(initial.toISOString(), '2026-06-02T00:00:00.000Z');
});

test('weekly plan uses configured weekdays', () => {
  const subscription = {
    planType: 'weekly',
    startDate: '2026-06-01T00:00:00Z',
    daysOfWeek: [1, 3, 5],
  };

  const next = calculateNextDeliveryDate(subscription, '2026-06-02T00:00:00Z');
  assert.equal(next.toISOString(), '2026-06-03T00:00:00.000Z');
});

test('skip dates and pause windows are respected', () => {
  const subscription = {
    planType: 'daily',
    startDate: '2026-06-02T00:00:00Z',
    skipDates: ['2026-06-03T00:00:00Z'],
    pauseUntil: '2026-06-04T00:00:00Z',
  };

  assert.equal(shouldSkipDeliveryDate(subscription, '2026-06-03T00:00:00Z'), true);
  assert.equal(shouldSkipDeliveryDate(subscription, '2026-06-04T00:00:00Z'), true);
  assert.equal(shouldSkipDeliveryDate(subscription, '2026-06-05T00:00:00Z'), false);
});

test('base next delivery date handles monthly and slot windows', () => {
  const subscription = { planType: 'monthly', startDate: '2026-01-31T00:00:00Z' };
  const next = getBaseNextDeliveryDate(subscription, '2026-01-31T00:00:00Z');
  assert.equal(next.toISOString(), '2026-02-28T00:00:00.000Z');

  const morningWindow = buildDeliverySlotWindow('2026-06-02T00:00:00Z', 'morning');
  const eveningWindow = buildDeliverySlotWindow('2026-06-02T00:00:00Z', 'evening');

  assert.equal(morningWindow.start.toISOString(), '2026-06-02T06:00:00.000Z');
  assert.equal(morningWindow.end.toISOString(), '2026-06-02T09:00:00.000Z');
  assert.equal(eveningWindow.start.toISOString(), '2026-06-02T16:00:00.000Z');
  assert.equal(eveningWindow.end.toISOString(), '2026-06-02T20:00:00.000Z');
});

test('schedule preview returns consecutive valid dates', () => {
  const subscription = { planType: 'daily', startDate: '2026-06-02T00:00:00Z' };
  const preview = getSchedulePreview(subscription, '2026-06-02T00:00:00Z', 3);
  assert.deepEqual(preview.map((date) => date.toISOString()), [
    '2026-06-03T00:00:00.000Z',
    '2026-06-04T00:00:00.000Z',
    '2026-06-05T00:00:00.000Z',
  ]);
});