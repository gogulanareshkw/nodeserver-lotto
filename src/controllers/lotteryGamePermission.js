const config = require('../../config');
var moment = require('moment');
const LotteryGamePermission = require('../models/lotteryGamePermission');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.initializeLotteryGamePermissions = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePermission']	
    // #swagger.summary = '(C) -> initialize Lottery Game Permissions'
    try {
        let type = Number(req.params.lotteryGameType || 0) || 0;
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }

        let permission = await LotteryGamePermission.findOne({ lotteryGameType: type });
        if (Boolean(permission)) {
            return res.status(400).json({ success: false, message: "LotteryGamePermission already initialized" });
        }
        else {
            const gamePermission = new LotteryGamePermission({
                lotteryGameType: type
            });

            let savedGamePermission = await gamePermission.save();
            if (Boolean(savedGamePermission)) {
                return res.status(200).json({
                    success: true,
                    newGamePermission: savedGamePermission
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePermissionController->initializeLotteryGamePermissions');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePermissionController->initializeLotteryGamePermissions", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllLotteryGamePermissions = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePermission']	
    // #swagger.summary = '(P) -> get all Lottery Game Permissions'
    try {
        let permissions = await LotteryGamePermission.find({})
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, lotteryGamePermissions: permissions });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePermissionController->getAllLotteryGamePermissions');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePermissionController->getAllLotteryGamePermissions", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGamePermissionsByGameType = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePermission']	
    // #swagger.summary = '(P) -> get Lottery Game Permissions by Game Type'
    try {
        let type = Number(req.params.lotteryGameType || 0) || 0;
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }

        let permission = await LotteryGamePermission.findOne({ lotteryGameType: type });
        return res.status(200).json({ success: true, lotteryGamePermission: permission || {} });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePermissionController->getLotteryGamePermissionsByGameType');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePermissionController->getLotteryGamePermissionsByGameType", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGamePermissions = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePermission']	
    // #swagger.summary = '(A) -> update Lottery Game Permissions'
    const { permissionId, field, value } = req.body;
    try {
        await body('permissionId', "Permission Id is required").notEmpty().run(req);
        await body('field', "field name is required").notEmpty().run(req);
        await body('value', "value is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {

            let objUpdate = {};
            switch (field) {
                case "isAvailableLotteryGame": {
                    objUpdate = { isAvailableLotteryGame: value };
                    break;
                }
                case "canPlayLotteryGame": {
                    objUpdate = { canPlayLotteryGame: value };
                    break;
                }
                case "removePlayDiscountOnLastDay": {
                    objUpdate = { removePlayDiscountOnLastDay: value };
                    break;
                }
                case "enableLastDayDiscounts": {
                    objUpdate = { enableLastDayDiscounts: value };
                    break;
                }
                case "showGameWinnersListScroll": {
                    objUpdate = { showGameWinnersListScroll: value };
                    break;
                }
                case "isAvailableSingleDigitGame": {
                    objUpdate = { isAvailableSingleDigitGame: value };
                    break;
                }
                case "isAvailableGameTotal": {
                    objUpdate = { isAvailableGameTotal: value };
                    break;
                }
                default: break;
            }

            let updatedPermission = await LotteryGamePermission.findByIdAndUpdate(permissionId, objUpdate, { upsert: false, new: true });
            if (Boolean(updatedPermission)) {
                return res.json({
                    success: true,
                    gamePermission: updatedPermission,
                });
            }
            else {
                return res.status(400).json({ success: false, message: 'Permission ID not found' })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePermissionController->updateLotteryGamePermissions');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePermissionController->updateLotteryGamePermissions", JSON.stringify({ userId: req.user?._id, permissionId, field, value }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}

