var moment = require('moment');
const LotteryGameBoard = require('../models/lotteryGameBoard');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.getAllLotteryGameBoards = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']	
    // #swagger.summary = '(P) -> get all lottery game results by Game Type'
    try {
        let selectFields = "_id lotteryGameType gameNumber firstPrizeResult threeUpStraightResult threeUpRumbleResult twoUpResult twoDownResult threeUpSingleDigitResult twoUpSingleDigitResult twoDownSingleDigitResult threeUpGameTotalResult twoUpGameTotalResult twoDownGameTotalResult resultLocked resultFinalized";
        let results = await LotteryGameBoard.find({}, selectFields)
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, gameResults: results });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->getAllLotteryGameBoards');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->getAllLotteryGameBoards", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGameBoards = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']	
    // #swagger.summary = '(P) -> get lottery game results by Game Type'
    try {
        let type = Number(req.params.lotteryGameType || 0) || 0;
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        let selectFields = "_id lotteryGameType gameNumber firstPrizeResult threeUpStraightResult threeUpRumbleResult twoUpResult twoDownResult threeUpSingleDigitResult twoUpSingleDigitResult twoDownSingleDigitResult threeUpGameTotalResult twoUpGameTotalResult twoDownGameTotalResult resultLocked resultFinalized";
        let results = await LotteryGameBoard.find({ lotteryGameType: type }, selectFields)
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, gameResults: results });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->getLotteryGameBoards');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->getLotteryGameBoards", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGameBoardsByGameNumber = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']	
    // #swagger.summary = '(A) -> get lottery game results by Game Type and gameNumber'
    try {
        let type = Number(req.params.lotteryGameType || 0) || 0;
        let gameNumber = req.params.gameNumber || 0;
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        if (gameNumber === 0) {
            return res.status(400).json({ success: false, message: "gameNumber is required" });
        }
        let results = await LotteryGameBoard.findOne({ lotteryGameType: type, gameNumber: gameNumber })
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, gameResults: results });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->getLotteryGameBoardsByGameNumber');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->getLotteryGameBoardsByGameNumber", JSON.stringify({ userId: req.user?._id, type, gameNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.addNewLotteryGameBoard = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']	
    // #swagger.summary = '(A) -> get lottery game results by Game Type and gameNumber'
    const { gameNumber, firstPrizeResult, twoDownResult } = req.body;
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        await body('gameNumber', "gameNumber is required").notEmpty().run(req);
        await body('firstPrizeResult', "firstPrizeResult is required").notEmpty().run(req);
        await body('firstPrizeResult', "invalid firstPrizeResult").isNumeric().isLength({ min: 6 }).run(req);
        await body('twoDownResult', "twoDownResult is required").notEmpty().run(req);
        await body('twoDownResult', "invalid twoDownResult").isNumeric().isLength({ min: 2 }).run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            if (type === 0) {
                return res.status(400).json({ success: false, message: "lotteryGameType is required" });
            }
            const threeUpResult = firstPrizeResult.slice(firstPrizeResult.length - 3);
            const twoUpResultNum = firstPrizeResult.slice(firstPrizeResult.length - 2);
            const threeUpDigits = threeUpResult.split("");
            const twoUpDigits = twoUpResultNum.split("");
            const twoDownDigits = twoDownResult.split("");
            const threeUpGameTotal = threeUpDigits.reduce((a, b) => Number(a) + Number(b)).toString();
            const twoUpGameTotal = twoUpDigits.reduce((a, b) => Number(a) + Number(b)).toString();
            const twoDownGameTotal = twoDownDigits.reduce((a, b) => Number(a) + Number(b)).toString();

            const newLottoryResult = new LotteryGameBoard({
                lotteryGameType: type,
                gameNumber: gameNumber,
                firstPrizeResult: firstPrizeResult,
                firstPrizeRumbleResult: jsFuncs.generateNumberCombinations(firstPrizeResult),
                threeUpStraightResult: threeUpResult,
                threeUpRumbleResult: jsFuncs.generateNumberCombinations(threeUpResult),
                twoUpResult: firstPrizeResult.slice(firstPrizeResult.length - 2),
                twoDownResult: twoDownResult,
                threeUpSingleDigitResult: threeUpDigits,
                twoUpSingleDigitResult: twoUpDigits,
                twoDownSingleDigitResult: twoDownDigits,
                threeUpGameTotalResult: threeUpGameTotal.slice(threeUpGameTotal.length - 1),
                twoUpGameTotalResult: twoUpGameTotal.slice(twoUpGameTotal.length - 1),
                twoDownGameTotalResult: twoDownGameTotal.slice(twoDownGameTotal.length - 1)
            });

            let savedResult = await newLottoryResult.save();
            if (Boolean(savedResult)) {
                return res.status(200).json({
                    success: true,
                    newLottoryGameResult: savedResult
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->addNewLotteryGameBoard');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->addNewLotteryGameBoard", JSON.stringify({ userId: req.user?._id, type, gameNumber, firstPrizeResult, twoDownResult }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGameBoard = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']
    // #swagger.summary = '(C) -> update lottery game result'
    const { lotteryResultId, firstPrizeResult, twoDownResult } = req.body;
    try {
        await body('lotteryResultId', "lotteryResultId is required").notEmpty().run(req);
        await body('firstPrizeResult', "firstPrizeResult is required").isLength({ min: 6 }).notEmpty().run(req);
        await body('twoDownResult', "twoDownResult is required").isLength({ min: 2 }).notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let lotto = await LotteryGameBoard.findById(lotteryResultId);
            if (Boolean(lotto)) {
                if (lotto.resultLocked) {
                    return res.status(400).json({ success: false, message: "Lottery result has been locked, can't modify." });
                }

                const threeUpResult = firstPrizeResult.slice(firstPrizeResult.length - 3);
                const twoUpResultNum = firstPrizeResult.slice(firstPrizeResult.length - 2);
                const threeUpDigits = threeUpResult.split("");
                const twoUpDigits = twoUpResultNum.split("");
                const twoDownDigits = twoDownResult.split("");
                const threeUpGameTotal = threeUpDigits.reduce((a, b) => Number(a) + Number(b)).toString();
                const twoUpGameTotal = twoUpDigits.reduce((a, b) => Number(a) + Number(b)).toString();
                const twoDownGameTotal = twoDownDigits.reduce((a, b) => Number(a) + Number(b)).toString();

                let objUpdate = {
                    firstPrizeResult: firstPrizeResult,
                    firstPrizeRumbleResult: jsFuncs.generateNumberCombinations(firstPrizeResult),
                    threeUpStraightResult: threeUpResult,
                    threeUpRumbleResult: jsFuncs.generateNumberCombinations(threeUpResult),
                    twoUpResult: firstPrizeResult.slice(firstPrizeResult.length - 2),
                    twoDownResult: twoDownResult,
                    threeUpSingleDigitResult: threeUpDigits,
                    twoUpSingleDigitResult: twoUpDigits,
                    twoDownSingleDigitResult: twoDownDigits,
                    threeUpGameTotalResult: threeUpGameTotal.slice(threeUpGameTotal.length - 1),
                    twoUpGameTotalResult: twoUpGameTotal.slice(twoUpGameTotal.length - 1),
                    twoDownGameTotalResult: twoDownGameTotal.slice(twoDownGameTotal.length - 1),
                    updatedDateTime: moment.now(),
                }

                let updatedResult = await LotteryGameBoard.findByIdAndUpdate(lotto._id, objUpdate, { upsert: false, new: true });
                if (Boolean(updatedResult)) {
                    return res.status(200).json({
                        success: true,
                        lottoryResult: updatedResult
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong while updating" });
                }

            }
            else {
                return res.status(400).json({ success: false, message: 'Item does not exist' });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->updateLotteryGameBoard');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->updateLotteryGameBoard", JSON.stringify({ userId: req.user?._id, lotteryResultId, firstPrizeResult, twoDownResult }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.lockUnlockLotteryGameBoard = async function (req, res, next) {
    // #swagger.tags = ['LotteryGameBoard']
    // #swagger.summary = '(S) -> lock lottery results for particular game'
    try {
        let type = Number(req.params.lotteryGameType || 0) || 0;
        let gameNumber = req.params.gameNumber || 0;
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        if (gameNumber === 0) {
            return res.status(400).json({ success: false, message: "gameNumber is required" });
        }

        let lotto = await LotteryGameBoard.findOne({ gameNumber: gameNumber, lotteryGameType: type });
        if (Boolean(lotto)) {
            let updatedResult = await LotteryGameBoard.findByIdAndUpdate(lotto._id, { resultLocked: !lotto.resultLocked }, { upsert: false, new: true });
            if (Boolean(updatedResult)) {
                return res.status(200).json({
                    success: true,
                    lottoryResult: updatedResult
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
        else {
            return res.status(400).json({ success: false, message: 'Item does not exist' });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGameBoardController->lockUnlockLotteryGameBoard');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGameBoardController->lockUnlockLotteryGameBoard", JSON.stringify({ userId: req.user?._id, type, gameNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


