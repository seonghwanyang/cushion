# TASK_017: 일기 작성 500 에러 해결 및 실제 데이터베이스 연결

## 🚨 현재 상황
- ✅ Supabase Auth 로그인 성공
- ✅ Frontend에서 /dashboard 리다이렉트 작동
- ❌ **일기 작성 시 500 Internal Server Error**
- ❌ Dashboard에 Mock 데이터 표시
- ⚠️ `USE_MOCK_DATABASE=false`이지만 실제 DB 연결 문제 의심

## 🔍 문제 분석

### 1. 500 에러 가능한 원인들
1. **Prisma 클라이언트 미생성**
   - `prisma generate` 실행 필요
   
2. **데이터베이스 마이그레이션 미실행**
   - 테이블이 존재하지 않을 수 있음
   
3. **사용자 ID 타입 불일치**
   - Supabase: UUID (예: `123e4567-e89b-12d3-a456-426614174000`)
   - Prisma Schema: `@default(uuid())` 설정되어 있음
   - 하지만 auth.middleware.supabase.ts에서 사용자 생성 시 문제 가능

4. **데이터베이스 연결 실패**
   - Supabase PostgreSQL 연결 문자열 문제
   - 네트워크 문제

## 🛠️ 해결 방법

### Step 1: Prisma 설정 및 마이그레이션

```bash
cd backend

# 1. Prisma 클라이언트 생성
pnpm prisma generate

# 2. 데이터베이스 상태 확인
pnpm prisma db pull

# 3. 마이그레이션 실행 (기존 테이블이 있으면 백업 먼저!)
pnpm prisma migrate dev --name init

# 4. Prisma Studio로 테이블 확인
pnpm prisma studio
```

### Step 2: 백엔드 로그 확인

백엔드 서버를 디버그 모드로 재시작:

```bash
# 기존 서버 중지 (Ctrl+C)
# 디버그 모드로 재시작
cd backend
pnpm dev
```

일기 작성을 다시 시도하고 콘솔에서 정확한 에러 메시지 확인

### Step 3: 에러별 해결 방법

#### 3-1. "relation does not exist" 에러
```bash
# 마이그레이션 강제 실행
pnpm prisma migrate reset --force
pnpm prisma migrate dev
```

#### 3-2. "User validation failed" 에러
**파일**: `backend/src/api/middleware/auth.middleware.supabase.ts`

```typescript
// 사용자 생성 부분 수정
if (!config.features.useMockDatabase) {
  const { prisma } = await import('@/config/database');
  
  // 이미 존재하는지 먼저 확인
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  });
  
  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        id: user.id, // Supabase UUID 사용
        email: user.email!,
        password: '', // Supabase 사용자는 비밀번호 불필요
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        profile: {
          create: {
            bio: '',
            currentSituation: '',
            goals: [],
          },
        },
      },
    });
    
    console.log('[Auth Middleware] Created new user:', newUser.id);
  }
  
  // 사용자 정보 다시 가져오기
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });
  
  req.user = {
    id: dbUser!.id,
    email: dbUser!.email,
    role: dbUser!.role,
  };
}
```

#### 3-3. "Cannot read properties of undefined" 에러
**파일**: `backend/src/services/diary.service.ts`

에러 핸들링 개선:
```typescript
async create(userId: string, input: CreateDiaryInput): Promise<Diary> {
  try {
    // userId 검증
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    const diary = await this.prisma.diary.create({
      data: {
        userId,
        content: input.content,
        mood: input.mood || null,
        tags: input.tags || [],
      },
    });

    logger.info(`Diary created: ${diary.id} for user: ${userId}`);
    return diary;
  } catch (error) {
    logger.error('Failed to create diary:', error);
    throw error;
  }
}
```

### Step 4: Dashboard Mock 데이터 제거

**파일**: `frontend/src/app/dashboard/components/StrengthRadar.tsx`
**파일**: `frontend/src/app/dashboard/components/EmotionTrend.tsx`
**파일**: `frontend/src/app/dashboard/components/WeeklyHeatmap.tsx`
**파일**: `frontend/src/app/dashboard/components/GrowthProgress.tsx`

각 컴포넌트에서:
1. Mock 데이터 import 제거
2. 실제 API 호출로 교체
3. 로딩 상태 처리 추가

예시:
```typescript
const [stats, setStats] = useState<DiaryStats | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStats = async () => {
    try {
      const data = await diaryApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchStats();
}, []);

if (loading) return <div>Loading...</div>;
if (!stats) return <div>No data available</div>;
```

## 📋 작업 체크리스트

### 즉시 실행
1. [ ] Prisma 클라이언트 생성 (`pnpm prisma generate`)
2. [ ] 데이터베이스 마이그레이션 (`pnpm prisma migrate dev`)
3. [ ] 백엔드 서버 재시작
4. [ ] 콘솔에서 정확한 에러 메시지 확인

### 에러 수정
5. [ ] 에러 메시지에 따라 위의 해결 방법 적용
6. [ ] auth.middleware.supabase.ts 사용자 생성 로직 수정
7. [ ] diary.service.ts 에러 핸들링 개선

### Dashboard 수정
8. [ ] Mock 데이터 import 제거
9. [ ] 실제 API 호출 구현
10. [ ] 로딩/에러 상태 처리

## 🎯 성공 기준
- ✅ 일기 작성 성공 (201 응답)
- ✅ 작성한 일기가 일기 목록에 표시
- ✅ Dashboard에 실제 통계 표시
- ✅ 콘솔에 에러 없음

## 💡 추가 팁

### 빠른 테스트를 위한 curl 명령어
```bash
# 토큰은 브라우저 개발자 도구 > Network > Authorization 헤더에서 복사
curl -X POST http://localhost:3002/api/v1/diaries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"content":"테스트 일기입니다","mood":"HAPPY","tags":["test"]}'
```

### Prisma Studio 활용
```bash
pnpm prisma studio
```
- Users 테이블에 로그인한 사용자가 있는지 확인
- Diaries 테이블이 생성되었는지 확인
- 관계가 올바르게 설정되었는지 확인

---

**작성일**: 2025-01-29
**작성자**: Claude
**우선순위**: 🔥 최우선
**예상 소요시간**: 30-45분
**다음 작업**: Dashboard Mock 데이터 제거 → AI 분석 실제 구현