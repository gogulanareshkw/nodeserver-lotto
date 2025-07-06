var mongoose = require("mongoose");
var constants = require('../config/constants');

const LotteryGameSettingSchema = mongoose.Schema({
    lotteryGameType: { type: Number, unique: true, enum: [constants.LOTTERY_GAME_TYPE_THAILAND, constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY, constants.LOTTERY_GAME_TYPE_DUBAI_DAILY, constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY, constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY] },
    //play discounts  10
    firstPrizePlayDiscountPercent: { type: Number, default: 0 },
    threeUpPlayDiscountPercent: { type: Number, default: 0 },
    twoUpPlayDiscountPercent: { type: Number, default: 0 },
    twoDownPlayDiscountPercent: { type: Number, default: 0 },
    threeUpSingleDigitPlayDiscountPercent: { type: Number, default: 0 },
    twoUpSingleDigitPlayDiscountPercent: { type: Number, default: 0 },
    twoDownSingleDigitPlayDiscountPercent: { type: Number, default: 0 },
    threeUpGameTotalPlayDiscountPercent: { type: Number, default: 0 },
    twoUpGameTotalPlayDiscountPercent: { type: Number, default: 0 },
    twoDownGameTotalPlayDiscountPercent: { type: Number, default: 0 },
    //special play discounts  10
    firstPrizePlaySpecialDiscountPercent: { type: Number, default: 0 },
    threeUpPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoUpPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoDownPlaySpecialDiscountPercent: { type: Number, default: 0 },
    threeUpSingleDigitPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoUpSingleDigitPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoDownSingleDigitPlaySpecialDiscountPercent: { type: Number, default: 0 },
    threeUpGameTotalPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoUpGameTotalPlaySpecialDiscountPercent: { type: Number, default: 0 },
    twoDownGameTotalPlaySpecialDiscountPercent: { type: Number, default: 0 },
    //play last day discounts  10
    firstPrizePlayLastDayDiscountPercent: { type: Number, default: 0 },
    threeUpPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoUpPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoDownPlayLastDayDiscountPercent: { type: Number, default: 0 },
    threeUpSingleDigitPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoUpSingleDigitPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoDownSingleDigitPlayLastDayDiscountPercent: { type: Number, default: 0 },
    threeUpGameTotalPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoUpGameTotalPlayLastDayDiscountPercent: { type: Number, default: 0 },
    twoDownGameTotalPlayLastDayDiscountPercent: { type: Number, default: 0 },
    //play winnings   12
    firstPrizeStraightWinningPercent: { type: Number, default: 0 },
    firstPrizeRumbleWinningPercent: { type: Number, default: 0 },
    threeUpStraightWinningPercent: { type: Number, default: 0 },
    threeUpRumbleWinningPercent: { type: Number, default: 0 },
    twoUpWinningPercent: { type: Number, default: 0 },
    twoDownWinningPercent: { type: Number, default: 0 },
    threeUpSingleDigitWinningPercent: { type: Number, default: 0 },
    twoUpSingleDigitWinningPercent: { type: Number, default: 0 },
    twoDownSingleDigitWinningPercent: { type: Number, default: 0 },
    threeUpTotalWinningPercent: { type: Number, default: 0 },
    twoUpTotalWinningPercent: { type: Number, default: 0 },
    twoDownTotalWinningPercent: { type: Number, default: 0 },
    //General settings  4
    gameStopHour: { type: String, default: "0:0" },
    gameDiscountStopHour: { type: String, default: "0:0" },
    lotteryGameDrawDates: { type: String, default: "" },
    minimumAmountForPlay: { type: Number, default: 0 },
    agentCommissionInPercent: { type: Number, default: 0 },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const LotteryGameSetting = mongoose.model('LotteryGameSetting', LotteryGameSettingSchema)

module.exports = LotteryGameSetting;
