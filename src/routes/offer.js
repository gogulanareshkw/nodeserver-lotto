const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var offerController = require('../controllers/offer');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");

apiRouter
    .get('/', auth, offerController.getAllOffers)
    .post('/', commonAdminAuth, offerController.createNewOffer)
    .delete('/:offerId', commonAdminAuth, offerController.deleteOffer)

module.exports = apiRouter;