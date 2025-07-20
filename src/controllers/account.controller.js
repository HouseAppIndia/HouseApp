const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const AccountService = require('../services/account.services');


/* ----------------------------- City Controllers ----------------------------- */

const addOrUpdateBankDetails = catchAsync(async (req, res) => {
    const qr_code_url = req.file ? `/logo/${req.file.filename}` : null;

    const {
      bank_account_number,
      ifsc_code,
      bank_name,
      account_holder_name
    } = req.body;

    // ✅ Check if at least one field or QR exists
    const hasFormData = bank_account_number || ifsc_code || bank_name || account_holder_name;
    const hasQr = !!qr_code_url;

    if (!hasFormData && !hasQr) {
      return res.status(400).json({ error: 'Please provide bank details or upload a QR code' });
    }

    const data = {
      qr_code_url,
      bank_account_number,
      ifsc_code,
      bank_name,
      account_holder_name,
    };

    const result = await AccountService.createOrUpdatePaymentDetail(data);
    res.status(200).json({ message: 'Saved successfully', result });

});



const getBankDetails=catchAsync(async(req,res)=>{
    const result = await AccountService.getAllPaymentDetails();
    res.status(200).json({ message: 'Saved successfully', result })
})

module.exports = {
    addOrUpdateBankDetails,
    getBankDetails
};
