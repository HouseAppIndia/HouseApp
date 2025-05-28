require('dotenv').config();
const app = require('./app');
const config = require('./config/config');
require('./cron/otpCleaner')
const logger = require('./config/logger');
const sql = require('mysql2');



let server;
console.log(process.env.MYSQL_PASSWORD,"uuuu")



const connection = sql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});



connection.connect(err => {
  console.log(err)
  if (err) {
    logger.error('❌ Failed to connect to SQL Server:', err.message);
    process.exit(1);
  }
  logger.info('✅ Connected to SQL Server');
  server = app.listen(8000, () => {
    console.log(process.env.MYSQL_PASSWORD,"uuuu")
    logger.info(`🚀 Listening on port ${8000}`);
  });
});


// mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
//   logger.info('Connected to MongoDB');
//   server = app.listen(config.port, () => {
//     logger.info(`Listening to port ${config.port}`);
//   });
// });



const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
