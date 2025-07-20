const {PaymentDetails} = require('../models');
const ApiError = require('../utils/ApiError');

// ✅ Get all payment details
const getAllPaymentDetails = async () => {
  const result = await PaymentDetails.findAll();
  if (result.error) throw new ApiError(500, result.error);
  return result.data;
};

// ✅ Get payment detail by ID
const getPaymentDetailById = async (id) => {
  const result = await PaymentDetails.findByPk(id);
  if (result.error) throw new ApiError(500, result.error);
  if (!result.data) throw new ApiError(404, 'Payment detail not found');
  return result.data;
};

// ✅ Create or Update by employee_id
const createOrUpdatePaymentDetail = async (data) => {
  const result = await PaymentDetails.createOrUpdateByBankAccountNumber(data);
  if (result.error) throw new ApiError(500, result.error);
  return result;
};

// ✅ Delete payment detail by ID
const deletePaymentDetailById = async (id) => {
  const result = await PaymentDetails.destroy(id);
  if (result.error) throw new ApiError(500, result.error);
  if (result.affectedRows === 0) throw new ApiError(404, 'Payment detail not found');
  return { message: 'Deleted successfully' };
};

module.exports = {
  getAllPaymentDetails,
  getPaymentDetailById,
  createOrUpdatePaymentDetail,
  deletePaymentDetailById,
};
