const config = require('../../config');
const User = require('../models/user');
const GameSetting = require('../models/gameSetting');
const LotteryGameSetting = require('../models/lotteryGameSetting');
const LotteryGameResult = require('../models/lotteryGameResult');
const ApplicationLog = require('../models/applicationLog');
const moment = require('moment');

// Database update utilities for cron jobs
const dbUpdates = {
  // Create application log entry
  createApplicationLog: async (userId, action, requestData, responseData, message, stackTrace) => {
    try {
      const logEntry = new ApplicationLog({
        userId: userId || null,
        action,
        requestData: requestData || '',
        responseData: responseData || '',
        message: message || '',
        stackTrace: stackTrace || '',
        createdDateTime: moment.now()
      });
      
      await logEntry.save();
      config.logger.info({ action, userId }, 'Application log created');
    } catch (error) {
      config.logger.error({ error, action, userId }, 'Failed to create application log');
    }
  },

  // Create database history entry
  createDbHistory: async (fieldName, value, collectionName, updateType, userId, updatedBy, description) => {
    try {
      const DbHistory = require('../models/dbHistory');
      const historyEntry = new DbHistory({
        fieldName,
        value,
        collectionName,
        updateType,
        userId,
        updatedBy,
        description,
        createdDateTime: moment.now()
      });
      
      await historyEntry.save();
      config.logger.info({ fieldName, collectionName, updateType }, 'Database history created');
    } catch (error) {
      config.logger.error({ error, fieldName, collectionName }, 'Failed to create database history');
    }
  },

  // Get game settings with caching
  getGameSettings: () => {
    // This would typically use a cache system
    // For now, return a default configuration
    return {
      isServerDown: false,
      superAdmins: config.superadmins,
      maintenanceMode: false,
      allowNewRegistrations: true,
      allowLotteryPlay: true,
      allowRecharge: true,
      allowWithdraw: true
    };
  },

  // Get last created user for app ID generation
  getLastCreatedUser: async () => {
    try {
      const lastUser = await User.findOne().sort({ appId: -1 });
      return lastUser || { appId: '1411851979' }; // Default starting app ID
    } catch (error) {
      config.logger.error({ error }, 'Failed to get last created user');
      return { appId: '1411851979' };
    }
  },

  // Update lottery game status
  updateLotteryGameStatus: async (gameType, status) => {
    try {
      await LotteryGameSetting.updateMany(
        { lotteryGameType: gameType },
        { 
          isActive: status === 'ACTIVE',
          updatedDateTime: moment.now()
        }
      );
      
      config.logger.info({ gameType, status }, 'Lottery game status updated');
    } catch (error) {
      config.logger.error({ error, gameType, status }, 'Failed to update lottery game status');
    }
  },

  // Clean up old lottery results
  cleanupOldLotteryResults: async (daysToKeep = 30) => {
    try {
      const cutoffDate = moment().subtract(daysToKeep, 'days').toDate();
      const result = await LotteryGameResult.deleteMany({
        createdDateTime: { $lt: cutoffDate }
      });
      
      config.logger.info({ deletedCount: result.deletedCount, daysToKeep }, 'Old lottery results cleaned up');
    } catch (error) {
      config.logger.error({ error, daysToKeep }, 'Failed to cleanup old lottery results');
    }
  },

  // Update user referral bonuses
  updateReferralBonuses: async () => {
    try {
      const Offer = require('../models/offer');
      const refBonusOffers = await Offer.find({ type: 'REFBONUS' });
      
      if (refBonusOffers.length === 0) {
        config.logger.info('No referral bonus offers found');
        return;
      }

      const users = await User.find({ userRole: 3 }); // Regular users only
      
      for (const user of users) {
        for (const offer of refBonusOffers) {
          if (user.referralCount >= offer.targetValue && !user.referralBonusClaimed) {
            user.availableAmount += Number(offer.bonusValue);
            user.referralBonusClaimed = true;
            await user.save();
            
            await dbUpdates.createDbHistory(
              'availableAmount',
              `+${Number(offer.bonusValue).toFixed(2)}`,
              'User',
              'MONEY',
              user._id,
              null,
              `Referral bonus for reaching ${offer.targetValue} referrals`
            );
            
            config.logger.info({ userId: user._id, bonusValue: offer.bonusValue }, 'Referral bonus applied');
          }
        }
      }
    } catch (error) {
      config.logger.error({ error }, 'Failed to update referral bonuses');
    }
  },

  // System health check
  systemHealthCheck: async () => {
    try {
      const stats = {
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ activeStatus: true }),
        totalGameSettings: await LotteryGameSetting.countDocuments(),
        activeGameSettings: await LotteryGameSetting.countDocuments({ isActive: true }),
        totalResults: await LotteryGameResult.countDocuments(),
        timestamp: moment.now()
      };
      
      config.logger.info(stats, 'System health check completed');
      return stats;
    } catch (error) {
      config.logger.error({ error }, 'System health check failed');
      throw error;
    }
  },

  // Database maintenance
  performDatabaseMaintenance: async () => {
    try {
      // Clean up old logs
      const cutoffDate = moment().subtract(90, 'days').toDate();
      const logResult = await ApplicationLog.deleteMany({
        createdDateTime: { $lt: cutoffDate }
      });
      
      // Clean up old lottery results
      await dbUpdates.cleanupOldLotteryResults(30);
      
      // Update referral bonuses
      await dbUpdates.updateReferralBonuses();
      
      // System health check
      const healthStats = await dbUpdates.systemHealthCheck();
      
      config.logger.info({ 
        deletedLogs: logResult.deletedCount,
        healthStats 
      }, 'Database maintenance completed');
      
    } catch (error) {
      config.logger.error({ error }, 'Database maintenance failed');
    }
  }
};

module.exports = dbUpdates; 