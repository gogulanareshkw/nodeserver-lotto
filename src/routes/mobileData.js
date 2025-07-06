const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var mobileDataController = require('../controllers/mobileData');
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
    .get('/', commonAdminAuth, mobileDataController.getAllMobileData)
    .get('/users', superAdminAuth, mobileDataController.getMobileUsers)
    .get('/:mobileDataId', commonAdminAuth, mobileDataController.getMobileDataById)
    .get('/user/:userId', commonAdminAuth, mobileDataController.getAllMobileDataByUserId)
    .post('/public', publicAuth, mobileDataController.storeMobileData)
    .post('/filter', superAdminAuth, mobileDataController.filterMobileData)
    .post('/public/filterbydeviceid', publicAuth, mobileDataController.getAllMobileDataByDeviceId)
    .post('/fav', superAdminAuth, mobileDataController.MakeFavUnYFavData)
    .post('/delete', superAdminAuth, mobileDataController.deleteMobileDataById)

module.exports = apiRouter;