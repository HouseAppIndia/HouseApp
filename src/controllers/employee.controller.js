const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  const data = req.body
  const formatted = {
    FirstName: data.FirstName,
    LastName: data.LastName,
    DOB: data.DOB,
    EmailId: data.EmailId,
    ManagerId: 0,
    Role: "manager",
    Status: true,
    Password: req.body.Password,
  };
  const user = await userService.createUser(formatted);
  res.status(httpStatus.CREATED).send({ message: 'Employee is register successfully', user: user, });
});

const login = catchAsync(async (req, res) => {
  console.log(req.body)
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  console.log(user, "Password")
  const tokens = await tokenService.generateAuthTokens(user);
  // 🧼 Clean the user object before sending
  

  res.send({ user: user, tokens });
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


const getAllAgents = catchAsync(async (req, res) => {
  console.log(req.user,"kkk")
  const id = req.user?.userId || req.query?.id;
  if (!id) {
    return res.status(404).json({ message: "Employee not exists" });
  }

  const data = await userService.getAllAgentsLocalitieWise(id);

  if (!data || data.length === 0) {
    return res.status(204).send(); // No Content
  }

  res.status(200).json(data);
})



const updateAgentPositions = catchAsync(async (req, res) => {
  // console.log(req.body)
  // const { agentId, newPosition } = req.body;

  // // Check if agentId and newPosition exist
  // if (agentId === '' || undefined || newPosition === '' || undefined) {
  //   return res.status(400).send({
  //     message: "agentId and newPosition are required fields"
  //   });
  // }

  // // Example: update user by id
  // const data = await userService.updateAgentPositionsById(agentId, { position: newPosition });

  // res.status(200).send({
  //   message: data,
  // });
});


const getAllNotifications = catchAsync(async (req, res) => {
  const id = req.user?.userId || req.query?.id;
  console.log(id,"kkkk")
  if (!id) {
    return res.status(404).json({ message: "Employee not exists" });
  }

  const data = await userService.getAllNotificationLocalitieWise(id);
  console.log(data)

  if (!data || data.length === 0) {
    return res.status(204).send(); // No Content
  }

  res.status(httpStatus.OK).json({
     success: true,
     message: 'Notifications fetched successfully',
     notifications: data?.data,
   });

})

const verifyNotification = catchAsync(async (req, res) => {

})

const DocumentDataCount = catchAsync(async (req, res) => {

})



const changePassword = catchAsync(async (req, res) => {

})


const getNotificationCount = catchAsync(async (req, res) => {
  const id = req.user?.id || req.query?.id;
  if (!id) {
    return res.status(404).json({ message: "Employee not exists" });
  }

  const data = await userService.getAllNotificationLocalitieWise(id);

  if (!data || data.length === 0) {
    return res.status(204).send(); // No Content
  }

  res.status(200).json(data);
})

const ViewProfile = catchAsync(async (req, res) => {

})
const UpdateProfile = catchAsync(async (req, res) => {

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
  updateAgentPositions,
  getAllAgents,
  getAllNotifications,
  verifyNotification,
  DocumentDataCount,
  getNotificationCount,
  changePassword,
  ViewProfile,
  UpdateProfile
};
