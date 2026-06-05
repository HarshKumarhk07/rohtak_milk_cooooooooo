const DEFAULT_WEEKLY_FREQUENCY_DAYS = 7;
const DEFAULT_ALTERNATE_DAY_FREQUENCY_DAYS = 2;

function toUtcDateOnly(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value supplied.');
  }

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
}

function isSameUtcDay(left, right) {
  if (!left || !right) return false;
  return toUtcDateOnly(left).getTime() === toUtcDateOnly(right).getTime();
}

function addUtcDays(value, days) {
  const date = toUtcDateOnly(value);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date;
}

function addUtcMonths(value, months) {
  const date = toUtcDateOnly(value);
  const originalDay = date.getUTCDate();

  date.setUTCMonth(date.getUTCMonth() + Number(months || 0), 1);

  const lastDayOfTargetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return date;
}

function normalizeWeekDays(daysOfWeek = []) {
  return [...new Set(daysOfWeek)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right);
}

function getPlanFrequencyDays(subscription) {
  if (!subscription) return DEFAULT_ALTERNATE_DAY_FREQUENCY_DAYS;

  if (subscription.planType === 'alternate_day') {
    return Math.max(1, Number(subscription.frequency || DEFAULT_ALTERNATE_DAY_FREQUENCY_DAYS));
  }

  if (subscription.planType === 'custom') {
    return Math.max(1, Number(subscription.frequency || 1));
  }

  return DEFAULT_WEEKLY_FREQUENCY_DAYS;
}

function getBaseNextDeliveryDate(subscription, referenceDate) {
  const startDate = toUtcDateOnly(subscription?.startDate || referenceDate);
  const reference = toUtcDateOnly(referenceDate);

  if (reference < startDate) {
    return startDate;
  }

  switch (subscription?.planType) {
    case 'daily':
      return addUtcDays(reference, 1);
    case 'alternate_day':
    case 'custom':
      return addUtcDays(reference, getPlanFrequencyDays(subscription));
    case 'weekly': {
      const weekDays = normalizeWeekDays(subscription?.daysOfWeek || []);
      if (!weekDays.length) {
        return addUtcDays(reference, DEFAULT_WEEKLY_FREQUENCY_DAYS);
      }

      for (let offset = 1; offset <= 14; offset += 1) {
        const candidate = addUtcDays(reference, offset);
        if (weekDays.includes(candidate.getUTCDay())) {
          return candidate;
        }
      }

      return addUtcDays(reference, DEFAULT_WEEKLY_FREQUENCY_DAYS);
    }
    case 'monthly':
      return addUtcMonths(reference, 1);
    default:
      return addUtcDays(reference, 1);
  }
}

function shouldSkipDeliveryDate(subscription, candidateDate) {
  const candidate = toUtcDateOnly(candidateDate);
  const skipDates = (subscription?.skipDates || []).map((date) => toUtcDateOnly(date).getTime());

  if (skipDates.includes(candidate.getTime())) {
    return true;
  }

  if (subscription?.pauseUntil) {
    const pauseUntil = toUtcDateOnly(subscription.pauseUntil);
    if (candidate <= pauseUntil) {
      return true;
    }
  }

  return false;
}

function calculateNextDeliveryDate(subscription, referenceDate = new Date()) {
  let candidate = getBaseNextDeliveryDate(subscription, referenceDate);
  const maxAttempts = 90;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!shouldSkipDeliveryDate(subscription, candidate)) {
      return candidate;
    }

    candidate = getBaseNextDeliveryDate(subscription, candidate);
  }

  throw new Error('Unable to calculate the next delivery date.');
}

function calculateInitialDeliveryDate(subscription) {
  const startDate = toUtcDateOnly(subscription?.startDate || new Date());
  return calculateNextDeliveryDate(subscription, addUtcDays(startDate, -1));
}

function buildDeliverySlotWindow(deliveryDate, deliverySlot) {
  const date = toUtcDateOnly(deliveryDate);
  const slot = deliverySlot === 'evening' ? 'evening' : 'morning';

  if (slot === 'evening') {
    return {
      start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 16, 0, 0)),
      end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 20, 0, 0)),
    };
  }

  return {
    start: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 6, 0, 0)),
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 9, 0, 0)),
  };
}

// Count how many deliveries a subscription-like config will produce between its
// startDate and an (exclusive of nothing — inclusive) endDate. Used to price a
// "Subscribe & Save" commitment (originalPrice = perDelivery * count). Bounded
// by a hard cap so a misconfigured schedule can never loop forever.
function countDeliveriesInRange(subscription, startDate, endDate) {
  const start = toUtcDateOnly(startDate || subscription?.startDate);
  const end = toUtcDateOnly(endDate);
  if (!start || !end || end < start) return 0;

  const HARD_CAP = 2000; // ~5+ years of daily deliveries; safety valve only
  let count = 0;
  // Begin the search the day before start so an on-start delivery is included.
  let cursor = addUtcDays(start, -1);

  for (let i = 0; i < HARD_CAP; i += 1) {
    let next;
    try {
      next = calculateNextDeliveryDate(subscription, cursor);
    } catch (err) {
      break; // unschedulable (e.g. fully paused range) — stop counting
    }
    if (!next || next > end) break;
    count += 1;
    cursor = next;
  }

  return count;
}

function getSchedulePreview(subscription, referenceDate = new Date(), count = 5) {
  const preview = [];
  let cursor = referenceDate;

  for (let index = 0; index < count; index += 1) {
    const nextDate = calculateNextDeliveryDate(subscription, cursor);
    preview.push(nextDate);
    cursor = nextDate;
  }

  return preview;
}

module.exports = {
  addUtcDays,
  addUtcMonths,
  buildDeliverySlotWindow,
  calculateInitialDeliveryDate,
  calculateNextDeliveryDate,
  countDeliveriesInRange,
  getBaseNextDeliveryDate,
  getPlanFrequencyDays,
  getSchedulePreview,
  isSameUtcDay,
  normalizeWeekDays,
  shouldSkipDeliveryDate,
  toUtcDateOnly,
};