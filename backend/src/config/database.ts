import { PrismaClient } from '@prisma/client';
import { config } from './index';
// import { logger } from '../utils/logger';

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.isDev) {
  globalForPrisma.prisma = prisma;
}

// Log queries in development
// if (config.isDev) {
//   prisma.$use(async (params, next) => {
//     const before = Date.now();
//     const result = await next(params);
//     const after = Date.now();
    
//     logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
    
//     return result;
//   });
// }