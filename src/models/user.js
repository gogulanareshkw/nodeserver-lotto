const config = require('../../config');
const mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var constants = require('../config/constants');
var Schema = mongoose.Schema;

var addressSchema = new Schema({
	latitude: { type: String },
	longitude: { type: String },
	streetName: { type: String },
	streetNumber: { type: String },
	city: { type: String },
	state: { type: String },
	zipcode: { type: String },
	countryCode: { type: String, uppercase: true, set: v => v.toUpperCase() },
	country: { type: String },
	stateCode: { type: String, uppercase: true, set: v => v.toUpperCase() },
	suburb: { type: String },
	county: { type: String },
	state_district: { type: String },
	formattedAddress: { type: String }
});

const UserSchema = mongoose.Schema({
	hash: String,
	salt: String,
	appId: { type: String, required: true, unique: true },
	firstName: { type: String, default: "", es_type: 'string', es_indexed: true, es_search_analyzer: "standard", es_analyzer: "edge_ngram_tokenizer" },
	lastName: { type: String, default: "", es_type: 'string', es_indexed: true, es_search_analyzer: "standard", es_analyzer: "edge_ngram_tokenizer" },
	gender: { type: String, default: constants.GENDER_TYPE_MALE, enum: [constants.GENDER_TYPE_MALE, constants.GENDER_TYPE_FEMALE], es_indexed: true },
	phone: { type: String, default: "" },
	email: { type: String, unique: true, required: true, trim: true, lowercase: true, set: v => v.toLowerCase() },
	userRole: { type: Number, enum: [constants.USER_ROLE_SUPER, constants.USER_ROLE_ADMIN, constants.USER_ROLE_CUSTOMER, constants.USER_ROLE_AGENT, constants.USER_ROLE_STAFF] },
	isEmailVerified: { type: Boolean, default: false },
	isAgentVerified: { type: Boolean, default: false },
	activeStatus: { type: Boolean, default: false, required: true },
	blockedByAdmin: { type: Boolean, default: false, required: true },
	allowedSpecialDiscount: { type: Boolean, default: false, required: false },
	isChangedDefaultPassword: { type: Boolean, default: false, required: true },
	availableAmount: { type: Number, default: 0, get: v => v.toFixed(2) },
	otp: { type: String, default: null },
	otpCreatedDate: { type: Date, default: null },
	otpExpiredDate: { type: Date, default: null },
	referredBy: { type: String, default: null },
	referralString: { type: String, default: "", get: v => Buffer.from(v, 'base64').toString('ascii') },
	referralCount: { type: Number, default: 0 },
	address: addressSchema,
	createdDateTime: { type: Date, default: Date.now },
	updatedDateTime: { type: Date, default: Date.now },
}, { toJSON: { getters: true } });

UserSchema.methods.setPassword = function (password) {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

UserSchema.methods.validPassword = function (password) {
	let hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
	return this.hash === hash;
};

UserSchema.methods.getExpDate = function (token) {
	let expDate = jwt.verify(token, config.jwtSecret);
	return expDate.exp || 0;
};

UserSchema.methods.generateJWT = function () {
	let today = new Date();
	let exp = new Date(today);
	exp.setDate(today.getDate() + 60);
	return jwt.sign({
		_id: this._id,
		email: this.email,
	},
		config.jwtSecret,
		{ expiresIn: 1 * 24 * 60 * 60 }	// 1 day in secs(formula = days * hours * minites * secs)
		//{ expiresIn: 30 }	// just for testing
	);
};
const User = mongoose.model('User', UserSchema)

module.exports = User;