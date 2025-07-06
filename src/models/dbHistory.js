const mongoose = require('mongoose');
var constants = require('../config/constants');

const DbHistorySchema = mongoose.Schema({
    fieldName: { type: String, required: true },
    fieldValue: { type: String, required: true },
    collectionName: { type: String, required: true },
    updateType: { type: String, required: true, enum: [constants.DBUPDATE_TYPE_PERMISSION, constants.DBUPDATE_TYPE_USER, constants.DBUPDATE_TYPE_MONEY, constants.DBUPDATE_TYPE_BANKDETAILS] },
    updatedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: false, default: "" },
    createdDateTime: { type: Date, default: Date.now }
});

const DbHistory = mongoose.model('DbHistory', DbHistorySchema)

module.exports = DbHistory;