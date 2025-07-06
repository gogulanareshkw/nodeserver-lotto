const mongoose = require('mongoose');
var constants = require('../config/constants');
var Schema = mongoose.Schema;

var paymentSchema = new Schema({
    upiId: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
    ifscCode: { type: String }
});

const WithdrawSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentInfo: paymentSchema,
    withdrawAmount: { type: Number, required: true, get: v => v.toFixed(2) },
    processedAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
    withdrawTo: { type: mongoose.Schema.Types.ObjectId, ref: 'BankCard' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referenceNumber: { type: String, default: "" },
    comments: { type: String, default: "" },
    imageURL: { type: String, default: "" },
    status: { type: String, default: constants.PAYMENT_STATUS_TYPE_P, enum: [constants.PAYMENT_STATUS_TYPE_P, constants.PAYMENT_STATUS_TYPE_A, constants.PAYMENT_STATUS_TYPE_D] },
    isCompleted: { type: Boolean, default: false },
    statusUpdatedDateTime: { type: Date, default: null },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now },
});

const Withdraw = mongoose.model('Withdraw', WithdrawSchema)

module.exports = Withdraw;