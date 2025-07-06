const mongoose = require('mongoose');

const EmailServiceSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    emailSubject: { type: String, default: "" },
    emailBody: { type: String, default: "" },
    emailTo: [{ type: String, default: "" }],
    serviceFrom: { type: String, default: "" },
    successInfo: { type: String, default: "" },
    isError: { type: Boolean, default: false },
    errorInfo: { type: String, default: "" },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const EmailService = mongoose.model('EmailService', EmailServiceSchema)

module.exports = EmailService;