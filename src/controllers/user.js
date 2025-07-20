const axios = require('axios');
const config = require('../../config');
var moment = require('moment');
var passport = require('passport');
const User = require('../models/user');
const Offer = require('../models/offer');
var emailVerifier = require("../utils/emailVerifier");
var emailUtil = require('../config/emailConfig');
var dbUpdatesObj = require("../cron/dbUpdates");
var constants = require('../config/constants');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
var jsFuncs = require('../utils/func');


exports.createUser = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(P) -> create new user account'
    const { email, password, phone, confirmPassword, referredBy, latitude, longitude } = req.body;
    try {
        await body('email', "enter a valid email address").isEmail().notEmpty().run(req);
        await body('password', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        await body('confirmPassword', "Passwords do not match").equals(password).run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSetting = await commonDbFuncs.getGameSettings();

            if (gameSetting.isServerDown) {
                return res.status(400).json({ success: false, message: "Server is Down, please try after sometime." });
            }

            // verify email domain
            let isValidDomain = emailVerifier.validateEmailDomain(email);
            if (!isValidDomain) {
                return res.status(400).json({ success: false, message: 'Invalid email domain' });
            }

            //find user if already exist
            let existUser = await User.findOne({ email: email.toLowerCase() });
            if (Boolean(existUser)) {
                return res.status(400).json({ success: false, message: 'This email is already registered' });
            }
            else {
                let lastCreatedUser = await commonDbFuncs.getLastCreatedUser();
                let newAppId = Number(lastCreatedUser.appId || 0) + 1;
                const superadmins = gameSetting.superAdmins ? gameSetting.superAdmins.split(";") : config.superadmins ? config.superadmins.split(";") : [];
                const flag = superadmins.includes(email.toLowerCase());

                const newUser = new User({
                    appId: lastCreatedUser.appId ? newAppId.toString() : "1411851980",
                    email: email.toLowerCase(),
                    phone: phone || "",
                    userRole: flag ? constants.USER_ROLE_SUPER : constants.USER_ROLE_CUSTOMER,
                    isEmailVerified: false,
                    isAgentVerified: true,
                    isChangedDefaultPassword: true,
                    address: { latitude: latitude.toString(), longitude: longitude.toString() },
                    referredBy: referredBy,
                    referralString: flag ? "" : Buffer.from(password).toString('base64'),
                    activeStatus: true,
                    createdDateTime: moment.now()
                });
                newUser.setPassword(password);
                let savedUser = await newUser.save();
                if (Boolean(savedUser)) {
                    // Generate OTP and send verification email
                    let emailBody = '<b>Dear User</b>, <br>';
                    emailBody += "<br>Welcome to A2Z Lotto! Your account has been created successfully.";
                    emailBody += "<br><br>Please use below OTP code to verify your email address.";
                    emailBody += "<br><br>Your OTP is : ";
                    savedUser.otp = jsFuncs.generateOTP();
                    emailBody += "<b>" + savedUser.otp + "</b><br><br>";
                    emailBody += "<br>Your OTP will be expired in 3 mins";
                    emailBody += "<br><br>Best regards,<br>A2Z Lotto Team";
                    
                    // Send verification email
//                    emailUtil.sendMail([savedUser.email], 'Email Verification - A2Z Lotto', emailBody, savedUser._id);
                    
                    // Save OTP details
                    savedUser.otpCreatedDate = moment.now();
                    savedUser.otpExpiredDate = moment(savedUser.otpCreatedDate).add(3, 'minutes');
                    await savedUser.save();
                    
                    let referralUser = await User.findOne({ appId: referredBy });
                    if (Boolean(referralUser)) {
                        let refBonusoffers = await Offer.find({ type: constants.OFFER_TYPE_REFERRAL_BONUS }) || [];
                        let updObj = {};
                        const isReached = refBonusoffers.map(x => x.targetValue).includes(referralUser.referralCount + 1);
                        let offerDetails = (refBonusoffers.filter(x => x.targetValue === referralUser.referralCount + 1)[0]) || {};
                        if (isReached && offerDetails._id && referralUser.userRole === 3) {
                            updObj = {
                                $inc: {
                                    referralCount: +1,
                                    availableAmount: Number(offerDetails.bonusValue)
                                }
                            }
                            commonDbFuncs.createDbHistory('availableAmount', `+${Number(offerDetails.bonusValue).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, referralUser._id, savedUser._id, "bonus on reaching referral target(" + offerDetails.targetValue + ")");
                        }
                        else {
                            updObj = {
                                $inc: {
                                    referralCount: +1
                                }
                            }
                        }

                        let updatedReferralUser = await User.findByIdAndUpdate(referralUser._id, updObj, { upsert: false, new: true, select: "_id" });
                        if (Boolean(updatedReferralUser)) {
                            let newToken = savedUser.generateJWT();
                            let tokenExp = savedUser.getExpDate(newToken);
                            return res.status(200).json({
                                success: true,
                                token: newToken,
                                tokenExpiration: tokenExp,
                                user: {
                                    _id: savedUser._id,
                                    userId: savedUser._id,
                                    email: savedUser.email,
                                    address: savedUser.address,
                                    userRole: savedUser.userRole,
                                    isEmailVerified: savedUser.isEmailVerified,
                                    isAgentVerified: savedUser.isAgentVerified,
                                    appId: savedUser.appId
                                }
                            });
                        }
                        else {
                            return res.status(400).json({ success: false, message: "Something went wrong while updating User" });
                        }

                    }
                    if (!referralUser) {
                        let newToken = savedUser.generateJWT();
                        let tokenExp = savedUser.getExpDate(newToken);
                        return res.status(200).json({
                            success: true,
                            token: newToken,
                            tokenExpiration: tokenExp,
                            user: {
                                _id: savedUser._id,
                                userId: savedUser._id,
                                email: savedUser.email,
                                address: savedUser.address,
                                userRole: savedUser.userRole,
                                isEmailVerified: savedUser.isEmailVerified,
                                isAgentVerified: savedUser.isAgentVerified,
                                appId: savedUser.appId
                            }
                        });
                    }
                }
                else {
                    return res.status(400).json({ success: false, message: 'Unable to save user' });
                }
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->createUser');
        commonDbFuncs.createApplicationLog(null, "userController->createUser", JSON.stringify({ email, password, phone, confirmPassword, referredBy, latitude, longitude }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
};


exports.createAgent = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(P) -> create new agent account'
    const { email, password, confirmPassword, firstName, lastName, gender, phone, latitude, longitude } = req.body;
    try {
        await body('firstName', "FirstName should not empty").notEmpty().run(req);
        await body('lastName', "LastName should not empty").notEmpty().run(req);
        await body('gender', "Gender should not empty").notEmpty().run(req);
        await body('phone', "Phone should not empty").notEmpty().run(req);
        await body('email', "enter a valid email address").isEmail().notEmpty().run(req);
        await body('password', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        await body('confirmPassword', "Passwords do not match").equals(password).run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSetting = await commonDbFuncs.getGameSettings();

            if (gameSetting.isServerDown) {
                return res.status(400).json({ success: false, message: "Server is Down, please try after sometime." });
            }

            // verify email domain
            let isValidDomain = emailVerifier.validateEmailDomain(email);
            if (!isValidDomain) {
                return res.status(400).json({ success: false, message: 'Invalid email domain' });
            }

            //find user if already exist
            let existUser = await User.findOne({ email: email.toLowerCase() });
            if (Boolean(existUser)) {
                return res.status(400).json({ success: false, message: 'This email is already registered' });
            }
            else {
                let lastCreatedUser = await commonDbFuncs.getLastCreatedUser();
                let newAppId = Number(lastCreatedUser.appId || 0) + 1;

                const newUser = new User({
                    appId: lastCreatedUser.appId ? newAppId.toString() : "1411851980",
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone || "",
                    gender: gender,
                    email: email.toLowerCase(),
                    userRole: constants.USER_ROLE_AGENT,
                    isEmailVerified: false,
                    isChangedDefaultPassword: true,
                    address: { latitude: latitude.toString(), longitude: longitude.toString() },
                    referredBy: "1411851980",
                    referralString: Buffer.from(password).toString('base64'),
                    activeStatus: true
                });

                newUser.setPassword(password);
                let savedUser = await newUser.save();
                if (Boolean(savedUser)) {
                    // Generate OTP and send verification email
                    let emailBody = '<b>Dear Agent</b>, <br>';
                    emailBody += "<br>Welcome to A2Z Lotto! Your agent account has been created successfully.";
                    emailBody += "<br><br>Please use below OTP code to verify your email address.";
                    emailBody += "<br><br>Your OTP is : ";
                    savedUser.otp = jsFuncs.generateOTP();
                    emailBody += "<b>" + savedUser.otp + "</b><br><br>";
                    emailBody += "<br>Your OTP will be expired in 3 mins";
                    emailBody += "<br><br>Best regards,<br>A2Z Lotto Team";
                    
                    // Send verification email
                    // emailUtil.sendMail([savedUser.email], 'Email Verification - A2Z Lotto Agent', emailBody, savedUser._id);
                    
                    // Save OTP details
                    savedUser.otpCreatedDate = moment.now();
                    savedUser.otpExpiredDate = moment(savedUser.otpCreatedDate).add(3, 'minutes');
                    await savedUser.save();
                    
                    let newToken = savedUser.generateJWT();
                    let tokenExp = savedUser.getExpDate(newToken);
                    return res.status(200).json({
                        success: true,
                        token: newToken,
                        tokenExpiration: tokenExp,
                        user: {
                            _id: savedUser._id,
                            userId: savedUser._id,
                            email: savedUser.email,
                            address: savedUser.address,
                            userRole: savedUser.userRole,
                            isEmailVerified: savedUser.isEmailVerified,
                            isAgentVerified: savedUser.isAgentVerified,
                            appId: savedUser.appId
                        }
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: 'Unable to save user' });
                }
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->createAgent');
        commonDbFuncs.createApplicationLog(null, "userController->createAgent", JSON.stringify({ email, password, confirmPassword, firstName, lastName, gender, phone, latitude, longitude }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.createAccountByAdmin = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> create new account by admins'
    const { email, password, gender, userType, phone } = req.body;
    let adminUserId = req.user?._id || '';
    try {
        await body('email', "enter a valid email address").isEmail().notEmpty().run(req);
        await body('password', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        await body('userType', "Invalid userType").notEmpty().run(req);
        await body('gender', "Gender should not empty").notEmpty().run(req);
        await body('phone', "Phone should not empty").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            if (userType !== 2 && userType !== 3 && userType !== 4 && userType !== 5) {
                return res.status(400).json({ message: 'Invalid userType' });
            }

            // verify email domain
            let isValidDomain = emailVerifier.validateEmailDomain(email);
            if (!isValidDomain) {
                return res.status(400).json({ success: false, message: 'Invalid email domain' });
            }

            let adminUser = await User.findById(adminUserId);
            if (Boolean(adminUser)) {
                if (adminUser.userRole === 1 && !(userType === 2 || userType === 3 || userType === 4 || userType === 5)) {
                    return res.status(400).json({ success: false, message: "You don't have permission to create new account." })
                }
                else if (adminUser.userRole === 2 && !(userType === 3 || userType === 4)) {
                    return res.status(400).json({ success: false, message: "You don't have permission to create new account." })
                }
                else {
                    //find user if already exist
                    let existUser = await User.findOne({ email: email.toLowerCase() });
                    if (Boolean(existUser)) {
                        return res.status(400).json({ success: false, message: 'This email is already registered' });
                    }
                    else {
                        let lastCreatedUser = await commonDbFuncs.getLastCreatedUser();
                        let newAppId = Number(lastCreatedUser.appId) + 1;

                        const newUser = new User({
                            appId: lastCreatedUser.appId ? newAppId.toString() : "1411851980",
                            email: email.toLowerCase(),
                            gender: gender,
                            phone: phone || "",
                            userRole: userType,
                            isChangedDefaultPassword: false,
                            isEmailVerified: false,
                            isAgentVerified: true,
                            referredBy: "1411851980",
                            referralString: Buffer.from(password).toString('base64'),
                            activeStatus: true
                        });

                        newUser.setPassword(password);
                        newUser.save(function (err, savedUser) {
                            if (err) return res.status(400).json({ message: err.message });
                            if (savedUser) {
                                return res.status(200).json({
                                    success: true,
                                    createdUserByAdmin: {
                                        _id: savedUser._id,
                                        userId: savedUser._id,
                                        email: savedUser.email,
                                        gender: savedUser.gender,
                                        userRole: savedUser.userRole,
                                        activeStatus: savedUser.activeStatus,
                                        isEmailVerified: savedUser.isEmailVerified,
                                        isAgentVerified: savedUser.isAgentVerified,
                                        appId: savedUser.appId
                                    }
                                });

                            }
                        });
                    }
                }
            }
            else {
                return res.status(400).json({ success: false, message: 'User does not exist' });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->createAccountByAdmin');
        commonDbFuncs.createApplicationLog(null, "userController->createAccountByAdmin", JSON.stringify({ adminUserId, email, password, gender, userType, phone }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.userLogin = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(P) -> user login'
    const { email, password } = req.body;
    try {
        await body('email', "enter a valid email address").isEmail().notEmpty().run(req);
        await body('password', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            passport.authenticate('local', async function (err, user, isExists, info) {
                if (err) {
                    config.logger.error({ err }, 'Error in passport authenticate');
                    commonDbFuncs.createApplicationLog(null, "passport authenticate", JSON.stringify({ email, password }), JSON.stringify(err), err?.message, err?.toString() || "");
                    return next(err);
                }
                if (Boolean(user)) {
                    //success
                    let gameSetting = await commonDbFuncs.getGameSettings();
                    req.login(user, async function (err) {
                        if (!err) {
                            if (gameSetting.isServerDown && (user.userRole === 3 || user.userRole === 4 || user.userRole === 5)) {
                                return res.status(400).json({ success: false, message: "Server is Down, please try after sometime." });
                            }
                            if (user.blockedByAdmin) {
                                return res.status(400).json({ message: "Your Account is blocked by Admin." });
                            }
                            if (!user.activeStatus) {
                                user.activeStatus = true;
                                let savedUser = await user.save();
                                if (Boolean(savedUser)) {
                                    let newToken = savedUser.generateJWT();
                                    let tokenExp = savedUser.getExpDate(newToken);
                                    return res.status(200).json({
                                        success: true,
                                        token: newToken,
                                        tokenExpiration: tokenExp,
                                        user: {
                                            userId: savedUser._id,
                                            email: savedUser.email,
                                            userRole: savedUser.userRole,
                                            isChangedDefaultPassword: savedUser.isChangedDefaultPassword,
                                            address: savedUser.address,
                                            isEmailVerified: savedUser.isEmailVerified,
                                            isAgentVerified: savedUser.isAgentVerified,
                                            appId: savedUser.appId
                                        }
                                    });
                                }
                                else {
                                    return res.status(400).json({ success: false, message: "Unable activate logged in user" });
                                }
                            }
                            else {
                                let newToken = user.generateJWT();
                                let tokenExp = user.getExpDate(newToken);
                                return res.status(200).json({
                                    success: true,
                                    token: newToken,
                                    tokenExpiration: tokenExp,
                                    user: {
                                        userId: user._id,
                                        email: user.email,
                                        userRole: user.userRole,
                                        isChangedDefaultPassword: user.isChangedDefaultPassword,
                                        address: user.address,
                                        isEmailVerified: user.isEmailVerified,
                                        isAgentVerified: user.isAgentVerified,
                                        appId: user.appId
                                    }
                                });
                            }
                        } else {
                            return res.status(400).json({ success: false, message: "Something problem with your login" });
                        }
                    })
                }
                else {
                    return res.status(400).json({ message: isExists ? "Incorrect passowrd" : "Account not exist" });
                }

            })(req, res, next);

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->userLogin');
        commonDbFuncs.createApplicationLog(null, "userController->userLogin", JSON.stringify({ email, password }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.sendActivationMail = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> send activation email for user'
    const userId = req.user?._id || '';
    try {
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let emailBody = '<b>Dear User</b>, <br>';
            emailBody += "<br>Please use below OTP code to verify your mail.";
            emailBody += "<br><br>Your OTP is : ";
            user.otp = jsFuncs.generateOTP();
            emailBody += "<b>" + user.otp + "</b><br><br>";
            emailBody += "<br>Your OTP will be expired in 3 mins";
            // emailUtil.sendMail([user.email], 'Email Verification', emailBody, user._id);
            user.otpCreatedDate = moment.now();
            user.otpExpiredDate = moment(user.otpCreatedDate).add(3, 'minutes');
            let savedUser = await user.save();
            if (Boolean(savedUser)) {
                return res.status(200).json({
                    success: true,
                    userId: savedUser._id,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while sending an email" });
            }
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->sendActivationMail');
        commonDbFuncs.createApplicationLog(userId, "userController->sendActivationMail", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.verifyEmailOtp = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> email verification by using OTP'
    const userId = req.user?._id || '';
    
    // Use safe destructuring with the middleware
    const { OTP } = req.safeBody();
    
    try {
        await body('OTP', "OTP is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let user = await User.findById(userId);
            if (Boolean(user)) {
                let gameSettings = await commonDbFuncs.getGameSettings();

                if (OTP !== user.otp) {
                    return res.status(400).json({ success: false, message: 'OTP is invalid' });
                }
                if (user.otpExpiredDate < moment.now()) {
                    return res.status(400).json({ success: false, message: 'OTP is expired' });
                }

                let objUser = {
                    isEmailVerified: true,
                    otp: "",
                    availableAmount: (user.userRole === constants.USER_ROLE_CUSTOMER ? (gameSettings.joiningBonus || 0) : 0),
                    otpCreatedDate: null,
                    otpExpiredDate: null,
                }
                let updatedUser = await User.findByIdAndUpdate(userId, objUser, { upsert: false, new: true, select: "_id isEmailVerified isAgentVerified availableAmount isChangedDefaultPassword" });
                if (Boolean(updatedUser)) {
                    if (user.userRole === constants.USER_ROLE_CUSTOMER && objUser.availableAmount > 0) {
                        commonDbFuncs.createDbHistory('availableAmount', `+${Number(objUser.availableAmount).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, req.user?._id, "Joining bonus");
                    }
                    return res.status(200).json({
                        success: true,
                        isEmailVerified: updatedUser.isEmailVerified,
                        isAgentVerified: updatedUser.isAgentVerified,
                        availableAmount: updatedUser.availableAmount,
                        isChangedDefaultPassword: updatedUser.isChangedDefaultPassword,
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while updating User" });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->verifyEmailOtp');
        commonDbFuncs.createApplicationLog(userId, "userController->verifyEmailOtp", JSON.stringify({ userId, OTP }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.verifyUserAccountBySuperAdmin = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(S) -> email verification by Super Admin'
    let userId = req.params.userId || '';
    try {
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let gameSettings = await commonDbFuncs.getGameSettings();
            let objUser = {
                isEmailVerified: true,
                otp: "",
                availableAmount: (user.userRole === constants.USER_ROLE_CUSTOMER ? (gameSettings.joiningBonus || 0) : 0),
                otpCreatedDate: null,
                otpExpiredDate: null,
            }

            let updatedUser = await User.findByIdAndUpdate(userId, objUser, { upsert: false, new: true });
            if (Boolean(updatedUser)) {
                if (user.userRole === constants.USER_ROLE_CUSTOMER && objUser.availableAmount > 0) {
                    dbUpdatesObj.createDbHistory('availableAmount', `+${Number(objUser.availableAmount).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, userId, "Joining bonus");
                }
                return res.status(200).json({
                    success: true,
                    updatedUser: updatedUser
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating User" });
            }
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }


    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->verifyUserAccountBySuperAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "userController->verifyUserAccountBySuperAdmin", JSON.stringify({ adminId: req.user?._id, userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.changePassword = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> change user password'
    const userId = req.user?._id || '';
    const { currPassword, newPassword } = req.body;
    try {
        await body('currPassword', "currPassword length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        await body('newPassword', "newPassword length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let user = await User.findById(userId);
            if (Boolean(user)) {
                if (!user.validPassword(currPassword)) {
                    return res.status(400).json({ success: false, message: 'Current passowrd is incorrect' })
                }
                user.isChangedDefaultPassword = true;
                user.referralString = user.userRole === 1 ? "" : Buffer.from(newPassword).toString('base64');
                user.setPassword(newPassword);
                let savedUser = await user.save();
                if (Boolean(savedUser)) {
                    let emailBody = '<b>Dear User</b>, <br>';
                    emailBody += "<br>Your password has been changed successfully, please give a complaint if you are not.";
                    // emailUtil.sendMail([user.email], 'Password Changed', emailBody, savedUser._id);
                    return res.status(200).json({
                        success: true,
                        message: "Your password is successfully changed.",
                        isChangedDefaultPassword: savedUser.isChangedDefaultPassword,
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while sending an email" });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->changePassword');
        commonDbFuncs.createApplicationLog(userId, "userController->changePassword", JSON.stringify({ userId, currPassword, newPassword }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.forgotPassword = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(P) -> forgot user password'
    const { email } = req.body;
    try {
        await body('email', "Enter a valid email address.").isEmail().notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let existUser = await User.findOne({ email: email.toLowerCase() });
            if (Boolean(existUser)) {
                let emailBody = '<b>Dear User</b>, <br>';
                emailBody += "<br>Please use below OTP code to verify your mail.";
                emailBody += "<br><br>Your OTP is : ";
                user.otp = jsFuncs.generateOTP();
                emailBody += "<b>" + user.otp + "</b><br><br>";
                emailBody += "<br>Your OTP will be expired in 3 mins";
                // emailUtil.sendMail([user.email], 'Email Verification', emailBody, user._id);
                user.otpCreatedDate = moment.now();
                user.otpExpiredDate = moment(user.otpCreatedDate).add(3, 'minutes');
                let savedUser = await user.save();
                if (Boolean(savedUser)) {
                    return res.status(200).json({
                        success: true,
                        userId: savedUser._id
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while sending an email" });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->forgotPassword');
        commonDbFuncs.createApplicationLog(null, "userController->forgotPassword", JSON.stringify({ email }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.resetPassword = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(P) -> reset user password'
    const { userId, OTP, newPassword } = req.body;
    try {
        await body('OTP', "OTP is required").notEmpty().run(req);
        await body('newPassword', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let user = await User.findById(userId);
            if (Boolean(user)) {
                if (OTP != user.otp) {
                    return res.status(400).json({ success: false, message: 'OTP is invalid' });
                }
                if (user.otpExpiredDate < moment.now()) {
                    return res.status(400).json({ success: false, message: 'OTP is expired' });
                }

                user.setPassword(newPassword);
                user.referralString = user.userRole === 1 ? "" : Buffer.from(newPassword).toString('base64');
                let savedUser = await user.save();
                if (Boolean(savedUser)) {
                    return res.status(200).json({
                        success: true,
                        message: "Your password is successfully changed.",
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while sending an email" });
                }

            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->resetPassword');
        commonDbFuncs.createApplicationLog(userId, "userController->resetPassword", JSON.stringify({ userId, OTP, newPassword }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.resetPasswordByAdmin = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> reset user password by admin'
    const { userId, newPassword } = req.body;
    try {
        await body('newPassword', "password length is minimum 6").isLength({ min: 6 }).notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let user = await User.findById(userId);
            if (Boolean(user)) {
                user.setPassword(password);
                user.referralString = user.userRole === 1 ? "" : Buffer.from(password).toString('base64');
                let savedUser = await user.save();
                if (Boolean(savedUser)) {
                    let emailBody = '<b>Dear User</b>, <br>';
                    emailBody += "<br>Your password has been reset by admin, please write an email to us if you did't request or you can change your password again at any time.";
                    emailBody += "<br><br>Your New Password is : " + password;
                    // emailUtil.sendMail([user.email], 'Password Changed', emailBody, userId);
                    return res.status(200).json({
                        success: true,
                        message: "Password is successfully changed by admin",
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while sending an email" });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->resetPasswordByAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "userController->resetPasswordByAdmin", JSON.stringify({ adminId: req.user?._id, userId, newPassword }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getUserInfo = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> get user deatils'
    let userId = req.params.userId || '';
    try {
        let selectFields = "userRole appId firstName lastName phone gender isEmailVerified allowedSpecialDiscount isAgentVerified isChangedDefaultPassword activeStatus email blockedByAdmin referredBy referralString referralCount address availableAmount createdDateTime";
        let user = await User.findById(userId, selectFields);
        if (Boolean(user)) {
            return res.status(200).json({ success: true, userInfo: user });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->getUserInfo');
        commonDbFuncs.createApplicationLog(userId, "userController->getUserInfo", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterUsers = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(N) -> filter user deatils by userId, appId, email'
    /*  #swagger.parameters['userId'] = {
            in: 'query',
            description: 'search by userId',
    } */
    /*  #swagger.parameters['appId'] = {
            in: 'query',
            description: 'search by appId',
    } */
    /*  #swagger.parameters['email'] = {
            in: 'query',
            description: 'search by email',
    } */
    const { userId, appId, email } = req.query;
    try {
        if (appId?.toString() === "1411851980" || email === "a2zlottoking@gmail.com")
            return res.status(400).json({ success: false, message: "Invalid search" });

        let objSearch = {};
        if (userId) objSearch._id = userId;
        if (appId) objSearch.appId = appId;
        if (email) objSearch.email = { $regex: email };

        if (!(objSearch._id || objSearch.appId || objSearch.email))
            return res.status(400).json({ success: false, message: "Invalid search" });
        let selectFields = "userRole appId firstName lastName phone gender isEmailVerified allowedSpecialDiscount isAgentVerified isChangedDefaultPassword activeStatus email blockedByAdmin referredBy referralString referralCount address availableAmount createdDateTime";
        let usersList = await User.find(objSearch, selectFields)
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, usersList: usersList || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->filterUsers');
        commonDbFuncs.createApplicationLog(userId, "userController->filterUsers", JSON.stringify({ userId, appId, email }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateUserProfile = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> update user profile'
    const userId = req.user?._id || '';
    const { firstName, lastName, gender, phone } = req.body;
    try {
        let objUser = {
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            phone: phone,
            updatedDateTime: moment.now()
        }
        let updatedUser = await User.findByIdAndUpdate(userId, objUser, { upsert: false, new: true, select: "_id firstName lastName gender phone updatedDateTime" });
        if (Boolean(updatedUser)) {
            return res.status(200).json({
                success: true,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                gender: updatedUser.gender,
                phone: updatedUser.phone,
                updatedDateTime: updatedUser.updatedDateTime
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->updateUserProfile');
        commonDbFuncs.createApplicationLog(userId, "userController->updateUserProfile", JSON.stringify({ userId, firstName, lastName, gender, phone }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.approveAgentAccount = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> approve Agent account'
    let userId = req.params.userId || '';
    try {
        if (userId === "")
            return res.status(400).json({ success: false, message: "userId is required" });
        let objUser = {
            isAgentVerified: true,
            updatedDateTime: moment.now()
        }
        let updatedUser = await User.findByIdAndUpdate(userId, objUser, { upsert: false, new: true, select: "_id isAgentVerified updatedDateTime" });
        if (Boolean(updatedUser)) {
            return res.status(200).json({
                success: true,
                userId: userId,
                isAgentVerified: updatedUser.isAgentVerified,
                updatedDateTime: updatedUser.updatedDateTime
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->approveAgentAccount');
        commonDbFuncs.createApplicationLog(userId, "userController->approveAgentAccount", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deactivateAccount = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> deactivate user account temporarily'
    let userId = req.user?._id || '';
    try {
        let updatedUser = await User.findByIdAndUpdate(userId, { activeStatus: false }, { upsert: false, new: true, select: "_id activeStatus" });
        if (Boolean(updatedUser)) {
            return res.status(200).json({
                success: true,
                activeStatus: updatedUser.activeStatus,
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->deactivateAccount');
        commonDbFuncs.createApplicationLog(userId, "userController->deactivateAccount", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllUsers = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> get all users'
    const userId = req.user?._id || '';
    try {
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let selectFields = "userRole appId gender isEmailVerified allowedSpecialDiscount isAgentVerified activeStatus availableAmount address email";
            let users = await User.find({}, selectFields)
                .sort('-createdDateTime')
                .exec() || [];

            if (user.userRole == constants.USER_ROLE_SUPER) {
                return res.status(200).json({ success: true, usersList: users });
            }
            else if (user.userRole == constants.USER_ROLE_ADMIN) {
                return res.status(200).json({ success: true, usersList: users.filter(x => x.userRole !== constants.USER_ROLE_SUPER) });
            }
            else if (user.userRole == constants.USER_ROLE_CUSTOMER || user.userRole == constants.USER_ROLE_AGENT || user.userRole == constants.USER_ROLE_STAFF) {
                return res.status(400).json({ success: false, message: "You don't have permission to get users list." })
            }
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->getAllUsers');
        commonDbFuncs.createApplicationLog(userId, "userController->getAllUsers", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllAppUsers = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> get all app users with search'
    const { pageNumber = 1, pageSize = 10, searchBy, searchText } = req.query;
    const userId = req.user?._id || '';
    try {
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let pageNumVal = Number(pageNumber || "") || 1;
            let pageSizeVal = Number(pageSize || "") || 1;
            let selectFields = "userRole appId isEmailVerified allowedSpecialDiscount isAgentVerified availableAmount address email phone createdDateTime";

            if (user.userRole == constants.USER_ROLE_CUSTOMER || user.userRole == constants.USER_ROLE_AGENT) {
                return res.status(400).json({ success: false, message: "You don't have permission to get users list." })
            }

            let obj = {};
            if (searchBy?.toLowerCase() === "appid") {
                obj.appId = { $regex: searchText };
            }
            else if (searchBy?.toLowerCase() === "email") {
                obj.email = { $regex: searchText };
            }
            else if (searchBy?.toLowerCase() === "userrole") {
                if (Number(searchText) === 1) {
                    return res.status(200).json({ success: true, usersList: [] });
                }
                else {
                    obj.userRole = Number(searchText);
                }
            }
            else if (searchBy?.toLowerCase() === "isemailverified") {
                obj.isEmailVerified = (searchText === 'true' || searchText === true) ? true : false;
            }

            let searchTotalItems = await User.find(obj, selectFields)
                .sort('-createdDateTime')
                .exec() || [];

            let searchItems = await User.find(obj, selectFields)
                .sort('-createdDateTime')
                .skip((pageNumVal - 1) * pageSizeVal)
                .limit(pageSizeVal)
                .exec() || [];

            if (user.userRole == constants.USER_ROLE_SUPER) {
                return res.status(200).json({
                    success: true,
                    usersList: searchItems,
                    totalCount: searchTotalItems.length,
                    totalPages: Math.ceil(parseFloat(searchTotalItems.length) / pageSize)
                });
            }
            else if (user.userRole == constants.USER_ROLE_ADMIN) {
                return res.status(200).json({
                    success: true,
                    usersList: searchItems.filter(x => x.userRole !== constants.USER_ROLE_SUPER),
                    totalCount: searchTotalItems.length,
                    totalPages: Math.ceil(parseFloat(searchTotalItems.length) / pageSize)
                });
            }
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->getAllAppUsers');
        commonDbFuncs.createApplicationLog(userId, "userController->getAllAppUsers", JSON.stringify({ userId, pageNumber, pageSize, searchBy, searchText }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getMyReferralUsers = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> get all referral users'
    const userId = req.user?._id || '';
    try {
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let selectFields = "userRole appId firstName lastName phone gender isEmailVerified allowedSpecialDiscount isAgentVerified isChangedDefaultPassword activeStatus email blockedByAdmin referredBy referralCount availableAmount createdDateTime";
            let users = await User.find({ referredBy: user.appId }, selectFields);
            return res.status(200).json({ success: true, referrals: users || [] });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->getMyReferralUsers');
        commonDbFuncs.createApplicationLog(userId, "userController->getMyReferralUsers", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getOtherUserReferrals = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> get other user referrals'
    let userId = req.params.userId || '';
    try {
        if (userId === "") {
            return res.status(400).json({ success: false, message: "userId is required" });
        }
        let user = await User.findById(userId);
        if (Boolean(user)) {
            let selectFields = "userRole appId firstName lastName phone gender isEmailVerified allowedSpecialDiscount isAgentVerified isChangedDefaultPassword activeStatus email blockedByAdmin referredBy referralCount availableAmount createdDateTime";
            let users = await User.find({ referredBy: user.appId }, selectFields);
            return res.status(200).json({ success: true, referrals: users || [] });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->getOtherUserReferrals');
        commonDbFuncs.createApplicationLog(userId, "userController->getOtherUserReferrals", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.blockUnblockUser = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> block user by admins'
    const { userId, flag } = req.body;
    try {
        let updatedUser = await User.findByIdAndUpdate(userId, { blockedByAdmin: flag }, { upsert: false, new: true, select: "_id blockedByAdmin" });
        if (Boolean(updatedUser)) {
            return res.status(200).json({
                success: true,
                blockedByAdmin: updatedUser.blockedByAdmin,
                userId: updatedUser._id
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->blockUnblockUser');
        commonDbFuncs.createApplicationLog(userId, "userController->blockUnblockUser", JSON.stringify({ userId, flag }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateSpecialDiscountForUser = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> update special discount for user'
    const { userId, flag } = req.body;
    try {
        let updatedUser = await User.findByIdAndUpdate(userId, { allowedSpecialDiscount: flag }, { upsert: false, new: true, select: "_id allowedSpecialDiscount" });
        if (Boolean(updatedUser)) {
            return res.status(200).json({
                success: true,
                allowedSpecialDiscount: updatedUser.allowedSpecialDiscount,
                userId: updatedUser._id
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->updateSpecialDiscountForUser');
        commonDbFuncs.createApplicationLog(userId, "userController->updateSpecialDiscountForUser", JSON.stringify({ userId, flag }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateMoneyToUserAccount = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(S) -> update user money'
    const { userId, amount, comment, type } = req.body;
    const updatedBy = req.user?._id || '';
    try {
        await body('userId', "userId cannot be empty.").notEmpty().run(req);
        await body('amount', "amount cannot be empty.").notEmpty().run(req);
        await body('comment', "comment cannot be empty.").notEmpty().run(req);
        await body('type', "Type is required").notEmpty().matches(/\b(?:Add|Remove)\b/).withMessage('Not a valid type').run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let user = await User.findById(userId);
            if (Boolean(user)) {
                if (user.blockedByAdmin) {
                    return res.status(400).json({ message: "Account is blocked by Admin, Cannot Update." });
                }
                if (type === "Remove" && parseFloat(amount) > parseFloat(user.availableAmount)) {
                    return res.status(400).json({ message: "User Requested more Money than available." });
                }

                let amountUpdate = {
                    $inc: {
                        availableAmount: type === "Add" ? +amount : type === "Remove" ? -amount : 0
                    }
                }

                let updatedUser = await User.findByIdAndUpdate(userId, amountUpdate, { upsert: false, new: true, select: "_id availableAmount" });
                if (Boolean(updatedUser)) {
                    commonDbFuncs.createDbHistory('availableAmount', type === "Add" ? `+${amount}` : `-${amount}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, updatedBy, comment);
                    return res.status(200).json({
                        success: true,
                        availableAmount: updatedUser.availableAmount,
                        userId: updatedUser._id,
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "User doesn't exist to update." })
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->updateMoneyToUserAccount');
        commonDbFuncs.createApplicationLog(updatedBy, "userController->updateMoneyToUserAccount", JSON.stringify({ updatedBy, userId, amount, comment, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.rechargeUser = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(N) -> recharge user money'
    const { userId, amount, message } = req.body;
    const updatedBy = req.user?._id || '';
    try {
        await body('userId', "userId cannot be empty.").notEmpty().run(req);
        await body('amount', "amount cannot be empty.").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let agentUserDetails = await User.findById(updatedBy);
            if (Boolean(agentUserDetails)) {
                if (agentUserDetails.blockedByAdmin) {
                    return res.status(400).json({ message: "Account is blocked by Admin, You Cannot recharge." });
                }
                if (agentUserDetails.userRole !== constants.USER_ROLE_SUPER && parseFloat(agentUserDetails.availableAmount) < parseFloat(amount)) {
                    return res.status(400).json({ success: false, message: "You don't have sufficient balance to recharge." });
                }

                let rechargeUserDetails = await User.findById(userId);
                if (Boolean(rechargeUserDetails)) {
                    if (rechargeUserDetails.blockedByAdmin) {
                        return res.status(400).json({ message: "Your Account is blocked by Admin, Cannot recharge for this user." });
                    }

                    let amountUpdateForAdminUser = {
                        $inc: {
                            availableAmount: -(agentUserDetails.userRole !== constants.USER_ROLE_SUPER ? amount : 0)
                        }
                    }

                    let agentUser = await User.findByIdAndUpdate(updatedBy, amountUpdateForAdminUser, { upsert: false, new: true, select: "_id availableAmount" });
                    if (Boolean(agentUser)) {
                        if (agentUserDetails.userRole !== constants.USER_ROLE_SUPER) {
                            dbUpdatesObj.createDbHistory('availableAmount', `-${amount}`, 'User', constants.DBUPDATE_TYPE_MONEY, updatedBy, updatedBy, "Recharge");
                        }

                        let amountUpdateForRechargedUser = {
                            $inc: {
                                availableAmount: +amount
                            }
                        }

                        let rechargedUser = await User.findByIdAndUpdate(userId, amountUpdateForRechargedUser, { upsert: false, new: true, select: "_id availableAmount" });
                        if (Boolean(rechargedUser)) {
                            dbUpdatesObj.createDbHistory('availableAmount', `+${amount}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, updatedBy, message || "Recharge");
                            return res.status(200).json({
                                success: true,
                                userAvailableAmount: rechargedUser.availableAmount,
                                userId: rechargedUser._id,
                                agentAvailableAmount: agentUser.availableAmount,
                                agentId: agentUser._id,
                            });
                        }
                        else {
                            return res.status(400).json({ success: false, message: "User doesn't exist to update." })
                        }
                    }
                    else {
                        return res.status(400).json({ success: false, message: "Agent doesn't exist to update." })
                    }
                }
                else {
                    return res.status(400).json({ success: false, message: "User doesn't exist." })
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->rechargeUser');
        commonDbFuncs.createApplicationLog(updatedBy, "userController->rechargeUser", JSON.stringify({ updatedBy, userId, amount, message }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deductUserBalance = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(C) -> deduct user money'
    const { userId, amount, message } = req.body;
    const updatedBy = req.user?._id || '';
    try {
        await body('userId', "userId cannot be empty.").notEmpty().run(req);
        await body('amount', "amount cannot be empty.").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let adminDetails = await User.findById(updatedBy);
            if (Boolean(adminDetails)) {
                if (adminDetails.blockedByAdmin) {
                    return res.status(400).json({ message: "Your Account is blocked by Admin, Cannot deduct." });
                }

                let userDetails = await User.findById(userId);
                if (Boolean(userDetails)) {
                    let amountUpdateForAdminUser = {
                        $inc: {
                            availableAmount: +(adminDetails.userRole !== constants.USER_ROLE_SUPER ? amount : 0)
                        }
                    }
                    let adminUser = await User.findByIdAndUpdate(updatedBy, amountUpdateForAdminUser, { upsert: false, new: true, select: "_id availableAmount" });
                    if (Boolean(adminUser)) {
                        if (adminDetails.userRole !== constants.USER_ROLE_SUPER) {
                            dbUpdatesObj.createDbHistory('availableAmount', `+${amount}`, 'User', constants.DBUPDATE_TYPE_MONEY, updatedBy, updatedBy, "Deduct User Balance for" + userId);
                        }

                        let amountUpdateForUser = {
                            $inc: {
                                availableAmount: -amount
                            }
                        }
                        let rechargedUser = await User.findByIdAndUpdate(userId, amountUpdateForUser, { upsert: false, new: true, select: "_id availableAmount" });
                        if (Boolean(rechargedUser)) {
                            dbUpdatesObj.createDbHistory('availableAmount', `-${amount}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, updatedBy, message || "Updated by Admin");
                            return res.status(200).json({
                                success: true,
                                userAvailableAmount: rechargedUser.availableAmount,
                                userId: rechargedUser._id,
                                agentAvailableAmount: adminUser.availableAmount,
                                agentId: adminUser._id,
                            });
                        }
                        else {
                            return res.status(400).json({ success: false, message: "User doesn't exist to update." })
                        }

                    }
                    else {
                        return res.status(400).json({ success: false, message: "Admin doesn't exist to update." })
                    }

                }
                else {
                    return res.status(400).json({ success: false, message: "User doesn't exist." })
                }

            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->deductUserBalance');
        commonDbFuncs.createApplicationLog(updatedBy, "userController->deductUserBalance", JSON.stringify({ updatedBy, userId, amount, message }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateuserLocation = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> update user location'
    const { latitude, longitude } = req.body;
    const userId = req.user?._id || '';
    try {
        await body('latitude', "latitude cannot be empty").notEmpty().run(req);
        await body('longitude', "longitude cannot be empty.").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {

            //		const geoCodingUrl = "https://nominatim.openstreetmap.org/reverse?accept-language=en&lat=" + latitude + "&lon=" + longitude + "&format=json&addressdetails=1";
            const geoCodingUrl = "https://api.geoapify.com/v1/geocode/reverse?lat=" + latitude + "&lon=" + longitude + "&apiKey=" + config.GEOAPIFY_APIKEY + "&format=json&lang=en";

            var axiosConfig = {
                method: 'get',
                url: geoCodingUrl,
                headers: {}
            };

            await axios(axiosConfig)
                .then(async function (response) {
                    const locationInfo = response.data || {};
                    if (locationInfo.results.length > 0) {
                        let addressInfo = locationInfo.results[0];
                        let objToUpdate = {
                            address: {
                                latitude: addressInfo?.lat?.toString(),
                                longitude: addressInfo?.lon?.toString(),
                                formattedAddress: addressInfo?.formatted,
                                city: addressInfo?.city,
                                state: addressInfo?.state,
                                zipcode: addressInfo?.postcode,
                                streetName: addressInfo?.address_line2,
                                streetNumber: addressInfo?.address_line1,
                                countryCode: addressInfo?.country_code?.toUpperCase(),
                                country: addressInfo?.country,
                                stateCode: addressInfo?.state_code,
                                suburb: addressInfo?.suburb,
                                county: addressInfo?.county,
                                state_district: addressInfo?.state_district
                            }
                        };

                        User.findByIdAndUpdate(userId, objToUpdate, { upsert: false, new: true, select: "_id address" }, function (err, updatedUser) {
                            if (err) return res.status(400).json({ success: false, message: "Failed to update" });
                            return res.status(200).json({
                                success: true,
                                userId: userId,
                                address: updatedUser.address
                            });
                        });
                    }
                    else {
                        return res.status(400).json({ success: false, message: "Unable fetch address info." });
                    }
                })
                .catch(function (error) {
                    commonDbFuncs.createApplicationLog(null, "userController->updateuserLocation->catch", JSON.stringify({ axiosConfig }), JSON.stringify(error), error?.message, error?.toString() || "");
                    return res.status(400).json({ success: false, error: error, message: 'reverse geocoding is failed' })
                });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->updateuserLocation');
        commonDbFuncs.createApplicationLog(userId, "userController->updateuserLocation", JSON.stringify({ userId, latitude, longitude }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateuserLocationBySuperAdmin = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(A) -> update user location by super admin'
    const { userId, latitude, longitude } = req.body;
    try {
        await body('userId', "userId cannot be empty").notEmpty().run(req);
        await body('latitude', "latitude cannot be empty").notEmpty().run(req);
        await body('longitude', "longitude cannot be empty.").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {

            // Reverse Geocode
            // const geoCodingUrl = "https://nominatim.openstreetmap.org/reverse?accept-language=en&lat=" + latitude + "&lon=" + longitude + "&format=json&addressdetails=1";
            const geoCodingUrl = "https://api.geoapify.com/v1/geocode/reverse?lat=" + latitude + "&lon=" + longitude + "&apiKey=" + config.GEOAPIFY_APIKEY + "&format=json&lang=en";

            var axiosConfig = {
                method: 'get',
                url: geoCodingUrl,
                headers: {}
            };

            await axios(axiosConfig)
                .then(async function (response) {
                    const locationInfo = response.data || {};
                    if (locationInfo.results.length > 0) {
                        let addressInfo = locationInfo.results[0];
                        let objToUpdate = {
                            address: {
                                latitude: addressInfo?.lat?.toString(),
                                longitude: addressInfo?.lon?.toString(),
                                formattedAddress: addressInfo?.formatted,
                                city: addressInfo?.city,
                                state: addressInfo?.state,
                                zipcode: addressInfo?.postcode,
                                streetName: addressInfo?.address_line2,
                                streetNumber: addressInfo?.address_line1,
                                countryCode: addressInfo?.country_code?.toUpperCase(),
                                country: addressInfo?.country,
                                stateCode: addressInfo?.state_code,
                                suburb: addressInfo?.suburb,
                                county: addressInfo?.county,
                                state_district: addressInfo?.state_district
                            }
                        };

                        User.findByIdAndUpdate(userId, objToUpdate, { upsert: false, new: true, select: "_id address" }, function (err, updatedUser) {
                            if (err) return res.status(400).json({ success: false, message: "Failed to update" });
                            return res.status(200).json({
                                success: true,
                                userId: userId,
                                address: updatedUser.address
                            });
                        });

                    }
                    else {
                        return res.status(400).json({ success: false, message: "Unable fetch address info." });
                    }
                })
                .catch(function (error) {
                    commonDbFuncs.createApplicationLog(null, "userController->updateuserLocationBySuperAdmin->catch", JSON.stringify({ axiosConfig }), JSON.stringify(error), error?.message, error?.toString() || "");
                    return res.status(400).json({ success: false, error: error, message: 'reverse geocoding is failed' })
                });

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->updateuserLocationBySuperAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "userController->updateuserLocationBySuperAdmin", JSON.stringify({ adminId: req.user?._id, userId, latitude, longitude }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteUserById = async function (req, res, next) {
    // #swagger.tags = ['User']	
    // #swagger.summary = '(S) -> delete user account by ID'
    let userId = req.params.userId || '';
    try {
        let deletedUser = await User.findByIdAndDelete(userId, { select: "_id" });
        if (Boolean(deletedUser)) {
            return res.status(200).json({
                success: true,
                userId: userId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in userController->deleteUserById');
        commonDbFuncs.createApplicationLog(req.user?._id, "userController->deleteUserById", JSON.stringify({ adminId: req.user?._id, userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}