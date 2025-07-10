const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, agentService, tokenService, agentWorkingLocationService, emailService } = require('../services');
const { image } = require('../config/cloudinary');

const register = catchAsync(async (req, res) => {
  let {phone } = req.body;
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
    phone:req.body.phone
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
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    phone = `+91${phone}`;
  }
  const data = await agentService.verifyOtp(phone, otp)
   // Check for success flag in returned data
  if (data.success === false) {
    return res.status(400).json({ message: data.message }); // OTP failed
  }
  const tokens = await tokenService.generateAuthTokens(data.user);
  res.status(200).json({ message: data.message, agentId: data.user.id, role: data.user.role, tokens });
})

const regenerateOtp = catchAsync(async (req, res) => {
  let { phone } = req.body;
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    phone = `+91${phone}`;
  }
  const data = await agentService.handleResendOtp(phone)
  res.status(200).json(data);
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
  let { phone } = req.body;
  phone = phone.trim();
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    phone = `+91${phone}`;
  }
  const user = await agentService.loginUserWithEmailAndPassword(phone);
  res.send({ user: user });
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
      return res.status(400).json({
        success: false,
        message: 'At least one image file is required',
      });
    }

    // Store all image paths
    const imagePaths = req.files.map(file => `image/${file.filename}`);

    // Save as array or comma-separated string, depending on your DB design
    updateData.images = imagePaths
    console.log(imagePaths) // or imagePaths.join(',') if you're storing as CSV
    console.log(updateData)
      
    // Now call the update service with all form data + images
    const success = await agentService.updateProfile(agentId, updateData);

    if (success) {
      return res.status(200).json({ message: 'Profile updated successfully' });
    } else {
      return res.status(404).json({ message: 'Agent not found or no changes made' });
    }
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const AddWorkingLocation = catchAsync(async (req, res) => {
  const agentId = req.user.userId;
  const { location } = req.body;

  if (!Array.isArray(location) || location.length === 0) {
    return res.status(400).json({ message: 'Locations must be a non-empty array.' });
  }
  console.log(agentId, location)
  const result = await agentWorkingLocationService.addLocations(agentId, location);

  if (result) {
    res.status(201).json({ message: 'Locations added successfully', locations: result });
  } else {
    res.status(500).json({ message: 'Failed to add locations' });
  }
});

// const logout = catchAsync(async (req, res) => {
//   const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
//   await authService.logout(refreshToken);
//   res.status(200).json({ message: 'Logged out f successfully' });
// });



const createOrUpdateAddress = catchAsync(async (req, res) => {
  try {
    const agentId = req.user.userId;
    const result = await agentService.upsertOfficeAddress(agentId, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
