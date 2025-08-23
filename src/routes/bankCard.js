const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var bankCardController = require('../controllers/bankCard');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
	.get('/', auth, bankCardController.getAllBankCardsByUserId)
	.get('/:type', commonAdminAuth, bankCardController.getAllBankCardsByType)
	.post('/', auth, bankCardController.createNewBankCard)
	.put('/:cardId', auth, bankCardController.updateBankCard)
	.put('/:cardId/active', auth, bankCardController.makeActiveBankCard)
	.delete('/:cardId', auth, bankCardController.deleteBankCard)

module.exports = apiRouter;