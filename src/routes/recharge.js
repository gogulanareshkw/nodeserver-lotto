const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var rechargeController = require('../controllers/recharge');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const commonStaffAuth = require("../middlewares/commonStaffAuth");
const nonUserAuth = require("../middlewares/nonUserAuth");

apiRouter
	.get('/', commonAdminAuth, rechargeController.getAllRecharges)
	.get('/user', auth, rechargeController.getRechargesByUserId)
    .get('/list/:userId', nonUserAuth, rechargeController.getRechargeListDoneByAgentOrAdmin)
	.post('/', auth, rechargeController.newRechargeRequest)
	.put('/', commonStaffAuth, rechargeController.updateRechargeStatus)

module.exports = apiRouter;