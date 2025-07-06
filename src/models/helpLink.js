const mongoose = require('mongoose');
const HelpLinkSchema = mongoose.Schema({
    uploadBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    title: { type: String, required: true },
    mediaLink: { type: String, required: true },
	createdDateTime: { type: Date, default: Date.now },
	updatedDateTime: { type: Date, default: Date.now }
});

const HelpLink = mongoose.model('HelpLink', HelpLinkSchema)

module.exports = HelpLink;