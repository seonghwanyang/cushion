# TASK_014: 백엔드 오류 해결 및 일기 작성 기능 완성

## 🚨 긴급 문제: 백엔드 서버 시작 실패

### 오류 내용
```
Error: Cannot find module '@/config/env'
[Supabase Config] Missing Supabase environment variables
```

## 수정 사항

### 1. 백엔드 모듈 경로 문제 해결

#### A. supabase-admin.ts 수정
**파일**: `backend/src/lib/supabase-admin.ts`

```typescript
// 현재 (오류)
import { env } from '@/config/env';

// 수정 방법 1: 상대 경로 사용
import { env } from '../config/env';

// 또는 수정 방법 2: config 파일이 없다면 직접 process.env 사용
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

#### B. 환경 변수 확인
`.env.local` 파일에 다음 변수들이 있는지 확인:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

이미 설정되어 있으므로 환경 변수 로드 문제일 수 있습니다.

#### C. tsconfig.json paths 확인
**파일**: `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. 임시 해결책 (빠른 수정)

만약 위 방법이 복잡하다면, supabase-admin.ts를 다음과 같이 수정:

```typescript
import { createClient } from '@supabase/supabase-js';

// 환경 변수 직접 사용
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase] Missing environment variables. Some features may not work.');
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
```

### 3. Frontend 수정 사항 (백엔드 해결 후)

#### A. 로그인 후 리다이렉트 경로
**파일**: `frontend/src/app/auth/callback/page.tsx`
```typescript
// /dashboard/diaries → /dashboard로 변경
router.push('/dashboard')
```

**파일**: `frontend/src/app/auth/login/page.tsx`
- 로그인 성공 후 리다이렉트 확인

#### B. 일기 최소 글자수 제거
**파일**: `frontend/src/app/dashboard/write/page.tsx`
```typescript
const diarySchema = z.object({
  content: z.string().min(1, '일기 내용을 입력해주세요'),
  mood: z.enum([...]),
  tags: z.string().optional(),
})
```

#### C. 취소 버튼 경로 수정
```typescript
// 현재: router.push('/diaries')
// 수정: router.push('/dashboard/diaries')
```

## 작업 순서

### Phase 1: 백엔드 긴급 수정 (최우선)
1. [ ] supabase-admin.ts의 import 경로 수정
2. [ ] 환경 변수 로드 확인
3. [ ] 백엔드 서버 재시작
4. [ ] 정상 작동 확인

### Phase 2: Frontend 수정
1. [ ] 리다이렉트 경로 수정
2. [ ] 최소 글자수 제한 제거
3. [ ] 취소 버튼 경로 수정

### Phase 3: 통합 테스트
1. [ ] 로그인 → /dashboard 이동
2. [ ] 일기 작성 → 저장 성공
3. [ ] 일기 목록 확인

## 디버깅 팁

### 백엔드 서버 시작 확인
```bash
cd backend

# 환경 변수 확인
cat .env.local | grep SUPABASE

# 서버 시작
pnpm dev

# 정상 시작 메시지
# Server running on http://localhost:3001
```

### 모듈 경로 문제 해결
1. `@/` 경로가 작동하지 않으면 상대 경로 사용
2. tsconfig-paths가 제대로 설정되었는지 확인
3. 필요시 ts-node 설정 확인

## 주의사항

- 백엔드가 시작되지 않으면 Frontend도 작동하지 않음
- 환경 변수가 제대로 로드되는지 확인
- TypeScript 경로 별칭(@/) 문제일 수 있음

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음 (백엔드 시작 실패)
**예상 소요시간**: 20분