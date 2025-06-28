# Cushion 클라우드 네이티브 개발 가이드

## 🎯 개요

MVP 단계부터 Docker/Kubernetes를 고려한 개발을 하면 나중에 확장할 때 큰 리팩토링 없이 전환할 수 있습니다. 이 가이드는 처음부터 클라우드 네이티브 애플리케이션으로 개발하는 방법을 다룹니다.

## 🏗 12-Factor App 원칙 적용

### 1. 코드베이스 (Codebase)
```yaml
# 모노레포 구조로 관리하되, 각 서비스는 독립적으로 배포 가능
cushion/
├── services/
│   ├── frontend/       # 독립 배포 가능
│   ├── backend/        # 독립 배포 가능
│   ├── ai-service/     # 향후 분리 가능
│   └── worker/         # 백그라운드 작업
├── packages/           # 공유 코드
│   ├── types/
│   └── utils/
└── k8s/               # Kubernetes 매니페스트
```

### 2. 의존성 (Dependencies)
```dockerfile
# ❌ Bad: 시스템 의존성에 의존
RUN apt-get install nodejs

# ✅ Good: 모든 의존성을 명시적으로 선언
FROM node:20-alpine AS base
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
```

### 3. 설정 (Config)
```typescript
// ❌ Bad: 하드코딩된 설정
const dbHost = 'localhost';
const apiKey = 'sk-1234567890';

// ✅ Good: 환경 변수로 모든 설정 관리
export class ConfigService {
  private readonly config = {
    // 데이터베이스
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME || 'cushion',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      // 연결 풀 설정 (K8s에서 중요)
      poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
      poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
      poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000'),
    },
    
    // Redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      // Sentinel 지원 (HA를 위해)
      sentinels: process.env.REDIS_SENTINELS?.split(',').map(s => {
        const [host, port] = s.split(':');
        return { host, port: parseInt(port) };
      }),
      name: process.env.REDIS_MASTER_NAME || 'mymaster',
    },
    
    // 애플리케이션
    app: {
      port: parseInt(process.env.PORT || '3000'),
      env: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      // 그레이스풀 셧다운을 위한 타임아웃
      shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000'),
    },
    
    // 외부 서비스
    services: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        organization: process.env.OPENAI_ORG || '',
        // 재시도 설정
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
      },
    },
  };

  get<T>(key: string): T {
    return key.split('.').reduce((o, k) => o?.[k], this.config) as T;
  }

  // 설정 검증 (앱 시작 시 실행)
  validate(): void {
    const required = [
      'DB_HOST',
      'DB_PASSWORD',
      'REDIS_HOST',
      'OPENAI_API_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }
}
```

### 4. 백킹 서비스 (Backing Services)
```typescript
// ✅ Good: 모든 외부 서비스를 추상화
export interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Redis 구현
export class RedisCacheService implements CacheService {
  constructor(private redis: Redis) {}
  
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// 로컬 메모리 구현 (테스트/개발용)
export class MemoryCacheService implements CacheService {
  private cache = new Map<string, { value: string; expires?: number }>();
  
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expires });
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
```

## 🐳 Docker 최적화

### 1. 멀티스테이지 빌드
```dockerfile
# frontend/Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@8 --activate

# 의존성 파일만 복사 (캐시 최적화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시 필요한 환경 변수
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# 보안을 위한 non-root 사용자
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 소유권 변경
RUN chown -R nextjs:nodejs /app

USER nextjs

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

```dockerfile
# backend/Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# Prisma 클라이언트 생성
RUN pnpm prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# 보안 강화
RUN apk add --no-cache dumb-init
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@8 --activate
RUN pnpm install --prod --frozen-lockfile

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN chown -R expressjs:nodejs /app

USER expressjs

# 헬스체크 엔드포인트
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

# dumb-init으로 시그널 처리
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### 2. 개발용 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - /app/dist
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cushion_dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-key
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=cushion_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx (개발용 리버스 프록시)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.dev.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## ☸️ Kubernetes 준비

### 1. 상태 비저장 설계 (Stateless)
```typescript
// ❌ Bad: 로컬 파일 시스템 사용
import fs from 'fs';

export class FileUploadService {
  async saveFile(file: Buffer, filename: string): Promise<void> {
    // 파드가 재시작되면 파일이 사라짐
    fs.writeFileSync(`./uploads/${filename}`, file);
  }
}

// ✅ Good: 객체 스토리지 사용
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3UploadService {
  constructor(private s3: S3Client) {}

  async saveFile(file: Buffer, filename: string): Promise<string> {
    const key = `uploads/${Date.now()}-${filename}`;
    
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file,
    }));
    
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
```

### 2. 헬스체크 구현
```typescript
// src/health/health.controller.ts
export class HealthController {
  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  // Liveness Probe: 앱이 살아있는지
  @Get('/health/live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  // Readiness Probe: 트래픽을 받을 준비가 되었는지
  @Get('/health/ready')
  async readiness(): Promise<{ status: string; checks: Record<string, boolean> }> {
    const checks = {
      database: false,
      redis: false,
    };

    try {
      // DB 연결 확인
      await this.db.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Redis 연결 확인
      await this.redis.ping();
      checks.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    const isReady = Object.values(checks).every(v => v);
    
    if (!isReady) {
      throw new HttpException(
        { status: 'not ready', checks },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ready', checks };
  }

  // Startup Probe: 앱이 시작되었는지 (초기화가 오래 걸리는 경우)
  @Get('/health/startup')
  async startup(): Promise<{ status: string; initialized: boolean }> {
    // 마이그레이션 완료 확인 등
    const initialized = await this.checkInitialization();
    
    if (!initialized) {
      throw new HttpException(
        { status: 'starting', initialized: false },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'started', initialized: true };
  }
}
```

### 3. 그레이스풀 셧다운
```typescript
// src/server.ts
import { createServer } from 'http';
import { app } from './app';

const server = createServer(app);
const PORT = process.env.PORT || 3001;

// 연결 추적
const connections = new Set<Socket>();

server.on('connection', (connection) => {
  connections.add(connection);
  connection.on('close', () => {
    connections.delete(connection);
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 그레이스풀 셧다운
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received, starting graceful shutdown...`);

  // 1. 새로운 요청 거부
  server.close(() => {
    console.log('HTTP server closed');
  });

  // 2. 헬스체크 실패 처리 (K8s가 트래픽을 보내지 않도록)
  app.locals.isShuttingDown = true;

  // 3. 진행 중인 요청 완료 대기 (최대 30초)
  const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || '30000');
  const forceShutdownTimer = setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    connections.forEach(connection => connection.destroy());
    process.exit(1);
  }, shutdownTimeout);

  // 4. 리소스 정리
  try {
    await Promise.all([
      // DB 연결 종료
      prisma.$disconnect(),
      // Redis 연결 종료
      redis.quit(),
      // 진행 중인 작업 완료
      jobQueue.close(),
    ]);

    clearTimeout(forceShutdownTimer);
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// 시그널 처리
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 비정상 종료 처리
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
```

### 4. 로깅 및 모니터링
```typescript
// src/logger/logger.service.ts
import winston from 'winston';

// 구조화된 로깅 (JSON 형식)
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'cushion-backend',
    version: process.env.APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // 콘솔 출력 (K8s가 수집)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
    }),
  ],
});

// 요청 로깅 미들웨어
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 요청 ID 생성 (분산 추적용)
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    });
  });

  next();
};

// 에러 로깅
export const errorLogger = (error: Error, req: Request) => {
  logger.error('Application Error', {
    requestId: req.id,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      path: req.path,
      body: req.body,
      userId: req.user?.id,
    },
  });
};
```

### 5. 메트릭 수집
```typescript
// src/metrics/metrics.service.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP 요청 카운터
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// HTTP 요청 지속 시간
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// 활성 연결 수
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// 비즈니스 메트릭
export const diaryCreatedCounter = new Counter({
  name: 'diary_created_total',
  help: 'Total number of diaries created',
  labelNames: ['user_type'],
});

// 메트릭 엔드포인트
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// 메트릭 수집 미들웨어
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status_code: res.statusCode,
    };
    
    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);
    activeConnections.dec();
  });
  
  next();
};
```

## 🔧 개발 시 주의사항

### 1. 환경 변수 관리
```typescript
// config/env.validation.ts
import { z } from 'zod';

// 환경 변수 스키마
const envSchema = z.object({
  // 필수 환경 변수
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().regex(/^\d+$/).transform(Number),
  
  // 데이터베이스
  DATABASE_URL: z.string().url(),
  DB_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DB_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  
  // 외부 서비스
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  
  // 옵셔널
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  METRICS_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// 환경 변수 검증
export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
};

// 타입 안전한 환경 변수
export const env = validateEnv();
```

### 2. 리소스 제한 고려
```typescript
// 메모리 효율적인 스트리밍 처리
export class LargeDataProcessor {
  // ❌ Bad: 전체 데이터를 메모리에 로드
  async processAllDiaries(): Promise<void> {
    const diaries = await prisma.diary.findMany(); // OOM 위험
    
    for (const diary of diaries) {
      await this.processDiary(diary);
    }
  }
  
  // ✅ Good: 스트리밍/페이징 처리
  async processAllDiariesStream(): Promise<void> {
    const batchSize = 100;
    let cursor: string | undefined;
    
    while (true) {
      const diaries = await prisma.diary.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      });
      
      if (diaries.length === 0) break;
      
      // 배치 처리
      await Promise.all(
        diaries.map(diary => this.processDiary(diary))
      );
      
      cursor = diaries[diaries.length - 1].id;
      
      // CPU 양보 (이벤트 루프 블로킹 방지)
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

### 3. 네트워크 정책 고려
```typescript
// 서비스 간 통신
export class ServiceClient {
  constructor(
    private httpClient: HttpClient,
    private config: ConfigService,
  ) {}
  
  // 재시도 및 타임아웃 설정
  async callAIService(data: any): Promise<any> {
    return this.httpClient.post('/analyze', data, {
      timeout: 30000, // 30초 타임아웃
      retry: {
        limit: 3,
        methods: ['POST'],
        statusCodes: [408, 429, 500, 502, 503, 504],
        backoff: {
          delay: 1000,
          maxDelay: 10000,
          factor: 2,
        },
      },
      // 서비스 메시 환경에서의 헤더
      headers: {
        'X-Request-ID': getCurrentRequestId(),
        'X-B3-TraceId': getTraceId(), // 분산 추적
      },
    });
  }
}
```

## 📦 Kubernetes 매니페스트 예시

### Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cushion-backend
  labels:
    app: cushion
    component: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cushion
      component: backend
  template:
    metadata:
      labels:
        app: cushion
        component: backend
    spec:
      containers:
      - name: backend
        image: cushion/backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cushion-secrets
              key: database-url
        envFrom:
        - configMapRef:
            name: cushion-config
        - secretRef:
            name: cushion-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: http
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
```

이렇게 처음부터 클라우드 네이티브 원칙을 따라 개발하면, 나중에 Kubernetes로 전환할 때 큰 수정 없이 배포할 수 있습니다!