const { localities, LocalityLimits } = require('../models');
const ApiError = require('../utils/ApiError');

// ✅ Get All Localities (with optional city_id and area_id filtering)
const getAllLocalities = async (filter = {}) => {
  console.log('Filter received:', filter);

  if (!filter.city_id && !filter.area_id) {
    return await localities.findAll();
  }

  return await localities.findlocalities({
    city_id: filter.city_id || null,
    area_id: filter.area_id || null,
  });
};

// ✅ Get Locality by ID
const getlocalitiesById = async (id) => {
  const locality = await localities.findByPk(id);
  if (!locality) throw new ApiError(404, 'Locality not found');
  return locality;
};

// ✅ Create Locality
const createlocalities = async (data) => {
  return await localities.create(data);
};

// ✅ Update Locality by ID
const updateLocalityById = async (id, updateData) => {
  const locality = await localities.findByPk(id);
  if (!locality) {
    throw new ApiError(404, `Locality with ID ${id} not found`);
  }

  await locality.update(updateData); // Assuming Sequelize model instance
  return locality;
};

// ✅ Delete Locality by ID
const deletelocalitiesById = async (id) => {
  const locality = await getlocalitiesById(id);
  await locality.destroy(); // Assuming Sequelize model instance
  return { message: 'Locality deleted successfully' };
};

// ✅ Add Locality Limit
const addLocalityLimit = async ({locality_id, data_limit}) => {
  return await LocalityLimits.create({ locality_id, data_limit });
};

// ✅ Get All Locality Limits
const getAllLocalityLimits = async () => {
  return await LocalityLimits.findAll();
};

// ✅ Update Locality Limit
const updateLocalityLimit = async (id, { locality_id, data_limit }) => {
  const existingLimit = await LocalityLimits.findByPk(id);
  if (!existingLimit) {
    throw new ApiError(404, 'Locality limit not found for the given ID.');
  }

  const data =await LocalityLimits.update(id,{ locality_id, data_limit });
  return data;
};

module.exports = {
  getAllLocalities,
  getlocalitiesById,
  createlocalities,
  updateLocalityById,
  deletelocalitiesById,
  addLocalityLimit,
  getAllLocalityLimits,
  updateLocalityLimit,
};
