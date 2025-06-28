# Task 004: 기본 API 구조 및 인증 시스템 구현

## 📋 작업 개요

**작업 ID**: 004  
**작업명**: Express API 기본 구조 및 JWT 인증 시스템 구현  
**예상 소요시간**: 45-60분  
**우선순위**: 🔴 Critical (API 기반 구축)  
**선행 작업**: Task 001, 002, 003 (완료됨)

## 🎯 목표

Express 서버의 기본 구조를 설정하고, JWT 기반 인증 시스템을 구현합니다. `docs/cushion-architecture.md`와 `docs/cushion-security-guide.md`의 설계를 따릅니다.

## 📋 작업 내용

### 1. Backend 폴더 구조 생성

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── auth.routes.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       ├── error.middleware.ts
│   │       └── validation.middleware.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── jwt.service.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   ├── config/
│   │   ├── index.ts
│   │   └── database.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── nodemon.json
└── .env
```

### 2. 기본 서버 설정

#### `backend/src/server.ts`
```typescript
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
    await prisma.$disconnect();
    logger.info('Database connection closed');
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
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

#### `backend/src/app.ts`
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { apiRouter } from './api/routes';
import { errorHandler } from './api/middleware/error.middleware';
import { logger } from './utils/logger';
import { config } from './config';

export const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});
```

### 3. 설정 파일

#### `backend/src/config/index.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Encryption
  ENCRYPTION_KEY: z.string().length(64),
  
  // CORS
  CORS_ORIGINS: z.string().transform((val) => val.split(',')),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
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
  
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
```

#### `backend/src/config/database.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '../utils/logger';

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
if (config.isDev) {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
    
    return result;
  });
}
```

### 4. 유틸리티 파일

#### `backend/src/utils/logger.ts`
```typescript
import winston from 'winston';
import { config } from '../config';

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format,
  defaultMeta: { service: 'cushion-backend' },
  transports: [
    new winston.transports.Console({
      format: config.isDev
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          )
        : format,
    }),
  ],
});
```

#### `backend/src/utils/errors.ts`
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}
```

#### `backend/src/utils/response.ts`
```typescript
import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
    hasNext?: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: SuccessResponse['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: {
    statusCode?: number;
    code: string;
    message: string;
    details?: any;
  }
): Response => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
  
  return res.status(error.statusCode || 500).json(response);
};
```

### 5. JWT 서비스

#### `backend/src/services/jwt.service.ts`
```typescript
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../config';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';
import type { User } from '@prisma/client';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  jti?: string;
}

export class JWTService {
  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const jti = randomBytes(32).toString('hex');
    
    // Generate access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      } as TokenPayload,
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        jti,
      } as TokenPayload,
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }
    );
    
    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        token: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
  
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }) as TokenPayload;
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }
  
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }) as TokenPayload;
      
      if (payload.type !== 'refresh' || !payload.jti) {
        throw new Error('Invalid token type');
      }
      
      // Check if token exists in database
      const dbToken = await prisma.refreshToken.findUnique({
        where: { jti: payload.jti },
      });
      
      if (!dbToken || dbToken.revoked) {
        throw new Error('Token revoked or not found');
      }
      
      // Check if token matches
      if (!this.compareTokenHash(token, dbToken.token)) {
        throw new Error('Token mismatch');
      }
      
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
  
  async revokeRefreshToken(jti: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { jti },
      data: { revoked: true },
    });
  }
  
  private hashToken(token: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }
  
  private compareTokenHash(token: string, hash: string): boolean {
    return this.hashToken(token) === hash;
  }
}

export const jwtService = new JWTService();
```

### 6. 인증 서비스

#### `backend/src/services/auth.service.ts`
```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { jwtService } from './jwt.service';
import { 
  ConflictError, 
  UnauthorizedError, 
  ValidationError 
} from '../utils/errors';
import type { User } from '@prisma/client';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<{
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }> {
    const { email, password, name } = input;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {},
        },
      },
    });
    
    // Generate tokens
    const tokens = await jwtService.generateTokens(user);
    
    return { user, tokens };
  }
  
  async login(input: LoginInput): Promise<{
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }> {
    const { email, password } = input;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = await jwtService.generateTokens(user);
    
    return { user, tokens };
  }
  
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Verify refresh token
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    // Revoke old refresh token
    if (payload.jti) {
      await jwtService.revokeRefreshToken(payload.jti);
    }
    
    // Generate new tokens
    return jwtService.generateTokens(user);
  }
  
  async logout(userId: string): Promise<void> {
    // Revoke all user's refresh tokens
    await prisma.refreshToken.updateMany({
      where: { 
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }
  
  async validateUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    return user;
  }
}

export const authService = new AuthService();
```

### 7. 미들웨어

#### `backend/src/api/middleware/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../../services/jwt.service';
import { authService } from '../../services/auth.service';
import { UnauthorizedError } from '../../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      tokenId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const payload = await jwtService.verifyAccessToken(token);
    
    // Validate user
    const user = await authService.validateUser(payload.sub);
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};
```

#### `backend/src/api/middleware/validation.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../../utils/errors';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};
```

#### `backend/src/api/middleware/error.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { sendError } from '../../utils/response';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });
  
  if (error instanceof AppError) {
    sendError(res, {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  } else {
    sendError(res, {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};
```

### 8. 인증 컨트롤러

#### `backend/src/api/controllers/auth.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { sendSuccess } from '../../utils/response';

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
    name: z.string().min(2).max(100).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body);
      
      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        tokens,
      }, 201);
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.login(req.body);
      
      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.refreshTokens(req.body.refreshToken);
      
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.id);
      
      sendSuccess(res, { message: '로그아웃되었습니다' });
    } catch (error) {
      next(error);
    }
  }
  
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.validateUser(req.user!.id);
      
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export { registerSchema, loginSchema, refreshSchema };
```

### 9. 라우터 설정

#### `backend/src/api/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import { authController, registerSchema, loginSchema, refreshSchema } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

// Public routes
authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);

// Protected routes
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
```

#### `backend/src/api/routes/index.ts`
```typescript
import { Router } from 'express';
import { authRouter } from './auth.routes';

export const apiRouter = Router();

// Mount routes
apiRouter.use('/auth', authRouter);

// API info
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'Cushion API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      diaries: '/diaries',
      insights: '/insights',
      portfolio: '/portfolio',
    },
  });
});
```

### 10. Nodemon 설정

#### `backend/nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts,js",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node -r tsconfig-paths/register ./src/server.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### 11. 환경 변수 업데이트

`.env` 파일에 다음 추가:

```env
# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-key-minimum-32-characters-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Logging
LOG_LEVEL="info"
```

### 12. 필요한 패키지 설치

`backend/package.json`의 dependencies 업데이트:

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.10.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/compression": "^1.7.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.0.0"
  }
}
```

### 13. TypeScript 경로 설정

`backend/tsconfig.json` 업데이트:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@cushion/types": ["../packages/types/src"],
      "@cushion/utils": ["../packages/utils/src"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 🚀 실행 및 테스트

```bash
# 1. 패키지 설치
cd backend
pnpm install

# 2. 개발 서버 실행
pnpm dev

# 3. API 테스트
# 회원가입
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Test123!@#",
    "name": "테스트 사용자"
  }'

# 로그인
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cushion.app",
    "password": "password123"
  }'
```

## ✅ 완료 조건

1. Express 서버가 3001 포트에서 실행됨
2. `/health` 엔드포인트 접근 가능
3. 회원가입 API 동작 확인
4. 로그인 API 동작 확인
5. JWT 토큰 발급 확인
6. 인증 미들웨어 동작 확인

## 📝 체크리스트 업데이트

작업 완료 후 `docs/cushion-checklist.md` 파일을 업데이트하세요:
- Phase 3의 "사용자 인증 시스템 - 회원가입/로그인" 체크
- Phase 3의 "사용자 인증 시스템 - JWT 토큰 관리" 체크

## 🔄 다음 단계

이 작업이 완료되면 다음 작업으로 진행:
- Task 005: 일기 CRUD API 구현
- Task 006: AI 서비스 통합

---
작성일: 2024-01-20
작성자: Cushion AI Assistant
