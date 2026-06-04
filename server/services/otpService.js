// src/services/otpService.js
// OTP + lockout emails. Now delivered through Brevo (see emailService.js).
// SendGrid has been fully replaced. The exported function names are unchanged
// so existing callers (auth/delivery controllers) keep working.
const { sendEmail } = require('./emailService');

const sendOTP = async (email, otp) => {
  if (!email) {
    throw new Error('Customer email is missing.');
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h1 style="color: #2c3e50; text-align: center;">Your One-Time Password</h1>
      <div style="background-color: #f7f9fb; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 16px; color: #555;">Use the following OTP to verify your account:</p>
        <h2 style="font-size: 32px; color: #3498db; letter-spacing: 5px; margin: 10px 0;">${otp}</h2>
        <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes.</p>
      </div>
      <p style="font-size: 14px; color: #777; line-height: 1.6;">
        If you did not request this OTP, please ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        Rohtak Milk Company - Connecting you to your roots.
      </p>
    </div>
  `;

  try {
    console.log(`[Brevo] Attempting to send OTP to: ${email}`);
    await sendEmail({
      to: email,
      subject: 'Your OTP for Rohtak Milk Company',
      html,
      text: `Your One-Time Password is: ${otp}`,
    });
    console.log(`[Brevo] Success: OTP sent to ${email}`);
  } catch (error) {
    console.error('[Brevo] Error sending OTP email:', error);
    throw new Error(error.message || 'Failed to send OTP via Brevo.');
  }
};

const sendLockoutEmail = async (email) => {
  if (!email) throw new Error('Email is missing.');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h1 style="color: #e74c3c; text-align: center;">Security Alert</h1>
      <div style="background-color: #fceae9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 16px; color: #c0392b;">Too Many Failed Login Attempts</p>
        <p style="font-size: 14px; color: #555;">Your account has been temporarily locked after 5 consecutive failed login attempts.</p>
        <p style="font-size: 18px; font-weight: bold; color: #2c3e50; margin: 15px 0;">Please try again after some time.</p>
      </div>
      <p style="font-size: 14px; color: #777; line-height: 1.6;">
        If this wasn't you, please reset your password immediately to secure your account.
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        Rohtak Milk Company - Security Notification
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: 'Security Alert: Too Many Failed Login Attempts',
      html,
      text: 'Your account has been temporarily locked due to 5 consecutive failed login attempts. Please try again after some time.',
    });
    console.log(`[Brevo] Lockout email sent to ${email}`);
  } catch (error) {
    console.error('[Brevo] Error sending lockout email:', error);
  }
};

module.exports = { sendOTP, sendLockoutEmail };
