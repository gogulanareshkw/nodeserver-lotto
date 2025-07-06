var moment = require('moment');
const EmailService = require('../models/emailService');
var commonDbFuncs = require("../utils/commonDbFuncs");


exports.FilterEmails = async function (req, res, next) {
    // #swagger.tags = ['EmailService']	
    // #swagger.summary = '(C) -> get all emailServices by type'
    const { isError, serviceType, userId, sortBy } = req.body;
    const { limit } = req.query;
    try {
        let obj = {};
        if (isError) obj.isError = isError;
        if (serviceType) obj.serviceFrom = serviceType;
        if (userId) obj.userId = userId;
        let emails = await EmailService.find(obj)
            .sort({ createdDateTime: sortBy === "asc" ? 1 : -1 })
            .limit(Number(limit) || 0)
            .exec();
        return res.status(200).json({ success: true, emailServiceList: emails || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in emailServiceController->FilterEmails');
        commonDbFuncs.createApplicationLog(req.user?._id, "emailServiceController->FilterEmails", JSON.stringify({ userId: req.user?._id, isError, serviceType, userId, sortBy, limit }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteOldEmailsHistory = async function (req, res, next) {
    // #swagger.tags = ['EmailService']	
    // #swagger.summary = '(S) -> delete old emails history before 2 days'
    try {
        let items = await EmailService.find({ createdDateTime: { $lt: moment().subtract(2, 'days') } }, '_id');
        const idList = items.map(x => x._id);
        let result = await EmailService.deleteMany({ _id: { $in: idList } });
        return res.status(200).json({ success: true, deletedCount: result?.deletedCount || 0 });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in emailServiceController->FilterEmails');
        commonDbFuncs.createApplicationLog(req.user?._id, "emailServiceController->FilterEmails", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}