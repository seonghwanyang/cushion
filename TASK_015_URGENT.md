# TASK_015_URGENT: Mock JWT가 실행되는 문제 해결

## 🚨 핵심 문제
- Supabase Auth가 아닌 **Mock JWT Service가 실행 중**
- `USE_SUPABASE_AUTH=true`가 제대로 인식되지 않음
- 기존 auth.middleware.ts가 사용되고 있음

## 즉시 해결 방법

### 1. 환경 변수 디버깅 추가

**파일**: `backend/src/api/routes/diary.routes.ts`
```typescript
import { Router } from 'express';
import { diaryController, createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema } from '../controllers/diary.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authenticateSupabase } from '../middleware/auth.middleware.supabase';

// Environment variable check
const USE_SUPABASE_AUTH = process.env.USE_SUPABASE_AUTH === 'true';

// 디버깅 로그 추가
console.log('[Diary Routes] USE_SUPABASE_AUTH:', process.env.USE_SUPABASE_AUTH);
console.log('[Diary Routes] Using auth middleware:', USE_SUPABASE_AUTH ? 'Supabase' : 'JWT Mock');

export const diaryRouter = Router();

// All diary routes require authentication
const authMiddleware = USE_SUPABASE_AUTH ? authenticateSupabase : authenticate;
diaryRouter.use(authMiddleware);

// Routes...
```

### 2. 다른 라우트 파일들도 확인

**확인 필요한 파일들**:
- `backend/src/api/routes/auth.routes.ts`
- `backend/src/api/routes/insight.routes.ts`
- 기타 인증이 필요한 라우트들

### 3. 임시 강제 적용 (빠른 해결)

만약 환경 변수가 계속 문제라면, 강제로 Supabase 사용:

**파일**: `backend/src/api/routes/diary.routes.ts`
```typescript
// 임시로 강제 설정
const USE_SUPABASE_AUTH = true; // process.env.USE_SUPABASE_AUTH === 'true';

// 또는 직접 Supabase 미들웨어 사용
diaryRouter.use(authenticateSupabase);
```

### 4. Mock 서비스 확인

**파일**: `backend/src/factories/service.factory.ts`
- USE_MOCK_AUTH가 false인지 확인
- 로그 추가하여 어떤 서비스가 생성되는지 확인

## 환경 변수 로드 문제 해결

### 옵션 1: dotenv 확인
**파일**: `backend/src/server.ts` 또는 app 초기화 부분
```typescript
import dotenv from 'dotenv';
import path from 'path';

// .env.local 파일 명시적 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 환경 변수 확인
console.log('=== Environment Check ===');
console.log('USE_SUPABASE_AUTH:', process.env.USE_SUPABASE_AUTH);
console.log('USE_MOCK_AUTH:', process.env.USE_MOCK_AUTH);
console.log('=======================');
```

### 옵션 2: package.json 스크립트 확인
```json
{
  "scripts": {
    "dev": "dotenv -e .env.local -- nodemon"
  }
}
```

## 작업 순서

1. **즉시 확인**
   - [ ] diary.routes.ts에 로그 추가
   - [ ] 서버 재시작
   - [ ] 콘솔에서 어떤 미들웨어가 사용되는지 확인

2. **환경 변수 문제 해결**
   - [ ] .env.local이 제대로 로드되는지 확인
   - [ ] USE_SUPABASE_AUTH=true 설정 확인

3. **임시 해결책**
   - [ ] 강제로 authenticateSupabase 사용
   - [ ] 테스트 후 정상 작동 확인

## 예상 콘솔 출력

정상적인 경우:
```
[Diary Routes] USE_SUPABASE_AUTH: true
[Diary Routes] Using auth middleware: Supabase
```

현재 문제:
```
[Diary Routes] USE_SUPABASE_AUTH: undefined
[Diary Routes] Using auth middleware: JWT Mock
```

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음
**예상 소요시간**: 10분