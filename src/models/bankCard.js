const mongoose = require('mongoose');
var constants = require('../config/constants');

const BankCardSchema = mongoose.Schema({
    upiId: { type: String, default:"" },
    accountNumber: { type: String, default:"" },
    accountHolderName: { type: String, default:"" },
    ifscCode: { type: String, default:"" },
    phoneNumber: { type: String, default:"" },
    type: { type: String, required: true, enum: [constants.BANKCARD_TYPE_UPI, constants.BANKCARD_TYPE_BANK] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	isActive: { type: Boolean, default: false },
    createdDateTime: { type: Date, default: Date.now },
	updatedDateTime: { type: Date, default: Date.now }
});

const BankCard = mongoose.model('BankCard', BankCardSchema)

module.exports = BankCard;