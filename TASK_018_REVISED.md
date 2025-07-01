# TASK_018: Prisma "prepared statement does not exist" 오류 해결 및 Mock 데이터 제거

## 🚨 긴급: 문제 진단 완료

백엔드 콘솔 로그 분석 결과:
```
Error: prepared statement "s10" does not exist
Error: prepared statement "s28" does not exist
Error: prepared statement "s27" does not exist
```

**원인**: Prisma Client와 PostgreSQL 연결 풀(connection pool) 문제입니다.

## 🔍 문제 상세 분석

### 1. Prisma Prepared Statement 오류
- Supabase PostgreSQL은 Pooler 모드 사용 시 prepared statements를 지원하지 않음
- 현재 연결 문자열이 pooler endpoint를 사용 중
- Prisma가 prepared statement를 사용하려 하지만 실패

### 2. 현재 연결 문자열
```
DATABASE_URL=postgresql://postgres.hfhqctnrcesbulljsbwt:XJc7HkRHGyerz5yM@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```
↑ `pooler.supabase.com` 부분이 문제!

## 🛠️ 즉시 해결 방법

### Solution 1: Transaction Mode 사용 (권장) 🔥

**파일**: `backend/.env.local`
```env
# Pooler 연결에 ?pgbouncer=true 추가
DATABASE_URL=postgresql://postgres.hfhqctnrcesbulljsbwt:XJc7HkRHGyerz5yM@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Solution 2: Direct Connection 사용

Supabase 대시보드에서 Direct Connection URL 찾기:
1. Supabase Dashboard → Settings → Database
2. Connection string → "Connection pooling" 체크 해제
3. Direct connection URL 복사

**파일**: `backend/.env.local`
```env
# Direct connection (pooler 없는 URL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.hfhqctnrcesbulljsbwt.supabase.co:5432/postgres
```

### Solution 3: Prisma 스키마 수정

**파일**: `backend/prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Pooler 사용 시 추가
  relationMode = "prisma"
}
```

## 📋 즉시 실행 단계

### Step 1: 환경 변수 수정
```bash
# backend/.env.local 파일 수정
# Solution 1 또는 2 중 선택하여 DATABASE_URL 수정
```

### Step 2: Prisma 재생성
```bash
cd backend

# Prisma Client 재생성
pnpm prisma generate

# 서버 재시작
# Ctrl+C로 중지 후
pnpm dev
```

### Step 3: 테스트
```bash
# 다시 로그인 후 일기 목록 확인
# 오류가 해결되었는지 확인
```

## 🔧 추가 디버깅 (문제 지속 시)

### Option A: Prisma 로그 레벨 상세 설정

**파일**: `backend/src/config/database.ts`
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
  // Prepared statements 비활성화
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 연결 테스트
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));
```

### Option B: Connection Pool 설정

**파일**: `backend/src/server.ts`
```typescript
// 서버 종료 시 Prisma 연결 정리
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

## 🎯 Mock 데이터 제거 (문제 해결 후)

### 1. Frontend 일기 목록 페이지
**파일**: `frontend/src/app/diaries/page.tsx`
- Mock import 제거
- 실제 API 응답 처리

### 2. Dashboard 컴포넌트들
- `StrengthRadar.tsx`
- `EmotionTrend.tsx`
- `WeeklyHeatmap.tsx`
- `GrowthProgress.tsx`

각 파일에서 Mock 데이터 import 제거 및 실제 API 연결

## ⚡ 빠른 임시 해결책

만약 위 방법들이 모두 실패하면:

**파일**: `backend/.env.local`
```env
# 임시로 로컬 PostgreSQL 사용
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cushion_dev
```

그리고:
```bash
# 로컬 PostgreSQL에 마이그레이션
pnpm prisma migrate dev
```

## 📊 예상 결과

성공 시 콘솔 출력:
```
✅ Database connected successfully
[Auth Middleware Supabase] Authentication successful for: yangseonghwan119@gmail.com
[DiaryService] Found 3 diaries for user: 5471aa3c-e344-4685-9c13-acde88043cf2
GET /api/v1/diaries 200 - 45ms
```

## 🚨 Claude Code에게 전달할 메시지

**"Prisma prepared statement 오류입니다! DATABASE_URL에 `?pgbouncer=true&connection_limit=1`을 추가하거나, Direct Connection URL로 변경해주세요. backend/.env.local 파일 수정 후 서버 재시작하면 즉시 해결됩니다."**

---

**작성일**: 2025-01-29
**우선순위**: 🔥🔥🔥 최우선 (5분 내 해결 가능)
**근본 원인**: Supabase Pooler와 Prisma 호환성 문제
**해결 시간**: 5-10분