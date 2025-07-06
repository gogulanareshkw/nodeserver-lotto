# A2ZLotto Node.js Server

A comprehensive Node.js server for the A2ZLotto lottery gaming platform, combining features from both the original a2zlottoserver and webapp.

## 🚀 Features

### Authentication & Authorization
- **Multi-role authentication** (Super Admin, Admin, User, Agent, Staff)
- **JWT-based authentication** with passport.js
- **Appkey validation** for public endpoints
- **Session management** with express-session

### Lottery Game Management
- **Multiple lottery types**: Thailand, Bangkok Weekly, Dubai Daily, London Weekly, Mexico Monthly
- **Game play types**: First Prize, Three Up, Two Up, Two Down, Single, Total
- **Real-time game results** with automatic updates
- **Game permissions** and settings management
- **Game boards** and result summaries

### Financial Management
- **Recharge system** with multiple payment methods
- **Withdrawal system** with bank card integration
- **Transaction history** and management
- **Wallet management** with balance tracking
- **Referral bonus system**

### User Management
- **User registration** and profile management
- **Email verification** system
- **Password reset** functionality
- **User blocking/unblocking** by admins
- **Agent registration** and approval system

### Admin Features
- **Comprehensive admin dashboard**
- **User management** and monitoring
- **Transaction management** and approval
- **System settings** configuration
- **Application logs** and monitoring
- **Database history** and cleanup tools

### Content Management
- **Media upload** and management
- **Feedback system** with multiple types
- **Help links** management
- **Offers** and promotions system
- **Email service** integration

### System Features
- **Cron jobs** for automated tasks
- **Currency exchange rates** integration
- **Mobile data** collection and management
- **Application agents** management
- **Swagger API documentation**

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens
- **Multer** - File upload handling
- **Cron** - Scheduled tasks
- **Swagger** - API documentation
- **Pino** - Logging
- **Cloudinary** - Cloud storage
- **Nodemailer** - Email service

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodeserver-lotto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `development.env` to `.env` for development
   - Copy `production.env` to `.env` for production
   - Update the variables according to your setup

4. **Configure MongoDB**
   - Ensure MongoDB is running
   - Update `MONGO_DB_URL` in your environment file

5. **Start the server**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | production |
| `PORT` | Server port | 3001 |
| `SECURE_APP_KEY` | App key for public endpoints | 68c1b935-1c1f-4c10-b16b-3fd6e3cba270 |
| `MONGO_DB_URL` | MongoDB connection string | mongodb://localhost:27017/A2ZLottoDB |
| `jwtSecret` | JWT secret key | a2ZlOtToSeCrEtKeY |
| `email` | Email service account | test@gmail.com |
| `emailPassword` | Email service password | test@123 |

### API Endpoints

The server provides comprehensive API endpoints organized by functionality:

- **Authentication**: `/api/user/*`
- **Game Settings**: `/api/gameSettings/*`
- **Lottery Games**: `/api/lotteryGame*/*`
- **Financial**: `/api/recharge/*`, `/api/withdraw/*`, `/api/bankcard/*`
- **Admin**: `/api/applicationAgent/*`, `/api/applicationLogs/*`
- **Content**: `/api/feedback/*`, `/api/media/*`, `/api/offer/*`
- **System**: `/api/currency/*`, `/api/db/*`

## 🔐 Security Features

- **Appkey validation** for public endpoints
- **JWT token authentication** for protected routes
- **Role-based access control** (RBAC)
- **Input validation** with express-validator
- **CORS configuration** for cross-origin requests
- **Rate limiting** and request validation

## 📊 Database Models

The server includes comprehensive MongoDB models:

- **User** - User accounts and profiles
- **GameSetting** - Application settings
- **LotteryGameSetting** - Lottery game configurations
- **LotteryGamePermission** - Game permissions
- **LotteryGameBoard** - Game boards
- **LotteryGamePlay** - Game plays and history
- **LotteryGameResult** - Game results
- **Recharge** - Recharge transactions
- **Withdraw** - Withdrawal transactions
- **BankCard** - Bank card management
- **Feedback** - User feedback
- **Media** - Media files
- **Offer** - Promotional offers
- **ApplicationAgent** - Agent applications
- **ApplicationLog** - System logs

## 🚀 Deployment

### Development
```bash
npm run start:dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📚 API Documentation

The server includes comprehensive Swagger API documentation available at:
```
http://localhost:3001/api/swagger
```

## 🔄 Cron Jobs

The server includes automated cron jobs for:

- **Currency rates** updates
- **Lottery game** start/stop scheduling
- **Monthly bonus** releases
- **System maintenance** tasks

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
- Email: admin@a2zlotto.com
- Documentation: Available at `/api/swagger`
- Issues: Please use the repository issue tracker

## 🔄 Version History

- **v1.0.0** - Initial release with complete lottery platform features
- Combined features from a2zlottoserver and webapp
- Modern Node.js and Express.js implementation
- Comprehensive API documentation
- Enhanced security and performance
