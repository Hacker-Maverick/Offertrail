const { BrevoClient } = require('@getbrevo/brevo');
const path = require('path');

// Initialize the client with API key
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sender = {
  email: process.env.SENDER_EMAIL || 'no-reply@offertrail.com',
  name: process.env.SENDER_NAME || 'OfferTrail',
};

/**
 * Send a welcome email to a newly registered user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: "Welcome to OfferTrail! 🚀",
      sender,
      to: [{ email, name }],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1;">Welcome to OfferTrail, ${name}!</h2>
          <p>We're thrilled to have you on board. OfferTrail is designed to help you track your job applications and land your dream role.</p>
          <p>Here's what you can do right now:</p>
          <ul>
            <li>Add your first job application</li>
            <li>Set reminders for follow-ups</li>
            <li>Track your progress on the dashboard</li>
          </ul>
          <p>If you have any questions, feel free to reply to this email.</p>
          <p>Happy hunting!</p>
          <p>Best regards,<br>The OfferTrail Team</p>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: "Reset Your OfferTrail Password",
      sender,
      to: [{ email, name }],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>You requested a password reset for your OfferTrail account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
          <p>Best regards,<br>The OfferTrail Team</p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
