import winston from 'winston';
import path from 'path';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
      : `${timestamp} [${level.toUpperCase()}]: ${message}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat,
    ),
  }),
];

if (config.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  silent: config.nodeEnv === 'test',
});
