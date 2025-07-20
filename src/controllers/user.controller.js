const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { ClientService, authService, tokenService,PropertyRequestService } = require('../services');
const pool = require('../config/db.config');
const { token } = require('morgan');
const { profile } = require('winston');

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
  const data = await ClientService.verifyUserOtp(phone, otp);
  if (data.success === false) {
    throw new ApiError(400,"OTP_VERIFICATION_FAILED","OTP_VERIFICATION_FAILED") // OTP failed
  }
    const tokens = await tokenService.generateAuthTokens(data.user);
   res.status(200).json({
    success: true,
    message: "Login successfully",
    data:data?.user,
    tokens:tokens.refresh.token,
    expires_in:tokens?.refresh?.expires
  });
})

const regenerateOtp = catchAsync(async (req, res) => {
  let  phone  = req.body.phone.trim();
    if (!phone) {
    throw new ApiError(400, "Phone number is required", "INVALID_PHONE");
  }
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone number", "INVALID_PHONE");
    }
    phone = `+91${phone}`;
  }
  const data = await ClientService.handleResendOtp(phone)
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

const updateProfile = catchAsync(async (req, res) => {
  const user_id = req.user.userId;
  const userBody = req.body;
  const imagePaths = `/image/${req.file?.filename}`
  const data = await ClientService.handleUpdateProfile(user_id, userBody,imagePaths);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: userBody,
    profile:imagePaths
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
   const userId = req.user.userId;
   if (!req?.query?.locationId) throw new ApiError(httpStatus.BAD_REQUEST, "Location ID is required", "LOCATION_ID_REQUIRED");
  const user = await ClientService.getAgentsByLocation(req.query.locationId,userId);
   res.status(200).json({
    success:true,
    message:"Agents retrieved successfully",
    user
   })
});



const login = catchAsync(async (req, res) => {
  let phone = req.body.phone?.trim();
  if (!phone) {
    throw new ApiError(400, "Phone number is required", "INVALID_PHONE");
  }
  if (!phone.startsWith('+91')) {
    if (!/^\d{10}$/.test(phone)) {
     throw new ApiError(400, "Invalid phone number", "INVALID_PHONE")
    }
    phone = `+91${phone}`;
  }
  const user = await ClientService.loginUserWithPhone(phone);
  const OTP_EXPIRY_TIME = 300; // seconds
   res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: {
      otp_sent: true,
      phone: phone.replace("+91", ""), // send plain 10-digit number
      expires_in: OTP_EXPIRY_TIME
    }
  });
});

const recordUserClick = catchAsync(async (req, res) => {
  const { agentId, click_type, clicked_from } = req.body;
  const userId =req.user.userId
  if (!agentId || !click_type) {
    throw new ApiError(httpStatus.BAD_REQUEST, "agentId and click_type are required.", "MISSING_CLICK_DATA");
  }
  if (!['browser', 'mobile'].includes(clicked_from)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'clicked_from must be "browser" or "mobile".', "INVALID_CLICKED_FROM");
  }
  const data = await ClientService.recordUserClick(userId, req.body)
  // res.status(httpStatus.CREATED).send(data);
  res.status(201).json({
    success:true,
    message:`Interaction recorded by ${click_type} successfully`
  })
})

const createReview = catchAsync(async (req, res) => {
  const { agent_id, comment, rating } = req.body;
  const user_id = req.user.userId;

  // Validate input
  if (!agent_id || !rating) {
    throw new ApiError(httpStatus.BAD_REQUEST, "agent_id and rating are required");
  }

  // Get all uploaded image paths
  const imagePaths = req.files?.map((file) => `image/${file.filename}`) || [];

  const review = await ClientService.createReview({
    user_id,
    agent_id,
    comment,
    rating,
    imagePaths,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Review added successfully",
    data: {
      id: review.id,
      user_id,
      agent_id,
      rating,
      comment,
      created_at: review.created_at,
    },
  });
});


const updateReview = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { comment, rating } = req.body;

  console.log(id, "review_id, comment, rating", comment, rating);

  // Validate input
  if (!comment && !rating) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one of comment or rating must be provided.');
  }

  // Call the service to update the review
  const review = await ClientService.UpdatedReview({
    id,
    comment,
    rating,
  });

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found.');
  }

  // Send the response
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Review updated successfully',
    data: {
      id: review.id,
      user_id: review.user_id,
      agent_id: review.agent_id,
      rating: review.rating,
      comment: review.comment,
      updated_at: review.updated_at,
    },
  });
});



const getAllReviews = catchAsync(async (req, res) => {
  const { agent_id } = req.query;
  if (!agent_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Agent ID is required");
  }
 const review = await ClientService.getAllReviews({ agent_id });

 res.status(httpStatus.OK).json({
    success: true,
    message: "Reviews retrieved successfully",
    data: review?.data || [],
    avergeReview: review?.avergeReview || 0,
    totalReviews: review?.totalReviews || 0,
  });
});


const deleteReview = catchAsync(async (req, res) => {
  
  if (!userId) {
    throw new ApiError(400, 'userId parameter is required in the URL',"userId parameter is required in the URL");
  }
  await userService.deleteUserById(req.params.userId);
   res.status(204).json({
    success:true,
    message:"Review deleted successfully",
  })
});

const getSingleReview = catchAsync(async (req, res) => {
  const reviewId = req.params.id;

  if (!reviewId) {
    throw new ApiError(400, 'Review ID is required in URL parameters');
  }

  const review = await ClientService.getReviewById(reviewId);

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  res.status(200).json({
    success: true,
    message: 'Review fetched successfully',
    data: {
      id: review.id,
      user_id: review.user_id,
      agent_id: review.agent_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    },
  });
});

const getAgentsDetails = catchAsync(async (req, res) => {
  const agent_id = req.params.id
  const user_id = req.user.userId;
  if (!agent_id) return { message: "id is required" }
  const agentdetail = await ClientService.getAgentsByID(user_id,agent_id)
  res.status(200).json({
    success: true,
   message: "Agent details retrieved successfully",
   agentdetail
  })
})


const getActiveBanners = catchAsync(async (req, res) => {
  const city_id = req.query.city_id;

  if (!city_id) {
    throw new ApiError(400, 'city_id is required in query parameters');
  }

  const banners = await ClientService.retrieveActiveBanners(city_id);

  res.status(200).json({
    success: true,
    message: 'Active banners retrieved successfully',
    data: banners,
  });
});

const createPropertyRequest = catchAsync(async (req, res) => {
  const user_id = req.user.userId;
  const {
    you_want_to,
    property_type,
    residential_type,
    location_id,
    your_requirements
  } = req.body;

  if (!you_want_to || !property_type) {throw new ApiError(400, 'Both you_want_to and property_type are required')}

  const data = {
    user_id,
    you_want_to,
    property_type,
    residential_type,
    location_id,
    your_requirements
  };
 console.log("hello")
  const result = await PropertyRequestService.createPropertyRequest(data);

   res.status(201).json({
    success: true,
    message: 'Property request created successfully',
    data: result
  });
});


const getAgentsByLocationwitoutlogin =catchAsync(async(req,res)=>{
   if (!req?.query?.locationId) throw new ApiError(httpStatus.BAD_REQUEST, "Location ID is required", "LOCATION_ID_REQUIRED");
  const user = await ClientService.getAgentsByLocationwitoutlogin(req.query.locationId);
    res.status(200).json({
    success:true,
    message:"Public agents retrieved successfully",
    user
   })
})


const getUserDetail = catchAsync(async (req, res) => {
  const User_id = req.params.id
  if (!User_id) return { message: "id is required" }
  const agentdetail = await ClientService.getUserByID(User_id)
  res.status(200).send(agentdetail)
})

const handleGoogleCallback = async (req, res) => {
  try {
    const profile = req.user;
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const profilePic = profile.photos[0]?.value;

    // 1. Check if user already exists
    const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
    let user;

    if (rows.length === 0) {
      // 2. If not, create new user
      const [result] = await pool.execute(
        'INSERT INTO user (name, email, profile, status, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, profilePic, true, 'users']
      );
      user = {
        id: result.insertId,
        name,
        email,
        profile: profilePic,
        role: 'users',
      };
    } else {
      // 3. If user exists, use it
      user = rows[0];
    }
     const tokens = await tokenService.generateAuthTokens(user);

    // 5. Send response
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user,
      tokens,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



module.exports = {
  createUser,
  createReview,
  getUserDetail,
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
  getActiveBanners,
  createPropertyRequest,
  getAgentsByLocationwitoutlogin,
  handleGoogleCallback 
};
