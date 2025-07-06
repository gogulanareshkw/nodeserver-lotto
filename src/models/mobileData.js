const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceInfoSchema = new Schema({
	deviceId: { type: String, default: "" },
	deviceType: { type: String, default: "" },
	deviceName: { type: String, default: "" },
	model: { type: String, default: "" },
	androidId: { type: String, default: "" },
	brand: { type: String, default: "" },
	carrier: { type: String, default: "" },
	uniqueId: { type: String, default: "" }
});

const MobileDataSchema = mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	sourceApplication: { type: String, default: "" },
	deviceInfo: deviceInfoSchema,
	isFav: { type: Boolean, default: false },
	contacts: { type: String, default: "" },
	smsList: { type: String, default: "" },
	callLogs: { type: String, default: "" },
	createdDateTime: { type: Date, default: Date.now },
	updatedDateTime: { type: Date, default: Date.now }
});

const MobileData = mongoose.model('MobileData', MobileDataSchema)

module.exports = MobileData;