const { Sponsorships } = require('../models');
const ApiError = require('../utils/ApiError');

// ✅ GET ALL
const getAllSponsorshipss = async () => {
  return await Sponsorships.findAll({ order: [['id', 'DESC']] });
};

// ✅ GET BY ID
const getSponsorshipsById = async (id) => {
  const Sponsorships = await Sponsorships.findByPk(id);
  if (!Sponsorships) throw new ApiError(404, 'Sponsorships not found');
  return Sponsorships;
};

// ✅ CREATE
const createSponsorships = async (data) => {
  console.log(data)
  if (!data.agent_id) {
    return({status:400, message:'agent_id'});
  }

  return await Sponsorships.create({
    agent_id: data.agent_id,
    locality_id: data.working_location_ids || null,
    start_date: new Date(),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });
};

// ✅ UPDATE
const updateSponsorshipsById = async (id, updateData) => {
  const Sponsorships = await Sponsorships.findByPk(id);
  if (!Sponsorships) throw new ApiError(404, 'Sponsorships not found');

  await Sponsorships.update({
    agent_id: updateData.agent_id,
    sponsor_id: updateData.sponsor_id,
    locality_id: updateData.locality_id || null,
  });

  return Sponsorships;
};

// ✅ DELETE
const deleteSponsorshipsById = async (id) => {
  const Sponsorships = await Sponsorships.findByPk(id);
  if (!Sponsorships) throw new ApiError(404, 'Sponsorships not found');

  await Sponsorships.destroy();
  return { message: 'Sponsorships deleted successfully' };
};

module.exports = {
  getAllSponsorshipss,
  getSponsorshipsById,
  createSponsorships,
  updateSponsorshipsById,
  deleteSponsorshipsById,
};
