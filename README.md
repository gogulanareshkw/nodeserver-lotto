# A2Z Lotto Node.js Server

Complete Lottery Gaming Platform with enhanced architecture, security, and performance.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Gmail account with 2-Step Verification enabled

### Installation
```bash
npm install
```

### Environment Setup
1. Copy `development.env` to `.env` (if needed)
2. Configure your Gmail SMTP settings (see Email Configuration below)
3. Update MongoDB connection string if needed

### Start Development Server
```bash
npm run start:dev
```

## 📧 Email Configuration

The application uses Gmail SMTP for sending emails. Follow these steps to configure it:

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
6. Copy the 16-character password

### Step 3: Update Environment Variables
Update your `development.env` file:

```env
# Email Configuration
email=your-gmail@gmail.com
emailPassword=your-16-character-app-password
```

### Step 4: Test Email Configuration
```bash
npm run test:email
```

### Troubleshooting Email Issues

**Error: "Username and Password not accepted"**
- Make sure you're using an **App Password**, not your regular Gmail password
- Ensure 2-Step Verification is enabled on your Google account
- Verify the email address is correct
- Check that the App Password was copied correctly (16 characters, no spaces)

**Error: "Less secure app access"**
- Google no longer supports "less secure app access"
- You must use App Passwords with 2-Step Verification enabled

## 🔧 Available Scripts

- `npm run start:dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run test:email` - Test email configuration
- `npm run swagger-autogen` - Generate Swagger documentation

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3001/api-docs`
- API Base URL: `http://localhost:3001/api`

## 🏗️ Architecture

### Enhanced Features
- **Error Handling**: Comprehensive error management with custom error classes
- **Logging**: Structured logging with Pino
- **Validation**: Request validation with express-validator
- **Security**: Role-based access control, rate limiting, appkey validation
- **Performance**: Caching, retry logic, real-time polling
- **Monitoring**: Request/response logging, performance metrics

### Directory Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── scripts/         # Setup and maintenance scripts
```

## 🔐 Security Features

- JWT-based authentication
- Role-based authorization (SUPER_ADMIN, ADMIN, USER, AGENT, STAFF)
- Rate limiting
- Input validation and sanitization
- Secure password hashing
- CORS configuration
- Appkey validation for public APIs

## 📊 Monitoring & Logging

- Structured logging with Pino
- Request/response logging
- Error tracking
- Performance monitoring
- API usage analytics

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up proper email credentials
4. Configure SSL certificates
5. Set up monitoring and logging

### Environment Variables
```env
NODE_ENV=production
PORT=3001
MONGO_DB_URL=mongodb://your-production-db
jwtSecret=your-secure-jwt-secret
email=your-gmail@gmail.com
emailPassword=your-app-password
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the email setup guide
- Test email configuration with `npm run test:email`
- Check server logs for detailed error information

## 🔄 Version History

- **v1.0.0** - Initial release with complete lottery platform features
- Combined features from a2zlottoserver and webapp
- Modern Node.js and Express.js implementation
- Comprehensive API documentation
- Enhanced security and performance
