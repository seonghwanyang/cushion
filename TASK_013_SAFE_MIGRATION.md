# TASK_013 안전한 마이그레이션 가이드 (Git Conflict 방지)

## 🛡️ 핵심 전략
**기존 코드를 수정하지 않고 새로운 코드를 추가하여 병렬 운영 후 전환**

## 1. 환경 변수 설정

### Backend `.env.local` 수정
```env
# Mock 모드 비활성화
USE_MOCK_AUTH=false
USE_MOCK_DATABASE=false
USE_MOCK_AI=true          # 일단 유지
USE_MOCK_STORAGE=true     # 일단 유지

# 새로운 플래그 추가
USE_SUPABASE_AUTH=true

# 기존 JWT 설정은 일단 유지
JWT_SECRET=... 
JWT_REFRESH_SECRET=...
```

## 2. 새 파일 생성 (기존 파일 수정 X)

### A. Backend 새 파일들
```
backend/src/
├── middlewares/
│   ├── auth.middleware.ts          # 기존 파일 (수정 X)
│   └── auth.middleware.supabase.ts # 새 파일 ✨
├── services/
│   ├── auth.service.ts             # 기존 파일 (수정 X)
│   └── auth.service.supabase.ts    # 새 파일 ✨
└── lib/
    └── supabase-admin.ts           # 새 파일 ✨
```

### B. Frontend 새 파일들
```
frontend/src/lib/
├── api/
│   ├── auth.ts                     # 수정 필요 (작은 변경)
│   └── client.ts                   # 수정 필요 (인터셉터만)
└── supabase.ts                     # 이미 존재하면 확인만
```

## 3. 조건부 로직 구현

### Backend 라우터 수정 (최소 변경)
```typescript
// backend/src/routes/diary.routes.ts
import { authenticate } from '../middlewares/auth.middleware';
import { authenticateSupabase } from '../middlewares/auth.middleware.supabase';

const authMiddleware = process.env.USE_SUPABASE_AUTH === 'true' 
  ? authenticateSupabase 
  : authenticate;

// 라우트에서 authMiddleware 사용
router.get('/', authMiddleware, getDiaries);
```

## 4. Mock 파일 처리

### Mock 파일들은 그대로 유지!
```
backend/src/mocks/    # 삭제하지 않음 ✅
├── services/        
│   ├── jwt.service.mock.ts
│   ├── auth.service.mock.ts
│   └── ...
└── ...
```

이유:
1. Git conflict 방지
2. 롤백 가능성 대비
3. 나중에 안정화되면 한 번에 제거

## 5. 작업 순서

### Phase 1: 인프라 준비
1. [ ] 패키지 설치
2. [ ] 환경 변수 추가 (기존 것 유지)
3. [ ] supabase-admin.ts 생성

### Phase 2: Backend 새 파일 생성
1. [ ] auth.middleware.supabase.ts 생성
2. [ ] 라우터에서 조건부 미들웨어 적용
3. [ ] 테스트

### Phase 3: Frontend 수정 (최소)
1. [ ] API client 인터셉터만 수정
2. [ ] auth.ts의 메서드만 Supabase로 변경
3. [ ] 테스트

### Phase 4: 검증
1. [ ] 모든 기능 테스트
2. [ ] 문제 발생 시 USE_SUPABASE_AUTH=false로 즉시 롤백 가능

## 6. Git Commit 전략

### 작은 단위로 커밋
```bash
# 1. 환경 변수 추가
git add .env.local .env.example
git commit -m "feat: add Supabase auth feature flag"

# 2. 패키지 설치
git add package.json pnpm-lock.yaml
git commit -m "feat: add Supabase dependencies"

# 3. 새 파일 추가 (기존 파일 수정 X)
git add src/lib/supabase-admin.ts
git commit -m "feat: add Supabase admin client"

# 4. 미들웨어 추가
git add src/middlewares/auth.middleware.supabase.ts
git commit -m "feat: add Supabase auth middleware"
```

## 7. 롤백 계획

문제 발생 시:
1. `USE_SUPABASE_AUTH=false` 로 변경
2. 서버 재시작
3. 기존 방식으로 즉시 복귀

## 8. 최종 정리 (나중에)

모든 것이 안정화되면:
1. Mock 파일들 제거
2. 기존 JWT 코드 제거  
3. 조건부 로직 제거
4. 환경 변수 정리

---

**이 방식의 장점:**
- Git conflict 최소화
- 언제든 롤백 가능
- 점진적 마이그레이션
- 위험 분산

**주의:**
- 기존 파일 수정은 최소화
- 새 파일 위주로 작업
- 환경 변수로 제어