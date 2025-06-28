# Task 005: Mock Diary Service 구현 및 서버 안정화

## 📋 작업 개요

**작업 ID**: 005  
**작업명**: 일기 CRUD Mock 서비스 구현 및 TypeScript 에러 해결  
**예상 소요시간**: 2-3시간  
**우선순위**: 🔴 Critical (Frontend 개발 블로킹 해소)  
**선행 작업**: Task 004-revised (90% 완료)

## 🎯 목표

1. TypeScript 컴파일 에러를 해결하여 서버가 정상 실행되도록 함
2. Mock Diary Service를 완전히 구현
3. 일기 관련 CRUD API 엔드포인트 구현
4. Frontend 개발을 위한 Mock API 완성

## 🐛 즉시 해결해야 할 문제

### TypeScript 에러 수정
현재 `src/app.ts`에서 사용하지 않는 매개변수로 인한 컴파일 에러 발생:
- Line 35: 'res' is declared but its value is never read
- Line 44: 'req' is declared but its value is never read  
- Line 59: 'req' is declared but its value is never read

**해결 방법**:
1. 사용하지 않는 매개변수 앞에 언더스코어(_) 추가
2. 또는 실제로 해당 매개변수 사용
3. tsconfig.json에서 일시적으로 규칙 완화 (비추천)

## 📋 작업 내용

### 1. TypeScript 에러 해결

#### `backend/src/app.ts` 수정
```typescript
// Line 35 근처 - 사용하지 않는 매개변수에 _ 추가
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Line 44 근처 - Health check 엔드포인트
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// Line 59 근처 - 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});
```

### 2. Mock Diary Service 완성

#### `backend/src/mocks/data/diaries.mock.ts` 생성
```typescript
import type { Diary, MoodType } from '@prisma/client';

export const mockDiaries: Diary[] = [
  {
    id: 'mock-diary-1',
    userId: 'mock-user-1',
    content: '오늘은 새로운 프로젝트 아이디어를 구상했다. 팀원들과 브레인스토밍을 하면서 창의적인 해결책을 제시했고, 모두가 긍정적인 반응을 보였다.',
    mood: 'EXCITED' as MoodType,
    tags: ['프로젝트', '브레인스토밍', '창의성'],
    isAnalyzed: true,
    analyzedAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'mock-diary-2',
    userId: 'mock-user-1',
    content: '면접 준비를 하면서 내가 지금까지 해온 프로젝트들을 정리했다. 생각보다 많은 것을 이뤄냈다는 것을 깨달았다.',
    mood: 'HAPPY' as MoodType,
    tags: ['면접준비', '회고', '성장'],
    isAnalyzed: true,
    analyzedAt: new Date('2024-01-16T10:00:00Z'),
    createdAt: new Date('2024-01-16T09:00:00Z'),
    updatedAt: new Date('2024-01-16T10:00:00Z'),
  },
  {
    id: 'mock-diary-3',
    userId: 'mock-user-1',
    content: '알고리즘 문제를 3시간 동안 풀었다. 어려웠지만 끝까지 포기하지 않고 해결했다. 문제 해결 능력이 향상되고 있음을 느낀다.',
    mood: 'NEUTRAL' as MoodType,
    tags: ['알고리즘', '문제해결', '인내'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-17T09:00:00Z'),
    updatedAt: new Date('2024-01-17T09:00:00Z'),
  },
  // 더 많은 mock 데이터 추가
  {
    id: 'mock-diary-4',
    userId: 'mock-user-2',
    content: '오늘은 고객 미팅이 있었다. 프레젠테이션을 성공적으로 마쳤고, 긍정적인 피드백을 받았다.',
    mood: 'HAPPY' as MoodType,
    tags: ['미팅', '프레젠테이션', '성취'],
    isAnalyzed: true,
    analyzedAt: new Date('2024-01-18T15:00:00Z'),
    createdAt: new Date('2024-01-18T14:00:00Z'),
    updatedAt: new Date('2024-01-18T15:00:00Z'),
  },
];

// 개발용 Mock 데이터 생성 함수
export function generateMockDiaries(userId: string, count: number): Diary[] {
  const moods: MoodType[] = ['HAPPY', 'SAD', 'NEUTRAL', 'ANXIOUS', 'EXCITED', 'ANGRY', 'PEACEFUL'];
  const contents = [
    '오늘은 코딩 챌린지를 완료했다. 새로운 알고리즘을 배웠고 문제 해결 능력이 향상되었다.',
    '팀 프로젝트에서 리더 역할을 맡았다. 책임감이 무겁지만 성장하는 기회라고 생각한다.',
    '면접 준비를 하면서 내 강점과 약점을 정리했다. 자기 이해가 깊어진 느낌이다.',
    '새로운 기술 스택을 학습했다. 처음엔 어려웠지만 점점 익숙해지고 있다.',
    '멘토링 세션에 참여했다. 선배 개발자의 조언이 큰 도움이 되었다.',
  ];
  
  const tags = [
    ['학습', '성장'],
    ['프로젝트', '팀워크'],
    ['코딩', '문제해결'],
    ['네트워킹', '커리어'],
    ['자기계발', '목표'],
  ];

  const diaries: Diary[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // 하루씩 이전
    const isAnalyzed = Math.random() > 0.3;
    
    diaries.push({
      id: `mock-diary-gen-${userId}-${i}`,
      userId,
      content: contents[i % contents.length],
      mood: moods[Math.floor(Math.random() * moods.length)],
      tags: tags[i % tags.length],
      isAnalyzed,
      analyzedAt: isAnalyzed ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return diaries;
}
```

#### `backend/src/mocks/services/diary.service.mock.ts` 완성
```typescript
import { IDiaryService, CreateDiaryInput, UpdateDiaryInput, DiaryFilter } from '@/interfaces/services/diary.service.interface';
import { mockDiaries, generateMockDiaries } from '../data/diaries.mock';
import { NotFoundError, UnauthorizedError } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import type { Diary } from '@prisma/client';

export class MockDiaryService implements IDiaryService {
  private diaries = new Map<string, Diary>();
  private userDiaries = new Map<string, Set<string>>();

  constructor() {
    // 초기 mock 데이터 로드
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // 기본 mock 데이터 추가
    mockDiaries.forEach(diary => {
      this.diaries.set(diary.id, { ...diary });
      this.addToUserDiaries(diary.userId, diary.id);
    });

    // 추가 mock 데이터 생성
    const additionalDiaries = generateMockDiaries('mock-user-1', 10);
    additionalDiaries.forEach(diary => {
      this.diaries.set(diary.id, diary);
      this.addToUserDiaries(diary.userId, diary.id);
    });
  }

  private addToUserDiaries(userId: string, diaryId: string): void {
    if (!this.userDiaries.has(userId)) {
      this.userDiaries.set(userId, new Set());
    }
    this.userDiaries.get(userId)!.add(diaryId);
  }

  async create(userId: string, input: CreateDiaryInput): Promise<Diary> {
    await this.simulateDelay();

    const diary: Diary = {
      id: `mock-diary-${uuidv4()}`,
      userId,
      content: input.content,
      mood: input.mood || null,
      tags: input.tags || [],
      isAnalyzed: false,
      analyzedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.diaries.set(diary.id, diary);
    this.addToUserDiaries(userId, diary.id);

    // 10% 확률로 에러 시뮬레이션 (개발 모드)
    if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
      throw new Error('Mock error: Failed to create diary');
    }

    return diary;
  }

  async findById(id: string): Promise<Diary | null> {
    await this.simulateDelay();
    return this.diaries.get(id) || null;
  }

  async findByUser(userId: string, filter?: DiaryFilter): Promise<Diary[]> {
    await this.simulateDelay();

    const userDiaryIds = this.userDiaries.get(userId) || new Set();
    let diaries = Array.from(userDiaryIds)
      .map(id => this.diaries.get(id)!)
      .filter(diary => diary !== undefined);

    // 필터 적용
    if (filter) {
      if (filter.startDate) {
        diaries = diaries.filter(d => d.createdAt >= filter.startDate!);
      }
      if (filter.endDate) {
        diaries = diaries.filter(d => d.createdAt <= filter.endDate!);
      }
      if (filter.mood) {
        diaries = diaries.filter(d => d.mood === filter.mood);
      }
      if (filter.tags && filter.tags.length > 0) {
        diaries = diaries.filter(d => 
          filter.tags!.some(tag => d.tags.includes(tag))
        );
      }
    }

    // 최신순 정렬
    return diaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary> {
    await this.simulateDelay();

    const diary = this.diaries.get(id);
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }

    if (diary.userId !== userId) {
      throw new UnauthorizedError('Not authorized to update this diary');
    }

    const updatedDiary = {
      ...diary,
      content: input.content !== undefined ? input.content : diary.content,
      mood: input.mood !== undefined ? input.mood : diary.mood,
      tags: input.tags !== undefined ? input.tags : diary.tags,
      updatedAt: new Date(),
    };

    this.diaries.set(id, updatedDiary);
    return updatedDiary;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.simulateDelay();

    const diary = this.diaries.get(id);
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }

    if (diary.userId !== userId) {
      throw new UnauthorizedError('Not authorized to delete this diary');
    }

    this.diaries.delete(id);
    this.userDiaries.get(userId)?.delete(id);
  }

  async count(userId: string): Promise<number> {
    await this.simulateDelay();
    return this.userDiaries.get(userId)?.size || 0;
  }

  private async simulateDelay(ms: number = 150): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Diary Controller 구현

#### `backend/src/api/controllers/diary.controller.ts` 생성
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';

// Validation schemas
const createDiarySchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
    mood: z.enum(['HAPPY', 'SAD', 'NEUTRAL', 'ANXIOUS', 'EXCITED', 'ANGRY', 'PEACEFUL']).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

const updateDiarySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    content: z.string().min(1).max(10000).optional(),
    mood: z.enum(['HAPPY', 'SAD', 'NEUTRAL', 'ANXIOUS', 'EXCITED', 'ANGRY', 'PEACEFUL']).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

const getDiarySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const listDiariesSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    mood: z.enum(['HAPPY', 'SAD', 'NEUTRAL', 'ANXIOUS', 'EXCITED', 'ANGRY', 'PEACEFUL']).optional(),
    tags: z.string().optional(), // comma-separated
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),
});

export class DiaryController {
  private get diaryService() {
    return serviceFactory.getDiaryService();
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const diary = await this.diaryService.create(userId, req.body);
      
      sendSuccess(res, diary, 201);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const diary = await this.diaryService.findById(id);
      
      if (!diary) {
        throw new NotFoundError('Diary not found');
      }
      
      // 권한 확인
      if (diary.userId !== userId) {
        throw new UnauthorizedError('Not authorized to view this diary');
      }
      
      sendSuccess(res, diary);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, mood, tags, page, limit } = req.query as any;
      
      const filter = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        mood,
        tags: tags ? tags.split(',') : undefined,
      };
      
      const diaries = await this.diaryService.findByUser(userId, filter);
      
      // 페이지네이션
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedDiaries = diaries.slice(start, end);
      
      sendSuccess(res, paginatedDiaries, 200, {
        page,
        totalPages: Math.ceil(diaries.length / limit),
        totalCount: diaries.length,
        hasNext: end < diaries.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const diary = await this.diaryService.update(id, userId, req.body);
      
      sendSuccess(res, diary);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await this.diaryService.delete(id, userId);
      
      sendSuccess(res, { message: '일기가 삭제되었습니다' });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const totalCount = await this.diaryService.count(userId);
      const diaries = await this.diaryService.findByUser(userId);
      
      // 기분 통계
      const moodStats = diaries.reduce((acc, diary) => {
        if (diary.mood) {
          acc[diary.mood] = (acc[diary.mood] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // 태그 통계
      const tagStats = diaries.reduce((acc, diary) => {
        diary.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      sendSuccess(res, {
        totalCount,
        moodStats,
        tagStats,
        lastDiaryDate: diaries[0]?.createdAt || null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const diaryController = new DiaryController();
export { createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema };
```

### 4. Diary Routes 구현

#### `backend/src/api/routes/diary.routes.ts` 생성
```typescript
import { Router } from 'express';
import { diaryController, createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema } from '../controllers/diary.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

export const diaryRouter = Router();

// 모든 diary 라우트는 인증 필요
diaryRouter.use(authenticate);

// Routes
diaryRouter.post('/', validate(createDiarySchema), diaryController.create.bind(diaryController));
diaryRouter.get('/', validate(listDiariesSchema), diaryController.list.bind(diaryController));
diaryRouter.get('/stats', diaryController.stats.bind(diaryController));
diaryRouter.get('/:id', validate(getDiarySchema), diaryController.findById.bind(diaryController));
diaryRouter.put('/:id', validate(updateDiarySchema), diaryController.update.bind(diaryController));
diaryRouter.delete('/:id', validate(getDiarySchema), diaryController.delete.bind(diaryController));
```

### 5. Routes Index 업데이트

#### `backend/src/api/routes/index.ts` 수정
```typescript
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { diaryRouter } from './diary.routes';

export const apiRouter = Router();

// Mount routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/diaries', diaryRouter);

// API info
apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'Cushion API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
      },
      diaries: {
        create: 'POST /diaries',
        list: 'GET /diaries',
        get: 'GET /diaries/:id',
        update: 'PUT /diaries/:id',
        delete: 'DELETE /diaries/:id',
        stats: 'GET /diaries/stats',
      },
      insights: '/insights (coming soon)',
      portfolio: '/portfolio (coming soon)',
    },
  });
});
```

### 6. Service Factory 업데이트

#### `backend/src/factories/service.factory.ts`에 diary service 추가 확인
이미 diary service가 추가되어 있는지 확인하고, 없다면 추가

### 7. JWT Mock Service 개선

#### `backend/src/mocks/services/jwt.service.mock.ts` 생성
```typescript
import { IJWTService } from '@/interfaces/services/jwt.service.interface';
import { UnauthorizedError } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';

interface MockTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  jti?: string;
  exp: number;
  iat: number;
}

export class MockJWTService implements IJWTService {
  private tokens = new Map<string, MockTokenPayload>();
  private refreshTokens = new Map<string, { userId: string; jti: string }>();

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const now = Date.now();
    const jti = uuidv4();
    
    // Generate mock access token
    const accessToken = `mock-access-${uuidv4()}`;
    const accessPayload: MockTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: now,
      exp: now + 15 * 60 * 1000, // 15 minutes
    };
    this.tokens.set(accessToken, accessPayload);
    
    // Generate mock refresh token
    const refreshToken = `mock-refresh-${uuidv4()}`;
    const refreshPayload: MockTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      jti,
      iat: now,
      exp: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    this.tokens.set(refreshToken, refreshPayload);
    this.refreshTokens.set(jti, { userId: user.id, jti });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
  
  async verifyAccessToken(token: string): Promise<MockTokenPayload> {
    const payload = this.tokens.get(token);
    
    if (!payload) {
      throw new UnauthorizedError('Invalid access token');
    }
    
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }
    
    if (payload.exp < Date.now()) {
      this.tokens.delete(token);
      throw new UnauthorizedError('Token expired');
    }
    
    return payload;
  }
  
  async verifyRefreshToken(token: string): Promise<MockTokenPayload> {
    const payload = this.tokens.get(token);
    
    if (!payload) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedError('Invalid token type');
    }
    
    if (payload.exp < Date.now()) {
      this.tokens.delete(token);
      if (payload.jti) {
        this.refreshTokens.delete(payload.jti);
      }
      throw new UnauthorizedError('Token expired');
    }
    
    return payload;
  }
  
  async revokeRefreshToken(jti: string): Promise<void> {
    this.refreshTokens.delete(jti);
    // Remove token from tokens map
    for (const [token, payload] of this.tokens.entries()) {
      if (payload.jti === jti) {
        this.tokens.delete(token);
        break;
      }
    }
  }
}
```

## 🚀 테스트 시나리오

### 1. 서버 시작 테스트
```bash
cd backend
pnpm dev:mock

# 콘솔에 다음과 같은 로그가 출력되어야 함:
# Using Mock Auth Service
# Using Mock Diary Service
# Server running on port 3001 in development mode
```

### 2. API 테스트 순서

#### 2.1 회원가입
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "테스트 사용자"
  }'
```

#### 2.2 로그인
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@cushion.app",
    "password": "password123"
  }'

# 응답에서 accessToken 복사
```

#### 2.3 일기 작성
```bash
curl -X POST http://localhost:3001/api/v1/diaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "content": "오늘은 Mock 서비스를 완성했다. 정말 뿌듯하다!",
    "mood": "HAPPY",
    "tags": ["개발", "성취"]
  }'
```

#### 2.4 일기 목록 조회
```bash
curl -X GET http://localhost:3001/api/v1/diaries \
  -H "Authorization: Bearer {accessToken}"
```

#### 2.5 일기 통계 조회
```bash
curl -X GET http://localhost:3001/api/v1/diaries/stats \
  -H "Authorization: Bearer {accessToken}"
```

## ✅ 완료 조건

1. TypeScript 컴파일 에러 해결
2. 서버가 정상적으로 실행됨
3. Mock 모드 로그 확인 (Using Mock ... Service)
4. 인증 API 동작 확인
5. 일기 CRUD API 모두 동작 확인
6. 에러 케이스 처리 확인

## 📝 주의사항

1. **Mock 데이터 일관성**: 
   - 모든 Mock ID는 'mock-' 접두사 사용
   - 사용자 ID와 일기 ID 간 참조 일치 확인

2. **에러 시뮬레이션**:
   - 개발 모드에서만 10% 확률로 에러 발생
   - 특정 입력값으로 에러 케이스 테스트 가능

3. **성능 시뮬레이션**:
   - 모든 Mock 서비스는 100-200ms 딜레이 포함
   - 실제 네트워크 지연과 유사한 환경 제공

## 🔄 다음 단계

### Task 006: Frontend 초기 설정 및 Mock API 연동
1. Next.js 프로젝트 설정
2. 인증 관련 페이지 구현 (로그인/회원가입)
3. 일기 작성 UI 구현
4. Mock API와 연동 테스트

---
작성일: 2024-01-20
작성자: Cushion AI Assistant