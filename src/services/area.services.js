const { Areas } = require('../models');
const ApiError = require('../utils/ApiError');

const getAllAreas = async (city_id) => {
  console.log(city_id)
  if(city_id){
       return Areas.getAreaId(city_id);
  }
  return Areas.findAll();
};

const getAreaById = async (id) => {
  console.log("id of area",id)
  const area = await Areas.findByPk(id);
  if (!area) throw new ApiError(404, 'Area not found');
  return area;
};

const createArea = async (data) => {
  const {name,city}=data
  console.log(name,city)
  return Areas.create(name,city);
};

const updateAreaById = async (id, updateData) => {
  console.log(updateData,"updateData")
  const area = await Areas.findByPk(id);
  console.log("hhhe",area)
  return Areas.update(id,updateData);
};

const deleteAreaById = async (id) => {
  const area = await getAreaById(id);
  return Areas.destroy(id);
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateAreaById,
  deleteAreaById,
};
