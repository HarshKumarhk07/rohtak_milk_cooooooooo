# Subscribe & Save

Configurable subscription commitment plans (with discounts) + a customer
subscribe checkout + an admin-managed rotating announcement bar.

## Concepts

There are **two independent axes** to a subscription:

| Axis | Field | Values | Meaning |
|------|-------|--------|---------|
| **Delivery frequency** | `Subscription.planType` | `daily`, `alternate_day`, `weekly`, `monthly`, `custom` | How often milk is delivered. |
| **Commitment plan** | `SubscriptionPlan` | Monthly / Quarterly / Half-Yearly / Yearly | How long the customer commits for, and the discount they earn. |

A customer chooses **both**. Discounts live only on `SubscriptionPlan` documents
and are read live at checkout — **never hardcoded**.

## Default plans (`npm run seed:plans`)

| Plan | durationMonths | discountPercentage |
|------|----------------|--------------------|
| Monthly Plan | 1 | 0% |
| Quarterly Plan | 3 | 5% |
| Half-Yearly Plan | 6 | 10% |
| Yearly Plan | 12 | 12% |

Admins manage these from **Admin Dashboard → Subscription Plans** (create, edit,
enable/disable, change discount/duration, reorder).

## Pricing model

At checkout the server recomputes everything (the client never sends prices):

```
perDeliveryAmount = Σ (variant.price × qty)        // one delivery
totalDeliveries   = deliveries between startDate and (start + durationMonths)
originalPrice     = perDeliveryAmount × totalDeliveries
discountedPrice   = originalPrice × (1 − discountPercentage/100)   // charged upfront
```

`totalDeliveries` is counted by `countDeliveriesInRange()` in
[`utils/subscriptionUtils.js`](../server/utils/subscriptionUtils.js) using the same
scheduler that drives recurring delivery dates, so it honours the chosen frequency
and weekdays.

The customer always sees **Original Price → Discount % → Final Price**.

## API

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| GET | `/api/subscription-plans` | Public | Active plans for the checkout |
| GET | `/api/subscription-plans/admin` | Admin | All plans |
| POST | `/api/subscription-plans` | Admin | Create plan |
| PUT | `/api/subscription-plans/:id` | Admin | Update plan |
| DELETE | `/api/subscription-plans/:id` | Admin | Delete plan |
| POST | `/api/subscriptions/preview` | Auth | Price + schedule preview (no write) |
| POST | `/api/subscriptions` | Auth | Create subscription + start payment |
| POST | `/api/subscriptions/:id/verify-payment` | Auth | Verify Razorpay, activate |
| GET | `/api/subscriptions/mine` | Auth | My subscriptions |
| POST | `/api/subscriptions/:id/cancel` | Auth | Cancel |
| GET | `/api/subscriptions` | Admin | All subscriptions (oversight) |
| GET | `/api/announcements` | Public | Active banners (rotating bar) |
| GET/POST/PUT/DELETE | `/api/announcements[...]` | Admin | Manage banners |

### Payment

Reuses the **exact** wallet + Razorpay split logic of the one-off Order flow:

- **Wallet-only** → charged immediately, subscription `active`.
- **Hybrid / Razorpay** → `pending_payment` until `verify-payment` succeeds, then
  the wallet portion is finalized (atomically, idempotent) and the subscription
  activates. Abandoned payments never debit the wallet.

> Scope note: this ships **upfront prepaid** commitments. Live Razorpay recurring
> auto-charge (Subscriptions API + webhooks) is intentionally **not** activated;
> the model has `billing.razorpaySubscriptionId`/`razorpayPlanId` reserved for it.

## Frontend

- Rotating bar: [`components/AnnouncementBanner.js`](../src/components/AnnouncementBanner.js) (in `Header`).
- Checkout: [`pages/SubscribePage.js`](../src/pages/SubscribePage.js) → `/subscribe`.
- My subs: [`pages/MySubscriptionsPage.js`](../src/pages/MySubscriptionsPage.js) → `/my-subscriptions`.
- Admin: `SubscriptionPlanManagement`, `AnnouncementBannerManagement` (dashboard tabs).

## Setup

```bash
cd server
npm run seed:plans      # 4 default commitment plans (idempotent)
npm run seed:banners    # 5 default rotating banners (idempotent)
```
