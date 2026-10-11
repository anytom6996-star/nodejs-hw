const pinoHttp = require('pino-http');

const logger = pinoHttp({
  transport: {
    target: 'pino-pretty',
  },
});

module.exports = logger;