const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // If email is not configured, return null
  if (!process.env.EMAIL_HOST) {
    console.warn('Email service not configured. Emails will be logged to console instead.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  // If no transporter (email not configured), log to console
  if (!transporter) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('\n=================================');
    console.log('PASSWORD RESET REQUESTED');
    console.log('Email:', email);
    console.log('Reset link:', resetLink);
    console.log('=================================\n');
    return { logged: true };
  }

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Snippet'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Snippet',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2b2b2b;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-family: 'Baskerville', 'Libre Baskerville', 'Palatino', serif;
            font-size: 36px;
            font-weight: 400;
            letter-spacing: 0.05em;
          }
          .content {
            background-color: #f5f5f5;
            padding: 30px 20px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Snippet</h1>
        </div>
        <div class="content">
          <h2 style="margin-top: 0;">Password Reset Request</h2>
          <p>You recently requested to reset your password for your Snippet account. Click the button below to reset it:</p>

          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            ${resetLink}
          </p>

          <div class="warning">
            <strong>Security Notice:</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>This link can only be used once</li>
              <li>If you didn't request this, you can safely ignore this email</li>
            </ul>
          </div>

          <div class="footer">
            <p>This is an automated email from Snippet. Please do not reply to this email.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request

You recently requested to reset your password for your Snippet account.

Reset your password by visiting this link:
${resetLink}

This link will expire in 1 hour and can only be used once.

If you didn't request this, you can safely ignore this email.

---
This is an automated email from Snippet. Please do not reply to this email.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
