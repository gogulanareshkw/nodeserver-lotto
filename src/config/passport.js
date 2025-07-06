var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
const User = require('../models/user');

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(async function (user, done) {
	try {
		//If using Mongoose with MongoDB; if other you will need JS specific to that schema
		const foundUser = await User.findById(user._id);
		done(null, foundUser);
	} catch (err) {
		done(err, null);
	}
});

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
}, async function (req, username, password, done) {
	try {
		const user = await User.findOne({ $or: [{ 'email': username }] });
		
		if (!user) {
			return done(null, false, false, "Account not exist");
		}
		
		if (!user.validPassword(password)) {
			return done(null, false, true, "Incorrect password");
		}
		
		return done(null, user);
	} catch (err) {
		return done(err);
	}
})); 