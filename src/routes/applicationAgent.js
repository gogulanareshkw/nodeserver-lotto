const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var applicationAgentController = require('../controllers/applicationAgent');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const auth = require("../middlewares/auth");

apiRouter
    .post('/filter', auth, applicationAgentController.filterAllApplicationAgents)
    .post('/', commonAdminAuth, applicationAgentController.addApplicationAgent)
    .put('/', commonAdminAuth, applicationAgentController.updateApplicationAgent)
    .delete('/:agentId', commonAdminAuth, applicationAgentController.deleteApplicationAgentById)

module.exports = apiRouter;