const config = require('../../config');
const LotteryGameSetting = require('../models/lotteryGameSetting');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.initializeLotteryGameSettings = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> initialize Lottery Game settings'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }

        let setting = await LotteryGameSetting.findOne({ lotteryGameType: type });
        if (Boolean(setting)) {
            return res.status(400).json({ success: false, message: "LotteryGameSetting already initialized" });
        }
        else {
            const gameSetting = new LotteryGameSetting({
                lotteryGameType: type
            });

            let savedGameSetting = await gameSetting.save();
            if (Boolean(savedGameSetting)) {
                return res.status(200).json({
                    success: true,
                    newGameSetting: savedGameSetting
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->initializeLotteryGameSettings');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->initializeLotteryGameSettings", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllLotteryGameSettings = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(P) -> get all Lottery Game settings'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        let settings = await LotteryGameSetting.find({});
        return res.status(200).json({ success: true, lotteryGameSettings: settings });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->getAllLotteryGameSettings');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->getAllLotteryGameSettings", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGameSettingsByGameType = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(P) -> get Lottery Game settings by Game Type'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }

        let setting = await LotteryGameSetting.findOne({ lotteryGameType: type });
        return res.status(200).json({ success: true, gameSetting: setting || {} });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->getLotteryGameSettingsByGameType');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->getLotteryGameSettingsByGameType", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updatelotteryGameSettingsForGameDiscounts = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> update Lottery Game settings for Game Discounts'
    const {
        gameSettingId,
        firstPrizePlayDiscountPercent,
        threeUpPlayDiscountPercent,
        twoUpPlayDiscountPercent,
        twoDownPlayDiscountPercent,
        threeUpSingleDigitPlayDiscountPercent,
        twoUpSingleDigitPlayDiscountPercent,
        twoDownSingleDigitPlayDiscountPercent,
        threeUpGameTotalPlayDiscountPercent,
        twoUpGameTotalPlayDiscountPercent,
        twoDownGameTotalPlayDiscountPercent
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (firstPrizePlayDiscountPercent !== null) objUpdate.firstPrizePlayDiscountPercent = firstPrizePlayDiscountPercent;
            if (threeUpPlayDiscountPercent !== null) objUpdate.threeUpPlayDiscountPercent = threeUpPlayDiscountPercent;
            if (twoUpPlayDiscountPercent !== null) objUpdate.twoUpPlayDiscountPercent = twoUpPlayDiscountPercent;
            if (twoDownPlayDiscountPercent !== null) objUpdate.twoDownPlayDiscountPercent = twoDownPlayDiscountPercent;
            if (threeUpSingleDigitPlayDiscountPercent !== null) objUpdate.threeUpSingleDigitPlayDiscountPercent = threeUpSingleDigitPlayDiscountPercent;
            if (twoUpSingleDigitPlayDiscountPercent !== null) objUpdate.twoUpSingleDigitPlayDiscountPercent = twoUpSingleDigitPlayDiscountPercent;
            if (twoDownSingleDigitPlayDiscountPercent !== null) objUpdate.twoDownSingleDigitPlayDiscountPercent = twoDownSingleDigitPlayDiscountPercent;
            if (threeUpGameTotalPlayDiscountPercent !== null) objUpdate.threeUpGameTotalPlayDiscountPercent = threeUpGameTotalPlayDiscountPercent;
            if (twoUpGameTotalPlayDiscountPercent !== null) objUpdate.twoUpGameTotalPlayDiscountPercent = twoUpGameTotalPlayDiscountPercent;
            if (twoDownGameTotalPlayDiscountPercent !== null) objUpdate.twoDownGameTotalPlayDiscountPercent = twoDownGameTotalPlayDiscountPercent;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updatelotteryGameSettingsForGameDiscounts');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updatelotteryGameSettingsForGameDiscounts", JSON.stringify({ userId: req.user?._id, gameSettingId, firstPrizePlayDiscountPercent, threeUpPlayDiscountPercent, twoUpPlayDiscountPercent, twoDownPlayDiscountPercent, threeUpSingleDigitPlayDiscountPercent, twoUpSingleDigitPlayDiscountPercent, twoDownSingleDigitPlayDiscountPercent, threeUpGameTotalPlayDiscountPercent, twoUpGameTotalPlayDiscountPercent, twoDownGameTotalPlayDiscountPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updatelotteryGameSettingsForGameSpecialDiscounts = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> update Lottery Game settings for Game Special Discounts'
    const {
        gameSettingId,
        firstPrizePlaySpecialDiscountPercent,
        threeUpPlaySpecialDiscountPercent,
        twoUpPlaySpecialDiscountPercent,
        twoDownPlaySpecialDiscountPercent,
        threeUpSingleDigitPlaySpecialDiscountPercent,
        twoUpSingleDigitPlaySpecialDiscountPercent,
        twoDownSingleDigitPlaySpecialDiscountPercent,
        threeUpGameTotalPlaySpecialDiscountPercent,
        twoUpGameTotalPlaySpecialDiscountPercent,
        twoDownGameTotalPlaySpecialDiscountPercent
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (firstPrizePlaySpecialDiscountPercent !== null) objUpdate.firstPrizePlaySpecialDiscountPercent = firstPrizePlaySpecialDiscountPercent;
            if (threeUpPlaySpecialDiscountPercent !== null) objUpdate.threeUpPlaySpecialDiscountPercent = threeUpPlaySpecialDiscountPercent;
            if (twoUpPlaySpecialDiscountPercent !== null) objUpdate.twoUpPlaySpecialDiscountPercent = twoUpPlaySpecialDiscountPercent;
            if (twoDownPlaySpecialDiscountPercent !== null) objUpdate.twoDownPlaySpecialDiscountPercent = twoDownPlaySpecialDiscountPercent;
            if (threeUpSingleDigitPlaySpecialDiscountPercent !== null) objUpdate.threeUpSingleDigitPlaySpecialDiscountPercent = threeUpSingleDigitPlaySpecialDiscountPercent;
            if (twoUpSingleDigitPlaySpecialDiscountPercent !== null) objUpdate.twoUpSingleDigitPlaySpecialDiscountPercent = twoUpSingleDigitPlaySpecialDiscountPercent;
            if (twoDownSingleDigitPlaySpecialDiscountPercent !== null) objUpdate.twoDownSingleDigitPlaySpecialDiscountPercent = twoDownSingleDigitPlaySpecialDiscountPercent;
            if (threeUpGameTotalPlaySpecialDiscountPercent !== null) objUpdate.threeUpGameTotalPlaySpecialDiscountPercent = threeUpGameTotalPlaySpecialDiscountPercent;
            if (twoUpGameTotalPlaySpecialDiscountPercent !== null) objUpdate.twoUpGameTotalPlaySpecialDiscountPercent = twoUpGameTotalPlaySpecialDiscountPercent;
            if (twoDownGameTotalPlaySpecialDiscountPercent !== null) objUpdate.twoDownGameTotalPlaySpecialDiscountPercent = twoDownGameTotalPlaySpecialDiscountPercent;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updatelotteryGameSettingsForGameSpecialDiscounts');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updatelotteryGameSettingsForGameSpecialDiscounts", JSON.stringify({ userId: req.user?._id, gameSettingId, firstPrizePlaySpecialDiscountPercent, threeUpPlaySpecialDiscountPercent, twoUpPlaySpecialDiscountPercent, twoDownPlaySpecialDiscountPercent, threeUpSingleDigitPlaySpecialDiscountPercent, twoUpSingleDigitPlaySpecialDiscountPercent, twoDownSingleDigitPlaySpecialDiscountPercent, threeUpGameTotalPlaySpecialDiscountPercent, twoUpGameTotalPlaySpecialDiscountPercent, twoDownGameTotalPlaySpecialDiscountPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updatelotteryGameSettingsForLastDayDiscounts = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> update Lottery Game settings for Game Special Discounts'
    const {
        gameSettingId,
        firstPrizePlayLastDayDiscountPercent,
        threeUpPlayLastDayDiscountPercent,
        twoUpPlayLastDayDiscountPercent,
        twoDownPlayLastDayDiscountPercent,
        threeUpSingleDigitPlayLastDayDiscountPercent,
        twoUpSingleDigitPlayLastDayDiscountPercent,
        twoDownSingleDigitPlayLastDayDiscountPercent,
        threeUpGameTotalPlayLastDayDiscountPercent,
        twoUpGameTotalPlayLastDayDiscountPercent,
        twoDownGameTotalPlayLastDayDiscountPercent
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (firstPrizePlayLastDayDiscountPercent !== null) objUpdate.firstPrizePlayLastDayDiscountPercent = firstPrizePlayLastDayDiscountPercent;
            if (threeUpPlayLastDayDiscountPercent !== null) objUpdate.threeUpPlayLastDayDiscountPercent = threeUpPlayLastDayDiscountPercent;
            if (twoUpPlayLastDayDiscountPercent !== null) objUpdate.twoUpPlayLastDayDiscountPercent = twoUpPlayLastDayDiscountPercent;
            if (twoDownPlayLastDayDiscountPercent !== null) objUpdate.twoDownPlayLastDayDiscountPercent = twoDownPlayLastDayDiscountPercent;
            if (threeUpSingleDigitPlayLastDayDiscountPercent !== null) objUpdate.threeUpSingleDigitPlayLastDayDiscountPercent = threeUpSingleDigitPlayLastDayDiscountPercent;
            if (twoUpSingleDigitPlayLastDayDiscountPercent !== null) objUpdate.twoUpSingleDigitPlayLastDayDiscountPercent = twoUpSingleDigitPlayLastDayDiscountPercent;
            if (twoDownSingleDigitPlayLastDayDiscountPercent !== null) objUpdate.twoDownSingleDigitPlayLastDayDiscountPercent = twoDownSingleDigitPlayLastDayDiscountPercent;
            if (threeUpGameTotalPlayLastDayDiscountPercent !== null) objUpdate.threeUpGameTotalPlayLastDayDiscountPercent = threeUpGameTotalPlayLastDayDiscountPercent;
            if (twoUpGameTotalPlayLastDayDiscountPercent !== null) objUpdate.twoUpGameTotalPlayLastDayDiscountPercent = twoUpGameTotalPlayLastDayDiscountPercent;
            if (twoDownGameTotalPlayLastDayDiscountPercent !== null) objUpdate.twoDownGameTotalPlayLastDayDiscountPercent = twoDownGameTotalPlayLastDayDiscountPercent;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updatelotteryGameSettingsForLastDayDiscounts');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updatelotteryGameSettingsForLastDayDiscounts", JSON.stringify({ userId: req.user?._id, gameSettingId, firstPrizePlayLastDayDiscountPercent, threeUpPlayLastDayDiscountPercent, twoUpPlayLastDayDiscountPercent, twoDownPlayLastDayDiscountPercent, threeUpSingleDigitPlayLastDayDiscountPercent, twoUpSingleDigitPlayLastDayDiscountPercent, twoDownSingleDigitPlayLastDayDiscountPercent, threeUpGameTotalPlayLastDayDiscountPercent, twoUpGameTotalPlayLastDayDiscountPercent, twoDownGameTotalPlayLastDayDiscountPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGameSettingsForGameWinnings = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> update Lottery Game settings for Winnings'
    const {
        gameSettingId,
        firstPrizeStraightWinningPercent,
        firstPrizeRumbleWinningPercent,
        threeUpStraightWinningPercent,
        threeUpRumbleWinningPercent,
        twoUpWinningPercent,
        twoDownWinningPercent,
        threeUpSingleDigitWinningPercent,
        twoUpSingleDigitWinningPercent,
        twoDownSingleDigitWinningPercent,
        threeUpTotalWinningPercent,
        twoUpTotalWinningPercent,
        twoDownTotalWinningPercent
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (firstPrizeStraightWinningPercent !== null) objUpdate.firstPrizeStraightWinningPercent = firstPrizeStraightWinningPercent;
            if (firstPrizeRumbleWinningPercent !== null) objUpdate.firstPrizeRumbleWinningPercent = firstPrizeRumbleWinningPercent;
            if (threeUpStraightWinningPercent !== null) objUpdate.threeUpStraightWinningPercent = threeUpStraightWinningPercent;
            if (threeUpRumbleWinningPercent !== null) objUpdate.threeUpRumbleWinningPercent = threeUpRumbleWinningPercent;
            if (twoUpWinningPercent !== null) objUpdate.twoUpWinningPercent = twoUpWinningPercent;
            if (twoDownWinningPercent !== null) objUpdate.twoDownWinningPercent = twoDownWinningPercent;
            if (threeUpSingleDigitWinningPercent !== null) objUpdate.threeUpSingleDigitWinningPercent = threeUpSingleDigitWinningPercent;
            if (twoUpSingleDigitWinningPercent !== null) objUpdate.twoUpSingleDigitWinningPercent = twoUpSingleDigitWinningPercent;
            if (twoDownSingleDigitWinningPercent !== null) objUpdate.twoDownSingleDigitWinningPercent = twoDownSingleDigitWinningPercent;
            if (threeUpTotalWinningPercent !== null) objUpdate.threeUpTotalWinningPercent = threeUpTotalWinningPercent;
            if (twoUpTotalWinningPercent !== null) objUpdate.twoUpTotalWinningPercent = twoUpTotalWinningPercent;
            if (twoDownTotalWinningPercent !== null) objUpdate.twoDownTotalWinningPercent = twoDownTotalWinningPercent;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updateLotteryGameSettingsForGameWinnings');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updateLotteryGameSettingsForGameWinnings", JSON.stringify({ userId: req.user?._id, gameSettingId, firstPrizeStraightWinningPercent, firstPrizeRumbleWinningPercent, threeUpStraightWinningPercent, threeUpRumbleWinningPercent, twoUpWinningPercent, twoDownWinningPercent, threeUpSingleDigitWinningPercent, twoUpSingleDigitWinningPercent, twoDownSingleDigitWinningPercent, threeUpTotalWinningPercent, twoUpTotalWinningPercent, twoDownTotalWinningPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGameSettingsForGameRules = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(C) -> update Lottery Game settings for Rules'
    const {
        gameSettingId,
        gameStopHour,
        gameDiscountStopHour,
        minimumAmountForPlay,
        agentCommissionInPercent
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (gameStopHour !== null) objUpdate.gameStopHour = gameStopHour;
            if (gameDiscountStopHour !== null) objUpdate.gameDiscountStopHour = gameDiscountStopHour;
            if (minimumAmountForPlay !== null) objUpdate.minimumAmountForPlay = minimumAmountForPlay;
            if (agentCommissionInPercent !== null) objUpdate.agentCommissionInPercent = agentCommissionInPercent;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updateLotteryGameSettingsForGameRules');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updateLotteryGameSettingsForGameRules", JSON.stringify({ userId: req.user?._id, gameSettingId, gameStopHour, gameDiscountStopHour, minimumAmountForPlay, agentCommissionInPercent }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGameSettingsForGameRulesBySuperAdmin = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameSetting']	
    // #swagger.summary = '(S) -> update Lottery Game settings for Rules by super admin'
    const {
        gameSettingId,
        lotteryGameDrawDates
    } = req.body;
    try {
        await body('gameSettingId', "GameSetting Id is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {};
            if (lotteryGameDrawDates !== null) objUpdate.lotteryGameDrawDates = lotteryGameDrawDates;

            let updatedGameSetting = await LotteryGameSetting.findByIdAndUpdate(gameSettingId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedGameSetting)) {
                return res.json({
                    success: true,
                    gameSetting: updatedGameSetting,
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameSettingController->updateLotteryGameSettingsForGameRulesBySuperAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameSettingController->updateLotteryGameSettingsForGameRulesBySuperAdmin", JSON.stringify({ userId: req.user?._id, gameSettingId, lotteryGameDrawDates }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}