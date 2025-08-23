var moment = require('moment');
const BankCard = require('../models/bankCard');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
const config = require('../config/constants');


exports.getAllBankCardsByUserId = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(A) -> get all saved bank cards by user ID'
    let userId = req.user?._id || '';
    try {
        if (userId === '') {
            return res.status(400).json({ success: false, message: "Invalid Id" });
        }
        let cards = await BankCard.find({ userId: userId });
        return res.status(200).json({ success: true, bankCards: cards || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->getAllBankCardsByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->getAllBankCardsByUserId", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllBankCardsByType = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(C) -> get all saved bank cards Type(UPI,BANK)'
    let type = req.params.type || '';
    try {
        if (type === "") {
            return res.status(400).json({ success: false, message: "type is required" });
        }
        let cards = await BankCard.find({ type: type });
        return res.status(200).json({ success: true, bankCards: cards || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->getAllBankCardsByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->getAllBankCardsByType", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.createNewBankCard = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(A) -> create new BankCard'
    let userId = req.user?._id || '';
    const { upiId, accountNumber, accountHolderName, ifscCode, phoneNumber, type } = req.body;
    try {
        await body('type', "type is required").notEmpty().run(req);
        if (type === "UPI") {
            await body('upiId', "upiId is required").notEmpty().run(req);
            await body('phoneNumber', "phoneNumber is required").notEmpty().run(req);
        }
        else if (type === "BANK") {
            await body('accountNumber', "accountNumber is required").notEmpty().run(req);
            await body('accountHolderName', "accountHolderName is required").notEmpty().run(req);
            await body('ifscCode', "ifscCode is required").notEmpty().run(req);
            await body('phoneNumber', "phoneNumber is required").notEmpty().run(req);
        }
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let bankCard;
            if (type === "UPI") {
                bankCard = new BankCard({
                    upiId: upiId,
                    phoneNumber: phoneNumber,
                    type: type,
                    isActive: true,
                    userId: userId
                });
            }
            else if (type === "BANK") {
                bankCard = new BankCard({
                    accountNumber: accountNumber,
                    accountHolderName: accountHolderName,
                    ifscCode: ifscCode,
                    phoneNumber: phoneNumber,
                    type: type,
                    isActive: true,
                    userId: userId
                });
            }

            await BankCard.updateMany(
                { userId: userId },
                { isActive: false },
                { upsert: false }
            );

            let savedCard = await bankCard.save();
            if (Boolean(savedCard)) {
                return res.status(200).json({
                    success: true,
                    newCard: savedCard
                });
            }
            else {
                return res.status(400).json({ success: false, message: 'Unable to save BankCard' });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->createNewBankCard');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->createNewBankCard", JSON.stringify({ userId, upiId, accountNumber, accountHolderName, ifscCode, phoneNumber, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateBankCard = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(A) -> update BankCard'
    const cardId = req.params.cardId || '';
    const { upiId, accountNumber, accountHolderName, ifscCode, phoneNumber, type } = req.body;
    try {
        if (cardId === '') {
            return res.status(400).json({ success: false, message: "cardId is required" });
        }
        await body('type', "type is required").notEmpty().run(req);
        if (type === "UPI") {
            await body('upiId', "upiId is required").notEmpty().run(req);
            await body('phoneNumber', "phoneNumber is required").notEmpty().run(req);
        }
        else if (type === "BANK") {
            await body('accountNumber', "accountNumber is required").notEmpty().run(req);
            await body('accountHolderName', "accountHolderName is required").notEmpty().run(req);
            await body('ifscCode', "ifscCode is required").notEmpty().run(req);
            await body('phoneNumber', "phoneNumber is required").notEmpty().run(req);
        }
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objCard;
            if (type === "UPI") {
                objCard = {
                    upiId: upiId,
                    phoneNumber: phoneNumber,
                    updatedDateTime: moment.now()
                };
            }
            else {
                objCard = {
                    accountNumber: accountNumber,
                    accountHolderName: accountHolderName,
                    ifscCode: ifscCode,
                    phoneNumber: phoneNumber,
                    updatedDateTime: moment.now()
                };
            }

            let updatedItem = await BankCard.findByIdAndUpdate(cardId, objCard, { upsert: false, new: true });
            if (Boolean(updatedItem)) {
                return res.status(200).json({
                    success: true,
                    updatedCard: updatedItem
                });
            }
            else {
                return res.status(400).json({ success: false, message: 'Failed to update Item' })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->updateBankCard');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->updateBankCard", JSON.stringify({ cardId, upiId, accountNumber, accountHolderName, ifscCode, phoneNumber, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteBankCard = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(A) -> delete BankCard'
    let cardId = req.params.cardId || '';
    try {
        let deletedItem = await BankCard.findByIdAndDelete(cardId, { select: "_id" });
        if (Boolean(deletedItem)) {
            return res.status(200).json({
                success: true,
                cardId: cardId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Item doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->deleteBankCard');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->deleteBankCard", JSON.stringify({ cardId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.makeActiveBankCard = async function (req, res, next) {
    // #swagger.tags = ['BankCard']	
    // #swagger.summary = '(A) -> make active BankCard'
    let cardId = req.params.cardId || '';
    let userId = req.user?._id || '';
    try {
        await BankCard.updateMany(
            { userId: userId },
            { isActive: false },
            { upsert: false }
        );

        let updatedItem = await BankCard.findByIdAndUpdate(cardId, { isActive: true }, { upsert: false, new: true, select: "_id isActive" });
        if (Boolean(updatedItem)) {
            let cards = await BankCard.find({ userId: userId });
            return res.status(200).json({ success: true, bankCards: cards || [] });
        }
        else {
            return res.status(400).json({ success: false, message: 'Failed to update Item' })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in bankCardController->makeActiveBankCard');
        commonDbFuncs.createApplicationLog(req.user?._id, "bankCardController->makeActiveBankCard", JSON.stringify({ cardId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}