const config = require('./config');
const initiateThaiLotteryCronJobs = require('./src/utils/thaiLotteryCronJobs');
const express = require('express');
const cors = require('cors');
const fs = require("fs");
var passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_doc.json');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = express.Router();
const app = express();
const hostname = '127.0.0.1';
const port = 3001;

// Import enhanced middleware and utilities
const { 
	globalErrorHandler, 
	requestLogger 
} = require('./src/utils/errorHandler');
const { responseMiddleware } = require('./src/utils/apiResponse');
const bodyParserMiddleware = require('./src/middlewares/bodyParser');

// Import all routes
var applicationLogRoutes = require('./src/routes/applicationLog');
var applicationAgentRoutes = require('./src/routes/applicationAgent');
var testRoutes = require('./src/routes/test');
var userRoutes = require('./src/routes/user');
var gameSettingRoutes = require('./src/routes/gameSetting');
var rechargeRoutes = require('./src/routes/recharge');
var withdrawRoutes = require('./src/routes/withdraw');
var dbHistoryRoutes = require('./src/routes/dbHistory');
var bankCardRoutes = require('./src/routes/bankCard');
var currencyRoutes = require('./src/routes/currency');
var helpLinkRoutes = require('./src/routes/helpLink');
var feedbackRoutes = require('./src/routes/feedback');
var mediaRoutes = require('./src/routes/media');
var mobileDataRoutes = require('./src/routes/mobileData');
var offerRoutes = require('./src/routes/offer');
var emailServiceRoutes = require('./src/routes/emailService');
var lotteryGameBoardRoutes = require('./src/routes/lotteryGameBoard');
var lotteryGamePermissionRoutes = require('./src/routes/lotteryGamePermission');
var lotteryGamePlayRoutes = require('./src/routes/lotteryGamePlay');
var lotteryGameResultSummeryRoutes = require('./src/routes/lotteryGameResultSummery');
var lotteryGameSettingRoutes = require('./src/routes/lotteryGameSetting');

// Import passport configuration and cron jobs
require('./src/config/passport');
require('./src/utils/gameCronJobs');

// Enhanced CORS configuration
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		
		const allowedOrigins = [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8080',
			'https://a2zlotto.com',
			'https://www.a2zlotto.com'
		];
		
		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Enhanced Body Parser Middleware
app.use(bodyParser.json({ 
	limit: '50mb',
	verify: (req, res, buf) => {
		req.rawBody = buf;
	}
}));
app.use(bodyParser.urlencoded({ 
	limit: '50mb', 
	extended: true 
}));
app.use(cookieParser());

// Custom body parser middleware for safety
app.use(bodyParserMiddleware);

// Enhanced Session Configuration
app.use(require('express-session')({ 
	secret: config.jwtSecret, 
	resave: false, 
	saveUninitialized: false,
	cookie: {
		secure: config.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	}
}));

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Static files with caching
app.use('/public', express.static('public', {
	maxAge: '1d',
	etag: true
}));

// Enhanced request logging
app.use(requestLogger);

// Response middleware
app.use(responseMiddleware);

// Health check endpoint
router.get('/health', (req, res) => {
	res.success({
		status: 'OK',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: config.NODE_ENV,
		version: '1.0.0'
	}, 'Server is healthy');
});

// Root endpoint
router.get('/', function (req, res) {
	// #swagger.tags = ['Test']	
	// #swagger.summary = 'server running status'
	let html = fs.readFileSync('./public/index.html').toString('utf8');
	res.end(html + '\n');
});

// Database connection with enhanced error handling
const db = mongoose.connection;

// Log MongoDB connection events
db.on('connecting', () => {
  config.logger.info('MongoDB connecting...');});

db.on('connected', () => {
  config.logger.info('✅ MongoDB connected successfully');
});

db.once('open', () => {
  config.logger.info('🔓 MongoDB connection is open');
});

db.on('reconnected', () => {
  config.logger.info('🔄 MongoDB reconnected');
});

db.on('disconnected', () => {
  config.logger.warn('⚠️ MongoDB disconnected');
});

db.on('error', (error) => {
  config.logger.error('❌ MongoDB connection error:', error.message);
  mongoose.disconnect();
});

// Connect to MongoDB
config.logger.info('🔌 Connecting to MongoDB:', config.MONGO_DB_URL);
mongoose.connect(config.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}).catch(err => {
  config.logger.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

// Enhanced global middleware
app.use((req, res, next) => {
	req.logger = config.logger;
	
	// Enhanced CORS headers
	res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,Cache-Control,Set-Cookie');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	
	// Security headers
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('X-XSS-Protection', '1; mode=block');
	res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	
	// Log request
	config.logger.info({
		method: req.method,
		url: req.url,
		ip: req.ip,
		userAgent: req.get('User-Agent')
	}, 'API Request');
	
	// Database status check
	if (db && db.readyState === 0) {
		return res.internalError('Database connection failed');
	}
	
	if (db && db.readyState === 2) {
		return res.internalError('Database is connecting, please wait');
	}
	
	if (db && db.readyState === 3) {
		return res.internalError('Database is disconnecting, please wait');
	}
	
	next();
});

// API Routes with enhanced organization
app.use('/', router);

// Public routes (no authentication required)
app.use('/api', testRoutes);
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
	customCss: '.swagger-ui .topbar { display: none }',
	customSiteTitle: 'A2ZLotto API Documentation'
}));

// Protected routes (authentication required)
app.use('/api/applicationAgent', applicationAgentRoutes);
app.use('/api/applicationLogs', applicationLogRoutes);
app.use('/api/bankcard', bankCardRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/db', dbHistoryRoutes);
app.use('/api/emails', emailServiceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/gameSettings', gameSettingRoutes);
app.use('/api/helpLink', helpLinkRoutes);
app.use('/api/lotteryGameBoard', lotteryGameBoardRoutes);
app.use('/api/lotteryGamePermission', lotteryGamePermissionRoutes);
app.use('/api/lotteryGamePlay', lotteryGamePlayRoutes);
app.use('/api/lotteryGameResultSummery', lotteryGameResultSummeryRoutes);
app.use('/api/lotteryGameSetting', lotteryGameSettingRoutes);
app.use('/api/mobileData', mobileDataRoutes);
app.use('/api/offer', offerRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/user', userRoutes);

// Enhanced 404 handler
app.all('*', (req, res) => {
	res.notFound(`API endpoint ${req.method} ${req.url} not found`);
});

// Start server with enhanced error handling
const server = app.listen(port, hostname, function () {
	config.logger.info(`🚀 A2ZLotto Server running at http://${hostname}:${port}/`);
	config.logger.info(`📚 API Documentation available at http://${hostname}:${port}/api/swagger`);
	config.logger.info(`🏥 Health check available at http://${hostname}:${port}/health`);
	config.logger.info(`🌍 Environment: ${config.NODE_ENV}`);
});

// Enhanced error handling
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
	config.logger.info('SIGTERM received, shutting down gracefully');
	server.close(() => {
		config.logger.info('Process terminated');
		mongoose.connection.close();
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	config.logger.info('SIGINT received, shutting down gracefully');
	server.close(() => {
		config.logger.info('Process terminated');
		mongoose.connection.close();
		process.exit(0);
	});
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
	config.logger.error({ err }, 'Unhandled Promise Rejection');
	server.close(() => {
		process.exit(1);
	});
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
	config.logger.error({ err }, 'Uncaught Exception');
	server.close(() => {
		process.exit(1);
	});
}); 