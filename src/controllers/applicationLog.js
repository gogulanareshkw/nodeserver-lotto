var moment = require('moment');
const ApplicationLog = require('../models/applicationLog');
var commonDbFuncs = require("../utils/commonDbFuncs");


exports.getApplicationLogs = async function (req, res, next) {
    // #swagger.tags = ['ApplicationLogs']	
    // #swagger.summary = '(C) -> get all applicationLogs'
    const { limit } = req.query;
    try {
        let noOfItems = await ApplicationLog.find({})
            .sort('-createdDateTime')
            .limit(Number(limit) || 0)
            .exec();
        return res.status(200).json({ success: true, applicationLogs: noOfItems || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationLogController->getApplicationLogs');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationLogController->getApplicationLogs", JSON.stringify({ userId: req.user?._id, limit }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteOldApplicationLogs = async function (req, res, next) {
    // #swagger.tags = ['ApplicationLogs']	
    // #swagger.summary = '(S) -> delete old ApplicationLogs history before 1 week'
    try {
        let items = await ApplicationLog.find({ createdDateTime: { $lt: moment().subtract(7, 'days') } }, '_id');
        const idList = items.map(x => x._id);
        let result = await ApplicationLog.deleteMany({ _id: { $in: idList } });
        return res.status(200).json({ success: true, deletedCount: result?.deletedCount || 0 });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationLogController->deleteOldApplicationLogs');
        commonDbFuncs.createApplicationLog(req.user?._id, "applicationLogController->deleteOldApplicationLogs", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.addApplicationLog = async function (req, res, next) {
    // #swagger.tags = ['ApplicationLogs']	
    // #swagger.summary = '(A) -> add applicationlog'
    const { userId, errorMethod, inputPayload, errorInfo, errorMessage, errorInString } = req.body;
    try {
        let log = await commonDbFuncs.createApplicationLog(userId, errorMethod, inputPayload, errorInfo, errorMessage, errorInString);
        return res.status(200).json({ success: true, createdLog: log });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in applicationLogController->addApplicationLog');
        commonDbFuncs.createApplicationLog(null, "applicationLogController->addApplicationLog", JSON.stringify({ userId, errorMethod, inputPayload, errorInfo, errorMessage, errorInString }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}