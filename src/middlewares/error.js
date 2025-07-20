const ApiError = require('../utils/ApiError');
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
    error: err.errorCode || "INTERNAL_ERROR",
  };
  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
