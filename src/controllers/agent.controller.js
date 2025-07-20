const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, agentService, tokenService, agentWorkingLocationService, emailService } = require('../services');
const { image } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  let { phone } = req.body;
  console.log('Body:', req.body);
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }



  phone = phone.trim();
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    phone = `+91${phone}`;
  }

  if (!/^\+91\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Invalid phone number format.' });
  }


  // Validate image


  // Prepare payload
  const userData = {
    phone: req.body.phone
  };

  // Call service to create agent
  const user = await agentService.createUser(userData);

  return res.status(201).json({
    success: true,
    message: 'Agent registered successfully.',
    user,
  });
});



const handleOtpVerification = catchAsync(async (req, res) => {
  let { phone, otp } = req.body;

  phone = phone?.trim();
  if (!phone) {
    throw new ApiError(400, "Phone number is required", "INVALID_PHONE");
  }

  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone number", "INVALID_PHONE");
    }
    phone = `+91${phone}`;
  }

  // ✅ Validate OTP
  if (!otp) {
    throw new ApiError(400, "OTP is required", "OTP_REQUIRED");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, "OTP must be numeric (6 digits)", "INVALID_OTP");
  }

  const data = await agentService.verifyOtp(phone, otp)
  // Check for success flag in returned data
  if (data.success === false) {
    throw new ApiError(400, "OTP_VERIFICATION_FAILED", "OTP_VERIFICATION_FAILED") // OTP failed // OTP failed
  }
  console.log(data)
  const tokens = await tokenService.generateAuthTokens(data.user);
  console.log(tokens)
  res.status(200).json({
    success: true,
    message: "Login successfully",
    data: data?.user,
    tokens: tokens.refresh.token,
    expires_in: tokens?.refresh?.expires
  });
})

const regenerateOtp = catchAsync(async (req, res) => {
  let phone = req.body.phone.trim();
  if (!phone) {
    throw new ApiError(400, "Phone number is required", "INVALID_PHONE");
  }
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone number", "INVALID_PHONE");
    }
    phone = `+91${phone}`;
  }
  const data = await agentService.handleResendOtp(phone)
  res.status(200).json({
    success: true,
    message: "A new OTP has been sent to your registered phone number.",
    data: {
      otp_sent: true,
      phone: phone.replace('+91', ''),
      expires_in: 300 // or return from service
    }
  });
})


const deleteAccountHandler = catchAsync(async (req, res) => {
  const user_id = req.user.userId;
  const data = await agentService.deactivateUserAccount(user_id)
  res.status(200).json(data);
})


const verifyAndDeleteAccount = catchAsync(async (req, res) => {
  const { otp } = req.body
  const user_id = req.user.userId;
  const data = await agentService.deleteUserAccount(user_id, otp)
  res.status(200).json(data);
})

const login = catchAsync(async (req, res) => {
  let phone = req.body.phone?.trim();

  if (!phone) {
    throw new ApiError(400, "Phone number is required", "INVALID_PHONE");
  }

  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Phone number must be exactly 10 digits", "INVALID_PHONE");
    }
    phone = `+91${phone}`;
  }

  const user = await agentService.loginUserWithEmailAndPassword(phone);

  const OTP_EXPIRY_TIME = 300; // seconds
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: {
      otp_sent: true,
      phone: phone.replace("+91", ""),
      expires_in: OTP_EXPIRY_TIME,
    }
  });

});

const UpdateProfile = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const updateData = req.body;

    // Debugging logs
    console.log('Uploaded Files:', req.files);
    console.log('Form Data:', updateData);

    if (!agentId) {
      return res.status(400).json({ message: 'Agent ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(400,"At least one image file is required","At least one image file is required'")
    }

    // Store all image paths
    const imagePaths = req.files.map(file => `image/${file.filename}`);

    // Save as array or comma-separated string, depending on your DB design
    updateData.images = imagePaths
    console.log(imagePaths) // or imagePaths.join(',') if you're storing as CSV
    console.log(updateData)

    // Now call the update service with all form data + images
    const success = await agentService.updateProfile(agentId, updateData);

     res.status(200).json({
       success:true,
       message:"Agent profile updated successfully",
       data:req.body,
       profile_image:imagePaths

     })
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const AddWorkingLocation = catchAsync(async (req, res) => {
  const agentId = req.user.userId;
  const { location } = req.body
  if (!Array.isArray(location) || location.length === 0) {
    throw new ApiError(400,"Locations must be a non-empty array","Locations must be a non-empty")
  }
  const result = await agentWorkingLocationService.addLocations(agentId, location);
   res.status(201).json({
    success: true,
    message: 'Working locations have been added successfully.',
    locations: result
  });
});




const createOrUpdateAddress = catchAsync(async (req, res) => {
   const result = await agentService.upsertOfficeAddress(agentId, req.body);
   res.status(200).json({
    success:true,
    message:"Office Address Update Sucessfuly",
    result
   })
})





module.exports = {
  register,
  login,
  UpdateProfile,
  AddWorkingLocation,
  handleOtpVerification,
  regenerateOtp,
  createOrUpdateAddress,
  deleteAccountHandler,
  verifyAndDeleteAccount,

  //   logout,
};
