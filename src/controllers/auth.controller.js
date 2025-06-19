const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, notificationService,PropertyRequestService } = require('../services');
const { bool } = require('joi');

const register = catchAsync(async (req, res) => {
  console.log(req.body)
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({ message: 'Employee is created successfully', user: user, });
});

const login = catchAsync(async (req, res) => {
  console.log(req.body)
  const { email, password } = req.body;
  console.log(email, password)
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  // 🧼 Clean the user object before sending
  const sanitizedUser = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  res.send({ message: "Welcome back! You’ve logged in successfully.", user: sanitizedUser, tokens });
});


const logout = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  await authService.logout(refreshToken);
  res.status(200).json({ message: 'Logged out f successfully' });
});


const logoutAllDevice = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });
  await authService.logoutAllDevice(refreshToken);
  res.status(200).json({ message: 'Logged out from all devices successfully' });
});


const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});



const addEmployee = catchAsync(async (req, res) => {
  const data = req.body
  const formatted = {
    name: data.name,
    dob: data.dob,
    email: data.email,
    managerId: data.managerId || null,
    role: "manager",
    password: `${data.name}@123`,
  };
  console.log(formatted)
  const user = await userService.createUser(formatted);
  res.status(httpStatus.CREATED).send({ message: 'Employee is created successfully', user: user, });
});


const getAllEmployees = catchAsync(async (req, res) => {
  console.log("hhhhh")
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize,) || 10;
  const data = await userService.getAllUser(role = "manager", page, pageSize);
  res.status(httpStatus.CREATED).send({ message: 'Employees fetched successfully', user: data, });
});


const getEmployee = catchAsync(async (req, res) => {
  console.log(req.params)
  const data = await userService.GetOneUser(req.params.id);
  res.status(httpStatus.CREATED).send({ message: 'Employees fetched successfully', user: data, });
});

const updateEmployee = catchAsync(async (req, res) => {
  const data = await userService.updateUserById(req.params.id, req.body);
  res.status(httpStatus.CREATED).send({ message: 'Employee updated successfully', user: data, });
});


const deleteEmployee = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);

  res.status(httpStatus.NO_CONTENT).send();
});



const getAllAgents = catchAsync(async (req, res) => {
  console.log(req.query, "GGGGGG")
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize,) || 10;
 const area_id = req.query.area_id ? req.query.area_id==="null"?null:req.query.area_id : null;
const city_id = req.query.city_id ? req.query.city_id==="null"?null:req.query.city_id : null;
const locationId = req.query.locationId ? req.query.locationId=="null"?null:req.query.locationId : null;
 console.log(city_id,"city_id")

  const agents = await userService.getAgentsWithDetails(page, pageSize, locationId,area_id,city_id);
  console.log(agents.data.length)

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Agents fetched successfully',
    data: agents,
  });
});


const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize,) || 10;

  const agents = await userService.getUseDetails(page, pageSize);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Agents fetched successfully',
    data: agents,
  });
});

const getAllNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.pushSystemNotification();
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notifications fetched successfully',
    notifications: notifications,
  });
})


const verifyNotification = catchAsync(async (req, res) => {
  const paramsId = req.params.id
  const source = req.body.source
  const notifications = await notificationService.handleNotificationAction(paramsId, source);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notifications  Update successfully',
    notifications: notifications,
  });
})



const DocumentDataCount = catchAsync(async (req, res) => {
  const counterdata = await notificationService.DataCount()
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Notifications  Update successfully',
    data: counterdata,
  });
})


const getNotificationCount = catchAsync(async (req, res) => {
  const count = await notificationService.getNotificationCount();

  res.status(200).json({
    status: 'success',
    message: 'Notification count fetched successfully',
    data: { count }
  });
});

const changePassword = catchAsync(async (req, res) => {
  console.log(req.user)
  const { userId } = req.user; // assuming user ID comes from auth middleware
  const { oldPassword, newPassword, confirmPassword } = req.body;
  console.log(oldPassword, newPassword, confirmPassword)


  // Check for missing fields
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide old password, new password, and confirm password.',
    });
  }

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: '⚠️ New password and confirm password do not match.',
    });
  }

  try {
    const result = await authService.changePassword(userId, oldPassword, newPassword);
    console.log(result, "admin@123")
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    let message = 'Something went wrong while changing password';

    if (error.message === 'Old password is incorrect') {
      message = '🚫 Oops! The old password you entered is incorrect. Please try again.';
    } else if (error.message === 'Employee not found') {
      message = '❗User not found. Please login again.';
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
});


const ViewProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const data = await userService.GetOneUser(userId);
  res.status(httpStatus.CREATED).send({ message: 'fetched successfully', user: data, });
});



const UpdateProfile = catchAsync(async (req, res) => {
  console.log(req.user, "jdfh")
  const { userId } = req.user;
  const data = await userService.updateUserById(userId, req.body);
  res.status(httpStatus.CREATED).send({ message: 'Employee updated successfully', user: data, });
});



const updateAgentPositions = catchAsync(async (req, res) => {
  console.log(req.body)
  const { agentId, newPosition, locationId } = req.body;
  // Check if agentId and newPosition exist
  if (agentId === '' || undefined || newPosition === '' || undefined || locationId === '') {
    return res.status(400).send({
      message: "agentId and newPosition are required fields"
    });
  }

  // Example: update user by id
  const data = await userService.updateAgentPositionsById(agentId, {
    position: newPosition,
    locationId: locationId,
  });

  res.status(200).send({
    message: data,
  });
});

const getAgentPositionHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = await userService.getAgentPositionHistory(page, limit)
  res.status(200).send({
    data
  });
})

const assignLocality = catchAsync(async (req, res) => {
  const { manager_id, locality_id } = req.body;
  if (!manager_id || !Array.isArray(locality_id) || locality_id.length === 0) {
    return res.status(400).json({
      error: "manager_id and a non-empty locality_id array are required",
    });
  }
  const result = await userService.assignLocalityToManager(manager_id, locality_id);
  res.status(201).json({ message: "Locality assigned to manager successfully", result });
})

const getEmployeeAssignedLocalities = catchAsync(async (req, res) => {
  console.log("helll")
  const result = await userService.fetchEmployeeLocalities();
  res.status(201).json({ message: "Locality assigned", result });

})
const getAllUserReviews = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.pageSize) || 10;
  const result = await userService.fetchAllUserReviews(page, limit);
  res.status(201).json({ result });
})


const getAgentInteractionLogs = catchAsync(async (req, res) => {
  const range = req.query.range || "today"

  const result = await userService.fetchInteractionHistory(range);
  res.status(201).json({ result });
})

const saveBanner = catchAsync(async (req, res) => {
 let { title, link_url, start_time, end_time, city_id, position } = req.body;
  console.log(title, link_url, start_time, end_time, city_id, position )
  if (!req.file || !req.file.filename) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required',
    });
  }

  const image_url = `/image/${req.file.filename}`;

  // Validation for all required fields
  if (!title || !link_url || !start_time || !end_time||!city_id||!position) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: title, link_url, start_time, end_time',
    });
  }
  // console.log(req.file)
  // console.log(image_url)

  // Save banner logic (replace with actual DB logic)
  const newBanner = await userService.uploadBannerWithImage({
    title,
    image_url,
    link_url,
    start_time,
    end_time,
    city_id,
    position
  });

  return res.status(201).json({
    success: true,
    message: 'Banner created successfully',
    data: newBanner,
  });
});


const fetchAllBanners = catchAsync(async (req, res) => {
  const Banner = await userService.retrieveAllBanners()
  return res.status(201).json({
    success: true,
    message: 'Banner created successfully',
    data: Banner,
  });
})

const updateBannerInfo = catchAsync(async (req, res) => {
  const { id } = req.params; // ✅ Correct destructuring
  let { title, link_url, start_time, end_time, city_id, position } = req.body;

  // Initialize updateData only with non-empty values
  const updateData = {};

  if (title) updateData.title = title;
  if (link_url) updateData.link_url = link_url;
  if (start_time) updateData.start_time = start_time;
  if (end_time) updateData.end_time = end_time;
  if(is_active) updateData.end_time = is_active;
  if(city_id) updateData.city_id=city_id
  if(position) updateData.position=position

  // If image file is uploaded, add its URL
  if (req.file) {
    updateData.image_url = `/public/image/${req.file.filename}`;
  }

  // Pass only filtered updateData to service
  const updateBanner = await userService.updateExistingBanner(id, updateData);

  return res.status(201).json({
    success: true,
    message: 'Banner updated successfully',
    data: updateBanner,
  });
})

const fetchSingleBanner = catchAsync(async (req, res) => {
  const { id } = req.params.id
  const data = await userService.getSelectedBanner(id)
  return res.status(201).json({
    success: true,
    message: 'Banner Update successfully',
    data: data,
  });
})

const fetchAllPropertyRequests = catchAsync(async (req, res) => {
  const result = await PropertyRequestService.getAllPropertyRequests();
  res.status(200).json({
    message: 'Property requests fetched successfully',
    data: result
  });
});

const getAgentsDetails = catchAsync(async (req, res) => {
  console.log("hello")
  const id = req.params.id
  if (!id) return { message: "id is required" }
  const agentdetail = await userService.getAgentsByID(id)
  res.status(200).send(agentdetail)
})



module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  logoutAllDevice,
  addEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getAllAgents,
  getAllUsers,
  getAllNotifications,
  verifyNotification,
  DocumentDataCount,
  getNotificationCount,
  changePassword,
  ViewProfile,
  UpdateProfile,
  updateAgentPositions,
  getAgentPositionHistory,
  assignLocality,
  getEmployeeAssignedLocalities,
  getAllUserReviews,
  getAgentInteractionLogs,
  saveBanner,
  fetchAllBanners,
  updateBannerInfo,
  fetchSingleBanner,
  fetchAllPropertyRequests,
  getAgentsDetails
};
