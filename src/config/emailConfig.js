const nodemailer = require('nodemailer');
const config = require('../../config');

// Email configuration
const emailConfig = {
  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || process.env.email || '',
      pass: process.env.SMTP_PASS || process.env.emailPassword || ''
    }
  },

  // Check if email is properly configured
  isConfigured: () => {
    return emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass && 
           emailConfig.smtp.auth.user !== 'your-email@gmail.com' && 
           emailConfig.smtp.auth.pass !== 'your-app-password';
  },

  // Get setup instructions
  getSetupInstructions: () => {
    return `
Email configuration is not set up properly. Please follow these steps:

1. Create a Gmail App Password:
   - Go to your Google Account settings
   - Enable 2-Step Verification if not already enabled
   - Go to Security > App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

2. Set environment variables:
   - SMTP_USER=your-gmail@gmail.com
   - SMTP_PASS=your-16-character-app-password

3. Or update the .env file:
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-character-app-password

Note: Do NOT use your regular Gmail password. Use the App Password generated in step 1.
    `;
  },

  // Email templates
  templates: {
    welcome: {
      subject: 'Welcome to A2Z Lotto',
      template: `
        <h2>Welcome to A2Z Lotto!</h2>
        <p>Dear {{name}},</p>
        <p>Thank you for registering with A2Z Lotto. Your account has been successfully created.</p>
        <p>Your App ID: <strong>{{appId}}</strong></p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{{verificationLink}}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>A2Z Lotto Team</p>
      `
    },
    passwordReset: {
      subject: 'Password Reset Request - A2Z Lotto',
      template: `
        <h2>Password Reset Request</h2>
        <p>Dear {{name}},</p>
        <p>We received a request to reset your password for your A2Z Lotto account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="{{resetLink}}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>A2Z Lotto Team</p>
      `
    },
    lotteryResults: {
      subject: 'Lottery Results - A2Z Lotto',
      template: `
        <h2>Lottery Results</h2>
        <p>Dear {{name}},</p>
        <p>The results for {{gameType}} lottery are now available.</p>
        <p><strong>Winning Numbers:</strong> {{winningNumbers}}</p>
        <p><strong>Draw Date:</strong> {{drawDate}}</p>
        <p><strong>Draw Number:</strong> {{drawNumber}}</p>
        {{#if isWinner}}
        <p><strong>Congratulations! You won {{winnings}}!</strong></p>
        {{else}}
        <p>Better luck next time!</p>
        {{/if}}
        <p>Best regards,<br>A2Z Lotto Team</p>
      `
    },
    rechargeConfirmation: {
      subject: 'Recharge Confirmation - A2Z Lotto',
      template: `
        <h2>Recharge Confirmation</h2>
        <p>Dear {{name}},</p>
        <p>Your recharge request has been confirmed.</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p>Your account balance has been updated.</p>
        <p>Best regards,<br>A2Z Lotto Team</p>
      `
    },
    withdrawalConfirmation: {
      subject: 'Withdrawal Confirmation - A2Z Lotto',
      template: `
        <h2>Withdrawal Confirmation</h2>
        <p>Dear {{name}},</p>
        <p>Your withdrawal request has been processed.</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p>The funds will be transferred to your registered bank account within 24-48 hours.</p>
        <p>Best regards,<br>A2Z Lotto Team</p>
      `
    }
  },

  // Create transporter
  createTransporter: () => {
    // Check if email is configured
    if (!emailConfig.isConfigured()) {
      const error = new Error('Email configuration is not set up properly');
      error.code = 'EMAIL_NOT_CONFIGURED';
      error.instructions = emailConfig.getSetupInstructions();
      throw error;
    }

    return nodemailer.createTransport(emailConfig.smtp);
  },

  // Send email
  sendEmail: async (to, subject, html, text = null) => {
    try {
      const transporter = emailConfig.createTransporter();
      
      const mailOptions = {
        from: `"A2Z Lotto" <${emailConfig.smtp.auth.user}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      };

      const result = await transporter.sendMail(mailOptions);
      config.logger.info({ to, subject, messageId: result.messageId }, 'Email sent successfully');
      return result;
    } catch (error) {
      config.logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  },

  // Send mail (compatibility function)
  sendMail: async (to, subject, html, userId = null) => {
    try {
      // Check if email is configured
      if (!emailConfig.isConfigured()) {
        config.logger.warn('Email not configured - skipping email send', { to, subject, userId });
        // Return success to prevent API failures, but log the issue
        return { success: true, message: 'Email not configured - check logs for setup instructions' };
      }

      const transporter = emailConfig.createTransporter();
      
      const mailOptions = {
        from: `"A2Z Lotto" <${emailConfig.smtp.auth.user}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      };

      const result = await transporter.sendMail(mailOptions);
      config.logger.info({ to, subject, messageId: result.messageId, userId }, 'Email sent successfully');
      return result;
    } catch (error) {
      if (error.code === 'EMAIL_NOT_CONFIGURED') {
        config.logger.error('Email configuration error:', error.instructions);
        // Return success to prevent API failures, but log the setup instructions
        return { success: true, message: 'Email not configured - check server logs for setup instructions' };
      }
      
      config.logger.error({ error, to, subject, userId }, 'Failed to send email');
      throw error;
    }
  },

  // Send welcome email
  sendWelcomeEmail: async (user, verificationLink) => {
    const template = emailConfig.templates.welcome.template;
    const html = template
      .replace('{{name}}', user.name || user.email)
      .replace('{{appId}}', user.appId)
      .replace('{{verificationLink}}', verificationLink);

    return await emailConfig.sendEmail(
      user.email,
      emailConfig.templates.welcome.subject,
      html
    );
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetLink) => {
    const template = emailConfig.templates.passwordReset.template;
    const html = template
      .replace('{{name}}', user.name || user.email)
      .replace('{{resetLink}}', resetLink);

    return await emailConfig.sendEmail(
      user.email,
      emailConfig.templates.passwordReset.subject,
      html
    );
  },

  // Send lottery results email
  sendLotteryResultsEmail: async (user, gameType, winningNumbers, drawDate, drawNumber, isWinner = false, winnings = 0) => {
    const template = emailConfig.templates.lotteryResults.template;
    const html = template
      .replace('{{name}}', user.name || user.email)
      .replace('{{gameType}}', gameType)
      .replace('{{winningNumbers}}', winningNumbers)
      .replace('{{drawDate}}', drawDate)
      .replace('{{drawNumber}}', drawNumber)
      .replace('{{isWinner}}', isWinner)
      .replace('{{winnings}}', winnings);

    return await emailConfig.sendEmail(
      user.email,
      emailConfig.templates.lotteryResults.subject,
      html
    );
  },

  // Send recharge confirmation email
  sendRechargeConfirmationEmail: async (user, amount, transactionId, date) => {
    const template = emailConfig.templates.rechargeConfirmation.template;
    const html = template
      .replace('{{name}}', user.name || user.email)
      .replace('{{amount}}', amount)
      .replace('{{transactionId}}', transactionId)
      .replace('{{date}}', date);

    return await emailConfig.sendEmail(
      user.email,
      emailConfig.templates.rechargeConfirmation.subject,
      html
    );
  },

  // Send withdrawal confirmation email
  sendWithdrawalConfirmationEmail: async (user, amount, transactionId, date) => {
    const template = emailConfig.templates.withdrawalConfirmation.template;
    const html = template
      .replace('{{name}}', user.name || user.email)
      .replace('{{amount}}', amount)
      .replace('{{transactionId}}', transactionId)
      .replace('{{date}}', date);

    return await emailConfig.sendEmail(
      user.email,
      emailConfig.templates.withdrawalConfirmation.subject,
      html
    );
  },

  // Validate email address
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Get email domain
  getEmailDomain: (email) => {
    return email.replace(/.*@/, "");
  },

  // Check if email is disposable
  isDisposableEmail: (email) => {
    const domain = emailConfig.getEmailDomain(email);
    const disposableDomains = [
      'tempmail.com', 'throwaway.com', 'test.com', 'example.com',
      'mailinator.com', 'guerrillamail.com', '10minutemail.com'
    ];
    return disposableDomains.includes(domain.toLowerCase());
  }
};

module.exports = emailConfig; 