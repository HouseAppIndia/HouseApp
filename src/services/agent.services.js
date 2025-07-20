const httpStatus = require('http-status');
const { Agent } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendOTP, deleteOtp, deleteAccount } = require('../utils/twilio');
const moment = require('moment');

const createUser = async (userBody) => {
  try {
    const { name, phone, email } = userBody;
    console.log('User Body:', userBody);

    const isPhoneExists = await Agent.isMobilePhone(phone);
    if (isPhoneExists) {
      return { error: true, message: 'Phone number is already registered' };
    }

    const otp = 123456;
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");

    const user = await Agent.create(name, phone, email);
    if (!user || !user.id) {
      return { error: true, message: 'Failed to create user' };
    }

    await Agent.isSaveOtp(user.id, otp, expiresAt);
    // await sendOTP(phone, otp);

    return {
      success: true,
      message: "OTP sent successfully",
      data: {
        agentId: user.id,
        phone: phone,
      }
    };
  } catch (error) {
    console.error("Error in createUser:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const loginUserWithEmailAndPassword = async (phone) => {
  try {
    let user = await Agent.getUserByPhone(phone);

    if (!user || !user.id) {
      user = await Agent.create(phone);
    }

    const otp = 123456;
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");
    await Agent.isSaveOtp(user.id, otp, expiresAt);

    return {
      success: true,
      message: "Login OTP sent successfully",
      data: {
        phone: user.phone,
      }
    };
  } catch (err) {
    console.error("Error in loginUserWithEmailAndPassword:", err);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const verifyOtp = async (phone, otp) => {
  try {
    const user = await Agent.getUserByPhone(phone);
    if (!user || user.success === false) {
      throw new ApiError(httpStatus.NOT_FOUND, "We couldn't find a user with the provided phone number.", "USER_NOT_FOUND");
    }

    const verificationResult = await Agent.getOtpByUserId(user.id, otp);
    if (!verificationResult || verificationResult.success === false) {
      return {
        success: false,
        message: verificationResult?.message || 'Invalid or expired OTP'
      };
    }

    return {
      user: user.data
    };
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const handleResendOtp = async (phone) => {
  try {
    const user = await Agent.getUserByPhone(phone);
    if (!user || user.success === false) {
      throw new ApiError(httpStatus.NOT_FOUND, "We couldn't find a user with the provided phone number.", "USER_NOT_FOUND");
    }

    const otp = 123456;
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");
    await Agent.isSaveOtp(user.id, otp, expiresAt);

    return { user: user };
  } catch (err) {
    console.error("Error in handleResendOtp:", err);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const deactivateUserAccount = async (user_id) => {
  try {
    const user = await Agent.getUserById(user_id);
    if (user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }

    const otp = 123456;
    const expiresAt = moment().add(5, "minutes").format("YYYY-MM-DD HH:mm:ss");
    await Agent.isSaveOtp(user.id, otp, expiresAt);
    await deleteOtp(user.phone, otp);

    return { message: "OTP sent to your phone for account deletion." };
  } catch (error) {
    console.error("Error in deactivateUserAccount:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const deleteUserAccount = async (user_id, otp) => {
  try {
    const user = await Agent.getUserById(user_id);
    if (!user || user.error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
    }

    const savedOtp = await Agent.getOtpByUserId(user.id, otp);
    if (!savedOtp) {
      return { success: false, message: "OTP not found. Please request a new one." };
    }

    if (savedOtp.error) {
      return { success: false, message: "Invalid OTP." };
    }

    const data = await Agent.statusUpdate(user.id);
    await deleteAccount(user.name, user.phone);

    return { success: true, message: "Your account has been successfully deleted." };
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


const updateProfile = async (agentId, userBody) => {
  try {
    return await Agent.updateProfile(agentId, userBody);
  } catch (err) {
    console.error("Error in updateProfile:", err);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const upsertOfficeAddress = async (agentId, { address, latitude, longitude }) => {
  try {
    console.log(agentId, { address, latitude, longitude });
    return await Agent.UpdateAddress(agentId, { address, latitude, longitude });
  } catch (err) {
    console.error("Error in upsertOfficeAddress:", err);
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};


module.exports = {
  createUser,
  loginUserWithEmailAndPassword,
  updateProfile,
  verifyOtp,
  handleResendOtp,
  deactivateUserAccount,
  deleteUserAccount,
  upsertOfficeAddress
};
