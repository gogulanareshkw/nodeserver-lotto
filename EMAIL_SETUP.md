# Email Configuration Setup Guide

## Gmail SMTP Configuration

The application uses Gmail SMTP for sending emails. Follow these steps to configure it properly:

### Step 1: Enable 2-Step Verification
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the steps to enable 2-Step Verification

### Step 2: Generate App Password
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "App passwords"
4. Select "Mail" from the dropdown
5. Click "Generate"
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
Update your `development.env` file with the following:

```env
# Email Configuration
email=your-gmail@gmail.com
emailPassword=your-16-character-app-password

# Or use the new SMTP variables (recommended)
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Step 4: Test Configuration
Restart your server and try sending a test email. The application will now use the proper Gmail credentials.

## Troubleshooting

### Error: "Username and Password not accepted"
- Make sure you're using an **App Password**, not your regular Gmail password
- Ensure 2-Step Verification is enabled on your Google account
- Verify the email address is correct
- Check that the App Password was copied correctly (16 characters, no spaces)

### Error: "Less secure app access"
- Google no longer supports "less secure app access"
- You must use App Passwords with 2-Step Verification enabled

### Error: "Email not configured"
- Check that the environment variables are set correctly
- Restart the server after updating environment variables
- Verify the `.env` file is in the correct location

## Alternative Email Providers

If you prefer to use a different email provider, update the SMTP configuration:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Security Notes

- Never commit your email credentials to version control
- Use environment variables for all sensitive information
- Regularly rotate your App Passwords
- Consider using email service providers like SendGrid or Mailgun for production 