const httpStatus = require('http-status');
const moment = require('moment');
const { Client, AgentInteraction, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendOTP, deleteOtp, deleteAccount } = require('../utils/twilio');

const createUser = async (userBody) => {
  try {
    const PHONE_NUMBER = `+91${userBody.phone}`;
    if (await Client.isMobilePhone(PHONE_NUMBER)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
    }

    const otp = 123456;
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const user = await Client.create(PHONE_NUMBER);
    await Client.isSaveOtp(user.id, otp, expiresAt);
    return { message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const loginUserWithPhone = async (phone) => {
  try {
    let user = await Client.getPhoneNumber(phone);
    if (user.success === false) {
      user = await Client.create(phone);
    }
    const otp = 123456;
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    await Client.isSaveOtp(user.data.id || user.id, otp, expiresAt);
    return { message: 'Login OTP sent successfully' };
  } catch (error) {
    console.error('Error in loginUserWithPhone:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const verifyUserOtp = async (phone, otp) => {
  try {
    const user = await Client.getPhoneNumber(phone);
    if (!user || user.success === false) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }
    const verificationResult = await Client.getOtpByUserId(user.data.id, otp);
    if (!verificationResult || verificationResult.success === false) {
      return { success: false, message: verificationResult?.message || 'Invalid or expired OTP' };
    }
    return { user: user.data };
  } catch (error) {
    console.error('Error in verifyUserOtp:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const handleResendOtp = async (phone) => {
  try {
    const user = await Client.getPhoneNumber(phone);
    if (!user || user.success === false) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }
    const otp = 123456;
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    await Client.isSaveOtp(user.data.id, otp, expiresAt);
    return { user };
  } catch (error) {
    console.error('Error in handleResendOtp:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const updateUserProfile = async (user_id, user_data) => {
  try {
    return await Client.updateUserById(user_id, user_data);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const deactivateUserAccount = async (user_id) => {
  try {
    const user = await Client.getUserById(user_id);
    if (!user || user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    await Client.isSaveOtp(user.id, otp, expiresAt);
    await deleteOtp(user.phone, otp);
    return { message: 'OTP sent to your phone for account deletion.' };
  } catch (error) {
    console.error('Error in deactivateUserAccount:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const deleteUserAccount = async (user_id, otp) => {
  try {
    const user = await Client.getUserById(user_id);
    if (!user || user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const savedOtp = await Client.getOtpByUserId(user.id, otp);
    if (!savedOtp) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }
    await Client.statusUpdate(user.id);
    await deleteAccount(user.name, user.phone);
    return { success: true, message: 'Your account has been successfully deleted.' };
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getAgentsByLocation = async (locationId, userId) => {
  try {
    if (!locationId) throw new ApiError(httpStatus.BAD_REQUEST, 'Location ID is required');
    const result = await Client.getLimitCheck(locationId);
    const limit = result?.data_limit ?? 10;
    const agents = await Client.getAgentsByLocation(locationId, userId, limit);
    if (!agents || agents.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, `No agents found`, 'NO_AGENTS_FOUND');
    }
    return agents;
  } catch (error) {
    console.error('Error in getAgentsByLocation:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const recordUserClick = async (user_id, data) => {
  try {
    return await AgentInteraction.create(user_id, data);
  } catch (error) {
    console.error('Error in recordUserClick:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const createReview = async ({ user_id, agent_id, comment, rating, imagePaths }) => {
  try {
    return await Client.createReview({ user_id, agent_id, comment, rating, imagePaths });
  } catch (error) {
    console.error('Error in createReview:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getAllReviews = async (agent_id) => {
  try {
    return await Client.getAllReviews(agent_id);
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const updateReview = async ({ id, comment, rating }) => {
  try {
    return await Client.updateReview({ review_id: id, comment, rating });
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getReviewById = async (id) => {
  try {
    return await Client.getReviewById({ review_id: id });
  } catch (error) {
    console.error('Error in getReviewById:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getAgentsByID = async (user_id, agent_id) => {
  try {
    return await Client.getAgentById(user_id, agent_id);
  } catch (error) {
    console.error('Error in getAgentsByID:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const handleUpdateProfile = (user_id, userBody, imagePaths) => {
  return Client.updateUserById(user_id, userBody, imagePaths);
};

const retrieveActiveBanners = async (city_id) => {
  try {
    return await Client.getTodayBanners(city_id);
  } catch (error) {
    console.error('Error in retrieveActiveBanners:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const UpdatedReview = async ({ id, comment, rating }) => {
  try {
    return await Client.updateReview({ id, comment, rating });
  } catch (error) {
    console.error('Error in UpdatedReview:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getAgentsByLocationwitoutlogin = async (locationId) => {
  try {
    if (!locationId) throw new ApiError(httpStatus.BAD_REQUEST, 'Location ID is required');
    const result = await Client.getLimitCheck(locationId);
    const limit = result?.data_limit ?? 10;
    const agents = await Client.getAgentsByLocationwitoutlogin(locationId, limit);
    if (!agents || agents.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, `No agents found`, 'NO_AGENTS_FOUND');
    }
    return agents;
  } catch (error) {
    console.error('Error in getAgentsByLocationwitoutlogin:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const getUserByID = async (user_id) => {
  try {
    return await Client.getUserById(user_id);
  } catch (error) {
    console.error('Error in getUserByID:', error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

module.exports = {
  createUser,
  loginUserWithPhone,
  verifyUserOtp,
  getUserByID,
  handleResendOtp,
  updateUserProfile,
  deactivateUserAccount,
  deleteUserAccount,
  getAgentsByLocation,
  recordUserClick,
  createReview,
  getAllReviews,
  updateReview,
  getAgentsByLocationwitoutlogin,
  getReviewById,
  getAgentsByID,
  handleUpdateProfile,
  retrieveActiveBanners,
  UpdatedReview
};
