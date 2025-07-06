const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var lotteryGameSettingController = require('../controllers/lotteryGameSetting');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public/:lotteryGameType', publicAuth, lotteryGameSettingController.getLotteryGameSettingsByGameType)
    .get('/public', publicAuth, lotteryGameSettingController.getAllLotteryGameSettings)
    .post('/:lotteryGameType', commonAdminAuth, lotteryGameSettingController.initializeLotteryGameSettings)
    .put('/updateDiscounts', commonAdminAuth, lotteryGameSettingController.updatelotteryGameSettingsForGameDiscounts)
    .put('/updateSpecialDiscounts', commonAdminAuth, lotteryGameSettingController.updatelotteryGameSettingsForGameSpecialDiscounts)
    .put('/updateLastDayDiscounts', commonAdminAuth, lotteryGameSettingController.updatelotteryGameSettingsForLastDayDiscounts)
    .put('/updateWinnings', commonAdminAuth, lotteryGameSettingController.updateLotteryGameSettingsForGameWinnings)
    .put('/updateRules', commonAdminAuth, lotteryGameSettingController.updateLotteryGameSettingsForGameRules)
    .put('/updateRulesBySuperAdmin', commonAdminAuth, lotteryGameSettingController.updateLotteryGameSettingsForGameRulesBySuperAdmin)

module.exports = apiRouter;