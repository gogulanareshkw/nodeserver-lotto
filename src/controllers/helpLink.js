var moment = require('moment');
const HelpLink = require('../models/helpLink');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.getAllHelpLinks = async function (req, res, next) {
    // #swagger.tags = ['HelpLink']	
    // #swagger.summary = '(A) -> get all helpLinks'
    try {
        let helpLinks = await HelpLink.find({});
        return res.status(200).json({ success: true, helpLinksList: helpLinks });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in helpLinkController->getAllHelpLinks');
        commonDbFuncs.createApplicationLog(req.user?._id, "helpLinkController->getAllHelpLinks", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.createHelpLink = async function (req, res, next) {
    // #swagger.tags = ['HelpLink']	
    // #swagger.summary = '(C) -> create new helpLink'
    let userId = req.user?._id || '';
    const { name, title, mediaLink } = req.body;
    try {
        await body('name', "name is required").notEmpty().run(req);
        await body('title', "title is required").notEmpty().run(req);
        await body('mediaLink', "mediaLink is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            const helpLink = new HelpLink({
                uploadBy: userId,
                name: name,
                title: title,
                mediaLink: mediaLink
            });

            let savedHelpLink = await helpLink.save();
            if (Boolean(savedHelpLink)) {
                return res.status(200).json({
                    success: true,
                    newHelpLink: savedHelpLink
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save helpLink" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in helpLinkController->createHelpLink');
        commonDbFuncs.createApplicationLog(req.user?._id, "helpLinkController->createHelpLink", JSON.stringify({ userId: req.user?._id, name, title, mediaLink }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateHelpLink = async function (req, res, next) {
    // #swagger.tags = ['HelpLink']	
    // #swagger.summary = '(C) -> update helpLink'
    let userId = req.user?._id || '';
    const { helpLinkId, name, title, mediaLink } = req.body;
    try {
        await body('helpLinkId', "helpLinkId is required").notEmpty().run(req);
        await body('name', "name is required").notEmpty().run(req);
        await body('title', "title is required").notEmpty().run(req);
        await body('mediaLink', "mediaLink is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objHelpLink = {
                uploadBy: userId,
                name: name,
                title: title,
                mediaLink: mediaLink,
                updatedDateTime: moment.now()
            };

            let updatedHelpLink = await HelpLink.findByIdAndUpdate(helpLinkId, objHelpLink, { upsert: false, new: true });
            if (Boolean(updatedHelpLink)) {
                return res.status(200).json({
                    success: true,
                    updatedHelpLink: updatedHelpLink
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong while updating HelpLink" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in helpLinkController->updateHelpLink');
        commonDbFuncs.createApplicationLog(req.user?._id, "helpLinkController->updateHelpLink", JSON.stringify({ userId: req.user?._id, helpLinkId, name, title, mediaLink }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteHelpLink = async function (req, res, next) {
    // #swagger.tags = ['HelpLink']	
    // #swagger.summary = '(C) -> delete helpLink'
    let helpLinkId = req.params.helpLinkId || '';
    try {
        let deletedHelpLink = await HelpLink.findByIdAndDelete(helpLinkId, { select: "_id" });
        if (Boolean(deletedHelpLink)) {
            return res.status(200).json({
                success: true,
                helpLinkId: helpLinkId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "HelpLink doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in helpLinkController->deleteHelpLink');
        commonDbFuncs.createApplicationLog(req.user?._id, "helpLinkController->deleteHelpLink", JSON.stringify({ userId: req.user?._id, helpLinkId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}