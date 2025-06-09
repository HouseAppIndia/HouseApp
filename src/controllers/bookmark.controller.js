const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {BookMarkService} = require('../services');

const getBookmarks = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const data = await BookMarkService.getAllBookmarksByUser(userId);
  res.status(httpStatus.OK).send({ message: 'Bookmarks fetched', data });
});

const addBookmark = catchAsync(async (req, res) => {
  console.log(req.user)
  const userId = req.user?.userId;
  const agentId = req.body?.agent_id;
  console.log(userId,agentId)

  const result = await BookMarkService.createBookmark({ user_id: userId, agent_id: agentId });
  res.status(httpStatus.CREATED).send({ message: 'Bookmark added', result });
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
