const express = require('express');
const userAuth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const bookmarkController =require('../../controllers/bookmark.controller')

const router = express.Router();


router.post('/register', userController.createUser);
router.post('/login', userController.login);
router.post('/verify-otp', userController.handleOtpVerification)
router.post('/resent-otp', userController.regenerateOtp)
router.patch('/profile', userAuth, userController.updateProfile);
router.get("/by-location", userController.getAgentsByLocation)
router.get("/agent-detail/:id", userController.getAgentsDetails)
router.post("/interactions/click", userAuth, userController.recordUserClick);
router.delete('/delete-account', userAuth, userController.deleteAccountHandler);
router.post('/verify-delete-account', userAuth, userController.verifyAndDeleteAccount);
router
  .route('/reviews')
  .post(userAuth, userController.createReview)
  .get(userAuth, userController.getAllReviews);

// Routes for /reviews/:id
router
  .route('/reviews/:id')
  .patch(userAuth, userController.updateReview)
  .delete(userAuth, userController.deleteReview)
  .get(userAuth, userController.getSingleReview);

router
.route('/banners/active')
.get(userController.getActiveBanners)

router.get('/bookmark', userAuth, bookmarkController.getBookmarks);
router.post('/bookmark', userAuth, bookmarkController.addBookmark);
router.delete('/bookmark', userAuth, bookmarkController.removeBookmark);


module.exports = router;
