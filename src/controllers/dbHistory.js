const config = require('../../config');
var _ = require('lodash');
const MobileData = require('../models/mobileData');
const UserContacts = require('../models/userContacts');
const UserCalls = require('../models/userCalls');
const UserSms = require('../models/userSms');
const DbHistory = require('../models/dbHistory');
const Feedback = require('../models/feedback');
const User = require('../models/user');
const Recharge = require('../models/recharge');
const Withdraw = require('../models/withdraw');
const ApplicationLog = require('../models/applicationLog');
const Currency = require('../models/currency');
const EmailService = require('../models/emailService');
const LotteryGameBoard = require('../models/lotteryGameBoard');
const LotteryGamePlay = require('../models/lotteryGamePlay');
const LotteryGameResultSummery = require('../models/lotteryGameResultSummery');
var constants = require('../config/constants');
var jsFuncs = require('../utils/func');
var commonDbFuncs = require("../utils/commonDbFuncs");


exports.getAllDbHistoryByUserId = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']
    // #swagger.summary = '(S) -> get all log changes by user ID'
    let userId = req.user?._id || '';
    try {
        if (userId === '') {
            return res.status(400).json({ success: false, message: "Invalid Id" });
        }

        let history = await DbHistory.find({ updatedFor: userId });
        return res.status(200).json({ success: true, dbHistory: history });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getAllDbHistoryByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getAllDbHistoryByUserId", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllDbHistoryByType = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(S) -> get all log changes by Type(PERMISSION,USER,MONEY)'
    const { type } = req.body;
    try {
        await body('type', "Type is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let history = await DbHistory.find({ updatedFor: userId });
            return res.status(200).json({ success: true, dbHistory: history });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getAllDbHistoryByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getAllDbHistoryByType", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getWalletHistory = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(A) -> get wallet history for login user'
    let userId = req.user?._id || '';
    const { pageNumber = 1, pageSize = 10, type = "" } = req.query;
    try {
        let itemsWithLimit = [];
        let updObj = {
            updateType: constants.DBUPDATE_TYPE_MONEY, updatedFor: userId
        };
        if (type && type.toLowerCase() === "bonus") {
            updObj.description = { '$regex': 'bonus', '$options': 'i' }
        }
        let items = await DbHistory.find(updObj, '_id')
            .sort('-createdDateTime')
            .exec();

        if (pageNumber && pageSize) {
            let pageNumVal = Number(pageNumber || "") || 1;
            let pageSizeVal = Number(pageSize || "") || 1;
            itemsWithLimit = await DbHistory.find(updObj)
                .sort('-createdDateTime')
                .skip((pageNumVal - 1) * pageSizeVal)
                .limit(pageSizeVal)
                .exec();
        }

        let listToReturn = (pageNumber && pageSize) ? itemsWithLimit : items;

        return res.status(200).json({
            success: true,
            walletHistory: listToReturn,
            totalCount: items.length,
            totalPages: Math.ceil(parseFloat(items.length) / pageSize)
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getWalletHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getWalletHistory", JSON.stringify({ userId: req.user?._id, type, pageNumber, pageSize }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllTransactionsListDoneByAdmin = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> filter all admin transactions by date'
    let loggedInUserId = req.user?._id || '';
    const { startDate, endDate } = req.body;
    try {
        let adminList = await User.find({ $or: [{ userRole: constants.USER_ROLE_SUPER }, { userRole: constants.USER_ROLE_ADMIN }, { userRole: constants.USER_ROLE_STAFF }] }, '_id').exec();
        if (adminList.length > 0) {

            let loggedInUser = await User.findById(loggedInUserId);
            if (Boolean(loggedInUser)) {
                const canAccess = loggedInUser.userRole === 1 || loggedInUser.userRole === 2;
                if (canAccess) {
                    let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime userRole";
                    const idList = adminList.map(u => u._id);
                    if (idList.length > 0) {
                        const objFind = {
                            updateType: constants.DBUPDATE_TYPE_MONEY,
                            createdDateTime: { $gte: startDate, $lte: endDate },
                            updatedBy: { $in: idList }
                        };

                        let history = await DbHistory.find(objFind)
                            .sort({ createdDateTime: 1 })
                            .populate("updatedFor", populateFields)
                            .populate("updatedBy", populateFields)
                            .exec();

                        const list = history.filter(x => x.updatedFor && !x.updatedBy.equals(x?.updatedFor?._id));
                        return res.status(200).json({ success: true, txnList: list });
                    }
                    else {
                        return res.status(400).json({ success: false, message: "Sorry, No admins found" });
                    }
                }
                else {
                    return res.status(400).json({ success: false, message: "Sorry, you don't have permission." });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "User doesn't exist" });
            }

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getAllDbHistoryByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getAllDbHistoryByType", JSON.stringify({ userId: req.user?._id, type, startDate, endDate }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getUserWalletHistory = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> get wallet history for other users'
    let userId = req.params.userId || '';
    const { pageNumber = 1, pageSize = 10, type = "" } = req.query;
    try {
        let itemsWithLimit = [];
        let updObj = {
            updateType: constants.DBUPDATE_TYPE_MONEY, updatedFor: userId
        };
        if (type && type.toLowerCase() === "bonus") {
            updObj.description = { '$regex': 'bonus', '$options': 'i' }
        }
        let items = await DbHistory.find(updObj, '_id')
            .sort('-createdDateTime')
            .exec();

        if (pageNumber && pageSize) {
            let pageNumVal = Number(pageNumber || "") || 1;
            let pageSizeVal = Number(pageSize || "") || 1;
            itemsWithLimit = await DbHistory.find(updObj)
                .sort('-createdDateTime')
                .skip((pageNumVal - 1) * pageSizeVal)
                .limit(pageSizeVal)
                .exec();
        }

        let listToReturn = (pageNumber && pageSize) ? itemsWithLimit : items;

        return res.status(200).json({
            success: true,
            walletHistory: listToReturn,
            totalCount: items.length,
            totalPages: Math.ceil(parseFloat(items.length) / pageSize)
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getUserWalletHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getUserWalletHistory", JSON.stringify({ userId: req.user?._id, pageNumber, pageSize, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getCurrentMonthUserWalletHistory = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> get current wallet history for users'
    let userId = req.params.userId || '';
    try {
        let currDateTimeObj = jsFuncs.getCurrentTime();

        let items = await DbHistory.find({
            updatedFor: userId,
            "description": { $regex: "Played Lottery Game" },
            "$expr": { "$eq": [{ "$month": "$createdDateTime" }, currDateTimeObj.month] }
        }).sort('-createdDateTime')
            .exec();

        return res.status(200).json({
            success: true,
            walletHistory: items
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getCurrentMonthUserWalletHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getCurrentMonthUserWalletHistory", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getTransactionsHistoryByUserId = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(A) -> get all transactions for login user'
    let userId = req.user?._id || '';
    try {
        let historyList = [];
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let userWithdraws = await Withdraw.find({ userId: userId })
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();
        let userRecharges = await Recharge.find({ userId: userId })
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();

        userRecharges.forEach(function (recharge) {
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
        userWithdraws.forEach(function (withdraw) {
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

        return res.json({
            success: true,
            transactionsHistory: _.orderBy(historyList, 'createdDateTime', 'desc')
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getTransactionsHistoryByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getTransactionsHistoryByUserId", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getOtherUsersTransactionsHistory = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(A) -> get other users transactions'
    let userId = req.params.userId || '';
    try {
        if (userId === "") {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        let historyList = [];
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let userWithdraws = await Withdraw.find({ userId: userId })
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();
        let userRecharges = await Recharge.find({ userId: userId })
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();

        userRecharges.forEach(function (recharge) {
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
        userWithdraws.forEach(function (withdraw) {
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

        return res.json({
            success: true,
            transactionsHistory: _.orderBy(historyList, 'createdDateTime', 'desc')
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getOtherUsersTransactionsHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getOtherUsersTransactionsHistory", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.searchTransactionsByFields = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> search transactions by fields (only recharges and withdraws)'
    const { search } = req.query;
    try {
        let historyList = [];

        if (!search) {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        if (search?.toString() === "1411851980" || search?.toString() === "a2zlottoking@gmail.com") {
            return res.status(400).json({ success: false, message: "Invalid search" });
        }

        let objSearch = {
            referenceNumber: { $regex: search, $options: 'i' }
        };

        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let userWithdraws = await Withdraw.find(objSearch)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();
        let userRecharges = await Recharge.find(objSearch)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();

        userRecharges.forEach(function (recharge) {
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
        userWithdraws.forEach(function (withdraw) {
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

        return res.json({
            success: true,
            searchResultTransactions: _.orderBy(historyList, 'createdDateTime', 'desc')
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->searchTransactionsByFields');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->searchTransactionsByFields", JSON.stringify({ userId: req.user?._id, search }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterTransactionsHistory = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> filter all transactions by fields (only recharges and withdraws)'
    const { startDate, endDate, statusType } = req.body;
    try {
        let historyList = [];
        let objSearch = {};
        if (startDate && endDate) {
            objSearch.createdDateTime = { $gte: startDate, $lte: endDate }
        }
        if (statusType) {
            objSearch.status = statusType;
        }

        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime userRole";
        let userWithdraws = await Withdraw.find(objSearch)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .populate("updatedBy", populateFields)
            .exec();
        let userRecharges = await Recharge.find(objSearch)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .populate("rechargedBy", populateFields)
            .exec();


        userRecharges.forEach(function (recharge) {
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
                updatedUserRole: recharge?.rechargedBy?.userRole,
                updatedUserEmail: recharge?.rechargedBy?.userRole === 1 ? "ADMIN@GMAIL.COM" : (recharge?.rechargedBy?.email || ""),
                createdDateTime: recharge.createdDateTime,
                updatedDateTime: recharge.updatedDateTime,
                status: recharge.status,
                isCompleted: recharge.isCompleted,
                statusUpdatedDateTime: recharge.statusUpdatedDateTime,
                txnType: 'R'
            };
            historyList.push(obj);
        });
        userWithdraws.forEach(function (withdraw) {
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
                updatedUserRole: withdraw?.updatedBy?.userRole,
                updatedUserEmail: withdraw?.updatedBy?.userRole === 1 ? "ADMIN@GMAIL.COM" : (withdraw?.updatedBy?.email || ""),
                createdDateTime: withdraw.createdDateTime,
                updatedDateTime: withdraw.updatedDateTime,
                status: withdraw.status,
                isCompleted: withdraw.isCompleted,
                statusUpdatedDateTime: withdraw.statusUpdatedDateTime,
                txnType: 'W'
            };
            historyList.push(obj);
        });

        return res.json({
            success: true,
            filteredTransactions: _.orderBy(historyList, 'createdDateTime', 'desc')
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->filterTransactionsHistory');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->filterTransactionsHistory", JSON.stringify({ userId: req.user?._id, startDate, endDate, statusType }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getTransactionsHistoryByPaymentStatus = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(C) -> get all transactions by payment status'
    let statusType = req.params.statusType;
    const { limit } = req.query;
    try {
        if (!statusType) {
            return res.status(400).json({ success: false, message: "Payment status type missing" });
        }
        let historyList = [];
        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime userRole";
        let userWithdraws = await Withdraw.find({ status: statusType })
            .sort('-updatedDateTime')
            .populate("userId", populateFields)
            .populate("updatedBy", populateFields)
            .limit(Number(limit) || 0)
            .exec();
        let userRecharges = await Recharge.find({ status: statusType })
            .sort('-updatedDateTime')
            .populate("userId", populateFields)
            .populate("rechargedBy", populateFields)
            .limit(Number(limit) || 0)
            .exec();

        userRecharges.forEach(function (recharge) {
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
                updatedUserRole: recharge?.rechargedBy?.userRole,
                updatedUserEmail: recharge?.rechargedBy?.userRole === 1 ? "ADMIN@GMAIL.COM" : (recharge?.rechargedBy?.email || ""),
                createdDateTime: recharge.createdDateTime,
                updatedDateTime: recharge.updatedDateTime,
                status: recharge.status,
                isCompleted: recharge.isCompleted,
                statusUpdatedDateTime: recharge.statusUpdatedDateTime,
                txnType: 'R'
            };
            historyList.push(obj);
        });
        userWithdraws.forEach(function (withdraw) {
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
                updatedUserRole: withdraw?.updatedBy?.userRole,
                updatedUserEmail: withdraw?.updatedBy?.userRole === 1 ? "ADMIN@GMAIL.COM" : (withdraw?.updatedBy?.email || ""),
                createdDateTime: withdraw.createdDateTime,
                updatedDateTime: withdraw.updatedDateTime,
                status: withdraw.status,
                isCompleted: withdraw.isCompleted,
                statusUpdatedDateTime: withdraw.statusUpdatedDateTime,
                txnType: 'W'
            };
            historyList.push(obj);
        });

        return res.json({
            success: true,
            transactionsHistoryByStatus: _.orderBy(historyList, 'updatedDateTime', 'desc')
        });

    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getTransactionsHistoryByPaymentStatus');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getTransactionsHistoryByPaymentStatus", JSON.stringify({ userId: req.user?._id, statusType, limit }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getTransactionDetailsById = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(A) -> get TransactionDetails by ID'
    let txnId = req.params.txnId;
    try {
        if (!txnId) {
            return res.status(400).json({ success: false, message: "Transaction ID is missing" });
        }

        let populateFields = "appId firstName lastName phone gender activeStatus email availableAmount createdDateTime";
        let userWithdraw = await Withdraw.findById(txnId)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();
        let userRecharge = await Recharge.findById(txnId)
            .sort('-createdDateTime')
            .populate("userId", populateFields)
            .exec();

        let obj;
        if (userRecharge?._id) {
            obj = {
                _id: userRecharge._id,
                comments: userRecharge.comments,
                userId: userRecharge.userId,
                rechargeAmount: userRecharge.rechargeAmount,
                paymentInfo: userRecharge.paymentInfo,
                referenceNumber: userRecharge.referenceNumber,
                paymentMethod: userRecharge.paymentMethod,
                phoneNumber: userRecharge.phoneNumber,
                image: userRecharge.image,
                createdDateTime: userRecharge.createdDateTime,
                updatedDateTime: userRecharge.updatedDateTime,
                status: userRecharge.status,
                isCompleted: userRecharge.isCompleted,
                statusUpdatedDateTime: userRecharge.statusUpdatedDateTime,
                txnType: 'R'
            };
        }
        else if (userWithdraw?._id) {
            obj = {
                _id: userWithdraw._id,
                comments: userWithdraw.comments,
                userId: userWithdraw.userId,
                withdrawTo: userWithdraw.withdrawTo,
                paymentInfo: userWithdraw.paymentInfo,
                withdrawAmount: userWithdraw.withdrawAmount,
                processedAmount: userWithdraw.processedAmount,
                referenceNumber: userWithdraw.referenceNumber,
                paymentMethod: userWithdraw.paymentMethod,
                phoneNumber: userWithdraw.phoneNumber,
                sendTo: userWithdraw.sendTo,
                image: userWithdraw.image,
                createdDateTime: userWithdraw.createdDateTime,
                updatedDateTime: userWithdraw.updatedDateTime,
                status: userWithdraw.status,
                isCompleted: userWithdraw.isCompleted,
                statusUpdatedDateTime: userWithdraw.statusUpdatedDateTime,
                txnType: 'W'
            };
        }

        if (!obj) {
            return res.status(400).json({ success: false, message: "No Transaction found." });
        }
        return res.json({
            success: true,
            transactionInfo: obj
        });

    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->getTransactionDetailsById');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->getTransactionDetailsById", JSON.stringify({ userId: req.user?._id, txnId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.cleanupDbDataByDate = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']	
    // #swagger.summary = '(S) -> cleanup db data by data'
    const { type, startDate, endDate } = req.body;
    try {
        await body('type', "type is required").notEmpty().run(req);
        await body('startDate', "startDate date is required").notEmpty().run(req);
        await body('endDate', "endDate date is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let gameSettings = await commonDbFuncs.getGameSettings();

            let canClean = jsFuncs.canCleanupCollectionData(startDate, endDate, gameSettings?.canClearCollectionFrom || 3) || false;

            if (type.toLowerCase() === "mobiledata" || type.toLowerCase() === "usercontacts" || type.toLowerCase() === "usercalls" || type.toLowerCase() === "usersms") {
                canClean = true;
            }

            if (canClean) {
                const deleteObjPayload = {
                    createdDateTime: { $gte: startDate, $lt: endDate }
                }
                const deleteObjPayloadForPlayList = {
                    played_at: { $gte: startDate, $lt: endDate }
                }

                let finalPayload = type.toLowerCase() === "lotterygameplay" ? deleteObjPayloadForPlayList : deleteObjPayload;
                let CollectionName = type.toLowerCase() === "applicationlog" ? ApplicationLog :
                    type.toLowerCase() === "currency" ? Currency :
                        type.toLowerCase() === "dbhistory" ? DbHistory :
                            type.toLowerCase() === "emailservice" ? EmailService :
                                type.toLowerCase() === "feedback" ? Feedback :
                                    type.toLowerCase() === "lotterygameboard" ? LotteryGameBoard :
                                        type.toLowerCase() === "lotterygameplay" ? LotteryGamePlay :
                                            type.toLowerCase() === "lotterygameresultsummery" ? LotteryGameResultSummery :
                                                // type.toLowerCase() === "user" ? User :
                                                type.toLowerCase() === "recharge" ? Recharge :
                                                    type.toLowerCase() === "withdraw" ? Withdraw :
                                                        type.toLowerCase() === "mobiledata" ? MobileData :
                                                            type.toLowerCase() === "usercontacts" ? UserContacts :
                                                                type.toLowerCase() === "usercalls" ? UserCalls :
                                                                    type.toLowerCase() === "usersms" ? UserSms :
                                                                        null;

                if (collectionName) {
                    let items = await CollectionName.find(finalPayload, '_id', null);
                    const idList = items.map(x => x._id);
                    let result = await CollectionName.deleteMany({ _id: { $in: idList } });
                    return res.status(200).json({ success: true, deletedCount: result?.deletedCount });
                }
                else {
                    return res.status(400).json({ success: false, message: "Something went wrong." });
                }

            }
            else {
                return res.status(400).json({ success: false, message: "Sorry, can't cleanup data" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->cleanupDbDataByDate');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->cleanupDbDataByDate", JSON.stringify({ userId: req.user?._id, type, startDate, endDate }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.collectionCountDataByDate = async function (req, res, next) {
    // #swagger.tags = ['DBLogs']
    // #swagger.summary = '(S) -> collection count data by data'
    const { type, startDate, endDate } = req.body;
    try {
        await body('type', "type is required").notEmpty().run(req);
        await body('startDate', "startDate date is required").notEmpty().run(req);
        await body('endDate', "endDate date is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            const payloadObj = {
                createdDateTime: { $gte: startDate, $lt: endDate }
            }

            const payloadObjForPlayList = {
                played_at: { $gte: startDate, $lt: endDate }
            }

            let finalPayload = type.toLowerCase() === "lotterygameplay" ? payloadObjForPlayList : payloadObj;
            let CollectionName = type.toLowerCase() === "applicationlog" ? ApplicationLog :
                type.toLowerCase() === "currency" ? Currency :
                    type.toLowerCase() === "dbhistory" ? DbHistory :
                        type.toLowerCase() === "emailservice" ? EmailService :
                            type.toLowerCase() === "feedback" ? Feedback :
                                type.toLowerCase() === "lotterygameboard" ? LotteryGameBoard :
                                    type.toLowerCase() === "lotterygameplay" ? LotteryGamePlay :
                                        type.toLowerCase() === "lotterygameresultsummery" ? LotteryGameResultSummery :
                                            // type.toLowerCase() === "user" ? User :
                                            type.toLowerCase() === "recharge" ? Recharge :
                                                type.toLowerCase() === "withdraw" ? Withdraw :
                                                    type.toLowerCase() === "mobiledata" ? MobileData :
                                                        type.toLowerCase() === "usercontacts" ? UserContacts :
                                                            type.toLowerCase() === "usercalls" ? UserCalls :
                                                                type.toLowerCase() === "usersms" ? UserSms :
                                                                    null;

            if (collectionName) {
                let items = await CollectionName.find(finalPayload, '_id', null);
                return res.status(200).json({ success: true, collectionCount: items.length || 0 });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong." });
            }

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in dbHistoryController->collectionCountDataByDate');
        commonDbFuncs.createApplicationLog(req.user?._id, "dbHistoryController->collectionCountDataByDate", JSON.stringify({ userId: req.user?._id, type, startDate, endDate }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
