const httpStatus = require('http-status');
const { Agent } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendOTP, deleteOtp, deleteAccount } = require('../utils/twilio');
const moment = require('moment')


const createUser = async (userBody) => {
  try {
    const name = userBody.name;
    const PHONE_NUMBER = `+91${userBody.phone}`;

    const isPhoneExists = await Agent.isMobilePhone(PHONE_NUMBER);
    if (isPhoneExists) {
      return { error: true, message: 'Phone number is already registered' };
    }

    const otp = 123456;
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");

    // Create new agent
    const user = await Agent.create(name, PHONE_NUMBER);
    if (!user || !user.id) {
      return { error: true, message: 'Failed to create user' };
    }

    // Save OTP to database
    await Agent.isSaveOtp(user.id, otp, expiresAt);

    // Send OTP via SMS (uncomment in production)
    // await sendOTP(PHONE_NUMBER, otp);

    return {
      success: true,
      message: "OTP sent successfully",
      data: {
        agentId: user.id,
        phone: PHONE_NUMBER
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
    const PHONE_NUMBER = `+91${phone}`;

    // Check if user exists
    let user = await Agent.getUserByPhone(PHONE_NUMBER);

    // If user does not exist, create one
    if (!user) {
      const defaultName = "New Agent"; // or get name from input if available
      user = await Agent.create(defaultName, PHONE_NUMBER);

      if (!user || !user.id) {
        return { error: true, message: "Failed to auto-create agent" };
      }
    }
    console.log(user)

    // Generate OTP and expiry
    const otp = 123456;
    const expiresAt = moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss");

    // Save OTP to DB
    await Agent.isSaveOtp(user.id, otp, expiresAt);

    return {
      success: true,
      message: "Login OTP sent successfully",
      data: {
        agentId: user.id,
        phone: user.phone,
        // otp // optional: return for development
      }
    };

  } catch (err) {
    console.error("Error in loginUserWithEmailAndPassword:", err);
    return { error: true, message: "Server error while sending OTP" };
  }
};




const verifyOtp = async (phone, otp) => {
  try {
    const PHONE_NUMBER = `+91${phone}`;
    const user = await Agent.getUserByPhone(PHONE_NUMBER);

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
    const PHONE_NUMBER = `+91${phone}`;
    const user = await Agent.getUserByPhone(PHONE_NUMBER);
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


const updateProfile = async (agentId, userBody, images) => {
  return Agent.updateProfile(agentId, userBody, images)
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
