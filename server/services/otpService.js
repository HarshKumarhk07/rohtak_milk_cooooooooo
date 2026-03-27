const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const sendOTP = async (email, otp) => {
  if (!email) {
    throw new Error('Customer email is missing.');
  }

  const apiKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.trim() : null;
  const emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : null;
  const fromName = process.env.FROM_NAME ? process.env.FROM_NAME.trim() : 'Gaon Se Ghar Tak';

  if (!apiKey) {
    console.error('CRITICAL: SENDGRID_API_KEY is not defined in env!');
    throw new Error('Email service configuration missing (API Key).');
  }

  if (!emailFrom) {
    console.error('CRITICAL: EMAIL_FROM is not defined in env!');
    throw new Error('Email service configuration missing (Sender Email).');
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: email.trim(),
    from: {
      email: emailFrom,
      name: fromName,
    },
    subject: 'Your OTP for Gaon Se Ghar Tak',
    text: `Your One-Time Password is: ${otp}`,
    html: `
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
          Gaon Se Ghar Tak - Connecting you to your roots.
        </p>
      </div>
    `,
  };

  try {
    console.log(`[SendGrid] Attempting to send OTP to: ${email}`);
    // Wait for the response but don't block too long
    await sgMail.send(msg);
    console.log(`[SendGrid] Success: OTP sent to ${email}`);
  } catch (error) {
    console.error('[SendGrid] Error sending email:', error);
    if (error.response) {
      const errorDetail = JSON.stringify(error.response.body, null, 2);
      console.error('[SendGrid] Response details:', errorDetail);
      if (error.response.body && error.response.body.errors && error.response.body.errors[0]) {
        throw new Error(`SendGrid: ${error.response.body.errors[0].message}`);
      }
    }
    throw new Error(error.message || 'Failed to send OTP via SendGrid.');
  }
};

const sendLockoutEmail = async (email) => {
  if (!email) throw new Error('Email is missing.');

  const apiKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.trim() : null;
  const emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : null;
  const fromName = process.env.FROM_NAME ? process.env.FROM_NAME.trim() : 'Gaon Se Ghar Tak';

  if (!apiKey || !emailFrom) {
    console.error('Email service configuration missing.');
    return;
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: email.trim(),
    from: {
      email: emailFrom,
      name: fromName,
    },
    subject: 'Security Alert: Too Many Failed Login Attempts',
    text: `Your account has been temporarily locked due to 5 consecutive failed login attempts. Please try again after 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #e74c3c; text-align: center;">Security Alert</h1>
        <div style="background-color: #fceae9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="font-size: 16px; color: #c0392b;">Too Many Failed Login Attempts</p>
          <p style="font-size: 14px; color: #555;">Your account has been temporarily locked after 5 consecutive failed login attempts.</p>
          <p style="font-size: 18px; font-weight: bold; color: #2c3e50; margin: 15px 0;">Please try again after 10 minutes.</p>
        </div>
        <p style="font-size: 14px; color: #777; line-height: 1.6;">
          If this wasn't you, please reset your password immediately to secure your account.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          Gaon Se Ghar Tak - Security Notification
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Lockout email sent to ${email}`);
  } catch (error) {
    console.error('[SendGrid] Error sending lockout email:', error);
  }
};

module.exports = { sendOTP, sendLockoutEmail };
