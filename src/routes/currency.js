const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var currencyController = require('../controllers/currency');
const superAdminAuth = require("../middlewares/superAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/public', publicAuth, currencyController.getCurrencyRatesByDate)
    .delete('/', superAdminAuth, currencyController.deleteOldCurrencyRates)

module.exports = apiRouter;