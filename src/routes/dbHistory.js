const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var dbHistoryController = require('../controllers/dbHistory');
const superAdminAuth = require("../middlewares/superAdminAuth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const commonStaffAuth = require("../middlewares/commonStaffAuth");
const auth = require("../middlewares/auth");

apiRouter
    .get('/walletHistory', auth, dbHistoryController.getWalletHistory)
    .get('/walletHistory/:userId', commonAdminAuth, dbHistoryController.getUserWalletHistory)
    .get('/walletHistory/currentMonth/:userId', auth, dbHistoryController.getCurrentMonthUserWalletHistory)
    .get('/searchTransactions', commonStaffAuth, dbHistoryController.searchTransactionsByFields)
    .get('/usertransactionsHistory', auth, dbHistoryController.getTransactionsHistoryByUserId)
    .get('/usertransactionsHistory/:userId', commonAdminAuth, dbHistoryController.getOtherUsersTransactionsHistory)
    .get('/transactionsHistory/:statusType', commonStaffAuth, dbHistoryController.getTransactionsHistoryByPaymentStatus)
    .get('/transactionInfo/:txnId', auth, dbHistoryController.getTransactionDetailsById)
    .get('/:userId', superAdminAuth, dbHistoryController.getAllDbHistoryByUserId)
    .post('/transactionsHistory/filter', commonAdminAuth, dbHistoryController.filterTransactionsHistory)
    .post('/history', superAdminAuth, dbHistoryController.getAllDbHistoryByType)
    .post('/allTxns/filter', commonAdminAuth, dbHistoryController.getAllTransactionsListDoneByAdmin)
    .post('/cleanupCollection', superAdminAuth, dbHistoryController.cleanupDbDataByDate)
    .post('/collectionCount', superAdminAuth, dbHistoryController.collectionCountDataByDate)

module.exports = apiRouter;