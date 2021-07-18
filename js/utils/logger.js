const winston = require('winston');

const myFormat = winston.format.printf(({ level, message, timestamp }) => `${timestamp} \x1b[36m${level}:\x1b[0m ${message}`);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    myFormat,
  ),
  transports: [
    new winston.transports.Console({
      level: 'info',
    }),
  ],
});

module.exports = logger;
