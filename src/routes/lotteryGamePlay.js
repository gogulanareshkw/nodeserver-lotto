const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var lotteryGamePlayController = require('../controllers/lotteryGamePlay');
const auth = require("../middlewares/auth");
const superAdminAuth = require("../middlewares/superAdminAuth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
    .get('/ticketInfo/:ticketNumber', auth, lotteryGamePlayController.getLotteryGamePlayInfoByTicketNumber)
    .get('/history/:lotteryGameType', auth, lotteryGamePlayController.getlotteryGamePlayShotsHistorybyUserID)
    .get('/history/:lotteryGameType/:gameNumber', commonAdminAuth, lotteryGamePlayController.getLotteryGamePlayShotsHistorybyGameNumber)
    .put('/ticketInfo', superAdminAuth, lotteryGamePlayController.updateLotteryGamePlayInfoByTicketNumber)
    .post('/filter', commonAdminAuth, lotteryGamePlayController.filterLotteryGamePlayByFields)
    .post('/:lotteryGameType', auth, lotteryGamePlayController.playLotteryGame)

module.exports = apiRouter;