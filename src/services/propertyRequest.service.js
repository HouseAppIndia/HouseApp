const {PropertyRequests} = require('../models');
const ApiError = require('../utils/ApiError');

// GET ALL
const getAllPropertyRequests = async () => {
  return PropertyRequests.findAll();
};

// GET BY ID
const getPropertyRequestById = async (id) => {
  const request = await PropertyRequests.findByPk(id);
  if (!request) throw new ApiError(404, 'Property Request not found');
  return request;
};

// CREATE
const createPropertyRequest = async (data) => {
  return PropertyRequests.create(data);
};

// UPDATE BY ID
const updatePropertyRequestById = async (id, updateData) => {
  const existing = await PropertyRequests.findByPk(id);
  if (!existing) throw new ApiError(404, 'Property Request not found');
  return PropertyRequests.update(id, updateData);
};

// DELETE BY ID
const deletePropertyRequestById = async (id) => {
  const existing = await PropertyRequests.findByPk(id);
  if (!existing) throw new ApiError(404, 'Property Request not found');
  return PropertyRequests.destroy(id);
};

module.exports = {
  getAllPropertyRequests,
  getPropertyRequestById,
  createPropertyRequest,
  updatePropertyRequestById,
  deletePropertyRequestById,
};
