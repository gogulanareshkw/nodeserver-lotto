const moment = require('moment');
const config = require('../../config');

// Common utility functions
const func = {
	// Generate random string
	generateRandomString: (length = 8) => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	},

	// Generate random number
	generateRandomNumber: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	// Format currency
	formatCurrency: (amount, currency = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(amount);
	},

	// Format date
	formatDate: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
		return moment(date).format(format);
	},

	// Generate referral code
	generateReferralCode: (length) => {
		let result = '';
		let characters = 'ABCDEFGabcdefg0123HIJKLMNOhijklmno4567PQRSTUVWpqrstuvwXYZxyz89';
		let charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() *
				charactersLength));
		}
		return result;
	},

	// Generate OTP
	generateOTP: () => {
		let otpLength = 6;
		// Declare a digits variable  
		// which stores all digits 
		let digits = '0123456789';
		let OTP = '';
		for (let i = 0; i < otpLength; i++) {
			OTP += digits[Math.floor(Math.random() * 10)];
		}
		return OTP;
	},

	// Get current time
	getCurrentTime: () => {
		const dateFormat = "YYYY-MM-DD HH:mm:ss";
		const rightNow = moment().utc().format(dateFormat);
		let year = Number(moment(rightNow).format('YYYY'));
		let month = Number(moment(rightNow).format('MM') || 0);
		let dayOfMonth = Number(moment(rightNow).format('DD'));
		let weekOfYear = Number(moment(rightNow).format('WW') || 0);
		let dayOfWeek = Number(moment(rightNow).format('E') || 0);
		let dayOfYear = Number(moment(rightNow).format('DDDD') || 0);
		let hour = moment(rightNow).hour();
		let mins = moment(rightNow).minutes();
		let secs = moment(rightNow).seconds();
		return { year, month, dayOfMonth, hour, mins, secs, weekOfYear, dayOfWeek, dayOfYear };
	},

	// Parse lottery game number
	parseLotteryGameNumber: (gameNumber) => {
		let lotteryGameNumber = gameNumber?.toString() || "";
		if (!lotteryGameNumber) return {};
		const lotteryGameType = Number(lotteryGameNumber.charAt(0) || 0);
		const year = Number(lotteryGameNumber.substr(1, 4) || 0);
		const month = Number(lotteryGameNumber.substr(5, 2) || 0);
		const weekOfYear = Number(lotteryGameNumber.substr(7, 2) || 0);
		const dayOfWeek = Number(lotteryGameNumber.substr(9, 1) || 0);
		const dayOfMonth = Number(lotteryGameNumber.substr(10, 2) || 0);
		const dayOfYear = Number(lotteryGameNumber.substr(12, 3) || 0);
		const hours = Number(lotteryGameNumber.substr(15, 2) || 0);
		const minutes = Number(lotteryGameNumber.substr(17, 2) || 0);
		return { lotteryGameType, year, month, weekOfYear, dayOfWeek, dayOfMonth, dayOfYear, hours, minutes };
	},

	// Get last game winners list
	getLastGameWinnersList: (count) => {
		// calculate time left
		let UserNames = [
			"kingw*****@gmail.com", "johny*****@gmail.com", "aarif*****@gmail.com", "shafi*****@outlook.com", "tahir*****@gmail.com", "kafir*****@gmail.com", "Leosa*****@gmail.com", "vijaa*****@gmail.com", "thait*****@gmail.com", "wingo*****@gmail.com",
			"shran*****@gmail.com", "tamba*****@gmail.com", "suren*****@gmail.com", "aarji*****@outlook.com", "neoja*****@gmail.com", "balan*****@gmail.com", "sofia*****@gmail.com", "karen*****@gmail.com", "rupes*****@gmail.com", "shaik*****@gmail.com",
			"gabri*****@gmail.com", "lisar*****@gmail.com", "mytha*****@gmail.com", "jaani*****@outlook.com", "singj*****@gmail.com", "reddy*****@gmail.com", "komal*****@gmail.com", "sharm*****@gmail.com", "deepa*****@gmail.com", "anvar*****@gmail.com",
			"basha*****@gmail.com", "heesh*****@gmail.com", "arabt*****@gmail.com", "kirna*****@outlook.com", "thamb*****@gmail.com", "aslam*****@gmail.com", "habib*****@gmail.com", "reena*****@gmail.com", "heeju*****@gmail.com", "wingo*****@gmail.com",
		];
		let amounts = [90000, 82000, 70800, 61500, 10500, 28300, 45050, 61070, 56000, 93100, 49000, 92700, 43000, 100750, 141050, 72800, 71000, 57000, 61750, 31200, 88920, 37500];

		let winners = [];
		for (let i = 0; i < count; i++) {
			winners.push({
				user: UserNames[Math.floor(Math.random() * UserNames.length)],
				winningAmount: amounts[Math.floor(Math.random() * amounts.length)].toString()
			});
		}
		return winners;
	},

	// Calculate lottery game discounts
	calculateLotteryGameDiscounts: (isSpecialUser, lotteryGameType, totalPlayedAmount, gameType, gameSettings, permissionsObj, currDateTimeObj, lotteryGameParserObj) => {
		let discount = 0;
		let discountPercent = 0;
		let winningAmountText = "";

		const gameDiscountStopTime = gameSettings.gameDiscountStopHour || "0:0";
		let defaultHour = (lotteryGameType === 1 || lotteryGameType === 2) ? 5 : (lotteryGameType === 3 || lotteryGameType === 4 || lotteryGameType === 5) ? 12 : 0;
		let defaultMin = (lotteryGameType === 1 || lotteryGameType === 2) ? 0 : (lotteryGameType === 3 || lotteryGameType === 4 || lotteryGameType === 5) ? 0 : 0;
		const gameDiscountStopTimeHour = Number(gameDiscountStopTime.split(":")[0] || defaultHour);
		const gameDiscountStopTimeMins = Number(gameDiscountStopTime.split(":")[1] || defaultMin);

		let isApplicableLastDayDiscount = (
			permissionsObj.enableLastDayDiscounts &&
			(currDateTimeObj.dayOfMonth === lotteryGameParserObj.dayOfMonth) &&
			(gameDiscountStopTimeHour < currDateTimeObj.hour || (gameDiscountStopTimeHour === currDateTimeObj.hour && gameDiscountStopTimeMins < currDateTimeObj.mins) || (gameDiscountStopTimeHour === currDateTimeObj.hour && gameDiscountStopTimeMins === currDateTimeObj.mins && currDateTimeObj.mins > 0))
		) || false;

		let firstPrizeDiscountPercent = isSpecialUser ? (gameSettings.firstPrizePlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.firstPrizePlayLastDayDiscountPercent || 0) : (gameSettings.firstPrizePlayDiscountPercent || 0);
		let threeUpDiscountPercent = isSpecialUser ? (gameSettings.threeUpPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.threeUpPlayLastDayDiscountPercent || 0) : (gameSettings.threeUpPlayDiscountPercent || 0);
		let twoUpDiscountPercent = isSpecialUser ? (gameSettings.twoUpPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoUpPlayLastDayDiscountPercent || 0) : (gameSettings.twoUpPlayDiscountPercent || 0);
		let twoDownDiscountPercent = isSpecialUser ? (gameSettings.twoDownPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoDownPlayLastDayDiscountPercent || 0) : (gameSettings.twoDownPlayDiscountPercent || 0);
		let threeUpSingleDigitDiscountPercent = isSpecialUser ? (gameSettings.threeUpSingleDigitPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.threeUpSingleDigitPlayLastDayDiscountPercent || 0) : (gameSettings.threeUpSingleDigitPlayDiscountPercent || 0);
		let twoUpSingleDigitDiscountPercent = isSpecialUser ? (gameSettings.twoUpSingleDigitPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoUpSingleDigitPlayLastDayDiscountPercent || 0) : (gameSettings.twoUpSingleDigitPlayDiscountPercent || 0);
		let twoDownSingleDigitDiscountPercent = isSpecialUser ? (gameSettings.twoDownSingleDigitPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoDownSingleDigitPlayLastDayDiscountPercent || 0) : (gameSettings.twoDownSingleDigitPlayDiscountPercent || 0);
		let threeUpGameTotalDiscountPercent = isSpecialUser ? (gameSettings.threeUpGameTotalPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.threeUpGameTotalPlayLastDayDiscountPercent || 0) : (gameSettings.threeUpGameTotalPlayDiscountPercent || 0);
		let twoUpGameTotalDiscountPercent = isSpecialUser ? (gameSettings.twoUpGameTotalPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoUpGameTotalPlayLastDayDiscountPercent || 0) : (gameSettings.twoUpGameTotalPlayDiscountPercent || 0);
		let twoDownGameTotalDiscountPercent = isSpecialUser ? (gameSettings.twoDownGameTotalPlaySpecialDiscountPercent || 0) : isApplicableLastDayDiscount ? (gameSettings.twoDownGameTotalPlayLastDayDiscountPercent || 0) : (gameSettings.twoDownGameTotalPlayDiscountPercent || 0);

		switch (gameType) {
			case "FirstPrize": {
				discountPercent = firstPrizeDiscountPercent;
				discount = totalPlayedAmount * (firstPrizeDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.firstPrizeStraightWinningPercent || 0) + " in Straight and ₹" + (gameSettings.firstPrizeRumbleWinningPercent || 0) + " in Rumble";
				break;
			}
			case "ThreeUp": {
				discountPercent = threeUpDiscountPercent;
				discount = totalPlayedAmount * (threeUpDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.threeUpStraightWinningPercent || 0) + " in Straight and ₹" + (gameSettings.threeUpRumbleWinningPercent || 0) + " in Rumble";
				break;
			}
			case "TwoUp": {
				discountPercent = twoUpDiscountPercent;
				discount = totalPlayedAmount * (twoUpDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoUpWinningPercent || 0);
				break;
			}
			case "TwoDown": {
				discountPercent = twoDownDiscountPercent;
				discount = totalPlayedAmount * (twoDownDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoDownWinningPercent || 0);
				break;
			}
			case "ThreeUpSingle": {
				discountPercent = threeUpSingleDigitDiscountPercent;
				discount = totalPlayedAmount * (threeUpSingleDigitDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.threeUpSingleDigitWinningPercent || 0);
				break;
			}
			case "TwoUpSingle": {
				discountPercent = twoUpSingleDigitDiscountPercent;
				discount = totalPlayedAmount * (twoUpSingleDigitDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoUpSingleDigitWinningPercent || 0);
				break;
			}
			case "TwoDownSingle": {
				discountPercent = twoDownSingleDigitDiscountPercent;
				discount = totalPlayedAmount * (twoDownSingleDigitDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoDownSingleDigitWinningPercent || 0);
				break;
			}
			case "ThreeUpTotal": {
				discountPercent = threeUpGameTotalDiscountPercent;
				discount = totalPlayedAmount * (threeUpGameTotalDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.threeUpTotalWinningPercent || 0);
				break;
			}
			case "TwoUpTotal": {
				discountPercent = twoUpGameTotalDiscountPercent;
				discount = totalPlayedAmount * (twoUpGameTotalDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoUpTotalWinningPercent || 0);
				break;
			}
			case "TwoDownTotal": {
				discountPercent = twoDownGameTotalDiscountPercent;
				discount = totalPlayedAmount * (twoDownGameTotalDiscountPercent / 100);
				winningAmountText = "₹" + (gameSettings.twoDownTotalWinningPercent || 0);
				break;
			}
			default: break;
		}

		return { discount, discountPercent, winningAmountText };
	},

	// Merge objects
	mergeObjects: (...objects) => {
		return objects.reduce((result, obj) => {
			return { ...result, ...obj };
		}, {});
	},

	// Pick properties from object
	pick: (obj, keys) => {
		const result = {};
		keys.forEach(key => {
			if (obj.hasOwnProperty(key)) {
				result[key] = obj[key];
			}
		});
		return result;
	},

	// Omit properties from object
	omit: (obj, keys) => {
		const result = { ...obj };
		keys.forEach(key => {
			delete result[key];
		});
		return result;
	},

	// Check if object is empty
	isEmpty: (obj) => {
		if (obj === null || obj === undefined) return true;
		if (typeof obj === 'string') return obj.trim().length === 0;
		if (Array.isArray(obj)) return obj.length === 0;
		if (typeof obj === 'object') return Object.keys(obj).length === 0;
		return false;
	},

	// Check if value is numeric
	isNumeric: (value) => {
		return !isNaN(parseFloat(value)) && isFinite(value);
	},

	// Round to decimal places
	round: (number, decimals = 2) => {
		return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
	},

	// Calculate percentage
	calculatePercentage: (part, total) => {
		if (total === 0) return 0;
		return func.round((part / total) * 100, 2);
	},

	// Generate pagination info
	generatePagination: (page, limit, total) => {
		const totalPages = Math.ceil(total / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;
		
		return {
			currentPage: page,
			totalPages,
			totalItems: total,
			itemsPerPage: limit,
			hasNextPage,
			hasPrevPage,
			nextPage: hasNextPage ? page + 1 : null,
			prevPage: hasPrevPage ? page - 1 : null
		};
	},

	// Generate sorting object
	generateSort: (sortBy, sortOrder = 'asc') => {
		const order = sortOrder.toLowerCase() === 'desc' ? -1 : 1;
		return { [sortBy]: order };
	},

	// Generate search query
	generateSearchQuery: (searchTerm, fields) => {
		if (!searchTerm || !fields || fields.length === 0) return {};
		
		const searchRegex = new RegExp(searchTerm, 'i');
		const searchConditions = fields.map(field => ({
			[field]: searchRegex
		}));
		
		return { $or: searchConditions };
	},

	// Generate date range query
	generateDateRangeQuery: (startDate, endDate, field = 'createdDateTime') => {
		const query = {};
		
		if (startDate) {
			query[field] = { $gte: new Date(startDate) };
		}
		
		if (endDate) {
			query[field] = { ...query[field], $lte: new Date(endDate) };
		}
		
		return Object.keys(query).length > 0 ? query : {};
	},

	// Sleep function
	sleep: (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	},

	// Retry function
	retry: async (fn, maxRetries = 3, delay = 1000) => {
		for (let i = 0; i < maxRetries; i++) {
			try {
				return await fn();
			} catch (error) {
				if (i === maxRetries - 1) throw error;
				await func.sleep(delay * Math.pow(2, i)); // Exponential backoff
			}
		}
	},

	// Debounce function
	debounce: (func, wait) => {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	},

	// Throttle function
	throttle: (func, limit) => {
		let inThrottle;
		return function() {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => inThrottle = false, limit);
			}
		};
	},

	// Generate UUID (simple version)
	generateUUID: () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},

	// Check if running in development
	isDevelopment: () => {
		return process.env.NODE_ENV === 'development';
	},

	// Check if running in production
	isProduction: () => {
		return process.env.NODE_ENV === 'production';
	},

	// Get environment variable with fallback
	getEnv: (key, fallback = '') => {
		return process.env[key] || fallback;
	},

	// Log function with environment check
	log: (level, message, data = {}) => {
		if (func.isDevelopment()) {
			console.log(`[${level.toUpperCase()}] ${message}`, data);
		}
		// In production, use proper logging service
	},

	// Error handler wrapper
	handleError: (error, context = '') => {
		config.logger.error({ error, context }, 'Error occurred');
		return {
			success: false,
			message: error.message || 'An error occurred',
			error: func.isDevelopment() ? error.stack : undefined
		};
	},

	// Success response wrapper
	handleSuccess: (data, message = 'Success') => {
		return {
			success: true,
			message,
			data
		};
	}
};

module.exports = func; 