// const passport = require('passport');
// const httpStatus = require('http-status');
// const ApiError = require('../utils/ApiError');
// const { roleRights } = require('../config/roles');


// // const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
// //   if (err || info || !user) {
// //     return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
// //   }
// //   req.user = user;

// //   if (requiredRights.length) {
// //     const userRights = roleRights.get(user.role);
// //     const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
// //     if (!hasRequiredRights && req.params.userId !== user.id) {
// //       return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
// //     }
// //   }

// //   resolve();
// // };

// // const auth = (...requiredRights) => async (req, res, next) => {
// //   console.log(req.headers.authorization,"authraization")
// //   const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
// //   return new Promise((resolve, reject) => {
// //     passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
// //   })
// //     .then(() => next())
// //     .catch((err) => next(err));
// // };


// const userAuth =(req,res,next)=>{
//   const authHeader = req?.headers?.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res?.status(401).json({ message: 'Unauthorized: No token provided' });
//   }
//   const token = authHeader.replace(/^Bearer\s+/i, '');
//   console.log(token)
//   const decoded = jwt.verify(token, config.jwt.secret);
//   console.log(decoded)
// }

// module.exports = userAuth;



const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Adjust this to your actual path

const userAuth = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // Attach decoded payload to req.user if needed
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = userAuth;

