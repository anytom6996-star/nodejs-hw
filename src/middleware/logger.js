
import pinoHttp from 'pino-http';

const logger = pinoHttp({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export { logger };
