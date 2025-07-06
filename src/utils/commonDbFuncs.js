const axios = require('axios');
const LotteryGamePermission = require('../models/lotteryGamePermission');
const Currency = require('../models/currency');
const DbHistory = require('../models/dbHistory');
const ApplicationLog = require('../models/applicationLog');
const GameSetting = require('../models/gameSetting');
const config = require('../../config');
const User = require('../models/user');
const dbUpdates = require('../cron/dbUpdates');
var moment = require('moment');

exports.updateLotteryGameRunningStatus = async function (type, value) {
    try {
        let gamePermission = {};
        let result = await LotteryGamePermission.findOne({ lotteryGameType: type });
        if (Boolean(result)) {
            let permissionId = result._id;
            let objUpdate = {
                updatedDateTime: moment.now()
            };
            objUpdate.canPlayLotteryGame = value;
            gamePermission = await LotteryGamePermission.findByIdAndUpdate(
                permissionId,
                objUpdate,
                { upsert: false, new: true }
            );
        }
        else if (!result) {
            const defaultPermissions = new LotteryGamePermission({
                lotteryGameType: type
            });
            gamePermission = await defaultPermissions.save();
        }

        return gamePermission;
    } catch (ex) {
        exports.createApplicationLog(null, "commonDbFuncs->updateLotteryGameRunningStatus", JSON.stringify({ type, value }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
    }
};

exports.saveTodayCurrencyRates = async function () {
    const dateFormat = "YYYY-MM-DD";
    const rightNow = moment().subtract(1, 'days').format(dateFormat);
    const countriesINeed = ["USD", "INR", "KWD", "AED", "SAR", "QAR", "LKR", "PKR", "BDT", "PHP", "NPR", "SGD", "MYR", "OMR", "BHD"]
    const usdUrl = "https://api.apilayer.com/currency_data/historical?date=" + rightNow + "&source=USD&currencies=" + countriesINeed.toString();

    try {
        const usdResp = await axios({ method: 'GET', url: usdUrl, headers: { apikey: "fz44YkODGJtNJ55ElKJHrSJ3yygmUM15" } });
        const usdRates = usdResp.data || {};
        if (!usdRates.success) {
            exports.createApplicationLog(null, "commonDbFuncs->saveTodayCurrencyRates-> API fail", JSON.stringify({ usdUrl, rightNow, countriesINeed }), JSON.stringify(usdRates?.error), usdRates?.error?.message, usdRates?.error?.toString() || "");
        }
        else if (usdRates.date) {
            const currency = new Currency({
                timestamp: usdRates.timestamp,
                date: usdRates.date,
                usdQuotes: {
                    USDINR: usdRates?.quotes?.USDINR || 0,
                    USDKWD: usdRates?.quotes?.USDKWD || 0,
                    USDAED: usdRates?.quotes?.USDAED || 0,
                    USDSAR: usdRates?.quotes?.USDSAR || 0,
                    USDQAR: usdRates?.quotes?.USDQAR || 0,
                    USDLKR: usdRates?.quotes?.USDLKR || 0,
                    USDPKR: usdRates?.quotes?.USDPKR || 0,
                    USDBDT: usdRates?.quotes?.USDBDT || 0,
                    USDPHP: usdRates?.quotes?.USDPHP || 0,
                    USDNPR: usdRates?.quotes?.USDNPR || 0,
                    USDSGD: usdRates?.quotes?.USDSGD || 0,
                    USDMYR: usdRates?.quotes?.USDMYR || 0,
                    USDOMR: usdRates?.quotes?.USDOMR || 0,
                    USDBHD: usdRates?.quotes?.USDBHD || 0
                }
            });

            let result = await Currency.findOne({ date: rightNow });
            if (!result) {
                await currency.save();
            }
        }

    } catch (ex) {
        exports.createApplicationLog(null, "commonDbFuncs->saveTodayCurrencyRates", JSON.stringify({ rightNow, countriesINeed }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
    }
};

exports.createDbHistory = async function (fieldName, fieldValue, collectionName, updateType, updatedFor, updatedBy, desc) {
    try {
        const newDbHistory = new DbHistory({
            fieldName: fieldName,
            fieldValue: fieldValue,
            collectionName: collectionName,
            updateType: updateType,
            updatedFor: updatedFor,
            updatedBy: updatedBy,
            description: desc,
            createdDateTime: moment.now()
        });
        return await newDbHistory.save();
    } catch (ex) {
        exports.createApplicationLog(null, "commonDbFuncs->createDbHistory", JSON.stringify({ fieldName, fieldValue, collectionName, updateType, updatedFor, updatedBy, desc }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
    }
};

exports.createApplicationLog = async function (userId, errorMethod, inputPayload, errorInfo, errMsg, errInStr, source) {
    try {
        const newLog = new ApplicationLog({
            userId: userId,
            errorMethod: errorMethod || "",
            inputPayload: inputPayload || "",
            errorInfo: errorInfo || "",
            errorMessage: errMsg || "",
            errorInString: errInStr || "",
            source: source || "",
            createdDateTime: moment.now()
        });
        return await newLog.save();
    } catch (ex) {
        console.error('Failed to create application log:', ex);
    }
};

exports.getGameSettings = async function () {
    try {
        let gameSetting = {};
        let defaultGameSettings = new GameSetting();
        let gameSettingResults = await GameSetting.find({});
        if (gameSettingResults.length === 0) {
            let newGameSettings = await defaultGameSettings.save();
            gameSetting = newGameSettings;
        }
        else {
            gameSetting = gameSettingResults[0];
        }
        return gameSetting;
    } catch (ex) {
        exports.createApplicationLog(null, "commonDbFuncs->getGameSettings", JSON.stringify({}), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return {};
    }
};

exports.getLastCreatedUser = async function () {
    try {
        let lastCreatedUsers = await User.find({}, '_id appId').sort('-createdDateTime').limit(1).exec();
        return lastCreatedUsers[0] || {};
    } catch (ex) {
        exports.createApplicationLog(null, "commonDbFuncs->getLastCreatedUser", JSON.stringify({}), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return {};
    }
};

// Enhanced utility functions
exports.validateEmailDomain = function (email) {
    const domain = email.replace(/.*@/, "");
    const invalidDomains = ['tempmail.com', 'throwaway.com', 'test.com'];
    return !invalidDomains.includes(domain.toLowerCase());
};

exports.generateAppId = async function () {
    try {
        const lastUser = await exports.getLastCreatedUser();
        const newAppId = Number(lastUser.appId) + 1;
        return newAppId.toString();
    } catch (error) {
        config.logger.error({ error }, 'Failed to generate app ID');
        return (Date.now() % 1000000000).toString();
    }
};

exports.userExists = async function (email) {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        return !!user;
    } catch (error) {
        config.logger.error({ error, email }, 'Failed to check if user exists');
        return false;
    }
};

exports.getUserByEmail = async function (email) {
    try {
        return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
        config.logger.error({ error, email }, 'Failed to get user by email');
        return null;
    }
};

exports.updateUserBalance = async function (userId, amount, operation = 'add') {
    try {
        const updateObj = operation === 'add' 
            ? { $inc: { availableAmount: amount } }
            : { $inc: { availableAmount: -Math.abs(amount) } };

        const user = await User.findByIdAndUpdate(userId, updateObj, { new: true });
        
        if (!user) {
            throw new Error('User not found');
        }

        config.logger.info({ userId, amount, operation, newBalance: user.availableAmount }, 'User balance updated');
        return user;
    } catch (error) {
        config.logger.error({ error, userId, amount, operation }, 'Failed to update user balance');
        throw error;
    }
};

exports.checkUserBalance = async function (userId, requiredAmount) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.availableAmount >= requiredAmount;
    } catch (error) {
        config.logger.error({ error, userId, requiredAmount }, 'Failed to check user balance');
        return false;
    }
};

exports.getUserStats = async function (userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            totalRecharges: user.totalRecharges || 0,
            totalWithdrawals: user.totalWithdrawals || 0,
            totalLotteryPlays: user.totalLotteryPlays || 0,
            referralCount: user.referralCount || 0,
            availableAmount: user.availableAmount || 0,
            totalWinnings: user.totalWinnings || 0
        };
    } catch (error) {
        config.logger.error({ error, userId }, 'Failed to get user statistics');
        return null;
    }
};

exports.validatePhoneNumber = function (phone) {
    const phoneRegex = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})|([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
};

exports.sanitizeUserData = function (userData) {
    const sanitized = { ...userData };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.passwordResetToken;
    delete sanitized.passwordResetExpires;
    delete sanitized.verificationToken;
    delete sanitized.verificationTokenExpires;
    
    return sanitized;
};

exports.formatCurrency = function (amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

exports.generateRandomString = function (length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

exports.validateCoordinates = function (latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
};

exports.getDistance = function (lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}; 