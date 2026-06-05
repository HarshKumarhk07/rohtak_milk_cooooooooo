# Admin Security Hardening

Progressive account lockout, audit logging, security email alerts and an admin
dashboard — applied **only to `role === 'admin'`**. Customers and delivery users
are never locked.

## Lockout rules

- **Threshold:** 4 consecutive failed attempts → account locked.
- **A "failed attempt"** = wrong password **OR** wrong admin secret passkey **OR**
  a bad admin password-reset (OTP/secret). They share one counter.
- **Progressive durations** (escalation persists in `User.lockLevel`):

  | Lock # (`lockLevel`) | Duration |
  |----------------------|----------|
  | 1 | 15 minutes |
  | 2 | 30 minutes |
  | 3 | 1 hour |
  | 4 | 2 hours |
  | 5+ | 24 hours |

- While locked, **login is blocked** and the API returns the remaining time;
  **password reset is still allowed** (the reset link is the escape hatch).
- A successful login **or** a completed password reset clears `failedAttempts`,
  `lockUntil` and resets `lockLevel` to 0 (immediate access, no waiting).

All logic lives in [`services/adminSecurityService.js`](../server/services/adminSecurityService.js);
[`controllers/authController.js`](../server/controllers/authController.js) calls into it.

## Data model

`User` gains (admins only; defaults are backward-compatible):
- `failedAttempts: Number` — consecutive failures in the current cycle.
- `lockLevel: Number` — escalation tier reached (persists across cycles).
- `lockUntil: Date` — existing field, now driven by the progressive schedule.

New model [`AdminSecurityLog`](../server/models/AdminSecurityLog.js): append-only
audit trail — `admin`, `email`, `eventType`, `ipAddress`, `userAgent`, `lockLevel`,
`details`, timestamps.

**Events:** `FAILED_LOGIN`, `ACCOUNT_LOCKED`, `PASSWORD_RESET`,
`SUCCESSFUL_LOGIN`, `PASSKEY_FAILURE`, `PASSKEY_LOCK`, `ACCOUNT_UNLOCKED`.

> IP capture requires `app.set('trust proxy', 1)` (added in `app.js`) so the real
> client IP is recorded behind Vercel/Render/Nginx.

## Security email

On lock, a best-effort email is sent via Brevo
([`emailService.sendAdminSecurityAlertEmail`](../server/services/emailService.js)):

- **Subject:** `Security Alert - Rohtak Milk Admin Panel`
- States >4 failed attempts, advises an immediate password change, includes a
  **secure reset link** (`FRONTEND_URL/forgot-password?email=…`) plus the IP/device.

Set `FRONTEND_URL` in `server/.env` (falls back to `https://rohtakmilkcompany.in`).

## API (all admin-only)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin-security/logs?email=&eventType=&page=&limit=` | Filterable, paginated logs |
| GET | `/api/admin-security/locked` | Currently locked accounts |
| GET | `/api/admin-security/accounts` | All admins + security state |
| POST | `/api/admin-security/unlock/:userId` | Manually unlock + reset escalation |

## Dashboard

**Admin Dashboard → Security** ([`components/AdminSecurityDashboard.js`](../src/components/AdminSecurityDashboard.js)):
view admin accounts with lock status, failed attempts and lock level; manually
unlock; browse/filter the full security log.

## Login UX

The login page surfaces the lock message + remaining time, and shows
"N attempts left before lock" on a wrong password/passkey before the lock trips.

## Migration

No backfill required — new `User` fields default via Mongoose and all reads use
`|| 0` guards, so existing admin documents work unchanged. The `AdminSecurityLog`
collection and its indexes are created automatically on first write.
