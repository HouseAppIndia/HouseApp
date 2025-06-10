const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { ClientService, authService, tokenService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  console.log(req.body)
  const { phone } = req.body
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  const user = await ClientService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const handleOtpVerification = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  const data = await ClientService.verifyUserOtp(phone, otp)
  console.log(data.user,"hjjj")
  const tokens = await tokenService.generateAuthTokens(data.user.data);
  res.status(200).json({ message: data.message,UserId:data.user.data.id,role:data.user.data.role, tokens });
})

const regenerateOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  const data = await ClientService.handleResendOtp(phone)
  res.status(200).json(data);
})

const updateProfile = catchAsync(async (req, res) => {
  const user_id = req.user.userId;
  const userBody = req.body;

  const data = await ClientService.handleUpdateProfile(user_id, userBody);

  res.status(200).json({
    success: true,
    message: data.message || "Profile updated successfully",
    data: data.user || null
  });
});


const deleteAccountHandler = catchAsync(async (req, res) => {
  const user_id = req.user.userId;
  const data = await ClientService.deactivateUserAccount(user_id)
  res.status(200).json(data);
})


const verifyAndDeleteAccount = catchAsync(async (req, res) => {
  const { otp } = req.body
  const user_id = req.user.userId;
  const data = await ClientService.deleteUserAccount(user_id, otp)
  res.status(200).json(data);
})


const getAgentsByLocation = catchAsync(async (req, res) => {
  console.log(req.query.locationId)
   const userId = req.user.userId;
  if (!req?.query?.locationId) return res.status(httpStatus.BAD_REQUEST).json({ message: "Location is required" });
  const user = await ClientService.getAgentsByLocation(req.query.locationId,userId);
  res.status(httpStatus.CREATED).send(user);
});



const login = catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
  }
  const user = await ClientService.loginUserWithPhone(phone);
  res.send({ user: user });
});

const recordUserClick = catchAsync(async (req, res) => {
  const { agentId, click_type, clicked_from } = req.body;
  const userId = req.user?.userId;
  // Basic validation
  console.log(req.body)
  if (!agentId || !click_type) {
    return res.status(400).json({ message: 'agentId and click_type are required.' });
  }

  if (!['browser', 'mobile'].includes(clicked_from)) {
    return res.status(400).json({ message: 'clicked_from must be "browser" or "mobile".' });
  }
  const data = await ClientService.recordUserClick(userId, req.body)
  res.status(httpStatus.CREATED).send(data);
})

const createReview = catchAsync(async (req, res) => {
  console.log(req.user)
  const { agent_id, comment, rating } = req.body;
  const user_id = req.user.userId;
  // Validate input
  if (!agent_id || !rating) {
    return res.status(400).json({
      success: false,
      message: 'agent_id and rating are required',
    });
  }
  const review = await ClientService.createReview({
    user_id,
    agent_id,
    comment,
    rating,
  });

  res.status(201).json({
    success: true,
    message: review.message,
    data: {
      id: review.id,
      user_id,
      agent_id,
      comment,
      rating,
    },
  });

});

const updateReview = catchAsync(async (req, res) => {
  const id = req.params.id;  // Get the review ID from the URL parameters
  const { user_id, agent_id, comment, rating } = req.body;  // Get the review data from the request body
  console.log(id, "review_id, comment, rating",comment,rating)
  // Validate input
  if (!comment && !rating) {
    return res.status(400).json({
      success: false,
      message: 'At least one of comment or rating must be provided.',
    });
  }

  // Call the service to update the review
  const review = await ClientService.UpdatedReview({
    id,
    comment,
    rating,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found.',
    });
  }

  // Send the response
  res.status(200).json({
    success: true,
    message: review.message,
    data: {
      id: review.id,
      user_id: review.user_id,
      agent_id: review.agent_id,
      comment: review.comment,
      rating: review.rating,
    },
  });
});


const getAllReviews = catchAsync(async (req, res) => {
  console.log(req.query,"chh")
  const { agent_id } = req.query;
  console.log(agent_id)

  if (!agent_id) {
    return res.status(400).json({
      success: false,
      message: 'Agent ID is required',
    });
  }

  const review = await ClientService.getAllReviews({ agent_id });

  res.status(200).json(review);
});


const deleteReview = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getSingleReview = catchAsync(async (req, res) => {
  console.log(req.params.id)
  const data = await ClientService.getReviewById(req.params.id);
  res.send(data);
});

const getAgentsDetails = catchAsync(async (req, res) => {
  console.log("hello")
  const id = req.params.id
  if (!id) return { message: "id is required" }
  const agentdetail = await ClientService.getAgentsByID(id)
  res.status(200).send(agentdetail)
})

const getActiveBanners=catchAsync(async (req,res) => {
  const banner = await ClientService.retrieveActiveBanners()
  res.status(200).send(banner)
})

module.exports = {
  createUser,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  getSingleReview,
  login,
  getAgentsByLocation,
  recordUserClick,
  handleOtpVerification,
  regenerateOtp,
  updateProfile,
  deleteAccountHandler,
  verifyAndDeleteAccount,
  getAgentsDetails,
  getActiveBanners
};
