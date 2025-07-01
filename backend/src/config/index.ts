import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

// Load .env.local file before parsing environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// 개발 환경에서는 더 유연한 스키마 사용
const createEnvSchema = (isDev: boolean) => {
  const baseSchema = {
    // App
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().transform(Number).default('3001'),
    
    // Feature Flags
    USE_MOCK_AUTH: z.string().transform(v => v === 'true').default(isDev ? 'true' : 'false'),
    USE_MOCK_DATABASE: z.string().transform(v => v === 'true').default(isDev ? 'true' : 'false'),
    USE_MOCK_AI: z.string().transform(v => v === 'true').default('true'),
    USE_MOCK_STORAGE: z.string().transform(v => v === 'true').default('true'),
    USE_SUPABASE_AUTH: z.string().transform(v => v === 'true').default('false'),
    
    // CORS
    CORS_ORIGINS: z.string().default('http://localhost:3000').transform((val) => val.split(',')),
    
    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  };

  // 개발 환경에서는 선택적, 프로덕션에서는 필수
  const conditionalSchema = isDev ? {
    // Database (개발에서는 선택적)
    DATABASE_URL: z.string().optional().default('postgresql://postgres:password@localhost:5432/cushion_dev'),
    REDIS_URL: z.string().optional(),
    
    // JWT (개발에서는 기본값 제공)
    JWT_SECRET: z.string().min(32).default('development-secret-key-minimum-32-characters-long'),
    JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-minimum-32-chars'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    
    // Encryption (개발에서는 기본값)
    ENCRYPTION_KEY: z.string().default('0'.repeat(64)),
    
    // External APIs (개발에서는 선택적)
    OPENAI_API_KEY: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    
    // Supabase (개발에서는 선택적)
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  } : {
    // 프로덕션에서는 모두 필수
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    ENCRYPTION_KEY: z.string().length(64),
    OPENAI_API_KEY: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    SUPABASE_URL: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
  };

  return z.object({ ...baseSchema, ...conditionalSchema });
};

const isDev = process.env.NODE_ENV !== 'production';
const envSchema = createEnvSchema(isDev);
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  features: {
    useMockAuth: env.USE_MOCK_AUTH,
    useMockDatabase: env.USE_MOCK_DATABASE,
    useMockAI: env.USE_MOCK_AI,
    useMockStorage: env.USE_MOCK_STORAGE,
    useSupabaseAuth: env.USE_SUPABASE_AUTH,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  
  corsOrigins: env.CORS_ORIGINS,
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  isDev,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;