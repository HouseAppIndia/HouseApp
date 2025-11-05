const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const SponserController =require('../../controllers/sponsorships.controller')
const uploadImage =require('../../middlewares/UploadBanner')

const auth = require('../../middlewares/auth');
console.log("TEST DEBUG");

const router = express.Router();
router.post('/register', authController.register);
router.post('/login',  authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/logout-all', validate(authValidation.logout), authController.logoutAllDevice);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
// router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/employee', authController.addEmployee);
router.get('/employee',authController.getAllEmployees)
router.get('/employee/:id', authController.getEmployee);
router.put('/employee/:id', authController.updateEmployee);
router.delete('/employee/:id', authController.deleteEmployee);
router.post('/assign',authController.assignLocality)
router.get('/employees-localities',authController.getEmployeeAssignedLocalities)
router.get('/agents', authController.getAllAgents);
router.get('/users',authController.getAllUsers)
router.get('/notifications',authController.getAllNotifications)
router.put('/notifications/:id/approve',authController.verifyNotification)
router.delete('/notifications/:id/decline',authController.deletedata)
router.get('/count',authController.DocumentDataCount)
router.get('/notifications/count',authController.getNotificationCount)
router.post('/change-password',auth, authController.changePassword);
router.route('/profile').get(auth,authController.ViewProfile).put(auth,authController.UpdateProfile)
router.route('/update-positions').put(auth,authController.updateAgentPositions)
router.route('/position-history-agents').get(authController.getAgentPositionHistory)
router.route('/reviews').get(authController.getAllUserReviews)
router.route('/interactions').get(authController.getAgentInteractionLogs)
router.route('/banners').post(uploadImage.single("image"),authController.saveBanner).get(authController.fetchAllBanners)
router.route('/banners/:id').patch(uploadImage.single("image"),authController.updateBannerInfo).get(authController.fetchSingleBanner)
router.route('/propteryrequest').get(authController.fetchAllPropertyRequests)
router.route('/agent-detail/:id').get(authController.getAgentsDetails)
router.route('/agent-detail/:id').delete(authController.deleteAgents)
router.route('/users-detail/:id').delete(authController.deleteUser)
router.route('/review/:id').delete(authController.deleteReview)
router.route('/agents/:agentId/sponsorships').post(SponserController.createSponsorship)
router.route('/agent-view-log').get(authController.getAgentViewLog)
router.route('/search-activity-log').get(authController.getSearchActivityLogs)
router.route('/locality-viewers/:localityId').get(authController.getLocalityViewers)
router.route('/remove-agent-location').delete(authController.removeAgentLocationMapping)
router.route('/add-agent-location').post(authController.addOrUpdateLocationController)
router.put('/agents/:id', uploadImage.array('images', 5), authController.updateAgent);
router.route('/verify_password').post(authController.verifyPassword)
module.exports = router;

