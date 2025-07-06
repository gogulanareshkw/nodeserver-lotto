#!/usr/bin/env node

require('dotenv').config({ path: './development.env' });
const emailConfig = require('./src/config/emailConfig');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  try {
    // Check if email is configured
    if (!emailConfig.isConfigured()) {
      console.log('❌ Email is not configured properly');
      console.log('\n📋 Setup Instructions:');
      console.log(emailConfig.getSetupInstructions());
      return;
    }

    console.log('✅ Email configuration looks good');
    console.log(`📧 SMTP Host: ${emailConfig.smtp.host}`);
    console.log(`📧 SMTP Port: ${emailConfig.smtp.port}`);
    console.log(`📧 SMTP User: ${emailConfig.smtp.auth.user}`);
    console.log(`🔑 SMTP Pass: [configured]`);

    // Test transporter creation
    console.log('\n🔧 Testing transporter creation...');
    const transporter = emailConfig.createTransporter();
    console.log('✅ Transporter created successfully');

    // Test connection
    console.log('\n🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    console.log('\n📤 Sending test email...');
    const testEmail = process.env.TEST_EMAIL || emailConfig.smtp.auth.user;
    
    const result = await emailConfig.sendMail(
      testEmail,
      'Test Email - A2Z Lotto',
      `
        <h2>Test Email</h2>
        <p>This is a test email from A2Z Lotto server.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    );

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📧 To: ${testEmail}`);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error - Common Solutions:');
      console.log('1. Make sure you\'re using a Gmail App Password (16 characters)');
      console.log('2. Ensure 2-Step Verification is enabled on your Google account');
      console.log('3. Verify the email address is correct');
      console.log('4. Check that the App Password was copied correctly');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error - Common Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the SMTP host and port are correct');
      console.log('3. Check if your firewall is blocking the connection');
    }
  }
}

// Run the test
testEmail(); 