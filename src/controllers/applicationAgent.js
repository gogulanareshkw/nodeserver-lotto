var moment = require('moment');
const ApplicationAgent = require('../models/applicationAgent');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.filterAllApplicationAgents = async function (req, res, next) {
    // #swagger.tags = ['ApplicationAgents']
    // #swagger.summary = '(A) -> get all applicationAgents'
    const { isActive, type, identity, name, country } = req.body;
    const { pageNumber = 1, pageSize = 20 } = req.query;
    try {
        let pageNumVal = Number(pageNumber || "") || 1;
        let pageSizeVal = Number(pageSize || "") || 20;
        let objSearch = {};
        if (name) objSearch.name = { $regex: name };
        if (type) objSearch.type = type;
        if (identity) objSearch.identity = { $regex: identity };
        if (country) objSearch.country = { $regex: country };
        if (isActive?.toString() === "true" || isActive?.toString() === "false") objSearch.isActive = isActive;

        let noOfItems = await ApplicationAgent.find(objSearch, '_id')
            .sort('-createdDateTime')
            .exec() || [];
        let itemsResult = await ApplicationAgent.find(objSearch)
            .sort('-createdDateTime')
            .skip((pageNumVal - 1) * pageSizeVal)
            .limit(pageSizeVal)
            .exec() || [];

        return res.status(200).json({
            success: true,
            totalItems: itemsResult || [],
            totalCount: noOfItems.length,
            totalPages: Math.ceil(parseFloat(noOfItems.length) / pageSize)
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationAgentController->filterAllApplicationAgents');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationAgentController->filterAllApplicationAgents", JSON.stringify({ userId: req.user?._id, isActive, type, identity, name, country, pageNumber, pageSize }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.addApplicationAgent = async function (req, res, next) {
    // #swagger.tags = ['ApplicationAgents']
    // #swagger.summary = '(A) -> add applicationAgent'
    const { isActive, type, identity, name, country } = req.body;
    try {
        await body('isActive', "isActive is required").notEmpty().run(req);
        await body('type', "type is required").notEmpty().run(req);
        await body('identity', "identity is required").notEmpty().run(req);
        await body('name', "name is required").notEmpty().run(req);
        await body('country', "country is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let newItem = new ApplicationAgent({
                isActive: isActive,
                type: type,
                identity: identity,
                name: name,
                country: country,
                createdDateTime: moment.now()
            });

            let savedItem = await newItem.save();
            if (Boolean(savedItem)) {
                return res.status(200).json({
                    success: true,
                    item: savedItem
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Failed to save Item" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationAgentController->addApplicationAgent');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationAgentController->addApplicationAgent", JSON.stringify({ userId: req.user?._id, isActive, type, identity, name, country }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateApplicationAgent = async function (req, res, next) {
    // #swagger.tags = ['ApplicationAgents']
    // #swagger.summary = '(A) -> update applicationAgent'
    const { agentId, isActive, type, identity, name, country } = req.body;
    try {
        await body('agentId', "agentId is required").notEmpty().run(req);
        await body('isActive', "isActive is required").notEmpty().run(req);
        await body('type', "type is required").notEmpty().run(req);
        await body('identity', "identity is required").notEmpty().run(req);
        await body('name', "name is required").notEmpty().run(req);
        await body('country', "country is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {
                isActive: isActive,
                type: type,
                identity: identity,
                name: name,
                country: country,
                updatedDateTime: moment.now()
            };

            let fields = "_id type identity name country isActive";
            let updatedItem = await ApplicationAgent.findByIdAndUpdate(agentId, objUpdate, { upsert: false, new: true, select: fields });
            if (Boolean(updatedItem)) {
                return res.json({ success: true, item: updatedItem });
            }
            else {
                return res.status(400).json({ success: false, message: 'Failed to update Item' })
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationAgentController->updateApplicationAgent');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationAgentController->updateApplicationAgent", JSON.stringify({ userId: req.user?._id, agentId, isActive, type, identity, name, country }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteApplicationAgentById = async function (req, res, next) {
    // #swagger.tags = ['ApplicationAgents']
    // #swagger.summary = '(A) -> delete ApplicationAgent by ID'
    let agentId = req.params.agentId || '';
    try {
        if (agentId === "")
            return res.status(400).json({ success: false, message: "agentId is required" });
        let deleteditem = await ApplicationAgent.findByIdAndDelete(agentId);
        if (Boolean(deleteditem)) {
            return res.status(200).json({
                success: true,
                agentId: agentId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "agent doesn't exist to delete." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationAgentController->deleteApplicationAgentById');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationAgentController->deleteApplicationAgentById", JSON.stringify({ userId: req.user?._id, agentId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}