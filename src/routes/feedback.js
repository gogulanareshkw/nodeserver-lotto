const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var feedbackController = require('../controllers/feedback');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
	.get('/', auth, feedbackController.getUserFeedbacks)
	.get('/all', commonAdminAuth, feedbackController.getAllFeedbacks)
	.get('/pending', commonAdminAuth, feedbackController.getAllPendingFeedbacks)
	.get('/:type', commonAdminAuth, feedbackController.getAllFeedbacksByType)
	.post('/filter', auth, feedbackController.filterAllFeedbacks)
	.post('/', auth, feedbackController.createFeedback)
	.put('/', commonAdminAuth, feedbackController.updateFeedback)
	.delete('/:feedbackId', auth, feedbackController.deleteFeedback)

module.exports = apiRouter;