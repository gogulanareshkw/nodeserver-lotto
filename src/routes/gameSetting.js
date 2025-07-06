const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var gameSettingController = require('../controllers/gameSetting');
const superAdminAuth = require("../middlewares/superAdminAuth");
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public/basic', publicAuth, gameSettingController.getAppBasicSettings)
    .get('/', auth, gameSettingController.getAllGameSettings)
    .get('/banksHistory', superAdminAuth, gameSettingController.getBankDetailsHistory)
    .post('/app', commonAdminAuth, gameSettingController.updateGameSettingsForApplication)
    .post('/appPermissions', commonAdminAuth, gameSettingController.updateGameSettingsPermissionsForApplication)
    .post('/payment', commonAdminAuth, gameSettingController.updateGameSettingsForPayments)
    .post('/social', commonAdminAuth, gameSettingController.updateGameSettingsForSocialLinks)
    .post('/superadmin', superAdminAuth, gameSettingController.updateSettingsBySuperAdmin)
    .post('/superpermission', superAdminAuth, gameSettingController.updateGameSettingsPermissionsBySuperAdmin)
    .post('/validateLoc', publicAuth, gameSettingController.validateAppLocation)

module.exports = apiRouter;