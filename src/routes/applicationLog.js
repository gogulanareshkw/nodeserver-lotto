const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var applicationLogController = require('../controllers/applicationLog');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");

apiRouter
    .get('/', commonAdminAuth, applicationLogController.getApplicationLogs)
    .post('/', commonAdminAuth, applicationLogController.addApplicationLog)
    .delete('/', superAdminAuth, applicationLogController.deleteOldApplicationLogs)

module.exports = apiRouter;