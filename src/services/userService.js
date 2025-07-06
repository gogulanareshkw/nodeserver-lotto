const User = require('../models/user');
const Offer = require('../models/offer');
const { 
  ValidationError, 
  ConflictError, 
  NotFoundError,
  AppError 
} = require('../utils/errorHandler');
const emailVerifier = require("../utils/emailVerifier");
const emailUtil = require('../config/emailConfig');
const commonDbFuncs = require("../utils/commonDbFuncs");
const constants = require('../config/constants');
const moment = require('moment');

class UserService {
  // Create new user account
  static async createUser(userData) {
    const { email, password, phone, confirmPassword, referredBy, latitude, longitude } = userData;

    // Validate email domain
    if (!emailVerifier.validateEmailDomain(email)) {
      throw new ValidationError('Invalid email domain');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check server status
    const gameSetting = commonDbFuncs.getGameSettings();
    if (gameSetting.isServerDown) {
      throw new AppError('Server is under maintenance', 503);
    }

    // Generate app ID
    const lastCreatedUser = await commonDbFuncs.getLastCreatedUser();
    const newAppId = Number(lastCreatedUser.appId || 1411851980) + 1;

    // Determine user role
    const superadmins = gameSetting.superAdmins ? 
      gameSetting.superAdmins.split(";") : 
      config.superadmins ? config.superadmins.split(";") : [];
    const isSuperAdmin = superadmins.includes(email.toLowerCase());

    // Create user
    const newUser = new User({
      appId: newAppId.toString(),
      email: email.toLowerCase(),
      phone: phone || "",
      userRole: isSuperAdmin ? constants.USER_ROLE_SUPER : constants.USER_ROLE_USER,
      isEmailVerified: false,
      isAgentVerified: true,
      isChangedDefaultPassword: true,
      address: { 
        latitude: latitude?.toString() || "0", 
        longitude: longitude?.toString() || "0" 
      },
      referredBy: referredBy,
      referralString: isSuperAdmin ? "" : Buffer.from(password).toString('base64'),
      activeStatus: true,
      createdDateTime: moment.now()
    });

    newUser.setPassword(password);
    const savedUser = await newUser.save();

    // Handle referral bonus
    if (referredBy) {
      await this.handleReferralBonus(savedUser, referredBy);
    }

    return this.generateAuthResponse(savedUser);
  }

  // Create agent account
  static async createAgent(agentData) {
    const { 
      email, password, confirmPassword, firstName, lastName, 
      gender, phone, latitude, longitude 
    } = agentData;

    // Validate email domain
    if (!emailVerifier.validateEmailDomain(email)) {
      throw new ValidationError('Invalid email domain');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check server status
    const gameSetting = commonDbFuncs.getGameSettings();
    if (gameSetting.isServerDown) {
      throw new AppError('Server is under maintenance', 503);
    }

    // Generate app ID
    const lastCreatedUser = await commonDbFuncs.getLastCreatedUser();
    const newAppId = Number(lastCreatedUser.appId || 1411851980) + 1;

    // Create agent
    const newAgent = new User({
      appId: newAppId.toString(),
      firstName,
      lastName,
      phone: phone || "",
      gender,
      email: email.toLowerCase(),
      userRole: constants.USER_ROLE_AGENT,
      isEmailVerified: false,
      isChangedDefaultPassword: true,
      address: { 
        latitude: latitude?.toString() || "0", 
        longitude: longitude?.toString() || "0" 
      },
      activeStatus: true,
      createdDateTime: moment.now()
    });

    newAgent.setPassword(password);
    const savedAgent = await newAgent.save();

    return this.generateAuthResponse(savedAgent);
  }

  // User login
  static async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }] 
    });

    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    if (!user.validPassword(password)) {
      throw new ValidationError('Invalid email or password');
    }

    if (user.blockedByAdmin) {
      throw new AppError('Your account has been blocked by admin', 403);
    }

    if (!user.activeStatus) {
      throw new AppError('Your account is deactivated', 403);
    }

    return this.generateAuthResponse(user);
  }

  // Get user by ID
  static async getUserById(userId, requestingUser) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check access permissions
    if (requestingUser.userRole === constants.USER_ROLE_USER && 
        user._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('Access denied', 403);
    }

    return user;
  }

  // Update user profile
  static async updateUserProfile(userId, updateData, requestingUser) {
    // Check if user can update this profile
    if (requestingUser.userRole === constants.USER_ROLE_USER && 
        userId !== requestingUser._id.toString()) {
      throw new AppError('You can only update your own profile', 403);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedDateTime: moment.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  // Get all users with pagination and filters
  static async getAllUsers(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, search, role, status } = pagination;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { appId: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.userRole = role;
    }

    if (status !== undefined) {
      query.activeStatus = status;
    }

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdDateTime: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  // Block/Unblock user
  static async toggleUserBlock(userId, blocked, adminUser) {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        blockedByAdmin: blocked,
        blockedBy: blocked ? adminUser._id : null,
        blockedAt: blocked ? moment.now() : null
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  // Handle referral bonus
  static async handleReferralBonus(newUser, referredBy) {
    const referralUser = await User.findOne({ appId: referredBy });
    if (!referralUser) return;

    const refBonusOffers = await Offer.find({ 
      type: constants.OFFER_TYPE_REFERRAL_BONUS 
    });

    const newReferralCount = referralUser.referralCount + 1;
    const matchingOffer = refBonusOffers.find(offer => 
      offer.targetValue === newReferralCount
    );

    const updateObj = {
      $inc: { referralCount: 1 }
    };

    if (matchingOffer && referralUser.userRole === constants.USER_ROLE_USER) {
      updateObj.$inc.availableAmount = Number(matchingOffer.bonusValue);
      
      // Create database history
      commonDbFuncs.createDbHistory(
        'availableAmount',
        `+${Number(matchingOffer.bonusValue).toFixed(2)}`,
        'User',
        constants.DBUPDATE_TYPE_MONEY,
        referralUser._id,
        newUser._id,
        `bonus on reaching referral target(${matchingOffer.targetValue})`
      );
    }

    await User.findByIdAndUpdate(referralUser._id, updateObj);
  }

  // Generate authentication response
  static generateAuthResponse(user) {
    const token = user.generateJWT();
    const tokenExp = user.getExpDate(token);

    return {
      token,
      tokenExpiration: tokenExp,
      user: {
        _id: user._id,
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        userRole: user.userRole,
        isEmailVerified: user.isEmailVerified,
        isAgentVerified: user.isAgentVerified,
        appId: user.appId,
        availableAmount: user.availableAmount,
        referralCount: user.referralCount
      }
    };
  }

  // Send verification email
  static async sendVerificationEmail(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send email
    const emailSent = await emailUtil.sendVerificationEmail(
      user.email,
      verificationToken
    );

    if (!emailSent) {
      throw new AppError('Failed to send verification email', 500);
    }

    return { message: 'Verification email sent successfully' };
  }

  // Verify email
  static async verifyEmail(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

    if (user.verificationToken !== token) {
      throw new ValidationError('Invalid verification token');
    }

    if (user.verificationTokenExpires < Date.now()) {
      throw new ValidationError('Verification token has expired');
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  // Forgot password
  static async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError('User with this email');
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    const emailSent = await emailUtil.sendPasswordResetEmail(
      user.email,
      resetToken
    );

    if (!emailSent) {
      throw new AppError('Failed to send password reset email', 500);
    }

    return { 
      message: 'Password reset email sent successfully',
      userId: user._id 
    };
  }

  // Reset password
  static async resetPassword(userId, token, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.passwordResetToken !== token) {
      throw new ValidationError('Invalid reset token');
    }

    if (user.passwordResetExpires < Date.now()) {
      throw new ValidationError('Reset token has expired');
    }

    user.setPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.validPassword(currentPassword)) {
      throw new ValidationError('Current password is incorrect');
    }

    user.setPassword(newPassword);
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

module.exports = UserService; 