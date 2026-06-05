// src/services/emailService.js
// Email delivery via Brevo (formerly Sendinblue) transactional API.
// Replaces the previous SendGrid integration. Uses the BREVO_API_KEY env var.
// Implemented with the native https module so no extra dependency is required.
const https = require('https');
require('dotenv').config();

const BREVO_HOST = 'api.brevo.com';
const BREVO_PATH = '/v3/smtp/email';

/**
 * Low-level send via the Brevo transactional email API.
 * @param {Object} opts
 * @param {string} opts.to       - recipient email
 * @param {string} [opts.toName] - recipient display name
 * @param {string} opts.subject
 * @param {string} opts.html     - HTML body
 * @param {string} [opts.text]   - plain-text fallback
 */
function sendEmail({ to, toName, subject, html, text }) {
  return new Promise((resolve, reject) => {
    if (!to) return reject(new Error('Recipient email is missing.'));

    const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
    const emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : null;
    const fromName = process.env.FROM_NAME ? process.env.FROM_NAME.trim() : 'Rohtak Milk Company';

    if (!apiKey) {
      console.error('CRITICAL: BREVO_API_KEY is not defined in env!');
      return reject(new Error('Email service configuration missing (BREVO_API_KEY).'));
    }
    if (!emailFrom) {
      console.error('CRITICAL: EMAIL_FROM is not defined in env!');
      return reject(new Error('Email service configuration missing (Sender Email).'));
    }

    const payload = JSON.stringify({
      sender: { email: emailFrom, name: fromName },
      to: [{ email: to.trim(), name: toName || to.trim() }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    });

    const req = https.request(
      {
        host: BREVO_HOST,
        path: BREVO_PATH,
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'accept': 'application/json',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Brevo] Email sent to ${to} (subject: "${subject}")`);
            resolve(body ? JSON.parse(body) : {});
          } else {
            console.error(`[Brevo] Failed (${res.statusCode}):`, body);
            reject(new Error(`Brevo email failed: ${res.statusCode} ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[Brevo] Request error:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Notify a customer that an admin cancelled their order and refunded the amount
 * to their wallet. Matches the exact content required by the spec.
 */
async function sendOrderCancelledEmail({ to, customerName, orderNumber, refundAmount, walletBalance }) {
  const subject = 'Order Cancelled & Amount Added to Wallet';

  const text =
    `Hello ${customerName},\n\n` +
    `Your order #${orderNumber} has been cancelled because one or more products became unavailable.\n\n` +
    `Refund Amount:\n₹${refundAmount}\n\n` +
    `The amount has been successfully credited to your wallet.\n\n` +
    `Current Wallet Balance:\n₹${walletBalance}\n\n` +
    `You can use this wallet balance for future purchases on Rohtak Milk Company.\n\n` +
    `Thank you for your understanding.\n\n` +
    `Regards,\nRohtak Milk Company`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <h1 style="color: #2e7d32; text-align: center; font-size: 22px;">Order Cancelled &amp; Amount Added to Wallet</h1>
      <p style="font-size: 15px; color: #333;">Hello <strong>${customerName}</strong>,</p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        Your order <strong>#${orderNumber}</strong> has been cancelled because one or more products became unavailable.
      </p>
      <div style="background-color: #f1f8e9; padding: 18px; border-radius: 10px; margin: 18px 0; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #558b2f; text-transform: uppercase; letter-spacing: 1px;">Refund Amount</p>
        <p style="margin: 6px 0 0; font-size: 30px; font-weight: 800; color: #2e7d32;">₹${refundAmount}</p>
      </div>
      <p style="font-size: 15px; color: #333;">The amount has been successfully credited to your wallet.</p>
      <div style="background-color: #f7f9fb; padding: 14px; border-radius: 10px; margin: 14px 0; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #777;">Current Wallet Balance</p>
        <p style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #1e4636;">₹${walletBalance}</p>
      </div>
      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        You can use this wallet balance for future purchases on Rohtak Milk Company.
      </p>
      <p style="font-size: 14px; color: #555;">Thank you for your understanding.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 13px; color: #888;">Regards,<br/><strong>Rohtak Milk Company</strong></p>
    </div>
  `;

  return sendEmail({ to, toName: customerName, subject, html, text });
}

/**
 * Notify a customer that specific item(s) in their order are unavailable and
 * the amount for those items has been refunded to their wallet. The rest of
 * the order is still delivered.
 * @param {Object} opts
 * @param {Array<{name:string, quantity:number, refundAmount:number}>} opts.products
 */
async function sendItemsUnavailableEmail({ to, customerName, products = [], refundAmount, walletBalance }) {
  const subject = 'Product Unavailable – Wallet Refund Processed';

  const productListText = products
    .map((p) => `- ${p.name}${p.quantity ? ` x${p.quantity}` : ''} (₹${p.refundAmount})`)
    .join('\n');

  const productListHtml = products
    .map(
      (p) =>
        `<li style="margin-bottom:4px;"><strong>${p.name}</strong>${p.quantity ? ` × ${p.quantity}` : ''} — ₹${p.refundAmount}</li>`
    )
    .join('');

  const text =
    `Hello ${customerName},\n\n` +
    `One or more products from your order could not be fulfilled.\n\n` +
    `Unavailable Product(s):\n${productListText}\n\n` +
    `Refund Amount:\n₹${refundAmount}\n\n` +
    `This amount has been credited to your wallet.\n\n` +
    `Current Wallet Balance:\n₹${walletBalance}\n\n` +
    `The remaining items in your order will be delivered as scheduled.\n\n` +
    `Thank you for your understanding.\n\n` +
    `Regards,\nRohtak Milk Company`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <h1 style="color: #2e7d32; text-align: center; font-size: 22px;">Product Unavailable – Wallet Refund Processed</h1>
      <p style="font-size: 15px; color: #333;">Hello <strong>${customerName}</strong>,</p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        One or more products from your order could not be fulfilled.
      </p>
      <p style="font-size: 14px; color: #555; margin-bottom: 4px; font-weight: bold;">Unavailable Product(s):</p>
      <ul style="font-size: 14px; color: #333; padding-left: 18px; margin-top: 4px;">${productListHtml}</ul>
      <div style="background-color: #f1f8e9; padding: 18px; border-radius: 10px; margin: 18px 0; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #558b2f; text-transform: uppercase; letter-spacing: 1px;">Refund Amount</p>
        <p style="margin: 6px 0 0; font-size: 30px; font-weight: 800; color: #2e7d32;">₹${refundAmount}</p>
      </div>
      <p style="font-size: 15px; color: #333;">This amount has been credited to your wallet.</p>
      <div style="background-color: #f7f9fb; padding: 14px; border-radius: 10px; margin: 14px 0; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #777;">Current Wallet Balance</p>
        <p style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #1e4636;">₹${walletBalance}</p>
      </div>
      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        The remaining items in your order will be delivered as scheduled.
      </p>
      <p style="font-size: 14px; color: #555;">Thank you for your understanding.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 13px; color: #888;">Regards,<br/><strong>Rohtak Milk Company</strong></p>
    </div>
  `;

  return sendEmail({ to, toName: customerName, subject, html, text });
}

/**
 * Security alert sent to an admin when their account is locked after repeated
 * failed login OR passkey attempts. Includes a secure password-reset link.
 * @param {Object} opts
 * @param {string} opts.to          - admin email
 * @param {string} [opts.adminName]
 * @param {string} opts.resetLink   - link to the password reset page
 * @param {string} [opts.lockLabel] - human label e.g. "15 minutes"
 * @param {string} [opts.ipAddress]
 * @param {string} [opts.userAgent]
 * @param {string} [opts.reason]    - 'password' | 'passkey'
 */
async function sendAdminSecurityAlertEmail({ to, adminName, resetLink, lockLabel, ipAddress, userAgent, reason }) {
  const subject = 'Security Alert - Rohtak Milk Admin Panel';

  const attemptType = reason === 'passkey' ? 'admin secret passkey' : 'password';

  const text =
    `We detected more than 4 unsuccessful login attempts on your admin account.\n\n` +
    `If this was not you, please change your password immediately.\n\n` +
    (lockLabel ? `Your account has been temporarily locked for ${lockLabel}.\n\n` : '') +
    `Reset your password securely: ${resetLink}\n\n` +
    `Attempt type: ${attemptType}\n` +
    (ipAddress ? `IP Address: ${ipAddress}\n` : '') +
    (userAgent ? `Device: ${userAgent}\n` : '') +
    `\nRegards,\nRohtak Milk Company Security`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <h1 style="color: #c0392b; text-align: center; font-size: 22px;">Security Alert - Rohtak Milk Admin Panel</h1>
      <p style="font-size: 15px; color: #333;">Hello <strong>${adminName || 'Admin'}</strong>,</p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        We detected <strong>more than 4 unsuccessful login attempts</strong> on your admin account.
      </p>
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        If this was not you, please <strong>change your password immediately</strong>.
      </p>
      ${lockLabel ? `<div style="background-color:#fceae9;padding:14px;border-radius:10px;margin:16px 0;text-align:center;">
        <p style="margin:0;font-size:14px;color:#c0392b;">Your account has been temporarily locked for <strong>${lockLabel}</strong>.</p>
      </div>` : ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="background-color:#2e7d32;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">Reset Password</a>
      </div>
      <div style="background-color:#f7f9fb;padding:14px;border-radius:10px;margin:14px 0;font-size:13px;color:#555;">
        <p style="margin:0 0 6px;"><strong>Attempt type:</strong> ${attemptType}</p>
        ${ipAddress ? `<p style="margin:0 0 6px;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
        ${userAgent ? `<p style="margin:0;"><strong>Device:</strong> ${userAgent}</p>` : ''}
      </div>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 13px; color: #888;">Regards,<br/><strong>Rohtak Milk Company Security</strong></p>
    </div>
  `;

  return sendEmail({ to, toName: adminName, subject, html, text });
}

module.exports = { sendEmail, sendOrderCancelledEmail, sendItemsUnavailableEmail, sendAdminSecurityAlertEmail };
