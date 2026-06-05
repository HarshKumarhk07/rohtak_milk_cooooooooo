// src/services/adminSecurityService.js
// Centralised admin-account protection: progressive lockout, audit logging and
// the security-alert email. ALL of this applies ONLY to users with role
// 'admin' — customers and delivery users are never locked by this module.
const AdminSecurityLog = require('../models/AdminSecurityLog');
const { sendAdminSecurityAlertEmail } = require('./emailService');

// Lock the account after this many consecutive failed attempts (password OR
// passkey). Spec: "After 4 incorrect password attempts: LOCK ADMIN ACCOUNT".
const MAX_ATTEMPTS_BEFORE_LOCK = 4;

// Progressive lock durations by escalation level (ms).
//   level 1 -> 15m, 2 -> 30m, 3 -> 1h, 4 -> 2h, 5+ -> 24h
const LOCK_DURATIONS_MS = {
  1: 15 * 60 * 1000,
  2: 30 * 60 * 1000,
  3: 60 * 60 * 1000,
  4: 2 * 60 * 60 * 1000,
  5: 24 * 60 * 60 * 1000,
};

function lockDurationForLevel(level) {
  if (level >= 5) return LOCK_DURATIONS_MS[5];
  return LOCK_DURATIONS_MS[level] || LOCK_DURATIONS_MS[1];
}

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

// Pull the real client IP + user agent from the request for the audit log.
function getRequestMeta(req) {
  if (!req) return { ipAddress: '', userAgent: '' };
  const forwarded = req.headers?.['x-forwarded-for'];
  const ipAddress = (forwarded ? String(forwarded).split(',')[0].trim() : '') ||
    req.ip ||
    req.connection?.remoteAddress ||
    '';
  const userAgent = req.headers?.['user-agent'] || '';
  return { ipAddress, userAgent };
}

function isLocked(user) {
  if (!user?.lockUntil) return false;
  return new Date(user.lockUntil).getTime() > Date.now();
}

function remainingLockMs(user) {
  if (!user?.lockUntil) return 0;
  return Math.max(0, new Date(user.lockUntil).getTime() - Date.now());
}

// Build a friendly "locked, try again in X" message for API responses.
function lockedMessage(user) {
  const ms = remainingLockMs(user);
  const minutes = Math.ceil(ms / 60000);
  const label = minutes < 60
    ? `${minutes} minute${minutes === 1 ? '' : 's'}`
    : `${Math.ceil(minutes / 60)} hour${Math.ceil(minutes / 60) === 1 ? '' : 's'}`;
  return `Account locked due to repeated failed attempts. Please try again in ${label}.`;
}

// Persist one audit event. Never throws — logging must not break auth flow.
async function logEvent({ user, email, eventType, req, lockLevel, details }) {
  try {
    const meta = getRequestMeta(req);
    await AdminSecurityLog.create({
      admin: user?._id,
      email: email || user?.email,
      eventType,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      lockLevel: lockLevel !== undefined ? lockLevel : (user?.lockLevel || 0),
      details,
    });
  } catch (err) {
    console.error('[AdminSecurity] Failed to write security log:', err.message);
  }
}

// Compose the password reset link the alert email points to.
function buildResetLink(email) {
  const base = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || 'https://rohtakmilkcompany.in';
  return `${base.replace(/\/$/, '')}/forgot-password?email=${encodeURIComponent(email || '')}`;
}

// Record a failed credential attempt and escalate the lock when the threshold
// is crossed. `kind` is 'password' or 'passkey' (controls the log event names).
// Returns { locked, lockLevel, lockLabel, remainingMs, attemptsRemaining }.
async function recordFailedAttempt({ user, req, kind = 'password' }) {
  user.failedAttempts = (user.failedAttempts || 0) + 1;

  await logEvent({
    user,
    eventType: kind === 'passkey' ? 'PASSKEY_FAILURE' : 'FAILED_LOGIN',
    req,
    details: `Failed ${kind} attempt ${user.failedAttempts}/${MAX_ATTEMPTS_BEFORE_LOCK}`,
  });

  if (user.failedAttempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
    user.lockLevel = (user.lockLevel || 0) + 1;
    const durationMs = lockDurationForLevel(user.lockLevel);
    user.lockUntil = new Date(Date.now() + durationMs);
    user.failedAttempts = 0; // reset per-cycle counter; lockLevel persists/escalates
    await user.save();

    const lockLabel = formatDuration(durationMs);
    await logEvent({
      user,
      eventType: kind === 'passkey' ? 'PASSKEY_LOCK' : 'ACCOUNT_LOCKED',
      req,
      lockLevel: user.lockLevel,
      details: `Locked for ${lockLabel} (escalation level ${user.lockLevel})`,
    });

    // Fire the security alert email (best-effort; never blocks the response).
    const meta = getRequestMeta(req);
    sendAdminSecurityAlertEmail({
      to: user.email,
      adminName: user.name,
      resetLink: buildResetLink(user.email),
      lockLabel,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      reason: kind,
    }).catch((e) => console.error('[AdminSecurity] alert email failed:', e.message));

    return { locked: true, lockLevel: user.lockLevel, lockLabel, remainingMs: durationMs };
  }

  await user.save();
  return {
    locked: false,
    lockLevel: user.lockLevel || 0,
    attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCK - user.failedAttempts,
  };
}

// Clear the lock state after a proven-legitimate action (successful login or a
// completed password reset). resetLevel=true wipes escalation back to 0.
async function resetLockState(user, { resetLevel = true, save = true } = {}) {
  user.failedAttempts = 0;
  user.lockUntil = undefined;
  user.loginAttempts = 0; // legacy counters
  user.otpAttempts = 0;
  if (resetLevel) user.lockLevel = 0;
  if (save) await user.save();
}

module.exports = {
  MAX_ATTEMPTS_BEFORE_LOCK,
  lockDurationForLevel,
  formatDuration,
  getRequestMeta,
  isLocked,
  remainingLockMs,
  lockedMessage,
  logEvent,
  recordFailedAttempt,
  resetLockState,
  buildResetLink,
};
