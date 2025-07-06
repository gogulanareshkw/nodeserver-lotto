const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var lotteryGameBoardController = require('../controllers/lotteryGameBoard');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public/all', publicAuth, lotteryGameBoardController.getAllLotteryGameBoards)
    .get('/public/:lotteryGameType', publicAuth, lotteryGameBoardController.getLotteryGameBoards)
    .get('/:lotteryGameType/:gameNumber', auth, lotteryGameBoardController.getLotteryGameBoardsByGameNumber)
    .post('/:lotteryGameType', commonAdminAuth, lotteryGameBoardController.addNewLotteryGameBoard)
    .post('/lockunlock/:lotteryGameType/:gameNumber', superAdminAuth, lotteryGameBoardController.lockUnlockLotteryGameBoard)
    .put('/', commonAdminAuth, lotteryGameBoardController.updateLotteryGameBoard)

module.exports = apiRouter;