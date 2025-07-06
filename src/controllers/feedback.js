var moment = require('moment');
const Feedback = require('../models/feedback');
var commonDbFuncs = require("../utils/commonDbFuncs");
const { body, validationResult } = require('express-validator');


exports.getAllFeedbacks = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(C) -> get all feedbacks'
    try {
        let feedbacks = await Feedback.find({});
        return res.status(200).json({ success: true, feedbacksList: feedbacks || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->getAllFeedbacks');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->getAllFeedbacks", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllPendingFeedbacks = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(C) -> get all pending feedbacks to review'
    try {
        let feedbacks = await Feedback.find({ isReviewd: false });
        return res.status(200).json({ success: true, feedbacksList: feedbacks || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->getAllPendingFeedbacks');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->getAllPendingFeedbacks", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getUserFeedbacks = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(A) -> get all user feedbacks'
    let userId = req.user?._id || '';
    try {
        let feedbacks = await Feedback.find({ userId: userId });
        return res.status(200).json({ success: true, feedbacksList: feedbacks || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->getUserFeedbacks');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->getUserFeedbacks", JSON.stringify({ userId: req.user?._id }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.getAllFeedbacksByType = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(C) -> get all saved feedbacks Type(GENERAL, COMPLAINT, COMPLIMENT, SUGGESTION, HELP)'
    let type = req.params.type || '';
    try {
        if (type === "") {
            return res.status(400).json({ success: false, message: "type is required" });
        }
        let feedbacks = await Feedback.find({ type: type });
        return res.status(200).json({ success: true, feedbacksList: feedbacks || [] });
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->getAllFeedbacksByType');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->getAllFeedbacksByType", JSON.stringify({ userId: req.user?._id, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.filterAllFeedbacks = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(C) -> filter all feedbacks'
    let adminId = req.user?._id || '';
    const { userId, status, repliedBy, type } = req.body;
    try {
        await body('type', "type is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            let adminUser = await User.findById(adminId);
            if (Boolean(adminUser)) {
                if (adminUser.userRole === 3 || adminUser.userRole === 4 || adminUser.userRole === 5) {
                    return res.status(400).json({ success: false, message: "You don't have permissions to see feedbacks." })
                }
                let findObj = { type: type };
                if (userId) findObj.userId = userId;
                if (repliedBy) findObj.repliedBy = repliedBy;
                if (status?.toLowerCase() === "pending" || status?.toLowerCase() === "completed") {
                    findObj.isReviewd = status?.toLowerCase() === "completed" ? true : false;
                }
                let populateFields = "appId firstName lastName email availableAmount createdDateTime";
                let feedbacks = await Feedback.find(findObj)
                    .sort('-createdDateTime')
                    .populate("userId", populateFields)
                    .exec();
                return res.status(200).json({ success: true, feedbacksList: feedbacks || [] });
            }
            else {
                return res.status(400).json({ success: false, message: 'User does not exist' });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->filterAllFeedbacks');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->filterAllFeedbacks", JSON.stringify({ userId, adminId, status, repliedBy, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.createFeedback = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(A) -> create new feedback'
    let userId = req.user?._id || '';
    const { subject, description, type } = req.body;
    try {
        await body('subject', "subject is required").notEmpty().run(req);
        await body('description', "description is required").notEmpty().run(req);
        await body('type', "type is required").notEmpty().run(req);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            return res.status(400).json({ success: false, errors: errorResult.array() });
        }
        else {
            const feedback = new Feedback({
                subject: subject,
                description: description,
                type: type,
                userId: userId
            });
            let savedFeedback = await feedback.save();
            if (Boolean(savedFeedback)) {
                return res.status(200).json({
                    success: true,
                    newFeedback: savedFeedback
                });
            }
            else {
                return res.status(400).json({ success: false, message: "Unable to save feedback" });
            }
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->createFeedback');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->createFeedback", JSON.stringify({ userId: req.user?._id, subject, description, type }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.updateFeedback = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(C) -> update feedback'
    let repliedBy = req.user?._id || '';
    const { feedbackId, reply, isReviewd } = req.body;
    try {
        let objFeedback = {
            reply: reply,
            repliedBy: repliedBy,
            isReviewd: isReviewd,
            updatedDateTime: moment.now()
        };
        let updatedFeedback = await Feedback.findByIdAndUpdate(feedbackId, objFeedback, { upsert: false, new: true });
        if (Boolean(updatedFeedback)) {
            return res.status(200).json({
                success: true,
                updatedFeedback: updatedFeedback
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Something went wrong while updating Feedback" });
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->updateFeedback');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->updateFeedback", JSON.stringify({ userId: req.user?._id, feedbackId, reply, isReviewd, repliedBy }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}


exports.deleteFeedback = async function (req, res, next) {
    // #swagger.tags = ['Feedback']	
    // #swagger.summary = '(A) -> delete Feedback'
    let feedbackId = req.params.feedbackId || '';
    try {
        let deletedFeedback = await Feedback.findByIdAndDelete(feedbackId, { select: "_id" });
        if (Boolean(deletedFeedback)) {
            return res.status(200).json({
                success: true,
                feedbackId: feedbackId
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Feedback doesn't exist." })
        }
    } catch (ex) {
        config.logger.error({ ex }, 'Error in feedbackController->deleteFeedback');
        commonDbFuncs.createApplicationLog(req.user?._id, "feedbackController->deleteFeedback", JSON.stringify({ userId: req.user?._id, feedbackId }), JSON.stringify(ex), ex?.message, ex?.toString() || "");
        return res.status(400).json({ success: false, message: ex?.message || ex });
    }
}