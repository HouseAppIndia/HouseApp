const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, notificationService,PropertyRequestService } = require('../services');
const { bool } = require('joi');
const pool = require('../config/db.config');

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
    password: data.password,
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
  console.log("red")
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;

  const area_id = req.query.area_id && req.query.area_id !== 'null' ? req.query.area_id : null;
  const city_id = req.query.city_id && req.query.city_id !== 'null' ? req.query.city_id : null;
  const locationId = req.query.locationId && req.query.locationId !== 'null' ? req.query.locationId : null;

  const startDate = req.query.startDate && req.query.startDate !== 'null' ? req.query.startDate : null;
  const endDate = req.query.endDate && req.query.endDate !== 'null' ? req.query.endDate : null;

  console.log({ startDate, endDate });
  const agents = await userService.getAgentsWithDetails(page, pageSize, locationId,area_id,city_id,startDate,endDate);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Agents fetched successfully',
    data: agents,
  });
});


const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize,) || 10;

  const startDate = req.query.startDate !== 'null' ? req.query.startDate : null;
  const endDate = req.query.endDate !== 'null' ? req.query.endDate : null;

  const agents = await userService.getUseDetails(page, pageSize,startDate,endDate);

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

const deletedata =catchAsync(async(req,res)=>{
    const paramsId = req.params.id
    const source = req.body.source
    console.log("log")
    const declinedata =await notificationService.handleNotificationDecline(paramsId,source)
   res.status(httpStatus.OK).json({
    success: true,
    message: 'Notifications  Update successfully',
    notifications: declinedata,
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
  const range = req.query.range || 'today';
  const startDate = req.query.startDate !== 'null' ? req.query.startDate : null;
  const endDate = req.query.endDate !== 'null' ? req.query.endDate : null;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const result = await userService.fetchInteractionHistory(range, startDate, endDate, page, pageSize);
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

const deleteAgents = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "Agent ID is required" });
  }
  const [result] = await pool.execute("DELETE FROM agents WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: "Agent not found or already deleted" });
  }
  res.status(200).json({ success: true, message: "Agent deleted successfully" });
});



const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  const [result] = await pool.execute("DELETE FROM user WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: "User not found or already deleted" });
  }
  res.status(200).json({ success: true, message: "User deleted successfully" });
});


const deleteReview =catchAsync(async(req,res)=>{
   const id = req.params.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "user_review id is required" });
  }
  const [result] = await pool.execute('DELETE FROM user_review WHERE id = ?', [id]);
   if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: "user_review not found or already deleted" });
  }
  res.status(200).json({ success: true, message: "user_review deleted successfully" });

})

const getAgentViewLog =catchAsync(async(req,res)=>{
  const data =await userService.getAgentViewAnalytics()
   res.status(200).json({ success: true, data:data});
})




const getSearchActivityLogs =catchAsync(async(req,res)=>{
  const data =await userService.getFilteredSearchLogs()
   res.status(200).json({ success: true, data:data});
})


const getLocalityViewers =catchAsync(async(req,res)=>{
     const { localityId } = req.params;
     const viewers = await userService.getUsersWhoViewedLocality(localityId);
    res.status(200).json({ data: viewers });
})

const removeAgentLocationMapping =catchAsync(async (req, res)=>{
  const {agentId,localityId}=req.body;
  if (!agentId || !localityId) {
     return res.status(400).json({success:false,message:"Agent Id and Locality Id  are Required"})  }
    const data= await userService.removeAgentLocationMapping(agentId, localityId)
    return res.status(200).json({
      success: true,
      message:"Agent Working Location delete Sucessfully"   })
})
const addOrUpdateLocationController = catchAsync(async (req, res) => {
  const { agent_id, location_id, city_id, area_id } = req.body;

  if (!agent_id || !location_id || !city_id) {
    return res
      .status(400)
      .json({ success: false, message: "Required fields missing" });
  }

  const result = await userService.addWorkingLocation(
    agent_id,
    location_id,
    city_id,
    area_id ?? null // Use null if undefined
  );

  return res.status(result.success ? 200 : 409).json(result);
});
const updateAgent = catchAsync(async (req, res) => {
  const agentId = req.params.id;
  const { name, phone, agency_name, whatsapp_number, email } = req.body;

  const updateData = {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(agency_name && { agency_name }),
    ...(whatsapp_number && { whatsapp_number }),
    ...(email && { email }),
  };

  const hasDataToUpdate = Object.keys(updateData).length > 0;
  const hasImagesToAdd = req.files && req.files.length > 0;

  if (!hasDataToUpdate && !hasImagesToAdd) {
    return res.status(400).json({ message: 'No data or images provided to update' });
  }

  // Update agent data if provided
  if (hasDataToUpdate) {
    const result = await userService.updateAgentbyadmin(agentId, updateData);
    if (!result.success) {
      return res.status(409).json({ message: 'Failed to update agent data' });
    }
  }

  // Replace images if uploaded
  if (hasImagesToAdd) {
    
    const imageUrls = req.files.map(file => '/image/' + file.filename);
    await userService.addImages(agentId, imageUrls);
  }

  return res.status(200).json({ message: 'Agent updated successfully' });
});

const verifyPassword = catchAsync(async (req,res)=>{
  console.log("hello world")
  const { userId  } =req.user;
  const  {password}=req.body;
  if(!password){
    return res.status(400).json({message:"Password is required"})
  }
  const isMatch =await authService.verifyUserPassword(userId,password);
  if(!isMatch){
    return res.status(401).json({message:"Invalid password"})
  }
  res.status(200).json({message:"Password verified successfully"})
})



module.exports = {
  updateAgent,
  register,
  getLocalityViewers,
  login,
  getSearchActivityLogs,
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
  deleteUser,
  deleteReview,
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
  getAgentsDetails,
  deletedata,
  deleteAgents,
  getAgentViewLog,
  removeAgentLocationMapping,
  addOrUpdateLocationController,
  verifyPassword
};
