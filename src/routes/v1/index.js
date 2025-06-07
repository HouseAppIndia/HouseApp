const express = require('express');
const authRoute = require('./auth.route');
const employeeRoute =require('./employee.route')
const userRoute = require('./user.route');
const agentRoute =require('./agent.route')
const docsRoute = require('./docs.route');
const config = require('../../config/config');
const CitiesRoute =require('./cities.route')
const Static_Content =require('./staticContent.routes')

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth/admin',
    route: authRoute,
  },
  {
    path: '/auth/employee',
    route: employeeRoute,
  },
  {
    path:'/auth/agent',
    route: agentRoute,
  },
  {
    path: '/auth/users',
    route: userRoute,
  },
  {
    path: '/auth',
    route: CitiesRoute,
  },
    {
    path: '/auth',
    route: Static_Content,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
