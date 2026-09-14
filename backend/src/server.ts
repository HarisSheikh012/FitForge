import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './config/database';

const PORT = config.port;

async function startServer() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${config.nodeEnv}]`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🔍 Health: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server and DB connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
