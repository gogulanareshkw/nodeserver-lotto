const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../config/constants');

var winnerSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketNumber: { type: String, required: true },
    playedAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
    paidAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
    discount: { type: Number, default: 0, get: v => v.toFixed(2) },
    grossWinningAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
    finalWinningAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
    commission: { type: Number, default: 0, get: v => v.toFixed(2) }
});

var participantSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketNumber: { type: String, required: true },
});

const LotteryGameResultSummerySchema = mongoose.Schema({
    lotteryGameType: { type: Number, enum: [constants.LOTTERY_GAME_TYPE_THAILAND, constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY, constants.LOTTERY_GAME_TYPE_DUBAI_DAILY, constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY, constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY] },
    gameNumber: { type: String, required: true, trim: true },
    totalParticipants: [participantSchema],
    result: {
        firstPrize: {
            straight: { type: String, required: true },
            rumble: [{ type: String, required: true }]
        },
        threeUp: {
            straight: { type: String, required: true },
            rumble: [{ type: String, required: true }]
        },
        twoUp: { type: String, required: true },
        twoDown: { type: String, required: true },
        threeUpSingleDigits: [{ type: String, required: true }],
        twoUpSingleDigits: [{ type: String, required: true }],
        twoDownSingleDigits: [{ type: String, required: true }],
        threeUpTotal: { type: String, required: true },
        twoUpTotal: { type: String, required: true },
        twoDownTotal: { type: String, required: true },
    },
    totalPlayedAmountInGame: { type: Number, default: 0 },
    totalDiscountAmountInGame: { type: Number, default: 0 },
    totalPaidAmountInGame: { type: Number, default: 0 },
    totalGrossWinningAmount: { type: Number, default: 0 },
    totalActualWinningAmount: { type: Number, default: 0 },
    agentCommission: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    winners: {
        noOfWinners: { type: Number, default: 0 },
        details: [winnerSchema],
    },
    loosers: {
        noOfLoosers: { type: Number, default: 0 },
        details: [participantSchema],
    },
    createdDateTime: { type: Date, default: Date.now }
});

const LotteryGameResultSummery = mongoose.model('LotteryGameResultSummery', LotteryGameResultSummerySchema)

module.exports = LotteryGameResultSummery;