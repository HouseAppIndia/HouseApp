const httpStatus = require('http-status');
const { Agent } = require('../models');
const ApiError = require('../utils/ApiError');

const addLocations = async (agentId, location_id) => {
  try {
    const user = await Agent.getUserById(agentId);
    const result = await Agent.addWorkingLocation(agentId, location_id);

    if (!result.success) {
      throw new ApiError(500, 'Failed to add locations',"Failed to add locations");
    }

    return {
      agent: user,
      addedLocations: result.locations
    };
  } catch (error) {
   throw new ApiError(500, 'Internal Server Error',"Internal Server Error");
  }
};

module.exports = {
  addLocations
};
