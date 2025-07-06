const axios = require('axios');
var constants = require('../config/constants');
var moment = require('moment');
const GameSetting = require('../models/gameSetting');
const User = require('../models/user');
const DbHistory = require('../models/dbHistory');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
const config = require('../../config');


exports.getAppBasicSettings = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(P) -> get basic info of application'
    try {
        let gameSettingsFields = "_id canRecharge canWithDraw isDisabledRechargeForm isAvailableGames bonusAmountByReferralPlayInPercent joiningBonus minimumRecharge maximumRecharge minimumWithdraw maximumWithdraw transactionFeeInPercent agentWhatsapp agentTelegram whatsAppLink youtubeLink telegramLink facebookLink instagramLink twitterLink emailLink homePageLotteryUrl hideSecretInfo isLocationBasedApp canProceedWithSkipVal isThaiLanguage canOpenWishesModel isAvailableThaiFullTicket isRequiredMobileData isRequiredMobileContacts isRequiredMobileCalls isRequiredMobileSms isRequiredLocation canDownloadMobileApp mobileVersionCode mobileVersionName mobileApkUrl dbDataExistFrom blockedLocations locationAccessSkipVal canClearCollectionFrom wishesModelHead wishesModelTitle wishesModelImageUrl";
        let gameSettings = await GameSetting.find({}, gameSettingsFields);
        return res.status(200).json({
            success: true,
            gameSettings: gameSettings[0] || {}
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->getAppBasicSettings');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->getAppBasicSettings", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllGameSettings = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(A) -> get all game settings'
    try {
        let gameSettings = commonDbFuncs.getGameSettings();
        return res.json({
            success: true,
            gameSettings: gameSettings
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->getAllGameSettings');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->getAllGameSettings", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateGameSettingsForApplication = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(C) -> update Game settings for Application'
    const {
        gameSettingId,
        bonusAmountByReferralPlayInPercent,
        joiningBonus,
        minimumRecharge,
        maximumRecharge,
        minimumWithdraw,
        maximumWithdraw,
        transactionFeeInPercent
    } = req.body;
    try {
        await body('gameSettingId', "gameSettingId is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (bonusAmountByReferralPlayInPercent !== null) objUpdate.bonusAmountByReferralPlayInPercent = bonusAmountByReferralPlayInPercent;
            if (joiningBonus !== null) objUpdate.joiningBonus = joiningBonus;
            if (minimumRecharge !== null) objUpdate.minimumRecharge = minimumRecharge;
            if (maximumRecharge !== null) objUpdate.maximumRecharge = maximumRecharge;
            if (minimumWithdraw !== null) objUpdate.minimumWithdraw = minimumWithdraw;
            if (maximumWithdraw !== null) objUpdate.maximumWithdraw = maximumWithdraw;
            if (transactionFeeInPercent !== null) objUpdate.transactionFeeInPercent = transactionFeeInPercent;

            let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateGameSettingsForApplication');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateGameSettingsForApplication", JSON.stringify({ userId: req.user?._id, gameSettingId, bonusAmountByReferralPlayInPercent, joiningBonus, minimumRecharge, maximumRecharge, minimumWithdraw, maximumWithdraw, transactionFeeInPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateGameSettingsPermissionsForApplication = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(C) -> update Game settings for Application permissions'
    const { gameSettingId, field, value } = req.body;
    try {
        await body('gameSettingId', "gameSettingId is required").notEmpty().run(req);
        await body('field', "field name is required").notEmpty().run(req);
        await body('value', "value is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            switch (field) {
                case "canRecharge": {
                    objUpdate = { canRecharge: value };
                    break;
                }
                case "isDisabledRechargeForm": {
                    objUpdate = { isDisabledRechargeForm: value };
                    break;
                }
                case "canDownloadMobileApp": {
                    objUpdate = { canDownloadMobileApp: value };
                    break;
                }
                case "canWithDraw": {
                    objUpdate = { canWithDraw: value };
                    break;
                }
                case "isAvailableGames": {
                    objUpdate = { isAvailableGames: value };
                    break;
                }
                default: break;
            }

            let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateGameSettingsPermissionsForApplication');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateGameSettingsPermissionsForApplication", JSON.stringify({ userId: req.user?._id, gameSettingId, field, value }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateGameSettingsForPayments = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(C) -> update Game settings for Payments'
    const {
        gameSettingId,
        upiId,
        upiQrCodeURL,
        bankAcNumber,
        bankAcHolderName,
        bankIfscCode,
        sendingMoneyTo,
        stcPayId,
        stcPayName,
        ncbAccountNumber,
        ncbAccountName,
        alRajhiAccountNumber,
        alRajhiAccountName
    } = req.body;
    try {
        await body('gameSettingId', "gameSettingId is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (upiId !== null) objUpdate.upiId = upiId;
            if (bankAcNumber !== null) objUpdate.bankAcNumber = bankAcNumber;
            if (upiQrCodeURL !== null) objUpdate.upiQrCodeURL = upiQrCodeURL;
            if (bankAcHolderName !== null) objUpdate.bankAcHolderName = bankAcHolderName;
            if (bankIfscCode !== null) objUpdate.bankIfscCode = bankIfscCode;
            if (sendingMoneyTo !== null) objUpdate.sendingMoneyTo = sendingMoneyTo;
            if (stcPayId !== null) objUpdate.stcPayId = stcPayId;
            if (stcPayName !== null) objUpdate.stcPayName = stcPayName;
            if (ncbAccountNumber !== null) objUpdate.ncbAccountNumber = ncbAccountNumber;
            if (ncbAccountName !== null) objUpdate.ncbAccountName = ncbAccountName;
            if (alRajhiAccountNumber !== null) objUpdate.alRajhiAccountNumber = alRajhiAccountNumber;
            if (alRajhiAccountName !== null) objUpdate.alRajhiAccountName = alRajhiAccountName;

            let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                commonDbFuncs.createDbHistory(JSON.stringify(objUpdate), JSON.stringify(objUpdate), 'GameSetting', constants.DBUPDATE_TYPE_BANKDETAILS, req.user?._id, req.user?._id, JSON.stringify(objUpdate));
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateGameSettingsForPayments');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateGameSettingsForPayments", JSON.stringify({ userId: req.user?._id, gameSettingId, upiId, upiQrCodeURL, bankAcNumber, bankAcHolderName, bankIfscCode, sendingMoneyTo, stcPayId, stcPayName, ncbAccountNumber, ncbAccountName, alRajhiAccountNumber, alRajhiAccountName }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getBankDetailsHistory = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(C) -> get bank details history'
    try {
        const objFind = {
            updateType: constants.DBUPDATE_TYPE_BANKDETAILS
        };
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime userRole";

        let history = await DbHistory.find(objFind)
            .sort({ createdDateTime: -1 })
            .populate("updatedBy", populateFields)
            .exec();
        return res.status(200).json({ success: true, history: history || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->getBankDetailsHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->getBankDetailsHistory", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateGameSettingsForSocialLinks = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(C) -> update Game settings for SocialLinks'
    const {
        gameSettingId,
        agentWhatsapp,
        agentTelegram,
        whatsAppLink,
        youtubeLink,
        telegramLink,
        facebookLink,
        instagramLink,
        twitterLink,
        emailLink,
        homePageLotteryUrl
    } = req.body;
    try {
        await body('gameSettingId', "gameSettingId is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (agentWhatsapp !== null) objUpdate.agentWhatsapp = agentWhatsapp;
            if (agentTelegram !== null) objUpdate.agentTelegram = agentTelegram;
            if (whatsAppLink !== null) objUpdate.whatsAppLink = whatsAppLink;
            if (youtubeLink !== null) objUpdate.youtubeLink = youtubeLink;
            if (telegramLink !== null) objUpdate.telegramLink = telegramLink;
            if (facebookLink !== null) objUpdate.facebookLink = facebookLink;
            if (instagramLink !== null) objUpdate.instagramLink = instagramLink;
            if (twitterLink !== null) objUpdate.twitterLink = twitterLink;
            if (emailLink !== null) objUpdate.emailLink = emailLink;
            if (homePageLotteryUrl !== null) objUpdate.homePageLotteryUrl = homePageLotteryUrl;

            let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateGameSettingsForSocialLinks');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateGameSettingsForSocialLinks", JSON.stringify({ userId: req.user?._id, gameSettingId, agentWhatsapp, agentTelegram, whatsAppLink, youtubeLink, telegramLink, facebookLink, instagramLink, twitterLink, emailLink, homePageLotteryUrl }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateSettingsBySuperAdmin = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(S) -> update app settings by super admin'
    const {
        gameSettingId,
        mailDeliveryType,
        notificationEmails,
        superAdmins,
        smtpEmailAddress,
        smtpEmailPassword,
        hereMapsApiKey,
        mailJetPublicApiKey,
        mailJetPrivateApiKey,
        sendInBlueApiKey,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
        mobileVersionCode,
        mobileVersionName,
        mobileApkUrl,
        dbDataExistFrom,
        blockedLocations,
        locationAccessSkipVal,
        canClearCollectionFrom,
        wishesModelTitle,
        wishesModelHead,
        wishesModelImageUrl
    } = req.body;
    try {
        let objUpdate = {};
        if (mailDeliveryType !== null) objUpdate.mailDeliveryType = mailDeliveryType;
        if (notificationEmails !== null) objUpdate.notificationEmails = notificationEmails;
        if (superAdmins !== null) objUpdate.superAdmins = superAdmins;
        if (smtpEmailAddress !== null) objUpdate.smtpEmailAddress = smtpEmailAddress;
        if (smtpEmailPassword !== null) objUpdate.smtpEmailPassword = smtpEmailPassword;
        if (hereMapsApiKey !== null) objUpdate.hereMapsApiKey = hereMapsApiKey;
        if (mailJetPublicApiKey !== null) objUpdate.mailJetPublicApiKey = mailJetPublicApiKey;
        if (mailJetPrivateApiKey !== null) objUpdate.mailJetPrivateApiKey = mailJetPrivateApiKey;
        if (sendInBlueApiKey !== null) objUpdate.sendInBlueApiKey = sendInBlueApiKey;
        if (cloudinaryCloudName !== null) objUpdate.cloudinaryCloudName = cloudinaryCloudName;
        if (cloudinaryApiKey !== null) objUpdate.cloudinaryApiKey = cloudinaryApiKey;
        if (cloudinaryApiSecret !== null) objUpdate.cloudinaryApiSecret = cloudinaryApiSecret;
        if (mobileVersionCode !== null) objUpdate.mobileVersionCode = mobileVersionCode;
        if (mobileVersionName !== null) objUpdate.mobileVersionName = mobileVersionName;
        if (mobileApkUrl !== null) objUpdate.mobileApkUrl = mobileApkUrl;
        if (dbDataExistFrom !== null) objUpdate.dbDataExistFrom = dbDataExistFrom;
        if (blockedLocations !== null) objUpdate.blockedLocations = blockedLocations;
        if (locationAccessSkipVal !== null) objUpdate.locationAccessSkipVal = locationAccessSkipVal;
        if (canClearCollectionFrom !== null) objUpdate.canClearCollectionFrom = canClearCollectionFrom;
        if (wishesModelHead !== null) objUpdate.wishesModelHead = wishesModelHead;
        if (wishesModelTitle !== null) objUpdate.wishesModelTitle = wishesModelTitle;
        if (wishesModelImageUrl !== null) objUpdate.wishesModelImageUrl = wishesModelImageUrl;

        let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
        if (Boolean(updatedGameSetting)) {
            return res.json({
                success: true,
                gameSetting: updatedGameSetting,
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateSettingsBySuperAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateSettingsBySuperAdmin", JSON.stringify({ userId: req.user?._id, gameSettingId, mailDeliveryType, notificationEmails, superAdmins, smtpEmailAddress, smtpEmailPassword, hereMapsApiKey, mailJetPublicApiKey, mailJetPrivateApiKey, sendInBlueApiKey, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret, mobileVersionCode, mobileVersionName, mobileApkUrl, dbDataExistFrom, blockedLocations, locationAccessSkipVal, canClearCollectionFrom, wishesModelTitle, wishesModelHead, wishesModelImageUrl }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateGameSettingsPermissionsBySuperAdmin = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(S) -> update Game settings permissios for super admin'
    const { gameSettingId, field, value } = req.body;
    try {
        await body('gameSettingId', "gameSettingId is required").notEmpty().run(req);
        await body('field', "field name is required").notEmpty().run(req);
        await body('value', "value is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            switch (field) {
                case "isServerDown": {
                    objUpdate = { isServerDown: value };
                    break;
                }
                case "isLocationBasedApp": {
                    objUpdate = { isLocationBasedApp: value };
                    break;
                }
                case "canProceedWithSkipVal": {
                    objUpdate = { canProceedWithSkipVal: value };
                    break;
                }
                case "hideSecretInfo": {
                    objUpdate = { hideSecretInfo: value };
                    break;
                }
                case "isRequiredMobileData": {
                    objUpdate = { isRequiredMobileData: value };
                    break;
                }
                case "isRequiredMobileContacts": {
                    objUpdate = { isRequiredMobileContacts: value };
                    break;
                }
                case "canOpenWishesModel": {
                    objUpdate = { canOpenWishesModel: value };
                    break;
                }
                case "isThaiLanguage": {
                    objUpdate = { isThaiLanguage: value };
                    break;
                }
                case "isAvailableThaiFullTicket": {
                    objUpdate = { isAvailableThaiFullTicket: value };
                    break;
                }
                case "isRequiredMobileCalls": {
                    objUpdate = { isRequiredMobileCalls: value };
                    break;
                }
                case "isRequiredMobileSms": {
                    objUpdate = { isRequiredMobileSms: value };
                    break;
                }
                case "isRequiredLocation": {
                    objUpdate = { isRequiredLocation: value };
                    break;
                }
                default: break;
            }

            let updatedGameSetting = await GameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating GameSetting" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->updateGameSettingsPermissionsBySuperAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "gameSettingController->updateGameSettingsPermissionsBySuperAdmin", JSON.stringify({ userId: req.user?._id, gameSettingId, field, value }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.validateAppLocation = async function (req, res, next) {
    // #swagger.tags = ['Settings']	
    // #swagger.summary = '(S) -> validate App location'
    const { latitude, longitude } = req.body;
    try {
        await body('latitude', "latitude is required").notEmpty().run(req);
        await body('longitude', "longitude name is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            // Reverse Geocode
            let gameSettingsFields = "_id blockedLocations";
            let gameSettings = await GameSetting.find({}, gameSettingsFields);
            const blockedLocations = JSON.parse(gameSettings[0]?.blockedLocations || "[]") || [];

            let userAddresses = await User.find({ 'address.latitude': { $regex: Number(latitude).toFixed(2).toString() }, 'address.longitude': { $regex: Number(longitude).toFixed(2).toString() } }, '_id appId address').sort('-createdDateTime').limit(1).exec();
            let userAddress = userAddresses[0] || {};

            if (userAddress.address?.country) {
                let isValid = false;
                if (blockedLocations.length === 0) {
                    isValid = true;
                }
                else {
                    let blockedCountry = blockedLocations.find(x => x.alpha2Code?.toLowerCase() === userAddress?.address?.countryCode?.toLowerCase() || x.alpha3Code?.toLowerCase() === userAddress?.address?.countryCode?.toLowerCase());
                    if (!blockedCountry) {
                        isValid = true;
                    }
                    else if (blockedCountry?.country?.toLowerCase() === "india") {
                        let blockedState = blockedCountry?.states?.find(x => x.toLowerCase() === userAddress?.state?.toLowerCase());
                        if (!blockedState) {
                            isValid = true;
                        }
                    }
                }
                return res.status(200).json({
                    success: true,
                    canUseApplication: isValid,
                    state: userAddress?.address?.state || "",
                    countryCode: userAddress.address?.countryCode,
                    country: userAddress.address?.country,
                    source: "server"
                });
            }
            else {

                //const geoCodingUrl = "https://nominatim.openstreetmap.org/reverse?accept-language=en&lat=" + latitude + "&lon=" + longitude + "&format=json&addressdetails=1";
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
                            let isValid = false;
                            if (blockedLocations.length === 0) {
                                isValid = true;
                            }
                            else {
                                let blockedCountry = blockedLocations.find(x => x.alpha2Code?.toLowerCase() === addressInfo?.country_code?.toLowerCase() || x.alpha3Code?.toLowerCase() === addressInfo?.country_code?.toLowerCase());
                                if (!blockedCountry) {
                                    isValid = true;
                                }
                                else if (blockedCountry?.country?.toLowerCase() === "india") {
                                    let blockedState = blockedCountry?.states?.find(x => x.toLowerCase() === addressInfo?.state?.toLowerCase());
                                    if (!blockedState) {
                                        isValid = true;
                                    }
                                }

                                if (!isValid) {
                                    let obj = { latitude, longitude, addressInfo }
                                    commonDbFuncs.createApplicationLog(null, "gameSettingController->validateAppLocation->isValidCheck", JSON.stringify({ obj }), JSON.stringify({}), "", "");
                                }
                                return res.status(200).json({
                                    success: true,
                                    canUseApplication: isValid,
                                    state: addressInfo?.state,
                                    countryCode: addressInfo?.country_code?.toUpperCase(),
                                    country: addressInfo?.country,
                                    source: "geoapify"
                                });
                            }
                        }
                        else {
                            return res.status(200).json({
                                success: true,
                                canUseApplication: false,
                                state: "",
                                countryCode: "",
                                country: "",
                            });
                        }
                    })
                    .catch(function (error) {
                        commonDbFuncs.createApplicationLog(null, "gameSettingController->validateAppLocation->catch", JSON.stringify({ axiosConfig }), JSON.stringify(error), error?.message, error?.toString() || "");
                        return res.status(400).json({ success: false, error: error, canUseApplication: false, message: 'reverse geocoding is failed' })
                    });
            }

        }
    }
    catch (ex) {
        config.logger.error({ ex }, 'Error in gameSettingController->validateAppLocation');
        commonDbFuncs.createApplicationLog(null, "gameSettingController->validateAppLocation", JSON.stringify({ userId: req.user?._id, latitude, longitude }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}