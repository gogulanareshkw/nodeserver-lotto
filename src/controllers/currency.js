var moment = require('moment');
const Currency = require('../models/currency');
var commonDbFuncs = require("../utils/commonDbFuncs");


exports.getCurrencyRatesByDate = async function (req, res, next) {
    // #swagger.tags = ['Currency']	
    // #swagger.summary = '(P) -> get currency rates by date'
    const date = req.query.date || "";
    try {
        let obj = {};
        if (date) {
            obj.date = date;
        }
        let latestCurrencyRate = await Currency.find(obj)
            .sort('-createdDateTime')
            .limit(1)
            .exec();
        return res.status(200).json({ success: true, latestCurrencyRate: latestCurrencyRate[0] || {} });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in currencyController->getCurrencyRatesByDate');
        commonDbFuncs.createApplicationLog(null, "currencyController->getCurrencyRatesByDate", JSON.stringify({}), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteOldCurrencyRates = async function (req, res, next) {
    // #swagger.tags = ['Currency']	
    // #swagger.summary = '(S) -> delete old Currency history before 1 week'
    try {
        let items = await Currency.find({ createdDateTime: { $lt: moment().subtract(7, 'days') } }, '_id');
        const idList = items.map(x => x._id);
        let result = await Currency.deleteMany({ _id: { $in: idList } });
        return res.status(200).json({ success: true, deletedCount: result?.deletedCount || 0 });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in currencyController->deleteOldCurrencyRates');
        commonDbFuncs.createApplicationLog(null, "currencyController->deleteOldCurrencyRates", JSON.stringify({}), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}