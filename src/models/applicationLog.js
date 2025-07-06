const mongoose = require('mongoose');

const ApplicationLogSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    errorMethod: { type: String, default: "" },
    inputPayload: { type: String, default: "" },
    errorInfo: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    errorInString: { type: String, default: "" },
    createdDateTime: { type: Date, default: Date.now }
});

const ApplicationLog = mongoose.model('ApplicationLog', ApplicationLogSchema)

module.exports = ApplicationLog;