const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, agentService, tokenService, agentWorkingLocationService, emailService } = require('../services');
const { image } = require('../config/cloudinary');

const register = catchAsync(async (req, res) => {
  const { name, phone } = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  if (!/^[A-Za-z\s]+$/.test(name)) {
    return res.status(400).json({ message: 'Name must contain only alphabets and spaces.' });
  }
  const user = await agentService.createUser(req.body);
  res.status(httpStatus.CREATED).send({ user: user, });
});

const handleOtpVerification = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  const data = await agentService.verifyOtp(phone, otp)
  console.log(data)
  const tokens = await tokenService.generateAuthTokens(data.user);
  res.status(200).json({ message: data.message, tokens });
})

const regenerateOtp = catchAsync(async (req, res) => {
   const { phone} = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
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
  const { phone } = req.body;
  const user = await agentService.loginUserWithEmailAndPassword(phone);
  res.send({ user: user });
});

const UpdateProfile = async (req, res) => {
  try {
    const agentId = req.user.userId; // assume karte hain agentId body me aa rahi hai
    const updateData = req.body;   
    if (!agentId) {
      return res.status(400).json({ message: 'Agent ID is required' });
    }

      if (!req.file || !req.file.filename) {
          return res.status(400).json({
      success: false,
      message: 'Image file is required',
    });
  }

  const images = `/public/images/${req.file.filename}`;

    const success = await agentService.updateProfile(agentId, updateData, images);
    if (success) {
      return res.status(200).json({ message: 'Profile updated successfully' });
    } else {
      return res.status(404).json({ message: 'Agent not found or no changes made' });
    }
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

const AddWorkingLocation = catchAsync(async (req, res) => {
  const agentId = req.user.userId;
  const { location_id } = req.body;

  if (!Array.isArray(location_id) || location_id.length === 0) {
    return res.status(400).json({ message: 'Locations must be a non-empty array.' });
  }
  console.log(agentId, location_id)
  const result = await agentWorkingLocationService.addLocations(agentId, location_id);

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
