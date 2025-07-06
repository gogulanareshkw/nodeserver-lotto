const config = require('../../config');
const dbUpdates = require('../cron/dbUpdates');
const LotteryGameResult = require('../models/lotteryGameResult');
const LotteryGamePlay = require('../models/lotteryGamePlay');
const User = require('../models/user');
const moment = require('moment');

// Lottery release utilities
const lotteryRelease = {
  // Release lottery results
  releaseLotteryResults: async (gameType, results) => {
    try {
      config.logger.info({ gameType, results }, 'Releasing lottery results');
      
      // Create result entry
      const resultEntry = new LotteryGameResult({
        lotteryGameType: gameType,
        lotteryGameResult: results,
        createdDateTime: moment.now(),
        isActive: true
      });
      
      await resultEntry.save();
      
      // Process winning tickets
      await lotteryRelease.processWinningTickets(gameType, results);
      
      config.logger.info({ gameType }, 'Lottery results released successfully');
      return resultEntry;
    } catch (error) {
      config.logger.error({ error, gameType, results }, 'Failed to release lottery results');
      throw error;
    }
  },

  // Process winning tickets
  processWinningTickets: async (gameType, results) => {
    try {
      config.logger.info({ gameType, results }, 'Processing winning tickets');
      
      // Get all plays for this game type
      const plays = await LotteryGamePlay.find({ 
        lotteryGameType: gameType,
        isActive: true,
        isProcessed: false
      });
      
      let totalWinnings = 0;
      let winningTickets = 0;
      
      for (const play of plays) {
        const winnings = lotteryRelease.calculateWinnings(play, results);
        
        if (winnings > 0) {
          // Update user balance
          const user = await User.findById(play.userId);
          if (user) {
            user.availableAmount += winnings;
            user.totalWinnings = (user.totalWinnings || 0) + winnings;
            await user.save();
            
            // Create database history
            await dbUpdates.createDbHistory(
              'availableAmount',
              `+${winnings.toFixed(2)}`,
              'User',
              'MONEY',
              play.userId,
              null,
              `Lottery winnings for game type ${gameType}`
            );
            
            totalWinnings += winnings;
            winningTickets++;
            
            config.logger.info({ 
              userId: play.userId, 
              winnings, 
              gameType 
            }, 'User won lottery');
          }
        }
        
        // Mark play as processed
        play.isProcessed = true;
        play.processedDateTime = moment.now();
        await play.save();
      }
      
      config.logger.info({ 
        gameType, 
        totalWinnings, 
        winningTickets, 
        totalPlays: plays.length 
      }, 'Winning tickets processed');
      
    } catch (error) {
      config.logger.error({ error, gameType, results }, 'Failed to process winning tickets');
      throw error;
    }
  },

  // Calculate winnings for a play
  calculateWinnings: (play, results) => {
    try {
      const playNumbers = play.lotteryGamePlay.split(',').map(num => parseInt(num.trim()));
      const resultNumbers = results.split(',').map(num => parseInt(num.trim()));
      
      let matches = 0;
      for (const playNum of playNumbers) {
        if (resultNumbers.includes(playNum)) {
          matches++;
        }
      }
      
      // Calculate winnings based on matches
      const winningsTable = {
        1: 0, // No winnings for 1 match
        2: 0, // No winnings for 2 matches
        3: play.amount * 2, // 2x for 3 matches
        4: play.amount * 10, // 10x for 4 matches
        5: play.amount * 50, // 50x for 5 matches
        6: play.amount * 100 // 100x for 6 matches
      };
      
      return winningsTable[matches] || 0;
    } catch (error) {
      config.logger.error({ error, play, results }, 'Failed to calculate winnings');
      return 0;
    }
  },

  // Get lottery results history
  getLotteryResultsHistory: async (gameType, limit = 10) => {
    try {
      const results = await LotteryGameResult.find({ 
        lotteryGameType: gameType 
      })
      .sort({ createdDateTime: -1 })
      .limit(limit);
      
      return results;
    } catch (error) {
      config.logger.error({ error, gameType }, 'Failed to get lottery results history');
      return [];
    }
  },

  // Get user lottery history
  getUserLotteryHistory: async (userId, limit = 20) => {
    try {
      const plays = await LotteryGamePlay.find({ userId })
        .sort({ createdDateTime: -1 })
        .limit(limit)
        .populate('lotteryGameType', 'lotteryGameName');
      
      return plays;
    } catch (error) {
      config.logger.error({ error, userId }, 'Failed to get user lottery history');
      return [];
    }
  },

  // Get lottery statistics
  getLotteryStats: async (gameType) => {
    try {
      const stats = {
        totalPlays: await LotteryGamePlay.countDocuments({ lotteryGameType: gameType }),
        totalWinnings: 0,
        totalAmount: 0,
        winningTickets: 0,
        averageWinnings: 0
      };
      
      // Calculate total amount and winnings
      const plays = await LotteryGamePlay.find({ lotteryGameType: gameType });
      for (const play of plays) {
        stats.totalAmount += play.amount;
        if (play.winnings) {
          stats.totalWinnings += play.winnings;
          stats.winningTickets++;
        }
      }
      
      stats.averageWinnings = stats.winningTickets > 0 ? stats.totalWinnings / stats.winningTickets : 0;
      
      return stats;
    } catch (error) {
      config.logger.error({ error, gameType }, 'Failed to get lottery statistics');
      return null;
    }
  },

  // Validate lottery play
  validateLotteryPlay: (playData) => {
    const errors = [];
    
    if (!playData.lotteryGameType) {
      errors.push('Lottery game type is required');
    }
    
    if (!playData.lotteryGamePlay) {
      errors.push('Lottery game play is required');
    }
    
    if (!playData.amount || playData.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    // Validate numbers format
    if (playData.lotteryGamePlay) {
      const numbers = playData.lotteryGamePlay.split(',').map(num => parseInt(num.trim()));
      if (numbers.length !== 6) {
        errors.push('Exactly 6 numbers are required');
      }
      
      for (const num of numbers) {
        if (isNaN(num) || num < 1 || num > 99) {
          errors.push('Numbers must be between 1 and 99');
          break;
        }
      }
      
      // Check for duplicates
      const uniqueNumbers = new Set(numbers);
      if (uniqueNumbers.size !== numbers.length) {
        errors.push('Duplicate numbers are not allowed');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get active lottery games
  getActiveLotteryGames: async () => {
    try {
      const LotteryGameSetting = require('../models/lotteryGameSetting');
      const activeGames = await LotteryGameSetting.find({ isActive: true });
      return activeGames;
    } catch (error) {
      config.logger.error({ error }, 'Failed to get active lottery games');
      return [];
    }
  },

  // Check if lottery game is active
  isLotteryGameActive: async (gameType) => {
    try {
      const LotteryGameSetting = require('../models/lotteryGameSetting');
      const game = await LotteryGameSetting.findOne({ 
        lotteryGameType: gameType,
        isActive: true
      });
      return !!game;
    } catch (error) {
      config.logger.error({ error, gameType }, 'Failed to check if lottery game is active');
      return false;
    }
  }
};

module.exports = lotteryRelease; 