const express = require('express');
const userController = require('../../controllers/user.controller');
const passport = require('passport');

const router = express.Router();



router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);



router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  userController.handleGoogleCallback
);


module.exports = router;
