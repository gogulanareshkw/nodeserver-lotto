const mongoose = require('mongoose');
var constants = require('../config/constants');

const LotteryGameBoardSchema = mongoose.Schema({
    lotteryGameType: { type: Number, enum: [constants.LOTTERY_GAME_TYPE_THAILAND, constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY, constants.LOTTERY_GAME_TYPE_DUBAI_DAILY, constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY, constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY] },
    gameNumber: { type: String, unique: true, required: true, trim: true },
    firstPrizeResult: { type: String, required: true, length: 6 },
    firstPrizeRumbleResult: [{ type: String, required: true, length: 6 }],
    threeUpStraightResult: { type: String, required: true, length: 3 },
    threeUpRumbleResult: [{ type: String, required: true, length: 3 }],
    twoUpResult: { type: String, required: true, length: 2 },
    twoDownResult: { type: String, required: true, length: 2 },
    threeUpSingleDigitResult: [{ type: String, required: true, length: 1 }],
    twoUpSingleDigitResult: [{ type: String, required: true, length: 1 }],
    twoDownSingleDigitResult: [{ type: String, required: true, length: 1 }],
    threeUpGameTotalResult: { type: String, required: true, length: 1 },
    twoUpGameTotalResult: { type: String, required: true, length: 1 },
    twoDownGameTotalResult: { type: String, required: true, length: 1 },
    resultLocked: { type: Boolean, default: false },
    resultFinalized: { type: Boolean, default: false },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const LotteryGameBoard = mongoose.model('LotteryGameBoard', LotteryGameBoardSchema)

module.exports = LotteryGameBoard;