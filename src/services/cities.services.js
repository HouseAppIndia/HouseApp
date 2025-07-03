const { City } = require('../models');
const ApiError = require('../utils/ApiError');

const getAllCities = async () => {
  console.log("jjjjjj");
  
  return City.findAll();
};

const getCityById = async (id) => {
  const city = await City.findByPk(id);
  if (!city) throw new ApiError(404, 'City not found');
  return city;
};

const createCity = async (data) => {
  return City.create(data);
};

const updateCityById = async (id, updateData) => {
  const city = await  City.findByPk(id);
  return City.updateCity(id,updateData);
};

const deleteCityById = async (id) => {
  const city = await findByPk(id);
  return city.destroy(id);
};

module.exports = {
  getAllCities,
  getCityById,
  createCity,
  updateCityById,
  deleteCityById,
};
