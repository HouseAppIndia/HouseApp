const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {BookMarkService} = require('../services');
const ApiError = require('../utils/ApiError');

const getBookmarks = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const bookmarks = await BookMarkService.getAllBookmarksByUser(userId);

  const transformedData = bookmarks.map((item) => ({
    id: item.bookmark_id,
    agent: {
      id: item.agent_id,
      name: item.agent_name,
      agency_name: item.agent_name, // You can adjust if you have a separate agency name
      rating: item.rating || 4.5, // Default or dynamic from DB if available
      profile_image: item.image_url,
    },
    bookmarked_at: item.created_at,
  }));

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Bookmarks retrieved successfully',
    data: transformedData,
  });
});


const addBookmark = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const agentId = req.body?.agent_id;

  if (!agentId) {
    throw new ApiError(400, 'agent_id is required');
  }

  const result = await BookMarkService.createBookmark({ user_id: userId, agent_id: agentId });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Agent bookmarked successfully',
    data: {
      bookmarked: true,
      agent_id: agentId,
      user_id: userId
    }
  });
});

const removeBookmark = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const agentId = req.body?.agent_id;

  const result = await BookMarkService.deleteBookmark({ user_id: userId, agent_id: agentId });
  res.status(httpStatus.OK).send({ message: 'Bookmark removed', result });
});

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
};
