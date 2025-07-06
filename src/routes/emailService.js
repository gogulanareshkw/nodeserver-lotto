const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var emailServiceController = require('../controllers/emailService');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");

apiRouter
	.delete('/', superAdminAuth, emailServiceController.deleteOldEmailsHistory)
	.post('/', commonAdminAuth, emailServiceController.FilterEmails)

module.exports = apiRouter;