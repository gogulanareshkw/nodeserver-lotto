const LotteryGameResultSummery = require('../models/lotteryGameResultSummery');
var commonDbFuncs = require("../utils/commonDbFuncs");
var lotteryReleaseObj = require("../utils/lotteryRelease");
var jsFuncs = require('../utils/func');


exports.getAllLotteryGameResults = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameResultSummery']	
    // #swagger.summary = '(C) -> get all lottery game results'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        let items = await LotteryGameResultSummery.find({ lotteryGameType: type });
        return res.status(200).json({ success: true, allLotteryResults: items });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameResultSummeryController->getAllLotteryGameResults');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameResultSummeryController->getAllLotteryGameResults", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGameResultsByGameNumber = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameResultSummery']	
    // #swagger.summary = '(C) -> get all lottery game results by Game Number'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    let gameNumber = req.params.gameNumber || 0;
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        if (gameNumber === 0) {
            return res.status(400).json({ success: false, message: "gameNumber is required" });
        }
        let item = await LotteryGameResultSummery.findOne({ gameNumber: gameNumber, lotteryGameType: type });
        return res.status(200).json({ success: true, lotteryResultSummery: item || {} });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameResultSummeryController->getLotteryGameResultsByGameNumber');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameResultSummeryController->getLotteryGameResultsByGameNumber", JSON.stringify({ userId: req.user?._id, type, gameNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.announceLotteryGameWinnersList = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameResultSummery']	
    // #swagger.summary = '(S) -> Announce Lottery Game Winners'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    let gameNumber = req.params.gameNumber || 0;
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        if (gameNumber === 0) {
            return res.status(400).json({ success: false, message: "gameNumber is required" });
        }
        let result = await lotteryReleaseObj.announceLotteryGameWinners(gameNumber, type);
        return res.status(200).json({
            success: true,
            lotteryResult: result
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameResultSummeryController->announceLotteryGameWinnersList');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameResultSummeryController->announceLotteryGameWinnersList", JSON.stringify({ userId: req.user?._id, type, gameNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLastLotteryGameWinners = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameResultSummery']	
    // #swagger.summary = '(P) -> get last Game winners'
    try {
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let selectFields = "_id winners";
        let gameResults = await LotteryGameResultSummery.find({}, selectFields)
            .sort('-createdDateTime')
            .populate("winners.details.userId", populateFields)
            .exec();

        let lastGameResult = gameResults[0] || {};
        const winners = lastGameResult?.winners?.details || [];
        let winnersList = [];
        winners.forEach(x => {
            winnersList.push({
                user: x.userId.email.split('@')[0].substring(0, 5) + "*****@gmail.com",
                winningAmount: x.grossWinningAmount
            })
        });
        let dummyList = jsFuncs.getLastGameWinnersList(30 - winners.length);
        let finalList = [...winnersList, ...dummyList]
        return res.status(200).json({ success: true, gameWinners: finalList });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameResultSummeryController->getLastLotteryGameWinners');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameResultSummeryController->getLastLotteryGameWinners", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
