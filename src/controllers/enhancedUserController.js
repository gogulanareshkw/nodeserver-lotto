const { body } = require('express-validator');
const { 
  asyncHandler, 
  sendSuccessResponse, 
  validateRequest 
} = require('../utils/errorHandler');
const UserService = require('../services/userService');
const { 
  publicAuth, 
  userAuth, 
  adminAuth, 
  superAdminAuth,
  requireOwnership 
} = require('../middlewares/enhancedAuth');
const User = require('../models/user');

// Validation schemas
const createUserValidation = [
  body('email', 'Enter a valid email address').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
    return value === req.body.password;
  }),
  body('phone').optional().isMobilePhone(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 })
];

const createAgentValidation = [
  body('firstName', 'First name is required').notEmpty().trim(),
  body('lastName', 'Last name is required').notEmpty().trim(),
  body('gender', 'Gender is required').isIn(['Male', 'Female']),
  body('phone', 'Phone number is required').notEmpty(),
  body('email', 'Enter a valid email address').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
    return value === req.body.password;
  }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 })
];

const loginValidation = [
  body('email', 'Enter a valid email address').isEmail().normalizeEmail(),
  body('password', 'Password is required').notEmpty()
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('gender').optional().isIn(['Male', 'Female']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 })
];

const changePasswordValidation = [
  body('currPassword', 'Current password is required').notEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
  body('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
    return value === req.body.newPassword;
  })
];

const forgotPasswordValidation = [
  body('email', 'Enter a valid email address').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('userId', 'User ID is required').notEmpty(),
  body('OTP', 'OTP is required').notEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

// Controller methods
const createUser = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(P) -> Create new user account'
  
  const result = await UserService.createUser(req.body);
  sendSuccessResponse(res, result, 'User created successfully', 201);
});

const createAgent = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(P) -> Create new agent account'
  
  const result = await UserService.createAgent(req.body);
  sendSuccessResponse(res, result, 'Agent registration submitted successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(P) -> User login'
  
  const result = await UserService.loginUser(req.body);
  sendSuccessResponse(res, result, 'Login successful');
});

const getUserInfo = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Get user information'
  
  const userId = req.params.userId || req.user._id;
  const user = await UserService.getUserById(userId, req.user);
  sendSuccessResponse(res, user, 'User information retrieved successfully');
});

const updateProfile = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Update user profile'
  
  const userId = req.params.userId || req.user._id;
  const user = await UserService.updateUserProfile(userId, req.body, req.user);
  sendSuccessResponse(res, user, 'Profile updated successfully');
});

const getAllUsers = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Get all users with pagination and filters'
  
  const { page, limit, search, role, status } = req.query;
  const filters = { search, role, status };
  const pagination = { page: parseInt(page), limit: parseInt(limit) };
  
  const result = await UserService.getAllUsers(filters, pagination);
  sendSuccessResponse(res, result.users, 'Users retrieved successfully', 200, result.pagination);
});

const toggleUserBlock = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Block/Unblock user'
  
  const { userId } = req.params;
  const { blocked } = req.body;
  
  const user = await UserService.toggleUserBlock(userId, blocked, req.user);
  const action = blocked ? 'blocked' : 'unblocked';
  sendSuccessResponse(res, user, `User ${action} successfully`);
});

const sendVerificationEmail = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Send verification email'
  
  const result = await UserService.sendVerificationEmail(req.user._id);
  sendSuccessResponse(res, result, result.message);
});

const verifyEmail = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Verify email with OTP'
  
  const { OTP } = req.body;
  const result = await UserService.verifyEmail(req.user._id, OTP);
  sendSuccessResponse(res, result, result.message);
});

const forgotPassword = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(P) -> Forgot password'
  
  const result = await UserService.forgotPassword(req.body.email);
  sendSuccessResponse(res, result, result.message);
});

const resetPassword = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(P) -> Reset password with OTP'
  
  const { userId, OTP, newPassword } = req.body;
  const result = await UserService.resetPassword(userId, OTP, newPassword);
  sendSuccessResponse(res, result, result.message);
});

const changePassword = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Change password'
  
  const { currPassword, newPassword } = req.body;
  const result = await UserService.changePassword(req.user._id, currPassword, newPassword);
  sendSuccessResponse(res, result, result.message);
});

const getMyReferrals = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Get user referrals'
  
  const referrals = await User.find({ referredBy: req.user.appId })
    .select('appId firstName lastName email createdDateTime')
    .sort({ createdDateTime: -1 });
  
  sendSuccessResponse(res, referrals, 'Referrals retrieved successfully');
});

const getReferralStats = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Get user referral statistics'
  
  const [referralCount, totalEarnings] = await Promise.all([
    User.countDocuments({ referredBy: req.user.appId }),
    User.aggregate([
      { $match: { referredBy: req.user.appId } },
      { $group: { _id: null, total: { $sum: '$availableAmount' } } }
    ])
  ]);
  
  const stats = {
    referralCount,
    totalEarnings: totalEarnings[0]?.total || 0,
    referralCode: req.user.appId
  };
  
  sendSuccessResponse(res, stats, 'Referral statistics retrieved successfully');
});

const deactivateAccount = asyncHandler(async (req, res) => {
  // #swagger.tags = ['User']	
  // #swagger.summary = '(A) -> Deactivate user account'
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 
      activeStatus: false,
      deactivatedAt: new Date()
    },
    { new: true }
  ).select('-password');
  
  sendSuccessResponse(res, user, 'Account deactivated successfully');
});

// Export controller methods with middleware
module.exports = {
  // Public endpoints
  createUser: [publicAuth, validateRequest(createUserValidation), createUser],
  createAgent: [publicAuth, validateRequest(createAgentValidation), createAgent],
  login: [publicAuth, validateRequest(loginValidation), login],
  forgotPassword: [publicAuth, validateRequest(forgotPasswordValidation), forgotPassword],
  resetPassword: [publicAuth, validateRequest(resetPasswordValidation), resetPassword],
  
  // Authenticated endpoints
  getUserInfo: [userAuth, getUserInfo],
  updateProfile: [userAuth, validateRequest(updateProfileValidation), updateProfile],
  sendVerificationEmail: [userAuth, sendVerificationEmail],
  verifyEmail: [userAuth, validateRequest([body('OTP').notEmpty()]), verifyEmail],
  changePassword: [userAuth, validateRequest(changePasswordValidation), changePassword],
  getMyReferrals: [userAuth, getMyReferrals],
  getReferralStats: [userAuth, getReferralStats],
  deactivateAccount: [userAuth, deactivateAccount],
  
  // Admin endpoints
  getAllUsers: [adminAuth, getAllUsers],
  toggleUserBlock: [adminAuth, toggleUserBlock]
}; 