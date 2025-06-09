const {Bookmarks} = require('../models');;
const ApiError = require('../utils/ApiError');

const getAllBookmarksByUser = async (userId) => {
  const result = await Bookmarks.findAllByUser(userId);
  if (result.error) {
    throw new ApiError(500, result.error);
  }
  return result.data;
};

const createBookmark = async (data) => {
  const result = await Bookmarks.create(data);
  if (result.error) {
    throw new ApiError(400, result.error);
  }
  return { id: result.insertId };
};

const deleteBookmark = async ({ user_id, agent_id }) => {
  const result = await Bookmarks.destroy(user_id, agent_id);
  if (result.error) {
    throw new ApiError(500, result.error);
  }
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Bookmark not found or already deleted');
  }
  return { message: 'Bookmark deleted successfully' };
};

module.exports = {
  getAllBookmarksByUser,
  createBookmark,
  deleteBookmark,
};
