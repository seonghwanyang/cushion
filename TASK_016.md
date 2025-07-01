# TASK_016: Mock 데이터베이스를 실제 PostgreSQL로 전환

## 현재 상황
- ✅ Supabase Auth 작동
- ✅ 일기 작성 API 호출 성공
- ❌ USE_MOCK_DATABASE=true로 인해 실제 저장 안 됨
- ❌ Dashboard와 일기 목록이 Mock 데이터 표시

## 해결 방법

### 1. 환경 변수 수정
**파일**: `backend/.env.local`
```env
# Mock 데이터베이스 비활성화
USE_MOCK_DATABASE=false  # true → false로 변경
```

### 2. PostgreSQL 실행 확인
```bash
# PostgreSQL 서비스 확인
# Windows PowerShell (관리자)
Get-Service -Name postgresql*

# 또는 pgAdmin으로 확인
```

### 3. 데이터베이스 생성 및 마이그레이션
```bash
cd backend

# Prisma 클라이언트 생성
pnpm prisma generate

# 데이터베이스 마이그레이션
pnpm prisma migrate dev

# Prisma Studio로 테이블 확인
pnpm prisma studio
```

### 4. 사용자 데이터 동기화 문제 해결

Supabase Auth 사용자와 로컬 DB 사용자를 연결해야 합니다.

**옵션 1: 자동 생성 (권장)**
**파일**: `backend/src/api/middleware/auth.middleware.supabase.ts`
```typescript
// 사용자가 DB에 없으면 자동 생성
try {
  const dbUser = await authService.validateUser(user.id);
  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role || 'USER',
  };
} catch (dbError) {
  // 사용자가 없으면 생성
  console.log('[Auth] Creating new user in database:', user.email);
  
  const userService = serviceFactory.getUserService();
  const newUser = await userService.create({
    id: user.id, // Supabase ID 사용
    email: user.email!,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    profileImage: user.user_metadata?.avatar_url || null,
  });
  
  req.user = {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role || 'USER',
  };
}
```

**옵션 2: Prisma 스키마 수정**
**파일**: `backend/prisma/schema.prisma`
```prisma
model User {
  id           String    @id @default(cuid())
  supabaseId   String?   @unique @map("supabase_id")
  email        String    @unique
  name         String
  role         Role      @default(USER)
  status       UserStatus @default(ACTIVE)
  profileImage String?   @map("profile_image")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  diaries      Diary[]
  insights     Insight[]
  
  @@map("users")
}
```

### 5. Dashboard Mock 데이터 제거

**파일**: `frontend/src/app/dashboard/page.tsx`
- Mock 데이터 사용 부분 확인 및 제거
- 실제 API 호출 확인

## 작업 순서

1. **데이터베이스 준비**
   - [ ] PostgreSQL 실행 확인
   - [ ] USE_MOCK_DATABASE=false로 변경
   - [ ] Prisma 마이그레이션 실행

2. **사용자 동기화**
   - [ ] auth.middleware.supabase.ts에 사용자 자동 생성 로직 추가
   - [ ] 또는 수동으로 사용자 생성

3. **백엔드 재시작**
   - [ ] 서버 재시작
   - [ ] 로그에서 "Database connected successfully" 확인

4. **테스트**
   - [ ] 로그인 다시 시도
   - [ ] 일기 작성
   - [ ] 일기 목록에서 확인
   - [ ] Dashboard 통계 확인

## 예상되는 문제 및 해결

### 1. PostgreSQL 연결 실패
```
Error: P1001: Can't reach database server
```
**해결**: PostgreSQL 서비스 시작

### 2. 마이그레이션 오류
```
Error: P1008: Operations timed out
```
**해결**: DATABASE_URL 확인, PostgreSQL 비밀번호 확인

### 3. 사용자 ID 불일치
```
Error: Foreign key constraint failed
```
**해결**: Supabase user.id를 그대로 사용하도록 수정

## Mock 데이터 완전 제거 계획

### Phase 1: 데이터베이스 (오늘)
- USE_MOCK_DATABASE=false
- 실제 PostgreSQL 사용

### Phase 2: AI 분석 (선택)
- USE_MOCK_AI=false
- OpenAI API 사용

### Phase 3: Storage (선택)
- USE_MOCK_STORAGE=false
- Supabase Storage 사용

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음
**예상 소요시간**: 30분