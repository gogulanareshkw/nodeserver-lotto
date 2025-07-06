const mongoose = require('mongoose');
var constants = require('../config/constants');

const OfferSchema = mongoose.Schema({
    targetValue: { type: Number, default: 0 },
    bonusValue: { type: Number, default: 0 },
    type: { type: String, required: true, enum: [constants.OFFER_TYPE_REFERRAL_BONUS, constants.OFFER_TYPE_RECHARGE_BONUS, constants.OFFER_TYPE_PLAY_BONUS] },
    createdDateTime: { type: Date, default: Date.now }
});

const Offer = mongoose.model('Offer', OfferSchema)

module.exports = Offer;