const mongoose = require('mongoose');
var constants = require('../config/constants');

const FeedbackSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    subject: { type: String, required: true },
    type: { type: String, default: constants.FEEDBACK_TYPE_GENERAL, enum: [constants.FEEDBACK_TYPE_GENERAL, constants.FEEDBACK_TYPE_COMPLAINT, constants.FEEDBACK_TYPE_COMPLIMENT, constants.FEEDBACK_TYPE_SUGGESTION, constants.FEEDBACK_TYPE_HELP] },
    description: { type: String, required: true },
    reply: { type: String, default: "" },
    isReviewd: { type: Boolean, default: false },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema)

module.exports = Feedback;