const httpStatus = require('http-status');
const { User,Banner } = require('../models');
const ApiError = require('../utils/ApiError');
const { data } = require('../config/logger');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  try {
    const emailTaken = await User.isEmailTaken(userBody.email);
    if (emailTaken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    return await User.create(userBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getAllUser = async (role, page, pageSize) => {
  try {
    return await User.getAll(role, page, pageSize);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch users');
  }
};

const GetOneUser = async (id) => {
  try {
    const user = await User.getOne(id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Query for users
 */
const queryUsers = async (filter, options) => {
  try {
    return await User.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query users');
  }
};

/**
 * Get user by id
 */
const getUserById = async (id) => {
  try {
    const user = await User.getOne(id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  try {
    const user = await User.getByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User with this email does not exist');
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Check if password matches
 */
const isPasswordMatch = async (password, hashedPassword) => {
  try {
    return await User.passwordMatch(password, hashedPassword);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to compare passwords');
  }
};

const getAgentsWithDetails = async (page, pageSize,locationId) => {
  try {
    return await User.getAgentsWithDetails(page, pageSize,locationId);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get agent details');
  }
};

const getUseDetails = async (page, pageSize) => {
  try {
    return await User.getAllUsersWithPagination(page, pageSize);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user details');
  }
};

/**
 * Update user by id
 */
const updateUserById = async (userId, updateBody) => {
  try {
    const user = await User.getOne(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return await User.update(userId, updateBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update user');
  }
};

/**
 * Delete user by id
 */
const deleteUserById = async (userId) => {
  try {
    const user = await User.getOne(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await user.remove();
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete user');
  }
};


const updateAgentPositionsById = async (agentId, { position: newPosition,locationId: locationId, }) => {
   try {
    const result = await User.updateAgentRanking(agentId, locationId, newPosition);

    // Check result format
    if (result && result.success) {
      return { success: true, message: 'Agent position updated successfully.' };
    } else {
      return { success: false, message: result?.message || 'Agent position not updated.' };
    }

  } catch (error) {
    console.error("🔥 Error in updateAgentPositionsById:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update agent position');
  }
};

const getAgentPositionHistory = async (page, pageSize) => {
  try {
    const data = await User.getAgentPositionHistory(page, pageSize)
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get Agents history details');
  }
}


const assignLocalityToManager = async (manager_id, locality_id) => {
  try {
    const data = await User.assignLocalityToManager(manager_id, locality_id)
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get Agents history details');
  }
}


const getAllAgentsLocalitieWise = async (id) => {
  try {
    const location_ids = await User.getLocalitiesByManager(id);
    console.log(location_ids.data[0],"location_ids")

    if (!location_ids|| location_ids.data[0].length === 0) {
      return { success: false, message: "This manager has not been assigned any localities." };
    }

    const data = await User.getAgentsByLocality(location_ids?.data[0]);

    if (!data || data.length === 0) {
      return { success: false, message: "No agents found for the assigned localities." };
    }

    return { success: true, data };
  } catch (error) {
    console.error("❌ Error in getAllAgentsLocalitiewise:", error);
    return { success: false, message: "An error occurred while fetching agent data.", error: error.message };
  }


}




const getAllNotificationLocalitieWise = async (managerId) => {
  try {
    const localityResponse = await User.getLocalitiesByManager(managerId);

    const localities = localityResponse?.data?.[0];
    console.log("📍 Localities assigned:", localities);

    if (!localities || localities.length === 0) {
      return {
        success: false,
        message: "This manager has not been assigned any localities.",
      };
    }

    const notificationResponse = await User.getNotificationByLocalities(localities);
    const notifications = notificationResponse;

    if (!notifications || notifications.length === 0) {
      return {
        success: false,
        message: "No notifications found for the assigned localities.",
      };
    }

    // Optional: Group notifications by locality
  

    return {
      success: true,
      data: notificationResponse.data,
    };
  } catch (error) {
    console.error("❌ Error in getAllNotificationLocalitieWise:", error);
    return {
      success: false,
      message: "An error occurred while fetching notifications.",
      error: error.message,
    };
  }
}



const fetchEmployeeLocalities =async()=>{
   try{
     const data =await User.getEmployeesWithLocalities()
     console.log(data)
     return data
   }catch(error){
     return {
      success: false,
      message: "❌ An error occurred while fetching EmployeeLocalities.",
      error: error.message,
    };
   }
}

const fetchAllUserReviews=async(page,limit)=>{
  try{
     const data =await User.getAllUserReviews(page,limit)
     return data
   }catch(error){
     return {
      success: false,
      message: "❌ Failed to fetch reviews.",
      error: error.message,
    };
   }
}


const fetchInteractionHistory=async(range)=>{
  try{
     const data =await User.getDetailedInteractionsByTimeRange(range)
     return data
   }catch(error){
     return {
      success: false,
      message: "❌ Failed to fetch reviews.",
      error: error.message,
    };
   }
}

const uploadBannerWithImage = async (
  title,
  image_url,
  link_url,
  start_time,
  end_time
) => {
  try {
    const data = await Banner.create({
      title,
      image_url,
      link_url,
      start_time,
      end_time,
    });
    
    return {
      success: true,
      message: 'Banner created successfully',
      data,
    };
  } catch (error) {
    console.error('Error creating banner:', error.message);
    return {
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    };
  }
};

const retrieveAllBanners  =async()=>{
  try {
    const banners = await Banner.getAllBanners();
    if (!banners || banners.length === 0) {
      return {
        success: false,
        message: "No banners found",
        data: [],
      };
    }

    return {
      success: true,
      message: "Banners retrieved successfully",
      data: banners,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    };
  }
}

const updateExistingBanner =async(id,data)=>{
  try {
      const update=await Banner.updateBanner(id,data)
      return update 
  } catch (error) {
      return {
      success: false,
      message: 'Failed to Update banner',
      error: error.message,
    };
  }
}

const getSelectedBanner =async(id)=>{
   try {
      const banners =await Banner.getBannerById(id)
      if (!banners || banners.length === 0) {
      return {
        success: false,
        message: "No banners found",
        data: [],
      };
    }

    return {
      success: true,
      message: "Banners retrieved successfully",
      data: banners,
    };

   } catch (error) {
  return {
      success: false,
      message: 'Failed to Update banner',
      error: error.message,
    };
   }
}

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  isPasswordMatch,
  getAllUser,
  GetOneUser,
  getAgentsWithDetails,
  getUseDetails,
  updateAgentPositionsById,
  getAgentPositionHistory,
  assignLocalityToManager,
  getAllAgentsLocalitieWise,
  getAllNotificationLocalitieWise,
  fetchEmployeeLocalities,
  fetchAllUserReviews,
  fetchInteractionHistory,
  uploadBannerWithImage,
  retrieveAllBanners,
  updateExistingBanner,
  getSelectedBanner
};
