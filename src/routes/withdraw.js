const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var withdrawController = require('../controllers/withdraw');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const commonStaffAuth = require("../middlewares/commonStaffAuth");

apiRouter
	.get('/', commonAdminAuth, withdrawController.getAllWithdraws)
	.get('/user', auth, withdrawController.getWithdrawsByUserId)
	.post('/', auth, withdrawController.newWithdrawRequest)
	.put('/', commonStaffAuth, withdrawController.updateWithdrawStatus)

module.exports = apiRouter;