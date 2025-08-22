var _ = require('lodash');
var moment = require('moment');
const Recharge = require('../models/recharge');
const DbHistory = require('../models/dbHistory');
const User = require('../models/user');
const Offer = require('../models/offer');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
var constants = require('../config/constants');



exports.getAllRecharges = async function (req, res, next) {
    // #swagger.tags = ['Recharge']
    // #swagger.summary = '(C) -> get all recharges'
    try {
        let recharges = await Recharge.find({});
        let historyList = [];
        recharges.forEach(function (recharge) {
            let obj = {
                _id: recharge._id,
                comments: recharge.comments,
                userId: recharge.userId,
                rechargeAmount: recharge.rechargeAmount,
                paymentInfo: recharge.paymentInfo,
                referenceNumber: recharge.referenceNumber,
                paymentMethod: recharge.paymentMethod,
                phoneNumber: recharge.phoneNumber,
                image: recharge.image,
                createdDateTime: recharge.createdDateTime,
                updatedDateTime: recharge.updatedDateTime,
                status: recharge.status,
                isCompleted: recharge.isCompleted,
                statusUpdatedDateTime: recharge.statusUpdatedDateTime,
                txnType: 'R'
            };
            historyList.push(obj);
        });
        return res.status(200).json({ success: true, rechargesList: _.orderBy(historyList, 'createdDateTime', 'desc') });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in rechargeController->getAllRecharges');
        commonDbFuncs.createApplicationLog(req.user?._id, "rechargeController->getAllRecharges", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getRechargesByUserId = async function (req, res, next) {
    // #swagger.tags = ['Recharge']
    // #swagger.summary = '(A) -> get recharges by user ID'
    try {
        const userId = req.user?._id || '';
        let recharges = await Recharge.find({ userId: userId });
        let historyList = [];
        recharges.forEach(function (recharge) {
            let obj = {
                _id: recharge._id,
                comments: recharge.comments,
                userId: recharge.userId,
                rechargeAmount: recharge.rechargeAmount,
                paymentInfo: recharge.paymentInfo,
                referenceNumber: recharge.referenceNumber,
                paymentMethod: recharge.paymentMethod,
                phoneNumber: recharge.phoneNumber,
                image: recharge.image,
                createdDateTime: recharge.createdDateTime,
                updatedDateTime: recharge.updatedDateTime,
                status: recharge.status,
                isCompleted: recharge.isCompleted,
                statusUpdatedDateTime: recharge.statusUpdatedDateTime,
                txnType: 'R'
            };
            historyList.push(obj);
        });
        return res.status(200).json({ success: true, userRecharges: _.orderBy(historyList, 'createdDateTime', 'desc') });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in rechargeController->getRechargesByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "rechargeController->getRechargesByUserId", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getRechargeListDoneByAgentOrAdmin = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(N) -> get recharge list done by agent or admins'
    let agentUserId = req.params.userId || '';
    let loggedInUserId = req.user?._id || '';
    const { pageNumber = 1, pageSize = 10 } = req.query;
    try {
        if (agentUserId === "") {
            return res.status(400).json({ success: false, message: "userId is required" });
        }
        let loggedInUser = await User.findById(loggedInUserId);
        if (Boolean(loggedInUser)) {
            let agentUser = await User.findById(agentUserId);
            if (Boolean(agentUser)) {
                const canAccess = ((loggedInUser.userRole === 1) || (loggedInUser.userRole === 2 && (agentUser.userRole === 2 || agentUser.userRole === 4)) || ((loggedInUser.userRole === 4 || loggedInUser.userRole === 5) && loggedInUser._id.equals(agentUser._id)));
                if (canAccess) {
                    let itemsWithLimit = [];
                    let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime userRole";
                    let findObj = {
                        updateType: constants.DBUPDATE_TYPE_MONEY,
                        fieldName: 'availableAmount',
                        updatedBy: agentUserId
                    };

                    let items = await DbHistory.find(findObj, '_id')
                        .sort('-createdDateTime')
                        .exec();

                    if (pageNumber && pageSize) {
                        let pageNumVal = Number(pageNumber || "") || 1;
                        let pageSizeVal = Number(pageSize || "") || 1;
                        itemsWithLimit = await DbHistory.find(findObj)
                            .sort('-createdDateTime')
                            .populate("updatedFor", populateFields)
                            .populate("updatedBy", populateFields)
                            .skip((pageNumVal - 1) * pageSizeVal)
                            .limit(pageSizeVal)
                            .exec();
                    }

                    let final_items = items.filter(x => !x.updatedBy?.equals(x.updatedFor?._id));
                    let listToReturn = (pageNumber && pageSize) ? itemsWithLimit.filter(x => !x.updatedBy.equals(x.updatedFor?._id)) : final_items;

                    return res.status(200).json({
                        success: true,
                        rechargeList: listToReturn,
                        totalCount: final_items.length,
                        totalPages: Math.ceil(parseFloat(final_items.length) / pageSize)
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "Sorry, you don't have permission." });
                }
            }
            else {
                return res.status(400).json({ success: false, message: 'User does not exist' });
            }
        }
        else {
            return res.status(400).json({ success: false, message: 'User does not exist' });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in rechargeController->getRechargeListDoneByAgentOrAdmin');
        commonDbFuncs.createApplicationLog(req.user?._id, "rechargeController->getRechargeListDoneByAgentOrAdmin", JSON.stringify({ userId: req.user?._id, agentUserId, loggedInUserId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.newRechargeRequest = async function (req, res, next) {
    // #swagger.tags = ['Recharge']
    // #swagger.summary = '(A) -> request new recharge'
    const userId = req.user?._id || '';
    const { rechargeAmount, referenceNumber, paymentMethod, phoneNumber, imageURL } = req.body;
    try {
        await body('rechargeAmount', "rechargeAmount is required").notEmpty().run(req);
        await body('referenceNumber', "referenceNumber is invalid").notEmpty().isLength({ min: 12, max:12 }).run(req);
        await body('paymentMethod', "paymentMethod is required").notEmpty().run(req);
        await body('phoneNumber', "phoneNumber is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSettings = await commonDbFuncs.getGameSettings();

            let existingRefDetails = await Recharge.find({
                referenceNumber: referenceNumber,
                $or: [{ 'status': constants.PAYMENT_STATUS_TYPE_A }, { 'status': constants.PAYMENT_STATUS_TYPE_P }]
            });
            if (existingRefDetails.length > 0) {
                return res.status(400).json({ success: false, message: "Incorrect details or duplicate Txn ID, please double check your referenceId/TxnID" });
            }

            if (parseFloat(rechargeAmount) < parseFloat(gameSettings.minimumRecharge)) {
                return res.status(400).json({ success: false, message: "Minimum Recharge amount is " + gameSettings.minimumRecharge });
            }
            if (parseFloat(rechargeAmount) > parseFloat(gameSettings.maximumRecharge)) {
                return res.status(400).json({ success: false, message: "Maximum Recharge amount is " + gameSettings.maximumRecharge });
            }

            let pInfo = {};
            switch (paymentMethod) {
                case constants.PAYMENT_TYPE_UPI: {
                    pInfo = { upiId: gameSettings.upiId }
                    break;
                }
                case constants.PAYMENT_TYPE_BANK: {
                    pInfo = { accountNumber: gameSettings.bankAcNumber, accountHolderName: gameSettings.bankAcHolderName, ifscCode: gameSettings.bankIfscCode }
                    break;
                }
                case constants.PAYMENT_TYPE_WesternUnion: {
                    pInfo = { sendingMoneyTo: gameSettings.sendingMoneyTo }
                    break;
                }
                case constants.PAYMENT_TYPE_STCPay: {
                    pInfo = { stcPayId: gameSettings.stcPayId, stcPayName: gameSettings.stcPayName }
                    break;
                }
                case constants.PAYMENT_TYPE_NCB: {
                    pInfo = { ncbAccountNumber: gameSettings.ncbAccountNumber, ncbAccountName: gameSettings.ncbAccountName }
                    break;
                }
                case constants.PAYMENT_TYPE_AlRajhiBank: {
                    pInfo = { alRajhiAccountNumber: gameSettings.alRajhiAccountNumber, alRajhiAccountName: gameSettings.alRajhiAccountName }
                    break;
                }
                default: break;
            }

            const recharge = new Recharge({
                userId: userId,
                rechargeAmount: rechargeAmount,
                referenceNumber: referenceNumber,
                paymentMethod: paymentMethod,
                paymentInfo: pInfo,
                phoneNumber: phoneNumber,
                imageURL: imageURL || ""
            });

            let savedRecharge = await recharge.save();
            if (Boolean(savedRecharge)) {
                let obj = {
                    _id: savedRecharge._id,
                    comments: savedRecharge.comments,
                    userId: savedRecharge.userId,
                    rechargeAmount: savedRecharge.rechargeAmount,
                    paymentInfo: savedRecharge.paymentInfo,
                    referenceNumber: savedRecharge.referenceNumber,
                    paymentMethod: savedRecharge.paymentMethod,
                    phoneNumber: savedRecharge.phoneNumber,
                    image: savedRecharge.image,
                    createdDateTime: savedRecharge.createdDateTime,
                    updatedDateTime: savedRecharge.updatedDateTime,
                    status: savedRecharge.status,
                    isCompleted: savedRecharge.isCompleted,
                    statusUpdatedDateTime: savedRecharge.statusUpdatedDateTime,
                    txnType: 'R'
                };
                return res.status(200).json({
                    success: true,
                    newRecharge: obj
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in rechargeController->newRechargeRequest');
        commonDbFuncs.createApplicationLog(req.user?._id, "rechargeController->newRechargeRequest", JSON.stringify({ userId: req.user?._id, rechargeAmount, referenceNumber, paymentMethod, phoneNumber, imageURL }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateRechargeStatus = async function (req, res, next) {
    // #swagger.tags = ['Recharge']
    // #swagger.summary = '(C) -> update recharge status'
    const rechargedBy = req.user?._id || '';
    const { rechargeId, comments, status } = req.body;
    try {
        await body('rechargeId', "rechargeId is required").notEmpty().run(req);
        await body('status', "status is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSettings = await commonDbFuncs.getGameSettings();
            let rechargeOffers = await Offer.find({ type: constants.OFFER_TYPE_RECHARGE_BONUS });
            let rechargeDetails = await Recharge.findById(rechargeId);
            let reviewdUser = await User.findById(rechargedBy);
            if (rechargeDetails.isCompleted)
                return res.status(400).json({ success: false, message: "Recharge is already completed for this ID." })
            if (status === constants.PAYMENT_STATUS_TYPE_A && (reviewdUser.userRole === 2 || reviewdUser.userRole === 5) && parseFloat(reviewdUser.availableAmount) < parseFloat(rechargeDetails.rechargeAmount))
                return res.status(400).json({ success: false, message: "You don't have sufficient balance to recharge." });

            let flag = status === constants.PAYMENT_STATUS_TYPE_A || status === constants.PAYMENT_STATUS_TYPE_D;
            let objRecharge = {
                rechargedBy: rechargedBy,
                status: status,
                isCompleted: flag,
                comments: comments,
                updatedDateTime: moment.now(),
            }
            if (flag) objRecharge.statusUpdatedDateTime = moment.now();

            let updatedRecharge = await Recharge.findByIdAndUpdate(rechargeId, objRecharge, { upsert: false, new: true });
            if (Boolean(updatedRecharge)) {
                if (status === constants.PAYMENT_STATUS_TYPE_A) {
                    const isMatched = rechargeOffers.map(x => Number(x.targetValue)).includes(Number(rechargeDetails.rechargeAmount));
                    let offerDetails = (rechargeOffers.filter(x => Number(x.targetValue) === Number(rechargeDetails.rechargeAmount))[0]) || {};
                    let amountUpdate = {
                        $inc: {
                            availableAmount: (isMatched && offerDetails._id) ? (Number(rechargeDetails.rechargeAmount) + Number(offerDetails.bonusValue)) : Number(rechargeDetails.rechargeAmount)
                        }
                    }

                    let updatedUser = await User.findByIdAndUpdate(rechargeDetails.userId, amountUpdate, { upsert: false, new: true });
                    if (Boolean(updatedUser)) {
                        commonDbFuncs.createDbHistory('availableAmount', `+${rechargeDetails.rechargeAmount}`, 'User', constants.DBUPDATE_TYPE_MONEY, rechargeDetails.userId, rechargedBy, "Recharge - " + rechargeDetails.paymentMethod + " - " + rechargeDetails.referenceNumber);
                        if (isMatched && offerDetails._id) {
                            commonDbFuncs.createDbHistory('availableAmount', `+${Number(offerDetails.bonusValue).toFixed(2)}`, 'User', constants.DBUPDATE_TYPE_MONEY, rechargeDetails.userId, rechargedBy, "Extra bonus on Recharge of " + rechargeDetails.rechargeAmount);
                        }
                        let obj = {
                            _id: updatedRecharge._id,
                            comments: updatedRecharge.comments,
                            userId: updatedRecharge.userId,
                            rechargeAmount: updatedRecharge.rechargeAmount,
                            paymentInfo: updatedRecharge.paymentInfo,
                            referenceNumber: updatedRecharge.referenceNumber,
                            paymentMethod: updatedRecharge.paymentMethod,
                            phoneNumber: updatedRecharge.phoneNumber,
                            image: updatedRecharge.image,
                            createdDateTime: updatedRecharge.createdDateTime,
                            updatedDateTime: updatedRecharge.updatedDateTime,
                            status: updatedRecharge.status,
                            isCompleted: updatedRecharge.isCompleted,
                            statusUpdatedDateTime: updatedRecharge.statusUpdatedDateTime,
                            txnType: 'R'
                        };
                        return res.status(200).json({
                            success: true,
                            updatedRecharge: obj
                        });
                    }
                    else {
                        return res.status(400).json({ success: false, message: "User doesn't exist to update balance." })
                    }
                }
                else {
                    let obj = {
                        _id: updatedRecharge._id,
                        comments: updatedRecharge.comments,
                        userId: updatedRecharge.userId,
                        rechargeAmount: updatedRecharge.rechargeAmount,
                        paymentInfo: updatedRecharge.paymentInfo,
                        referenceNumber: updatedRecharge.referenceNumber,
                        paymentMethod: updatedRecharge.paymentMethod,
                        phoneNumber: updatedRecharge.phoneNumber,
                        image: updatedRecharge.image,
                        createdDateTime: updatedRecharge.createdDateTime,
                        updatedDateTime: updatedRecharge.updatedDateTime,
                        status: updatedRecharge.status,
                        isCompleted: updatedRecharge.isCompleted,
                        statusUpdatedDateTime: updatedRecharge.statusUpdatedDateTime,
                        txnType: 'R'
                    };
                    return res.status(200).json({
                        success: true,
                        updatedRecharge: obj
                    });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in rechargeController->updateRechargeStatus');
        commonDbFuncs.createApplicationLog(req.user?._id, "rechargeController->updateRechargeStatus", JSON.stringify({ userId: req.user?._id, rechargedBy, rechargeId, comments, status }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}

