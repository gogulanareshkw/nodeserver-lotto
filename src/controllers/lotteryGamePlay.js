var _ = require('lodash');
const User = require('../models/user');
const LotteryGamePlay = require('../models/lotteryGamePlay');
const LotteryGameResultSummery = require('../models/lotteryGameResultSummery');
const LotteryGameSetting = require('../models/lotteryGameSetting');
const LotteryGamePermission = require('../models/lotteryGamePermission');
var moment = require('moment');
var constants = require('../config/constants');
var jsFuncs = require('../utils/func');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.getLotteryGamePlayInfoByTicketNumber = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']	
    // #swagger.summary = '(A) -> get lottery game play information by ticket number'
    let ticketNumber = req.params.ticketNumber || '';
    try {
        if (!ticketNumber) {
            return res.status(400).json({ success: false, message: "Ticket Number is required" });
        }
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let item = await LotteryGamePlay.findOne({ ticketNumber: ticketNumber })
            .populate("userId", populateFields)
            .exec();
        return res.status(200).json({ success: true, ticketInfo: item || {} });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->getLotteryGamePlayInfoByTicketNumber');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->getLotteryGamePlayInfoByTicketNumber", JSON.stringify({ userId: req.user?._id, ticketNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateLotteryGamePlayInfoByTicketNumber = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']	
    // #swagger.summary = '(S) -> update lottery game play information by ticket number'
    const { ticketNumberId, number, straight, rumble, numberId } = req.body;
    try {
        await body('ticketNumberId', "ticketNumberId is required").notEmpty().run(req);
        await body('number', "number is required").notEmpty().run(req);
        await body('straight', "straight is required").notEmpty().run(req);
        await body('numberId', "numberId is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let findObj = {
                _id: ticketNumberId,
                'numbers._id': numberId,
                //"numbers": { "$elemMatch": { "_id": numberId } }      // can try this also
            }
            let objUpdate = {
                $set: {
                    'numbers.$.number': number,
                    'numbers.$.straight': straight,
                    'numbers.$.rumble': rumble
                }
            };

            let item = await LotteryGamePlay.findOneAndUpdate(findObj, objUpdate, { upsert: false, new: true })
                .populate("userId", populateFields)
                .exec();
            return res.status(200).json({ success: true, ticketInfo: item || {} });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->updateLotteryGamePlayInfoByTicketNumber');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->updateLotteryGamePlayInfoByTicketNumber", JSON.stringify({ userId: req.user?._id, ticketNumberId, number, straight, rumble, numberId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterLotteryGamePlayByFields = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']	
    // #swagger.summary = '(A) -> filter lottery game play by fields and number'
    const { lotteryGameType, gameNumber, pageNumber = 1, pageSize = 10, searchBy, searchText } = req.body;
    try {
        await body('lotteryGameType', "lotteryGameType is required").notEmpty().run(req);
        await body('gameNumber', "gameNumber is required").isLength({ min: 3 }).run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let pageNumVal = Number(pageNumber || "") || 1;
            let pageSizeVal = Number(pageSize || "") || 1;

            let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
            let obj = { gameNumber: gameNumber, lotteryGameType: lotteryGameType };

            if (searchBy?.toLowerCase() === "userid") {
                obj.userId = searchText;
            }
            else if (searchBy?.toLowerCase() === "ticketnumber") {
                obj.ticketNumber = searchText;
            }
            else if (searchBy?.toLowerCase() === "number") {
                obj.numbers = { $elemMatch: { number: searchText } };
            }

            let gamePlayShotsAll = await LotteryGamePlay.find(obj)
                .sort('-played_at')
                .populate("userId", populateFields)
                .exec();

            let gamePlayShots = await LotteryGamePlay.find(obj)
                .sort('-played_at')
                .populate("userId", populateFields)
                .skip((pageNumVal - 1) * pageSizeVal)
                .limit(pageSizeVal)
                .exec();

            let results = [];
            gamePlayShots.forEach(function (play) {
                play.numbers.forEach(function (num) {
                    let obj = {
                        _id: play._id,
                        lotteryGameType: play.lotteryGameType,
                        gameNumber: play.gameNumber,
                        ticketNumber: play.ticketNumber,
                        userId: play.userId,
                        playingGameType: play.playingGameType,
                        isOriginalTicket: play.isOriginalTicket,
                        number: num.number,
                        straight: num.straight,
                        rumble: num.rumble,
                        played_at: play.played_at
                    };
                    if ((searchBy?.toLowerCase() === "number" && searchText === num.number.toString()) || searchBy?.toLowerCase() !== "number") {
                        results.push(obj);
                    }
                });
            });
            return res.status(200).json({
                success: true,
                gamePlayShots: _.orderBy(results, 'played_at', 'desc'),
                details: {
                    totalPlayedAmount: gamePlayShotsAll.map(x => parseFloat(x.playedAmount) || 0).reduce((a, b) => a + b, 0),
                    totalDiscount: gamePlayShotsAll.map(x => parseFloat(x.discount) || 0).reduce((a, b) => a + b, 0),
                    totalAmountPaid: gamePlayShotsAll.map(x => parseFloat(x.paidAmount) || 0).reduce((a, b) => a + b, 0),
                    totalTickets: gamePlayShotsAll.length,
                    totalUsers: [...new Set(gamePlayShotsAll.map(x => x.userId || ""))].length
                },
                totalCount: gamePlayShotsAll.length,
                totalPages: Math.ceil(parseFloat(gamePlayShotsAll.length) / pageSize)
            });

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->filterLotteryGamePlayByFields');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->filterLotteryGamePlayByFields", JSON.stringify({ userId: req.user?._id, lotteryGameType, gameNumber, pageNumber, pageSize, searchBy, searchText }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


const getLotteryResults = async (userPlayShots, type) =>
    new Promise(async (resolve, reject) => {
        const list = [];
        await Promise.all(
            userPlayShots.map(async playShot => {
                let lotteryResult = await LotteryGameResultSummery.findOne({ gameNumber: playShot.gameNumber, lotteryGameType: type }) || {};
                let winnersList = lotteryResult._id ? lotteryResult?.winners?.details : [];
                let me = (winnersList.filter(x => x.ticketNumber.toString() === playShot.ticketNumber.toString())[0]) || {};
                let resultObj = {
                    playShot: playShot,
                    gameResult: lotteryResult._id ? lotteryResult?.result : null,
                    myResult: { isWinner: me._id ? true : false, finalWinningAmount: me._id ? me.finalWinningAmount : 0, grossWinningAmount: me._id ? me.grossWinningAmount : 0, commission: me._id ? (me.commission || 0) : 0, isPendingResult: lotteryResult._id ? false : true },
                };
                list.push(resultObj);
            }),
        );
        resolve(list);
    });


exports.getlotteryGamePlayShotsHistorybyUserID = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']	
    // #swagger.summary = '(A) -> get lottery games played by user ID'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    const { pageNumber = 1, pageSize = 10 } = req.query;
    const userId = req.user?._id || '';
    try {
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }
        let itemsWithLimit = [];
        let items = await LotteryGamePlay.find({ userId: userId, lotteryGameType: type }, '_id')
            .sort('-played_at')
            .exec();

        if (pageNumber && pageSize) {
            let pageNumVal = Number(pageNumber || "") || 1;
            let pageSizeVal = Number(pageSize || "") || 1;
            itemsWithLimit = await LotteryGamePlay.find({ userId: userId, lotteryGameType: type })
                .sort('-played_at')
                .skip((pageNumVal - 1) * pageSizeVal)
                .limit(pageSizeVal)
                .exec();
        }

        let listToReturn = (pageNumber && pageSize) ? itemsWithLimit : items;

        let returnList = await getLotteryResults(listToReturn, type);

        return res.status(200).json({
            success: true,
            lotteryGamePlayHistory: returnList,
            totalCount: items.length,
            totalPages: Math.ceil(parseFloat(items.length) / pageSize)
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->getlotteryGamePlayShotsHistorybyUserID');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->getlotteryGamePlayShotsHistorybyUserID", JSON.stringify({ userId: req.user?._id, type, pageNumber, pageSize }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getLotteryGamePlayShotsHistorybyGameNumber = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']
    // #swagger.summary = '(C) -> get user lottery playshots by game number'
    let gameNumber = req.params.gameNumber || 0;
    let type = Number(req.params.lotteryGameType || 0) || 0;
    try {
        if (gameNumber === 0) {
            return res.status(400).json({ success: false, message: "gameNumber is required" });
        }
        if (type === 0) {
            return res.status(400).json({ success: false, message: "lotteryGameType is required" });
        }

        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let gamePlayShots = await LotteryGamePlay.find({ gameNumber: gameNumber, lotteryGameType: type })
            .sort('-played_at')
            .populate("userId", populateFields)
            .exec();

        let results = [];
        gamePlayShots.forEach(function (play) {
            play.numbers.forEach(function (num) {
                let obj = {
                    _id: play._id,
                    lotteryGameType: play.lotteryGameType,
                    gameNumber: play.gameNumber,
                    ticketNumber: play.ticketNumber,
                    userId: play.userId,
                    playingGameType: play.playingGameType,
                    isOriginalTicket: play.isOriginalTicket,
                    number: num.number,
                    straight: num.straight,
                    rumble: num.rumble,
                    played_at: play.played_at
                };
                results.push(obj);
            });
        });
        return res.status(200).json({
            success: true,
            gamePlayShots: _.orderBy(results, 'played_at', 'desc')
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->getLotteryGamePlayShotsHistorybyGameNumber');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->getLotteryGamePlayShotsHistorybyGameNumber", JSON.stringify({ userId: req.user?._id, type, gameNumber }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.playLotteryGame = async function (req, res, next) {
    // #swagger.tags = ['LotteryGamePlay']	
    // #swagger.summary = '(A) -> Play lottery game'
    let type = Number(req.params.lotteryGameType || 0) || 0;
    if (type === 0) {
        return res.status(400).json({ success: false, message: "lotteryGameType is required" });
    }
    const userId = req.user?._id || '';
    const { playingGameType, gameNumber, numbers, playedAmount, isOriginalTicket } = req.body;
    try {
        await body('playingGameType', "playingGameType is required").notEmpty().run(req);
        await body('numbers', "numbers is required").notEmpty().run(req);
        await body('gameNumber', "gameNumber is required").isLength({ min: 3 }).notEmpty().run(req);
        await body('playedAmount', "playedAmount is required").notEmpty().run(req);
        await body('isOriginalTicket', "isOriginalTicket is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSettings = await commonDbFuncs.getGameSettings();
            let lotteryGameSetting = await LotteryGameSetting.findOne({ lotteryGameType: type }) || {};
            if (!lotteryGameSetting._id) {
                return res.status(400).json({ success: false, message: "Lottery Game Settings not initialized yet" });
            }

            let lotteryGamePermission = await LotteryGamePermission.findOne({ lotteryGameType: type }) || {};
            if (!lotteryGamePermission._id) {
                return res.status(400).json({ success: false, message: "Lottery Game Permissions not initialized yet" });
            }

            if (!lotteryGamePermission.isAvailableSingleDigitGame && playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_3UPSingle || playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_2UPSingle || playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_2DNSingle) {
                return res.status(400).json({ success: false, message: "The Game that you have played is currently unavailable" });
            }
            if (!lotteryGamePermission.isAvailableGameTotal && playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_3UPTOTAL || playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_2UPTOTAL || playingGameType === constants.LOTTERY_GAME_PLAY_TYPE_2DNTOTAL) {
                return res.status(400).json({ success: false, message: "The Game that you have played is currently unavailable" });
            }
            if (playedAmount < lotteryGameSetting.minimumAmountForPlay) {
                return res.status(400).json({ success: false, message: "The minimum amount to play is " + lotteryGameSetting.minimumAmountForPlay });
            }

            if (!lotteryGamePermission.canPlayLotteryGame || !lotteryGamePermission.isAvailableLotteryGame || !gameSettings.isAvailableGames) {
                return res.status(400).json({ success: false, lotteryGameStatus: lotteryGamePermission, message: "Lottery Game is currently Unavailable." });
            }

            // lotterygametype specific code to be written
            let lotteryGameParserObj = jsFuncs.parseLotteryGameNumber(gameNumber);
            let currDateTimeObj = jsFuncs.getCurrentTime();
            const gameStopTime = lotteryGameSetting.gameStopHour || "0:0";
            if ((currDateTimeObj.dayOfMonth === lotteryGameParserObj.dayOfMonth) && (Number(gameStopTime.split(":")[0] || 0) < currDateTimeObj.hour || (Number(gameStopTime.split(":")[0] || 0) === currDateTimeObj.hour && Number(gameStopTime.split(":")[1] || 0) < currDateTimeObj.mins))) {
                return res.status(400).json({ success: false, lotteryGameStatus: false, message: "Lottery Game is currently Unavailable." });
            }

            let playedUser = await User.findById(userId);

            if (Boolean(playedUser)) {
                if (playedUser.blockedByAdmin) {
                    return res.status(400).json({ success: false, message: "Your account is blocked by Admin." });
                }

                let gameDiscounts = jsFuncs.calculateLotteryGameDiscounts(playedUser.allowedSpecialDiscount || false, type, playedAmount, playingGameType, lotteryGameSetting, lotteryGamePermission, currDateTimeObj, lotteryGameParserObj);
                let totalDiscount = gameDiscounts.discount || 0;
                let totalPaidAmount = playedAmount - totalDiscount;

                if (parseFloat(playedUser.availableAmount) < parseFloat(totalPaidAmount)) {
                    return res.status(400).json({ success: false, message: "You don't have sufficient balance to play a game." });
                }

                const newLotteryPlay = new LotteryGamePlay({
                    lotteryGameType: type,
                    userId: userId,
                    numbers: numbers,
                    playingGameType: playingGameType,
                    isOriginalTicket: isOriginalTicket || false,
                    playedAmount: playedAmount,
                    discount: totalDiscount,
                    paidAmount: totalPaidAmount,
                    gameNumber: gameNumber,
                    played_at: moment.now(),
                    ticketNumber: jsFuncs.getLotteryTicketNumber(type)
                });
                const referralBonus = (totalPaidAmount * ((gameSettings.bonusAmountByReferralPlayInPercent || 0) / 100));

                let savedLotteryPlayShot = await newLotteryPlay.save();
                if (Boolean(savedLotteryPlayShot)) {
                    let referralUser = await User.findOne({ appId: playedUser.referredBy });
                    if (Boolean(referralUser)) {
                        if (Number(referralBonus).toFixed(2) > 0.00 && (referralUser.userRole === 3 || referralUser.userRole === 4) && referralUser.appId !== "1411851985") {
                            let updatedReferralUser = await User.findByIdAndUpdate(referralUser._id, { $inc: { availableAmount: referralBonus } }, { upsert: false, new: true, select: "_id" });
                            if (Boolean(updatedReferralUser)) {
                                //log referral user bonus
                                if (referralBonus > 0) {
                                    commonDbFuncs.createDbHistory('availableAmount', `+${Number(referralBonus).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, referralUser._id, userId, "bonus on your friend play");
                                }

                                let amountUpdate = {
                                    $inc: {
                                        availableAmount: -totalPaidAmount
                                    }
                                }
                                let updatedPlayedUser = await User.findByIdAndUpdate(userId, amountUpdate, { upsert: false, new: true, select: "_id availableAmount" });
                                if (Boolean(updatedPlayedUser)) {
                                    //log played user amount
                                    if (totalPaidAmount > 0) {
                                        commonDbFuncs.createDbHistory('availableAmount', `-${Number(totalPaidAmount).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, userId, "Played Lottery Game with Ticket Number " + savedLotteryPlayShot.ticketNumber);
                                    }

                                    return res.status(200).json({
                                        success: true,
                                        updatedAmount: updatedPlayedUser.availableAmount,
                                        userId: updatedPlayedUser._id,
                                        savedLotteryPlayShot: savedLotteryPlayShot,
                                        message: "Your play is confirmed."
                                    });

                                }
                                else {
                                    return res.status(400).json({ success: false, message: 'Failed to update Item 1' })
                                }
                            }
                            else {
                                return res.status(400).json({ success: false, message: 'Failed to update Item 2' })
                            }
                        }
                        else {
                            let amountUpdate = {
                                $inc: {
                                    availableAmount: -totalPaidAmount
                                }
                            }
                            let updatedPlayedUser = await User.findByIdAndUpdate(userId, amountUpdate, { upsert: false, new: true, select: "_id availableAmount" });
                            if (Boolean(updatedPlayedUser)) {
                                if (totalPaidAmount > 0) {
                                    commonDbFuncs.createDbHistory('availableAmount', `-${Number(totalPaidAmount).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, userId, "Played Lottery Game with Ticket Number " + savedLotteryPlayShot.ticketNumber);
                                }
                                return res.status(200).json({
                                    success: true,
                                    updatedAmount: updatedPlayedUser.availableAmount,
                                    userId: updatedPlayedUser._id,
                                    savedLotteryPlayShot: savedLotteryPlayShot,
                                    message: "Your play is confirmed."
                                });
                            }
                            else {
                                return res.status(400).json({ success: false, message: 'Failed to update Item 3' })
                            }
                        }
                    }
                    else {
                        let amountUpdate = {
                            $inc: {
                                availableAmount: -totalPaidAmount
                            }
                        }
                        let updatedPlayedUser = await User.findByIdAndUpdate(userId, amountUpdate, { upsert: false, new: true, select: "_id availableAmount" });
                        if (Boolean(updatedPlayedUser)) {
                            //log played user amount
                            if (totalPaidAmount > 0) {
                                commonDbFuncs.createDbHistory('availableAmount', `-${Number(totalPaidAmount).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, userId, userId, "Played Lottery Game with Ticket Number " + savedLotteryPlayShot.ticketNumber);
                            }
                            return res.status(200).json({
                                success: true,
                                updatedAmount: updatedPlayedUser.availableAmount,
                                userId: updatedPlayedUser._id,
                                savedLotteryPlayShot: savedLotteryPlayShot,
                                message: "Your play is confirmed."
                            });
                        }
                        else {
                            return res.status(400).json({ success: false, message: 'Failed to update Item 4' })
                        }
                    }
                }
                else {
                    return res.status(400).json({ success: false, message: "Failed to save Item 5" });
                }

            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist." })
            }



        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in lotteryGamePlayController->playLotteryGame');
        commonDbFuncs.createApplicationLog(req.user?._id, "lotteryGamePlayController->playLotteryGame", JSON.stringify({ userId: req.user?._id, type, playingGameType, gameNumber, numbers, playedAmount, isOriginalTicket }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
