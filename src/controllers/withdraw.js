const config = require('../../config');
var _ = require('lodash');
var moment = require('moment');
const Withdraw = require('../models/withdraw');
const User = require('../models/user');
const BankCard = require('../models/bankCard');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
var constants = require('../config/constants');


exports.getAllWithdraws = async function (req, res, next) {
    // #swagger.tags = ['Withdraw']	
    // #swagger.summary = '(C) -> get all withdraws'
    try {
        let withdraws = await Withdraw.find({});
        let historyList = [];
        withdraws.forEach(function (withdraw) {
            let obj = {
                _id: withdraw._id,
                comments: withdraw.comments,
                userId: withdraw.userId,
                withdrawTo: withdraw.withdrawTo,
                paymentInfo: withdraw.paymentInfo,
                withdrawAmount: withdraw.withdrawAmount,
                processedAmount: withdraw.processedAmount,
                referenceNumber: withdraw.referenceNumber,
                paymentMethod: withdraw.paymentMethod,
                phoneNumber: withdraw.phoneNumber,
                sendTo: withdraw.sendTo,
                image: withdraw.image,
                createdDateTime: withdraw.createdDateTime,
                updatedDateTime: withdraw.updatedDateTime,
                status: withdraw.status,
                isCompleted: withdraw.isCompleted,
                statusUpdatedDateTime: withdraw.statusUpdatedDateTime,
                txnType: 'W'
            };
            historyList.push(obj);
        });
        return res.status(200).json({ success: true, withdrawsList: _.orderBy(historyList, 'createdDateTime', 'desc') });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in withdrawController->getAllWithdraws');
        commonDbFuncs.createApplicationLog(req.user?._id, "withdrawController->getAllWithdraws", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getWithdrawsByUserId = async function (req, res, next) {
    // #swagger.tags = ['Withdraw']	
    // #swagger.summary = '(A) -> get all withdraws list by user ID'
    try {
        const userId = req.user?._id || '';
        let withdraws = await Withdraw.find({ userId: userId });
        let historyList = [];
        withdraws.forEach(function (withdraw) {
            let obj = {
                _id: withdraw._id,
                comments: withdraw.comments,
                userId: withdraw.userId,
                withdrawTo: withdraw.withdrawTo,
                paymentInfo: withdraw.paymentInfo,
                withdrawAmount: withdraw.withdrawAmount,
                processedAmount: withdraw.processedAmount,
                referenceNumber: withdraw.referenceNumber,
                paymentMethod: withdraw.paymentMethod,
                phoneNumber: withdraw.phoneNumber,
                sendTo: withdraw.sendTo,
                image: withdraw.image,
                createdDateTime: withdraw.createdDateTime,
                updatedDateTime: withdraw.updatedDateTime,
                status: withdraw.status,
                isCompleted: withdraw.isCompleted,
                statusUpdatedDateTime: withdraw.statusUpdatedDateTime,
                txnType: 'W'
            };
            historyList.push(obj);
        });
        return res.status(200).json({ success: true, userWithdraws: _.orderBy(historyList, 'createdDateTime', 'desc') });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in withdrawController->getWithdrawsByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "withdrawController->getWithdrawsByUserId", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.newWithdrawRequest = async function (req, res, next) {
    // #swagger.tags = ['Withdraw']	
    // #swagger.summary = '(A) -> request withdraw'
    const userId = req.user?._id || '';
    const { withdrawAmount, bankCardId } = req.body;
    try {
        await body('withdrawAmount', "withdrawAmount is required").notEmpty().run(req);
        await body('bankCardId', "bankCardId is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let bankCardInfo = await BankCard.findById(bankCardId);
            let gameSettings = await commonDbFuncs.getGameSettings();
            if (parseFloat(withdrawAmount) < parseFloat(gameSettings.minimumWithdraw)) {
                return res.status(400).json({ success: false, message: "Minimum withdraw amount is " + gameSettings.minimumWithdraw });
            }
            if (parseFloat(withdrawAmount) > parseFloat(gameSettings.maximumWithdraw)) {
                return res.status(400).json({ success: false, message: "maximum withdraw amount is " + gameSettings.maximumWithdraw });
            }

            let wlist = await Withdraw.find({ status: constants.PAYMENT_STATUS_TYPE_P, userId: userId });

            if (wlist.length > 0) {
                return res.status(400).json({ success: false, message: "Your previous withdraw request is still in pending." });
            }

            let user = await User.findById(userId);

            if (parseFloat(user.availableAmount) < parseFloat(withdrawAmount)) {
                return res.status(400).json({ success: false, message: "Your available amount is only " + user.availableAmount });
            }

            let txnFee = gameSettings.transactionFeeInPercent ? (withdrawAmount * (gameSettings.transactionFeeInPercent / 100)) : 0;
            const withdraw = new Withdraw({
                userId: userId,
                withdrawAmount: withdrawAmount,
                processedAmount: Math.floor((withdrawAmount - txnFee) || 0),
                withdrawTo: bankCardId,
                paymentInfo: bankCardInfo
            });

            let savedWithdraw = await withdraw.save();
            if (Boolean(savedWithdraw)) {
                let obj = {
                    _id: savedWithdraw._id,
                    comments: savedWithdraw.comments,
                    userId: savedWithdraw.userId,
                    withdrawTo: savedWithdraw.withdrawTo,
                    paymentInfo: savedWithdraw.paymentInfo,
                    withdrawAmount: savedWithdraw.withdrawAmount,
                    processedAmount: savedWithdraw.processedAmount,
                    referenceNumber: savedWithdraw.referenceNumber,
                    paymentMethod: savedWithdraw.paymentMethod,
                    phoneNumber: savedWithdraw.phoneNumber,
                    sendTo: savedWithdraw.sendTo,
                    image: savedWithdraw.image,
                    createdDateTime: savedWithdraw.createdDateTime,
                    updatedDateTime: savedWithdraw.updatedDateTime,
                    status: savedWithdraw.status,
                    isCompleted: savedWithdraw.isCompleted,
                    statusUpdatedDateTime: savedWithdraw.statusUpdatedDateTime,
                    txnType: 'W'
                };
                return res.status(200).json({
                    success: true,
                    newWithdraw: obj
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in withdrawController->newWithdrawRequest');
        commonDbFuncs.createApplicationLog(req.user?._id, "withdrawController->newWithdrawRequest", JSON.stringify({ userId: req.user?._id, withdrawAmount, bankCardId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateWithdrawStatus = async function (req, res, next) {
    // #swagger.tags = ['Withdraw']	
    // #swagger.summary = '(C) -> update withdraw status'
    const updatedBy = req.user?._id || '';
    const { withdrawId, referenceNumber, comments, imageURL, status } = req.body;
    try {
        await body('withdrawId', "withdrawId is required").notEmpty().run(req);
        await body('referenceNumber', "referenceNumber is required").notEmpty().run(req);
        await body('status', "status is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let withdrawDetails = await Withdraw.findById(withdrawId);
            if (withdrawDetails.isCompleted) {
                return res.status(400).json({ success: false, message: "Withdraw is already completed for this ID." });
            }

            let withDrawUser = await User.findById(withdrawDetails.userId);

            if (status === constants.PAYMENT_STATUS_TYPE_A && parseFloat(withDrawUser.availableAmount) < parseFloat(withdrawDetails.withdrawAmount)) {
                return res.status(400).json({ success: false, message: "Can't approve Withdraw as user available amount is less than requested amount." });
            }

            let flag = status === constants.PAYMENT_STATUS_TYPE_A || status === constants.PAYMENT_STATUS_TYPE_D;
            let objWithdraw = {
                status: status,
                isCompleted: flag,
                updatedBy: updatedBy,
                referenceNumber: referenceNumber,
                comments: comments,
                imageURL: imageURL || "",
                updatedDateTime: moment.now()
            }
            if (flag) objWithdraw.statusUpdatedDateTime = moment.now();

            let updatedWithdraw = await Withdraw.findByIdAndUpdate(withdrawId, objWithdraw, { upsert: false, new: true });
            if (status === constants.PAYMENT_STATUS_TYPE_A) {
                let amountUpdate = {
                    $inc: {
                        availableAmount: -withdrawDetails.withdrawAmount
                    }
                }
                let updatedUser = await User.findByIdAndUpdate(withdrawDetails.userId, amountUpdate, { upsert: false, new: true });
                if (Boolean(updatedUser)) {
                    commonDbFuncs.createDbHistory('availableAmount', `-${withdrawDetails.withdrawAmount}`, 'User', constants.DBUPDATE_TYPE_MONEY, withdrawDetails.userId, updatedBy, 'Withdraw - ' + updatedWithdraw.referenceNumber + ' - ' + updatedWithdraw.processedAmount);
                    let obj = {
                        _id: updatedWithdraw._id,
                        comments: updatedWithdraw.comments,
                        userId: updatedWithdraw.userId,
                        withdrawTo: updatedWithdraw.withdrawTo,
                        paymentInfo: updatedWithdraw.paymentInfo,
                        withdrawAmount: updatedWithdraw.withdrawAmount,
                        processedAmount: updatedWithdraw.processedAmount,
                        referenceNumber: updatedWithdraw.referenceNumber,
                        paymentMethod: updatedWithdraw.paymentMethod,
                        phoneNumber: updatedWithdraw.phoneNumber,
                        sendTo: updatedWithdraw.sendTo,
                        image: updatedWithdraw.image,
                        createdDateTime: updatedWithdraw.createdDateTime,
                        updatedDateTime: updatedWithdraw.updatedDateTime,
                        status: updatedWithdraw.status,
                        isCompleted: updatedWithdraw.isCompleted,
                        statusUpdatedDateTime: updatedWithdraw.statusUpdatedDateTime,
                        txnType: 'W'
                    };
                    return res.status(200).json({
                        success: true,
                        updatedWithdraw: obj,
                        withdrawFor: updatedUser
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: "User doesn't exist to update balance." })
                }
            }
            else {
                return res.status(200).json({
                    success: true,
                    updatedWithdraw: updatedWithdraw,
                    withdrawFor: null
                });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in withdrawController->updateWithdrawStatus');
        commonDbFuncs.createApplicationLog(req.user?._id, "withdrawController->updateWithdrawStatus", JSON.stringify({ userId: req.user?._id, updatedBy, withdrawId, referenceNumber, comments, imageURL, status }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
