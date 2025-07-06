const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var helpLinkController = require('../controllers/helpLink');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
	.get('/', auth, helpLinkController.getAllHelpLinks)
	.post('/', commonAdminAuth, helpLinkController.createHelpLink)
	.put('/', commonAdminAuth, helpLinkController.updateHelpLink)
	.delete('/:helpLinkId', commonAdminAuth, helpLinkController.deleteHelpLink)

module.exports = apiRouter;