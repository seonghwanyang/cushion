import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { logger } from './utils/logger';
import { config } from './config';
import { prisma } from './config/database';

const server = createServer(app);
const PORT = config.port || 3001;

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Mock 모드가 아닐 때만 DB 연결 해제
    if (!config.features.useMockDatabase) {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Feature flags 로깅
    logger.info('Starting with features:', config.features);

    // Mock 모드가 아닐 때만 DB 연결 시도
    if (!config.features.useMockDatabase) {
      try {
        await prisma.$connect();
        logger.info('Database connected successfully');
      } catch (error) {
        logger.error('Failed to connect to database:', error);
        if (!config.isDev) {
          throw error; // 프로덕션에서는 실패
        }
        logger.warn('Continuing without database in development mode');
      }
    } else {
      logger.info('Using Mock Database - No real DB connection');
    }

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode`);
      logger.info(`Mock Services: Auth=${config.features.useMockAuth}, DB=${config.features.useMockDatabase}, AI=${config.features.useMockAI}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();