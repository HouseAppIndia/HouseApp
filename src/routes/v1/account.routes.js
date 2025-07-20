const express = require('express');
const uploadImage = require('../../middlewares/upload'); // multer config
const accountController = require('../../controllers/account.controller');

const router = express.Router();

// Add or Update Bank Details (with optional QR code)
router.get('/payment-details', accountController.getBankDetails);
router.post('/payment-details', uploadImage.single('qr_code'), accountController.addOrUpdateBankDetails);

module.exports = router;
