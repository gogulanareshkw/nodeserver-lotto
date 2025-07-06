const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var lotteryGamePermissionController = require('../controllers/lotteryGamePermission');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public/:lotteryGameType', publicAuth, lotteryGamePermissionController.getLotteryGamePermissionsByGameType)
    .get('/public', publicAuth, lotteryGamePermissionController.getAllLotteryGamePermissions)
    .post('/:lotteryGameType', commonAdminAuth, lotteryGamePermissionController.initializeLotteryGamePermissions)
    .put('/', commonAdminAuth, lotteryGamePermissionController.updateLotteryGamePermissions)

module.exports = apiRouter;