const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../config/constants');

var numberSchema = new Schema({
    number: { type: String, required: true },
    straight: { type: Number, required: true, get: v => v.toFixed(2) },
    rumble: { type: Number, default: 0, get: v => v.toFixed(2) },
});

const LotteryGamePlaySchema = mongoose.Schema({
    lotteryGameType: { type: Number, enum: [constants.LOTTERY_GAME_TYPE_THAILAND, constants.LOTTERY_GAME_TYPE_BANGKOK_WEEKLY, constants.LOTTERY_GAME_TYPE_DUBAI_DAILY, constants.LOTTERY_GAME_TYPE_LONDON_WEEKLY, constants.LOTTERY_GAME_TYPE_MEXICO_MONTHLY] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    numbers: [numberSchema],
    played_at: { type: Date, default: Date.now },
    playedAmount: { type: Number, required: true, get: v => v.toFixed(2) },
    discount: { type: Number, required: true, get: v => v.toFixed(2) },
    paidAmount: { type: Number, required: true, get: v => v.toFixed(2) },
    isOriginalTicket: { type: Boolean, default: false },
    playingGameType: { type: String, enum: [constants.LOTTERY_GAME_PLAY_TYPE_1STPRIZE, constants.LOTTERY_GAME_PLAY_TYPE_3UP, constants.LOTTERY_GAME_PLAY_TYPE_2DN, constants.LOTTERY_GAME_PLAY_TYPE_2UP, constants.LOTTERY_GAME_PLAY_TYPE_3UPSingle, constants.LOTTERY_GAME_PLAY_TYPE_2DNSingle, constants.LOTTERY_GAME_PLAY_TYPE_3UPTOTAL, constants.LOTTERY_GAME_PLAY_TYPE_2DNTOTAL] },
    gameNumber: { type: String, required: true, trim: true },
    ticketNumber: { type: String, required: true, unique: true }
});

const LotteryGamePlay = mongoose.model('LotteryGamePlay', LotteryGamePlaySchema)

module.exports = LotteryGamePlay;