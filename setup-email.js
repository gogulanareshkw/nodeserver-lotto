#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 A2Z Lotto Email Configuration Setup\n');

console.log('This script will help you configure Gmail SMTP for sending emails.\n');

console.log('📋 Prerequisites:');
console.log('1. A Gmail account with 2-Step Verification enabled');
console.log('2. A Gmail App Password (16-character password)\n');

console.log('📖 How to get Gmail App Password:');
console.log('1. Go to https://myaccount.google.com/');
console.log('2. Click "Security" in the left sidebar');
console.log('3. Under "Signing in to Google", click "2-Step Verification"');
console.log('4. Enable 2-Step Verification if not already enabled');
console.log('5. Go back to Security and click "App passwords"');
console.log('6. Select "Mail" from the dropdown and click "Generate"');
console.log('7. Copy the 16-character password\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEmail() {
  try {
    const gmail = await question('Enter your Gmail address: ');
    const appPassword = await question('Enter your Gmail App Password (16 characters): ');

    if (!gmail.includes('@gmail.com')) {
      console.log('❌ Please enter a valid Gmail address');
      rl.close();
      return;
    }

    if (appPassword.length !== 16) {
      console.log('❌ App Password should be exactly 16 characters');
      rl.close();
      return;
    }

    // Read current development.env
    const envPath = path.join(__dirname, 'development.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update email configuration
    const lines = envContent.split('\n');
    let updated = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('email=')) {
        lines[i] = `email=${gmail}`;
        updated = true;
      }
      if (lines[i].startsWith('emailPassword=')) {
        lines[i] = `emailPassword=${appPassword}`;
        updated = true;
      }
    }

    // Add if not found
    if (!updated) {
      lines.push(`email=${gmail}`);
      lines.push(`emailPassword=${appPassword}`);
    }

    // Write back to file
    fs.writeFileSync(envPath, lines.join('\n'));

    console.log('\n✅ Email configuration updated successfully!');
    console.log(`📧 Gmail: ${gmail}`);
    console.log('🔑 App Password: [configured]');
    console.log('\n🔄 Please restart your server for changes to take effect.');
    console.log('\n📝 Note: The server will now use Gmail SMTP for sending emails.');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

setupEmail(); 