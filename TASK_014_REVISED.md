# TASK_014_REVISED: 일기 작성 기능 문제 해결

## 현재 문제점 정리

### 1. 로그인 리다이렉트 문제
- 위치: `frontend/src/app/auth/callback/page.tsx`
- 54번째 줄: `const next = searchParams.get('next') || '/dashboard/diaries'`
- 수정: `/dashboard/diaries` → `/dashboard`

### 2. 일기 최소 글자수 제한
- 위치: `frontend/src/app/dashboard/write/page.tsx`
- diarySchema에서 최소 10자 제한 → 1자로 수정

### 3. 백엔드 연결 오류 (ERR_CONNECTION_REFUSED)
- 백엔드 서버가 실행되지 않고 있음
- 원인: supabase-admin.ts의 import 경로 문제

### 4. 일기 작성 시 undefined 오류
- API 응답이 undefined로 나타남
- 백엔드가 실행되지 않아서 발생하는 문제

## 수정 작업

### 1. 백엔드 서버 수정 (최우선)

#### A. Import 경로 문제 해결
**파일**: `backend/src/lib/supabase-admin.ts`
```typescript
// 옵션 1: 상대 경로 사용
import { env } from '../config/env';

// 옵션 2: process.env 직접 사용 (env.ts가 없는 경우)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

#### B. 백엔드 서버 재시작
```bash
cd backend
pnpm dev

# 정상 시작 확인 메시지:
# Server running on http://localhost:3001
```

### 2. Frontend 수정

#### A. 로그인 리다이렉트 경로
**파일**: `frontend/src/app/auth/callback/page.tsx` (54번째 줄)
```typescript
// 현재
const next = searchParams.get('next') || '/dashboard/diaries'

// 수정
const next = searchParams.get('next') || '/dashboard'
```

#### B. 일기 최소 글자수 제거
**파일**: `frontend/src/app/dashboard/write/page.tsx`
```typescript
// 현재
const diarySchema = z.object({
  content: z.string().min(10, '일기는 최소 10자 이상 작성해주세요'),
  // ...
})

// 수정
const diarySchema = z.object({
  content: z.string().min(1, '일기 내용을 입력해주세요'),
  // ...
})
```

#### C. 취소 버튼 경로 수정
**파일**: `frontend/src/app/dashboard/write/page.tsx`
```typescript
// 현재
onClick={() => router.push('/diaries')}

// 수정
onClick={() => router.push('/dashboard/diaries')}
```

### 3. 디버깅 정보 추가 (선택사항)

**파일**: `frontend/src/lib/api/diary.ts`
```typescript
async create(data: CreateDiaryRequest): Promise<Diary> {
  try {
    console.log('[Diary API] Creating diary with data:', data);
    const response = await apiClient.post('/diaries', data);
    console.log('[Diary API] Create response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Diary API] Create error:', error);
    throw error;
  }
},
```

## 작업 순서

1. **백엔드 서버 해결 (필수)**
   - [ ] supabase-admin.ts import 경로 수정
   - [ ] 백엔드 서버 정상 시작 확인
   - [ ] http://localhost:3001 접속 확인

2. **Frontend 수정**
   - [ ] 로그인 리다이렉트 경로 수정
   - [ ] 일기 최소 글자수 제한 제거
   - [ ] 취소 버튼 경로 수정

3. **통합 테스트**
   - [ ] 로그인 → /dashboard로 이동
   - [ ] 일기 작성 → 1글자만 써도 저장 가능
   - [ ] 일기 저장 → 성공 확인

## 테스트 시나리오

1. **백엔드 서버 상태 확인**
   ```bash
   # 브라우저에서
   http://localhost:3001/api/v1/health
   
   # 또는 터미널에서
   curl http://localhost:3001/api/v1/health
   ```

2. **일기 작성 테스트**
   - 1글자만 입력 → 저장 성공
   - 네트워크 탭에서 201 응답 확인

## 문제 해결 팁

### ERR_CONNECTION_REFUSED 해결
1. 백엔드 서버가 실행 중인지 확인
2. 포트 3001이 사용 중인지 확인
3. 방화벽 설정 확인

### undefined 오류 해결
1. 백엔드 응답 형식 확인
2. API 클라이언트 로그 확인
3. 네트워크 탭에서 실제 응답 확인

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음
**예상 소요시간**: 15분