// Quick standalone test for the Brevo email integration.
// Usage:  node testBrevoEmail.js  [recipient@email.com]
// Sends the exact "Order Cancelled & Amount Added to Wallet" email so you can
// confirm BREVO_API_KEY + EMAIL_FROM are configured correctly.
require('dotenv').config();
const { sendOrderCancelledEmail } = require('./services/emailService');

const to = process.argv[2] || process.env.EMAIL_FROM;

(async () => {
  try {
    console.log(`Sending test cancellation email to: ${to} ...`);
    await sendOrderCancelledEmail({
      to,
      customerName: 'Test Customer',
      orderNumber: 'ORD-TEST-123',
      refundAmount: 250,
      walletBalance: 250,
    });
    console.log('✅ Email sent. Check the inbox (and spam folder).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    process.exit(1);
  }
})();
