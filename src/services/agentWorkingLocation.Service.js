const httpStatus = require('http-status');
const { Agent } = require('../models');
const ApiError = require('../utils/ApiError');// Your MySQL pool

const addLocations = async (agentId, location_id) => {
    const user = await Agent.getUserById(agentId);
  
    if (!user) {
      return {
        status:httpStatus.UNAUTHORIZED,
        message:  'Agent does not exist'
      }
    }
  
    const result = await Agent.addWorkingLocation(agentId, location_id);
  
    if (!result.success) {
      return {
        status:httpStatus.INTERNAL_SERVER_ERROR,
        message:  'Failed to add locations'
      }
    }
  
    // Return both user info and newly added locations
    return {
      agent: user,
      addedLocations: result.locations
    }
};

module.exports = {
  addLocations
};
