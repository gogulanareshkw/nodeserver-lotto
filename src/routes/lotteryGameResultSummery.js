const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var lotteryGameResultSummeryController = require('../controllers/lotteryGameResultSummery');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public/lastGameWinners', publicAuth, lotteryGameResultSummeryController.getLastLotteryGameWinners)
    .get('/:lotteryGameType', commonAdminAuth, lotteryGameResultSummeryController.getAllLotteryGameResults)
    .get('/:lotteryGameType/:gameNumber', commonAdminAuth, lotteryGameResultSummeryController.getLotteryGameResultsByGameNumber)
    .post('/:lotteryGameType/:gameNumber', superAdminAuth, lotteryGameResultSummeryController.announceLotteryGameWinnersList)

module.exports = apiRouter;