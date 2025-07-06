const mongoose = require('mongoose');
var constants = require('../config/constants');
var Schema = mongoose.Schema;

var paymentSchema = new Schema({
    upiId: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
    ifscCode: { type: String },
    sendingMoneyTo: { type: String },
    stcPayId: { type: String },
    stcPayName: { type: String },
    ncbAccountNumber: { type: String },
    ncbAccountName: { type: String },
    alRajhiAccountNumber: { type: String },
    alRajhiAccountName: { type: String },
});

const RechargeSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageURL: { type: String, default: "" },
    paymentInfo: paymentSchema,
    rechargeAmount: { type: Number, required: true, get: v => v.toFixed(2) },
    referenceNumber: { type: String, default: "" },
    paymentMethod: {
        type: String, required: true, enum: [
            constants.PAYMENT_TYPE_UPI,
            constants.PAYMENT_TYPE_BANK,
            constants.PAYMENT_TYPE_WesternUnion,
            constants.PAYMENT_TYPE_MasterCard,
            constants.PAYMENT_TYPE_VISA,
            constants.PAYMENT_TYPE_PerfectMoney,
            constants.PAYMENT_TYPE_Skrill,
            constants.PAYMENT_TYPE_EVoucher,
            constants.PAYMENT_TYPE_CryptoCurrency,
            constants.PAYMENT_TYPE_NeTeller,
            constants.PAYMENT_TYPE_STCPay,
            constants.PAYMENT_TYPE_NCB,
            constants.PAYMENT_TYPE_AlRajhiBank
        ]
    },
    phoneNumber: { type: String, default: "" },
    rechargedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: { type: String, default: "" },
    status: { type: String, default: constants.PAYMENT_STATUS_TYPE_P, enum: [constants.PAYMENT_STATUS_TYPE_P, constants.PAYMENT_STATUS_TYPE_A, constants.PAYMENT_STATUS_TYPE_D] },
    isCompleted: { type: Boolean, default: false },
    statusUpdatedDateTime: { type: Date, default: null },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now },
});


const Recharge = mongoose.model('Recharge', RechargeSchema)

module.exports = Recharge;