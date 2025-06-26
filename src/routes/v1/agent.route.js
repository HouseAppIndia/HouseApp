const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const agentController = require('../../controllers/agent.controller');
const ProfileController =require('../../controllers/profil.controller')
const userAuth = require('../../middlewares/auth');
const upload =require('../../middlewares/upload')
const uploadImage =require('../../middlewares/UploadBanner')

const router = express.Router();
router.post('/register', agentController.register);
router.post('/login', agentController.login);
router.post('/verify-otp',agentController.handleOtpVerification)
router.post('/resent-otp',agentController.regenerateOtp)
router.delete('/delete-account', userAuth, agentController.deleteAccountHandler);
router.post('/verify-delete-account', userAuth, agentController.verifyAndDeleteAccount);
router.patch('/profile-update', userAuth, uploadImage.array('image'),agentController.UpdateProfile)
router.get('/profile',userAuth,ProfileController.getAgentProfile)
router.post('/working-locations',userAuth,agentController.AddWorkingLocation)
router.get('/working-locations',userAuth,ProfileController.getAgentWorkingLocations)
router.post('/office-address',userAuth, agentController.createOrUpdateAddress);
router.get('/office-address',userAuth, ProfileController.getOfficeAddressByAgentId);
module.exports = router;

