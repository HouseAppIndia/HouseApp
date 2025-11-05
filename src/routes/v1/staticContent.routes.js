const express = require('express');
const router = express.Router();
const staticController = require('../../controllers/staticContent.controller');

// About Us
router.post('/about-us', staticController.createAboutUs);
router.get('/about-us', staticController.getAboutUs);

// Privacy Policies
router.post('/privacy-policy', staticController.createPrivacyPolicy);
router.get('/privacy-policy', staticController.getPrivacyPolicies);

// Terms & Conditions
router.post('/terms', staticController.createTermsConditions);
router.get('/terms', staticController.getTermsConditions);
router.put('/terms/:id', staticController.updateTermsConditions);

// Contact Us
router.post('/contact-us', staticController.createContactUs);
router.get('/contact-us', staticController.getContactUs);

module.exports = router;
