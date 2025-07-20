const { Bookmarks } = require('../models');
const ApiError = require('../utils/ApiError');

const getAllBookmarksByUser = async (userId) => {
  try {
    const result = await Bookmarks.findAllByUser(userId);
    if (result.error) {
      throw new ApiError(500, result.error);
    }
    return result.data;
  } catch (error) {
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const createBookmark = async (data) => {
  try {
    if (!data.user_id || !data.agent_id) {
      throw new ApiError(400, 'user_id and agent_id are required fields');
    }
    const result = await Bookmarks.create(data);
    if (result.error) {
      throw new ApiError(400, result.error);
    }
    return { id: result.insertId };
  } catch (error) {
     throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

const deleteBookmark = async ({ user_id, agent_id }) => {
  try {
    if (!user_id || !agent_id) {
      throw new ApiError(400, 'user_id and agent_id are required fields');
    }
    const result = await Bookmarks.destroy(user_id, agent_id);
    if (result.error) {
      throw new ApiError(500, result.error);
    }
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Bookmark not found or already deleted');
    }
    return { message: 'Bookmark deleted successfully' };
  } catch (error) {
    throw new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
  }
};

module.exports = {
  getAllBookmarksByUser,
  createBookmark,
  deleteBookmark,
};
