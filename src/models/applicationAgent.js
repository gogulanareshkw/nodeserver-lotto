const mongoose = require('mongoose');
var constants = require('../config/constants');

const ApplicationAgentSchema = mongoose.Schema({
    type: { type: String, required: true, enum: [constants.AGENT_TYPE_WHATSAPP, constants.AGENT_TYPE_TELEGRAM] },
    identity: { type: String, default: "" },
    name: { type: String, default: "" },
    country: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    createdDateTime: { type: Date, default: Date.now },
    updatedDateTime: { type: Date, default: Date.now }
});

const ApplicationAgent = mongoose.model('ApplicationAgent', ApplicationAgentSchema)

module.exports = ApplicationAgent;