const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var testController = require('../controllers/test');

apiRouter
  .get('/public/test', testController.testGetHandler)

module.exports = apiRouter;