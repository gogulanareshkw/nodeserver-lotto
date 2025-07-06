const Offer = require('../models/offer');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.getAllOffers = async function (req, res, next) {
    // #swagger.tags = ['Offer']	
    // #swagger.summary = '(A) -> get all offers'
    try {
        let offers = await Offer.find({})
            .sort('-createdDateTime')
            .exec();
        return res.status(200).json({ success: true, allOffers: offers });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in offerController->getAllOffers');
        commonDbFuncs.createApplicationLog(req.user?._id, "offerController->getAllOffers", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.createNewOffer = async function (req, res, next) {
    // #swagger.tags = ['Offer']	
    // #swagger.summary = '(C) -> create new Offer'
    const { targetValue, bonusValue, type } = req.body;
    try {
        await body('type', "type is required").notEmpty().run(req);
        await body('targetValue', "targetValue is required").notEmpty().run(req);
        await body('bonusValue', "bonusValue is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let offer = new Offer({
                targetValue: targetValue,
                bonusValue: bonusValue,
                type: type
            });

            let savedOffer = await offer.save();
            if (Boolean(savedOffer)) {
                return res.status(200).json({
                    success: true,
                    savedOffer: savedOffer
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save." });
            }

        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in offerController->createNewOffer');
        commonDbFuncs.createApplicationLog(req.user?._id, "offerController->createNewOffer", JSON.stringify({ userId: req.user?._id, targetValue, bonusValue, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteOffer = async function (req, res, next) {
    // #swagger.tags = ['Offer']	
    // #swagger.summary = '(C) -> delete Offer'
    let offerId = req.params.offerId || '';
    try {
        let deletedItem = await Offer.findByIdAndDelete(offerId, { select: "_id" });
        if (Boolean(deletedItem)) {
            return res.status(200).json({
                success: true,
                offerId: offerId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Item doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in offerController->deleteOffer');
        commonDbFuncs.createApplicationLog(req.user?._id, "offerController->deleteOffer", JSON.stringify({ offerId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


