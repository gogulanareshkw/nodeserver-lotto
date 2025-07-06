const express = require('express');
const apiRouter = express.Router({ mergeParams: true });
var userController = require('../controllers/user');
const auth = require("../middlewares/auth");
const commonAdminAuth = require("../middlewares/commonAdminAuth");
const nonUserAuth = require("../middlewares/nonUserAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");
const publicAuth = require("../middlewares/publicAuth");

apiRouter
  .post('/public/create', publicAuth, userController.createUser)
  .post('/public/createAgent', publicAuth, userController.createAgent)
  .post('/public/login', publicAuth, userController.userLogin)
  .get('/ref', auth, userController.getMyReferralUsers)
  .get('/ref/:userId', commonAdminAuth, userController.getOtherUserReferrals)
  .get('/searchby', nonUserAuth, userController.filterUsers)
  .get('/sendActivationMail', auth, userController.sendActivationMail)
  .get('/verifyByAdmin/:userId', commonAdminAuth, userController.verifyUserAccountBySuperAdmin)
  .get('/searchusers', commonAdminAuth, userController.getAllAppUsers)
  .post('/verifyEmailOtp', auth, userController.verifyEmailOtp)
  .post('/changePassword', auth, userController.changePassword)
  .post('/public/forgotPassword', publicAuth, userController.forgotPassword)
  .post('/public/resetPassword', publicAuth, userController.resetPassword)
  .post('/resetPasswordByAdmin', commonAdminAuth, userController.resetPasswordByAdmin)
  .get('/:userId', auth, userController.getUserInfo)
  .get('/approveAgent/:userId', commonAdminAuth, userController.approveAgentAccount)
  .post('/updateProfile', auth, userController.updateUserProfile)
  .delete('/', auth, userController.deactivateAccount)
  .get('/', commonAdminAuth, userController.getAllUsers)
  .post('/createAccount', commonAdminAuth, userController.createAccountByAdmin)
  .post('/blockUnBlock', commonAdminAuth, userController.blockUnblockUser)
  .post('/allowSpecialDiscount', superAdminAuth, userController.updateSpecialDiscountForUser)
  .post('/recharge', nonUserAuth, userController.rechargeUser)
  .post('/deduct', commonAdminAuth, userController.deductUserBalance)
  .put('/amount', superAdminAuth, userController.updateMoneyToUserAccount)
  .post('/updateLoc', auth, userController.updateuserLocation)
  .post('/updateLocBySuperAdmin', superAdminAuth, userController.updateuserLocationBySuperAdmin)
  .delete('/:userId', superAdminAuth, userController.deleteUserById)

module.exports = apiRouter;