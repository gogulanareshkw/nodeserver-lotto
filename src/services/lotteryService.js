const LotteryGameSetting = require('../models/lotteryGameSetting');
const LotteryGamePermission = require('../models/lotteryGamePermission');
const LotteryGameBoard = require('../models/lotteryGameBoard');
const LotteryGamePlay = require('../models/lotteryGamePlay');
const LotteryGameResult = require('../models/lotteryGameResult');
const User = require('../models/user');
const { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AppError 
} = require('../utils/errorHandler');
const constants = require('../config/constants');
const moment = require('moment');

class LotteryService {
  // Get all lottery game settings
  static async getAllLotterySettings() {
    const settings = await LotteryGameSetting.find()
      .sort({ lotteryGameType: 1, createdDateTime: -1 });
    
    return settings;
  }

  // Get lottery settings by game type
  static async getLotterySettingsByType(gameType) {
    const settings = await LotteryGameSetting.find({ lotteryGameType: gameType })
      .sort({ createdDateTime: -1 });
    
    if (!settings.length) {
      throw new NotFoundError(`Lottery settings for game type ${gameType}`);
    }
    
    return settings;
  }

  // Get lottery permissions
  static async getLotteryPermissions(gameType = null) {
    const query = gameType ? { lotteryGameType: gameType } : {};
    const permissions = await LotteryGamePermission.find(query)
      .sort({ lotteryGameType: 1, createdDateTime: -1 });
    
    return permissions;
  }

  // Get lottery game boards
  static async getLotteryBoards(gameType = null) {
    const query = gameType ? { lotteryGameType: gameType } : {};
    const boards = await LotteryGameBoard.find(query)
      .sort({ lotteryGameType: 1, boardNumber: 1 });
    
    return boards;
  }

  // Get lottery results
  static async getLotteryResults(gameType, limit = 10) {
    const results = await LotteryGameResult.find({ lotteryGameType: gameType })
      .sort({ createdDateTime: -1 })
      .limit(limit);
    
    return results;
  }

  // Get latest lottery winners
  static async getLatestWinners() {
    const results = await LotteryGameResult.aggregate([
      {
        $group: {
          _id: '$lotteryGameType',
          latestResult: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestResult' }
      },
      {
        $sort: { createdDateTime: -1 }
      }
    ]);
    
    return results;
  }

  // Play lottery game
  static async playLotteryGame(userId, gameData) {
    const {
      lotteryGameType,
      lotteryGameBoardId,
      lotteryGamePlayType,
      selectedNumbers,
      amount
    } = gameData;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.blockedByAdmin) {
      throw new AppError('Your account has been blocked', 403);
    }

    // Check game settings
    const gameSetting = await LotteryGameSetting.findOne({ 
      lotteryGameType,
      isActive: true 
    });
    
    if (!gameSetting) {
      throw new NotFoundError('Lottery game setting');
    }

    // Check if game is active
    const now = moment();
    if (now.isBefore(gameSetting.startDateTime) || now.isAfter(gameSetting.endDateTime)) {
      throw new ValidationError('Lottery game is not active at this time');
    }

    // Check user permissions
    const permission = await LotteryGamePermission.findOne({
      lotteryGameType,
      userRole: user.userRole,
      isActive: true
    });

    if (!permission) {
      throw new AppError('You do not have permission to play this game', 403);
    }

    // Validate game board
    const gameBoard = await LotteryGameBoard.findById(lotteryGameBoardId);
    if (!gameBoard || gameBoard.lotteryGameType !== lotteryGameType) {
      throw new NotFoundError('Lottery game board');
    }

    // Validate play type
    const validPlayTypes = this.getValidPlayTypes(lotteryGameType);
    if (!validPlayTypes.includes(lotteryGamePlayType)) {
      throw new ValidationError(`Invalid play type. Valid types: ${validPlayTypes.join(', ')}`);
    }

    // Validate selected numbers
    this.validateSelectedNumbers(selectedNumbers, lotteryGamePlayType, gameBoard);

    // Calculate cost
    const cost = this.calculateGameCost(lotteryGamePlayType, gameSetting);
    if (amount !== cost) {
      throw new ValidationError(`Invalid amount. Expected: ${cost}, Received: ${amount}`);
    }

    // Check user balance
    if (user.availableAmount < cost) {
      throw new ValidationError('Insufficient balance');
    }

    // Create game play
    const gamePlay = new LotteryGamePlay({
      userId,
      lotteryGameType,
      lotteryGameBoardId,
      lotteryGamePlayType,
      selectedNumbers,
      amount: cost,
      status: 'PENDING',
      createdDateTime: moment.now()
    });

    await gamePlay.save();

    // Deduct amount from user
    user.availableAmount -= cost;
    await user.save();

    return gamePlay;
  }

  // Get user game history
  static async getUserGameHistory(userId, filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = { userId };
    
    if (filters.gameType) {
      query.lotteryGameType = filters.gameType;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdDateTime = {
        $gte: moment(filters.startDate).startOf('day').toDate(),
        $lte: moment(filters.endDate).endOf('day').toDate()
      };
    }

    const [plays, total] = await Promise.all([
      LotteryGamePlay.find(query)
        .populate('lotteryGameBoardId', 'boardNumber boardName')
        .sort({ createdDateTime: -1 })
        .skip(skip)
        .limit(limit),
      LotteryGamePlay.countDocuments(query)
    ]);

    return {
      plays,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  // Get all lottery plays (admin)
  static async getAllLotteryPlays(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (filters.gameType) {
      query.lotteryGameType = filters.gameType;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdDateTime = {
        $gte: moment(filters.startDate).startOf('day').toDate(),
        $lte: moment(filters.endDate).endOf('day').toDate()
      };
    }

    const [plays, total] = await Promise.all([
      LotteryGamePlay.find(query)
        .populate('userId', 'appId email firstName lastName')
        .populate('lotteryGameBoardId', 'boardNumber boardName')
        .sort({ createdDateTime: -1 })
        .skip(skip)
        .limit(limit),
      LotteryGamePlay.countDocuments(query)
    ]);

    return {
      plays,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  // Update lottery game setting
  static async updateLotterySetting(settingId, updateData) {
    const setting = await LotteryGameSetting.findByIdAndUpdate(
      settingId,
      { ...updateData, updatedDateTime: moment.now() },
      { new: true, runValidators: true }
    );

    if (!setting) {
      throw new NotFoundError('Lottery game setting');
    }

    return setting;
  }

  // Update lottery permission
  static async updateLotteryPermission(permissionId, updateData) {
    const permission = await LotteryGamePermission.findByIdAndUpdate(
      permissionId,
      { ...updateData, updatedDateTime: moment.now() },
      { new: true, runValidators: true }
    );

    if (!permission) {
      throw new NotFoundError('Lottery game permission');
    }

    return permission;
  }

  // Initialize lottery settings
  static async initializeLotterySettings(gameType) {
    const existingSettings = await LotteryGameSetting.findOne({ lotteryGameType: gameType });
    
    if (existingSettings) {
      throw new ConflictError(`Lottery settings for game type ${gameType} already exist`);
    }

    const defaultSettings = this.getDefaultSettings(gameType);
    const setting = new LotteryGameSetting(defaultSettings);
    await setting.save();

    return setting;
  }

  // Initialize lottery permissions
  static async initializeLotteryPermissions(gameType) {
    const existingPermissions = await LotteryGamePermission.find({ lotteryGameType: gameType });
    
    if (existingPermissions.length > 0) {
      throw new ConflictError(`Lottery permissions for game type ${gameType} already exist`);
    }

    const defaultPermissions = this.getDefaultPermissions(gameType);
    const permissions = await LotteryGamePermission.insertMany(defaultPermissions);

    return permissions;
  }

  // Helper methods
  static getValidPlayTypes(gameType) {
    const playTypes = {
      [constants.LOTTERY_GAME_TYPE_THAILAND]: [
        constants.THAI_GAME_TYPE_1STPRIZE,
        constants.THAI_GAME_TYPE_3UP,
        constants.THAI_GAME_TYPE_2UP,
        constants.THAI_GAME_TYPE_2DN,
        constants.THAI_GAME_TYPE_3UPSingle,
        constants.THAI_GAME_TYPE_2UPSingle,
        constants.THAI_GAME_TYPE_2DNSingle,
        constants.THAI_GAME_TYPE_3UPTOTAL,
        constants.THAI_GAME_TYPE_2UPTOTAL,
        constants.THAI_GAME_TYPE_2DNTOTAL
      ]
    };

    return playTypes[gameType] || [];
  }

  static validateSelectedNumbers(numbers, playType, gameBoard) {
    // Implementation depends on specific game rules
    // This is a basic validation
    if (!Array.isArray(numbers) || numbers.length === 0) {
      throw new ValidationError('Selected numbers are required');
    }

    // Add specific validation logic based on play type
    switch (playType) {
      case constants.THAI_GAME_TYPE_1STPRIZE:
        if (numbers.length !== 3) {
          throw new ValidationError('First prize requires exactly 3 numbers');
        }
        break;
      case constants.THAI_GAME_TYPE_3UP:
      case constants.THAI_GAME_TYPE_2UP:
      case constants.THAI_GAME_TYPE_2DN:
        if (numbers.length !== 2) {
          throw new ValidationError(`${playType} requires exactly 2 numbers`);
        }
        break;
      default:
        // Add more validations as needed
        break;
    }
  }

  static calculateGameCost(playType, gameSetting) {
    const costs = {
      [constants.THAI_GAME_TYPE_1STPRIZE]: gameSetting.firstPrizeCost || 10,
      [constants.THAI_GAME_TYPE_3UP]: gameSetting.threeUpCost || 5,
      [constants.THAI_GAME_TYPE_2UP]: gameSetting.twoUpCost || 5,
      [constants.THAI_GAME_TYPE_2DN]: gameSetting.twoDownCost || 5,
      [constants.THAI_GAME_TYPE_3UPSingle]: gameSetting.threeUpSingleCost || 2,
      [constants.THAI_GAME_TYPE_2UPSingle]: gameSetting.twoUpSingleCost || 2,
      [constants.THAI_GAME_TYPE_2DNSingle]: gameSetting.twoDownSingleCost || 2,
      [constants.THAI_GAME_TYPE_3UPTOTAL]: gameSetting.threeUpTotalCost || 3,
      [constants.THAI_GAME_TYPE_2UPTOTAL]: gameSetting.twoUpTotalCost || 3,
      [constants.THAI_GAME_TYPE_2DNTOTAL]: gameSetting.twoDownTotalCost || 3
    };

    return costs[playType] || 0;
  }

  static getDefaultSettings(gameType) {
    const gameNames = {
      [constants.LOTTERY_GAME_TYPE_THAILAND]: 'Thailand Lottery',
      [constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY]: 'Bangkok Weekly Lottery',
      [constants.LOTTERY_GAME_TYPE_DUBAI_DAILY]: 'Dubai Daily Lottery',
      [constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY]: 'London Weekly Lottery',
      [constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY]: 'Mexico Monthly Lottery'
    };

    return {
      lotteryGameType: gameType,
      gameName: gameNames[gameType] || `Game Type ${gameType}`,
      isActive: true,
      startDateTime: moment().startOf('day').toDate(),
      endDateTime: moment().endOf('day').toDate(),
      firstPrizeCost: 10,
      threeUpCost: 5,
      twoUpCost: 5,
      twoDownCost: 5,
      threeUpSingleCost: 2,
      twoUpSingleCost: 2,
      twoDownSingleCost: 2,
      threeUpTotalCost: 3,
      twoUpTotalCost: 3,
      twoDownTotalCost: 3,
      createdDateTime: moment.now()
    };
  }

  static getDefaultPermissions(gameType) {
    const roles = [
      constants.USER_ROLE_SUPER,
      constants.USER_ROLE_ADMIN,
      constants.USER_ROLE_USER,
      constants.USER_ROLE_AGENT,
      constants.USER_ROLE_STAFF
    ];

    return roles.map(role => ({
      lotteryGameType: gameType,
      userRole: role,
      isActive: true,
      canPlay: true,
      canView: true,
      createdDateTime: moment.now()
    }));
  }
}

module.exports = LotteryService; 