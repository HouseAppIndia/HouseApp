const jwt = require('jsonwebtoken')
const config = require('../config/config');

const userAuth = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    console.log(config.jwt.secret)
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = jwt.verify(token,config.jwt.secret)
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = userAuth;
