var mongoose = require("mongoose");
var constants = require('../config/constants');

const LotteryGamePermissionSchema = mongoose.Schema({
	lotteryGameType: { type: Number, unique: true, enum: [constants.LOTTERY_GAME_TYPE_THAILAND, constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY, constants.LOTTERY_GAME_TYPE_DUBAI_DAILY, constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY, constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY] },
	isAvailableLotteryGame: { type: Boolean, default: true },
	canPlayLotteryGame: { type: Boolean, default: false },
	removePlayDiscountOnLastDay: { type: Boolean, default: false },
	enableLastDayDiscounts: { type: Boolean, default: false },
	showGameWinnersListScroll: { type: Boolean, default: false },
	isAvailableSingleDigitGame: { type: Boolean, default: false },
	isAvailableGameTotal: { type: Boolean, default: false },
	createdDateTime: { type: Date, default: Date.now },
	updatedDateTime: { type: Date, default: Date.now }
});

const LotteryGamePermission = mongoose.model('LotteryGamePermission', LotteryGamePermissionSchema)

module.exports = LotteryGamePermission;
