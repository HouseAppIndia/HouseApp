const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const employeeController = require('../../controllers/employee.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();
// router.post('/register', employeeController.register);
router.post('/login',employeeController.login);
router.post('/logout', validate(authValidation.logout), employeeController.logout);
router.post('/logout-all', validate(authValidation.logout), employeeController.logoutAllDevice);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), employeeController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), employeeController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), employeeController.resetPassword);
router.post('/verify-email', validate(authValidation.verifyEmail), employeeController.verifyEmail);
router.get('/agents',auth, employeeController.getAllAgents)
router.get('/notifications',auth,  employeeController.getAllNotifications)
router.get('/notifications/count',employeeController.getNotificationCount)

module.exports = router;

