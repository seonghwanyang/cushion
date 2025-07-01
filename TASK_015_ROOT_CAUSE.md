# TASK_015_ROOT_CAUSE: USE_SUPABASE_AUTH 환경 변수 추가

## 🎯 근본 원인
`backend/src/config/index.ts`에 `USE_SUPABASE_AUTH` 환경 변수가 정의되지 않아서 인식되지 않음

## 해결 방법

### 1. config/index.ts에 환경 변수 추가

**파일**: `backend/src/config/index.ts`

```typescript
const baseSchema = {
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Feature Flags
  USE_MOCK_AUTH: z.string().transform(v => v === 'true').default(isDev ? 'true' : 'false'),
  USE_MOCK_DATABASE: z.string().transform(v => v === 'true').default(isDev ? 'true' : 'false'),
  USE_MOCK_AI: z.string().transform(v => v === 'true').default('true'),
  USE_MOCK_STORAGE: z.string().transform(v => v === 'true').default('true'),
  USE_SUPABASE_AUTH: z.string().transform(v => v === 'true').default('false'), // 추가!
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform((val) => val.split(',')),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
};
```

그리고 config 객체에도 추가:

```typescript
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  features: {
    useMockAuth: env.USE_MOCK_AUTH,
    useMockDatabase: env.USE_MOCK_DATABASE,
    useMockAI: env.USE_MOCK_AI,
    useMockStorage: env.USE_MOCK_STORAGE,
    useSupabaseAuth: env.USE_SUPABASE_AUTH, // 추가!
  },
  
  // ... 나머지
} as const;
```

### 2. diary.routes.ts 수정

**파일**: `backend/src/api/routes/diary.routes.ts`

```typescript
import { Router } from 'express';
import { diaryController, createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema } from '../controllers/diary.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authenticateSupabase } from '../middleware/auth.middleware.supabase';
import { config } from '@/config'; // config import

export const diaryRouter = Router();

// config에서 가져오기
const authMiddleware = config.features.useSupabaseAuth ? authenticateSupabase : authenticate;

console.log('[Diary Routes] Using auth:', config.features.useSupabaseAuth ? 'Supabase' : 'JWT');

diaryRouter.use(authMiddleware);

// Routes...
```

### 3. 다른 라우트 파일들도 동일하게 수정

**수정이 필요한 파일들**:
- `backend/src/api/routes/auth.routes.ts`
- `backend/src/api/routes/insight.routes.ts`
- 기타 인증이 필요한 모든 라우트

### 4. Supabase 관련 환경 변수도 추가 (선택사항)

config/index.ts의 conditionalSchema에 추가:

```typescript
// Supabase (개발에서는 선택적)
SUPABASE_URL: z.string().optional(),
SUPABASE_ANON_KEY: z.string().optional(),
SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
```

그리고 config 객체에 추가:

```typescript
supabase: {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
},
```

## 작업 순서

1. **config/index.ts 수정**
   - [ ] USE_SUPABASE_AUTH 환경 변수 스키마 추가
   - [ ] config.features.useSupabaseAuth 추가

2. **라우트 파일들 수정**
   - [ ] diary.routes.ts - config에서 가져오기
   - [ ] auth.routes.ts - 동일하게 수정
   - [ ] insight.routes.ts - 동일하게 수정

3. **테스트**
   - [ ] 서버 재시작
   - [ ] 콘솔에서 "Using auth: Supabase" 확인
   - [ ] 일기 작성 테스트

## 예상 결과

서버 시작 시:
```
[Diary Routes] Using auth: Supabase
[Auth Routes] Using auth: Supabase
Server running on port 3001 in development mode
Mock Services: Auth=false, DB=false, AI=true
```

이제 Supabase Auth가 제대로 사용될 것입니다!

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음
**예상 소요시간**: 15분

이것이 근본적인 해결책입니다. 환경 변수가 config에 정의되지 않아서 무시되고 있었던 것입니다.