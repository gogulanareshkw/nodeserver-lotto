const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var bankCardController = require('../controllers/bankCard');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
	.get('/', auth, bankCardController.getAllBankCardsByUserId)
	.get('/:type', commonAdminAuth, bankCardController.getAllBankCardsByType)
	.post('/', auth, bankCardController.createNewBankCard)
	.put('/', auth, bankCardController.updateBankCard)
	.put('/:cardId', auth, bankCardController.makeActiveBankCard)
	.delete('/:cardId', auth, bankCardController.deleteBankCard)

module.exports = apiRouter;