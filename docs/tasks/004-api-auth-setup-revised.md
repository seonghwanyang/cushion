# Task 004 (Revised): Mock-First API 구조 및 인증 시스템 구현

## 📋 작업 개요

**작업 ID**: 004-revised  
**작업명**: Mock 기반 API 구조 설계 및 점진적 구현 전략  
**예상 소요시간**: 2-3시간  
**우선순위**: 🔴 Critical (새로운 개발 방향 설정)  
**선행 작업**: Task 001, 002, 003 (완료됨)

## 🎯 목표

Mock-First 개발 전략에 따라 인터페이스 기반 API 구조를 설계하고, Mock 서비스로 먼저 구현한 후 실제 서비스로 점진적으로 전환할 수 있는 구조를 만듭니다.

## 🔄 기존 작업 상태 확인

Task 4가 진행 중인 상태에서 다음 파일들이 이미 생성되었습니다:
- ✅ `backend/src/server.ts`
- ✅ `backend/src/app.ts`
- ✅ `backend/src/config/index.ts`
- ✅ `backend/src/utils/*` (logger, errors, response)
- ✅ `backend/src/services/jwt.service.ts`
- ✅ `backend/src/services/auth.service.ts`
- ✅ `backend/src/api/middleware/*`
- ✅ `backend/src/api/controllers/auth.controller.ts`
- ✅ `backend/src/api/routes/*`

## 📋 수정 작업 내용

### 1. 인터페이스 정의 레이어 추가

#### 폴더 구조 추가
```
backend/src/
├── interfaces/           # 새로 추가
│   ├── services/
│   │   ├── auth.service.interface.ts
│   │   ├── diary.service.interface.ts
│   │   ├── ai.service.interface.ts
│   │   └── storage.service.interface.ts
│   └── repositories/
│       ├── user.repository.interface.ts
│       └── diary.repository.interface.ts
├── mocks/               # 새로 추가
│   ├── services/
│   │   ├── auth.service.mock.ts
│   │   ├── diary.service.mock.ts
│   │   └── ai.service.mock.ts
│   ├── data/
│   │   ├── users.mock.ts
│   │   └── diaries.mock.ts
│   └── index.ts
└── factories/           # 새로 추가
    └── service.factory.ts
```

### 2. 환경 설정 수정

#### `backend/src/config/index.ts` 수정
```typescript
import { z } from 'zod';

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
  
  isDev,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
```

### 3. Service Interfaces 생성

#### `backend/src/interfaces/services/auth.service.interface.ts`
```typescript
import type { User } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IAuthService {
  register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }>;
  login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  validateUser(userId: string): Promise<User>;
}
```

#### `backend/src/interfaces/services/diary.service.interface.ts`
```typescript
import type { Diary, MoodType } from '@prisma/client';

export interface CreateDiaryInput {
  content: string;
  mood?: MoodType;
  tags?: string[];
}

export interface UpdateDiaryInput {
  content?: string;
  mood?: MoodType;
  tags?: string[];
}

export interface DiaryFilter {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  mood?: MoodType;
  tags?: string[];
}

export interface IDiaryService {
  create(userId: string, input: CreateDiaryInput): Promise<Diary>;
  findById(id: string): Promise<Diary | null>;
  findByUser(userId: string, filter?: DiaryFilter): Promise<Diary[]>;
  update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary>;
  delete(id: string, userId: string): Promise<void>;
  count(userId: string): Promise<number>;
}
```

### 4. Mock Services 구현

#### `backend/src/mocks/data/users.mock.ts`
```typescript
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const mockUsers: User[] = [
  {
    id: 'mock-user-1',
    email: 'test@cushion.app',
    password: bcrypt.hashSync('password123', 10),
    name: '김테스트',
    profileImage: null,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-20'),
  },
  {
    id: 'mock-user-2',
    email: 'admin@cushion.app',
    password: bcrypt.hashSync('admin123', 10),
    name: '관리자',
    profileImage: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-19'),
  },
];
```

#### `backend/src/mocks/services/auth.service.mock.ts`
```typescript
import { IAuthService, RegisterInput, LoginInput, AuthTokens } from '@/interfaces/services/auth.service.interface';
import { mockUsers } from '../data/users.mock';
import { ConflictError, UnauthorizedError } from '@/utils/errors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';

export class MockAuthService implements IAuthService {
  private users = new Map(mockUsers.map(u => [u.id, { ...u }]));
  private usersByEmail = new Map(mockUsers.map(u => [u.email, u.id]));
  private refreshTokens = new Map<string, { userId: string; token: string }>();

  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    // 시뮬레이션 딜레이
    await this.simulateDelay();

    if (this.usersByEmail.has(input.email)) {
      throw new ConflictError('Email already registered');
    }

    const user: User = {
      id: `mock-user-${uuidv4()}`,
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      name: input.name || null,
      profileImage: null,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);

    const tokens = this.generateTokens(user.id);
    return { user, tokens };
  }

  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    await this.simulateDelay();

    const userId = this.usersByEmail.get(input.email);
    if (!userId) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    const tokens = this.generateTokens(user.id);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    await this.simulateDelay();

    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 새 토큰 생성
    this.refreshTokens.delete(refreshToken);
    return this.generateTokens(tokenData.userId);
  }

  async logout(userId: string): Promise<void> {
    await this.simulateDelay();
    
    // 해당 사용자의 모든 refresh token 삭제
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    return user;
  }

  private generateTokens(userId: string): AuthTokens {
    const accessToken = `mock-access-token-${uuidv4()}`;
    const refreshToken = `mock-refresh-token-${uuidv4()}`;
    
    this.refreshTokens.set(refreshToken, { userId, token: refreshToken });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15분
    };
  }

  private async simulateDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5. Service Factory 구현

#### `backend/src/factories/service.factory.ts`
```typescript
import { config } from '@/config';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

// Interfaces
import { IAuthService } from '@/interfaces/services/auth.service.interface';
import { IDiaryService } from '@/interfaces/services/diary.service.interface';

// Real implementations
import { AuthService } from '@/services/auth.service';
import { DiaryService } from '@/services/diary.service';

// Mock implementations
import { MockAuthService } from '@/mocks/services/auth.service.mock';
import { MockDiaryService } from '@/mocks/services/diary.service.mock';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getAuthService(): IAuthService {
    const key = 'auth';
    if (!this.services.has(key)) {
      if (config.features.useMockAuth) {
        logger.info('Using Mock Auth Service');
        this.services.set(key, new MockAuthService());
      } else {
        logger.info('Using Real Auth Service');
        this.services.set(key, new AuthService());
      }
    }
    return this.services.get(key);
  }

  getDiaryService(): IDiaryService {
    const key = 'diary';
    if (!this.services.has(key)) {
      if (config.features.useMockDatabase) {
        logger.info('Using Mock Diary Service');
        this.services.set(key, new MockDiaryService());
      } else {
        logger.info('Using Real Diary Service');
        this.services.set(key, new DiaryService(prisma));
      }
    }
    return this.services.get(key);
  }

  // 테스트를 위한 서비스 리셋
  resetServices(): void {
    this.services.clear();
  }
}

// Singleton 인스턴스 export
export const serviceFactory = ServiceFactory.getInstance();
```

### 6. 서버 시작 로직 수정

#### `backend/src/server.ts` 수정
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
```

### 7. Controller 수정 (Service Factory 사용)

#### `backend/src/api/controllers/auth.controller.ts` 수정
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';

// ... validation schemas는 동일 ...

export class AuthController {
  private get authService() {
    return serviceFactory.getAuthService();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await this.authService.register(req.body);
      
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

  // ... 나머지 메서드들도 this.authService 사용하도록 수정 ...
}
```

### 8. 개발용 환경 변수 파일

#### `.env.development` (새로 생성)
```env
# Development Environment with Mocks
NODE_ENV=development
PORT=3001

# Feature Flags - 개발 초기에는 모두 Mock 사용
USE_MOCK_AUTH=true
USE_MOCK_DATABASE=true
USE_MOCK_AI=true
USE_MOCK_STORAGE=true

# 아래는 Mock 모드에서는 사용되지 않지만 설정 파일 에러 방지용
DATABASE_URL=postgresql://postgres:password@localhost:5432/cushion_dev
JWT_SECRET=development-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=development-refresh-secret-minimum-32-chars
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# CORS
CORS_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### 9. Package.json 스크립트 수정

```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon",
    "dev:mock": "NODE_ENV=development USE_MOCK_AUTH=true USE_MOCK_DATABASE=true nodemon",
    "dev:real": "NODE_ENV=development USE_MOCK_AUTH=false USE_MOCK_DATABASE=false nodemon",
    "dev:mixed": "NODE_ENV=development USE_MOCK_AUTH=false USE_MOCK_DATABASE=true nodemon"
  }
}
```

## 🚀 실행 및 테스트

### 1. Mock 모드로 실행 (DB 연결 불필요)
```bash
cd backend
cp .env.development .env
pnpm dev:mock
```

### 2. API 테스트
```bash
# 회원가입 테스트 (Mock)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Test123!@#",
    "name": "새 사용자"
  }'

# 로그인 테스트 (Mock)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cushion.app",
    "password": "password123"
  }'
```

### 3. 점진적 전환 테스트
```bash
# Auth는 Mock, DB는 Real
USE_MOCK_AUTH=true USE_MOCK_DATABASE=false pnpm dev

# Auth는 Real, DB는 Mock  
USE_MOCK_AUTH=false USE_MOCK_DATABASE=true pnpm dev
```

## ✅ 완료 조건

1. Mock 모드에서 서버가 DB 없이도 정상 실행
2. 회원가입/로그인 API가 Mock 데이터로 동작
3. Feature Flag로 Mock/Real 전환 가능
4. 기존 코드와의 호환성 유지
5. 인터페이스 기반 설계 완료

## 📝 다음 단계

### Task 005: 일기 CRUD Mock 구현
1. Diary Service Interface 정의
2. Mock Diary Service 구현
3. 일기 관련 API 엔드포인트 구현
4. Frontend 연동 가능한 상태 만들기

### Task 006: Frontend 기본 구조
1. Next.js 초기 설정
2. Mock API와 연동
3. 로그인/회원가입 UI 구현
4. 일기 작성 UI 구현

## ⚠️ 주의사항

1. **Mock 데이터 일관성**: Mock 서비스 간 데이터 참조 시 ID 일치 확인
2. **상태 관리**: Mock 서비스는 메모리에 상태 저장 (서버 재시작 시 초기화)
3. **에러 시뮬레이션**: 개발 중 에러 케이스 테스트를 위한 특수 입력값 정의
4. **성능 시뮬레이션**: setTimeout으로 네트워크 지연 시뮬레이션

---
작성일: 2024-01-20
작성자: Cushion AI Assistant