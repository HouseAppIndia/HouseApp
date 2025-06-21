const httpStatus = require('http-status');
const { Agent } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendOTP, deleteOtp, deleteAccount } = require('../utils/twilio');
const moment = require('moment')


const createUser = async (userBody) => {
  try {
    const { name, phone, email } = userBody;
    console.log('User Body:', userBody);

    // Check if phone already exists
    const isPhoneExists = await Agent.isMobilePhone(phone);
    if (isPhoneExists) {
      return { error: true, message: 'Phone number is already registered' };
    }

    // Generate OTP and expiry
    const otp = 123456; // In production, use random generator
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");

    // Create new agent
    const user = await Agent.create(name, phone, email);
    if (!user || !user.id) {
      return { error: true, message: 'Failed to create user' };
    }

    // Save OTP in DB
    await Agent.isSaveOtp(user.id, otp, expiresAt);

    // Send OTP (Uncomment in production)
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
    return {
      error: true,
      message: error.message || 'An error occurred while creating user'
    };
  }
};



const loginUserWithEmailAndPassword = async (phone) => {
  try {
    let user = await Agent.getUserByPhone(phone);

    // If user not found, create new
    if (!user || !user.id) {
      user = await Agent.create(phone); // update the existing `user` variable
    }

    // Send OTP
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
    return { error: true, message: "Server error while sending OTP" };
  }
};




const verifyOtp = async (phone, otp) => {
  try {
    const user = await Agent.getUserByPhone(phone);

    // Check if user exists
    if (!user || !user.id) {
      return { error: true, message: "Agent not found with this phone number" };
    }

    // Verify OTP
    const verificationResult = await Agent.getOtpByUserId(user.id, otp);

    if (verificationResult.error) {
      return { error: true, message: verificationResult.error };
    }

    return {
      success: true,
      message: verificationResult.message,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        status: user.status,
        role: user.role
      }
    };

  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return { error: true, message: "Server error during OTP verification" };
  }
};



const handleResendOtp = async (phone) => {
  try {
    const user = await Agent.getUserByPhone(phone);
    if (user.error) {
      return { error: "User not found" };
    }
    const otp = 123456 // 4-digit OTP
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");
    await Agent.isSaveOtp(user.id, otp, expiresAt);
    // await sendOTP(PHONE_NUMBER, otp);
    return { message: "OTP resent successfully" };
  } catch (err) {
    console.error("Error in handleResendOtp:", err);
    return { error: "Server error while resending OTP" };
  }
}



const deactivateUserAccount = async (user_id) => {
  try {
    const user = await Agent.getUserById(user_id);
    if (user.error) return { error: "User not found" };
    const otp = 123456
    const expiresAt = moment().add(5, "minutes").format("YYYY-MM-DD HH:mm:ss");
    await Agent.isSaveOtp(user.id, otp, expiresAt);
    await deleteOtp(user.phone, otp);
    return { message: "OTP sent to your phone for account deletion." };
  } catch (error) {
    return { message: "An error occurred while deactivating your account. Please try again later." };
  }
};


const deleteUserAccount = async (user_id, otp) => {
  try {
    // 1. Fetch user by ID
    const user = await Agent.getUserById(user_id);
    if (!user || user.error) {
      return { success: false, message: "User not found." };
    }
    const savedOtp = await Agent.getOtpByUserId(user.id, otp);
    if (!savedOtp) {
      return { success: false, message: "OTP not found. Please request a new one." };
    }

    if (savedOtp.error) {
      return { success: false, message: "Invalid OTP." };
    }
    const data = await Agent.statusUpdate(user.id);


    // 5. Send deletion confirmation via SMS
    await deleteAccount(user.name, user.phone); // Ensure deleteAccount receives phone

    return { success: true, message: "Your account has been successfully deleted." };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return { success: false, message: "An error occurred while deleting your account. Please try again later." };
  }
};


const updateProfile = async (agentId, userBody) => {
  return Agent.updateProfile(agentId, userBody)
}

const upsertOfficeAddress = async (agentId, { address, latitude, longitude }) => {
  console.log(agentId, { address, latitude, longitude })
  return Agent.UpdateAddress(agentId, { address, latitude, longitude })
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
