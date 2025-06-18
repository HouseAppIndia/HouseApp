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

    const otp = 123456
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    const user = await Client.create(PHONE_NUMBER);
    await Client.isSaveOtp(user.id, otp, expiresAt);
    // await sendOTP(PHONE_NUMBER, otp);

    return { message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to create user');
  }
};

const loginUserWithPhone = async (phone) => {
  try {
    const PHONE_NUMBER = `+91${phone}`;
    console.log(PHONE_NUMBER, "PHONE_NUMBER")
    let user = await Client.getPhoneNumber(PHONE_NUMBER);
    console.log(user, "jjjj")

    if (user.success == false) {

      user = await Client.create(PHONE_NUMBER);

    }

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = 123456
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    await Client.isSaveOtp(user.id, otp, expiresAt);
    // await sendOTP(PHONE_NUMBER, otp);

    return { message: 'Login OTP sent successfully' };
  } catch (error) {
    console.error('Error in loginUserWithPhone:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to login');
  }
};

const verifyUserOtp = async (phone, otp) => {
  try {
    const PHONE_NUMBER = `+91${phone}`;
    const user = await Client.getPhoneNumber(PHONE_NUMBER);

    if (!user || user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const verificationResult = await Client.getOtpByUserId(user.id, otp);
    if (!verificationResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully', user };
  } catch (error) {
    console.error('Error in verifyUserOtp:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to verify OTP');
  }
};

const resendOtp = async (phone) => {
  try {
    const PHONE_NUMBER = `+91${phone}`;
    const user = await Client.getPhoneNumber(PHONE_NUMBER);

    if (!user || user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
    const expiresAt = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    await Client.isSaveOtp(user.id, otp, expiresAt);
    await sendOTP(PHONE_NUMBER, otp);

    return { message: 'OTP resent successfully' };
  } catch (error) {
    console.error('Error in resendOtp:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to resend OTP');
  }
};

const updateUserProfile = async (user_id, user_data) => {
  try {
    return await Client.updateUserById(user_id, user_data);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update profile');
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to initiate account deactivation');
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete account');
  }
};

const getAgentsByLocation = async (locationId,userId) => {
  try {
    if (!locationId) throw new ApiError(httpStatus.BAD_REQUEST, 'Location ID is required');
     const result =await Client.getLimitCheck(locationId)
     const limit =result?.data_limit==undefined?10:result?.data_limit
     console.log(result)
     console.log(limit)

    const agents = await Client.getAgentsByLocation(locationId,userId,limit);
    if (!agents || agents.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, `No agents found for location: ${locationId}`);
    }

    return agents;
  } catch (error) {
    console.error('Error in getAgentsByLocation:', error);
    throw error;
  }
};

const recordUserClick = async (user_id, data) => {
  try {
    return await AgentInteraction.create(user_id, data);
  } catch (error) {
    console.error('Error in recordUserClick:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to record user click');
  }
};

const createReview = async ({ user_id, agent_id, comment, rating,imagePaths }) => {
  try {
    return await Client.createReview({ user_id, agent_id, comment, rating,imagePaths });
  } catch (error) {
    console.error('Error in createReview:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create review');
  }
};

const getAllReviews = async (agent_id) => {
  try {
    return await Client.getAllReviews(agent_id);
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch reviews');
  }
};

const updateReview = async ({ id, comment, rating }) => {
  try {
    return await Client.updateReview({ review_id: id, comment, rating });
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update review');
  }
};

const getReviewById = async (id) => {
  try {
    return await Client.getReviewById({ review_id: id });
  } catch (error) {
    console.error('Error in getReviewById:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get review');
  }
};




const getAgentsByID = async (id) => {
  try {
    return await Client.geAgentsById(id);
  } catch (error) {
    console.error('Error in getReviewById:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get review');
  }
};

const handleUpdateProfile =(Id, userBody)=>{
  return Client.updateUserById(Id, userBody)
}

const retrieveActiveBanners =async()=>{
  try {
     const data =await Client.getTodayBanners()
     return data
  } catch (error) {
      return error
  }
}

const UpdatedReview= async({
    id,
    comment,
    rating,
  })=>{
  try {
    const updtenow =await Client.updateReview({
    id,
    comment,
    rating,
  })
    return updtenow
  } catch (error) {
     return error
  }
}

module.exports = {
  createUser,
  loginUserWithPhone,
  verifyUserOtp,
  resendOtp,
  updateUserProfile,
  deactivateUserAccount,
  deleteUserAccount,
  getAgentsByLocation,
  recordUserClick,
  createReview,
  getAllReviews,
  updateReview,
  getReviewById,
  getAgentsByID,
  handleUpdateProfile,
  retrieveActiveBanners,
  UpdatedReview
};
