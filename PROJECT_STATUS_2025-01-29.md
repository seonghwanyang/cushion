# Cushion 프로젝트 현황 (2025-01-29 업데이트)

## 🚀 프로젝트 개요
**Cushion**은 AI가 분석하는 감정 일기 웹 애플리케이션입니다. 사용자의 일상 감정을 기록하고 AI가 감정 패턴을 분석하여 개인의 강점과 성장 포인트를 발견해줍니다.

## 📍 현재 진행 상황

### ✅ 완료된 작업 (Task 001-011)
1. **프로젝트 초기 설정**
   - Monorepo 구조 (pnpm workspace)
   - TypeScript, ESLint, Prettier
   - Git hooks 설정

2. **Backend 구축**
   - Express + TypeScript 서버
   - JWT 인증 시스템
   - Prisma ORM 설정
   - Mock 서비스 구현

3. **Frontend 구축**
   - Next.js 14 App Router
   - Shadcn/ui 컴포넌트
   - 인증 페이지 UI
   - 대시보드 UI

4. **기능 구현**
   - 로그인/회원가입 UI
   - 대시보드 차트
   - 다크모드
   - 반응형 디자인

5. **Task 011 완료**
   - API 파일명 정리 (.api.ts → .ts)
   - Import 경로 수정 필요

### 🔧 진행 중인 작업 (Task 012)
**회원가입/로그인 기능 실제 작동**
- Mock 모드 해제됨
- PostgreSQL 연결 필요
- Prisma 마이그레이션 필요

### 🔴 주요 이슈
1. **Import 경로 오류**
   - Dashboard 페이지: `diary.api` → `diary`로 수정 필요

2. **데이터베이스 연결**
   - PostgreSQL 실행 확인 필요
   - 마이그레이션 실행 필요

3. **개발 환경**
   - OneDrive 경로 캐시 문제
   - 프로젝트 이동 권장

## 🛠️ 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- TanStack Query
- Framer Motion
- Recharts

### Backend
- Express.js
- TypeScript
- PostgreSQL + Prisma
- JWT Authentication
- Winston Logger
- Zod Validation

### Infrastructure
- Supabase (Auth/DB/Storage)
- OpenAI API (AI 분석)
- Vercel (배포 예정)

## 📂 프로젝트 구조
```
cushion_code/
├── frontend/          # Next.js 앱
├── backend/           # Express 서버
├── packages/          # 공유 패키지
├── docs/             # 문서
└── TASK_XXX.md       # 작업 지시서
```

## 🔐 환경 설정

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=설정됨
NEXT_PUBLIC_SUPABASE_ANON_KEY=설정됨
NEXT_PUBLIC_GOOGLE_CLIENT_ID=설정됨
```

### Backend (.env.local)
```env
PORT=3001
DATABASE_URL=postgresql://설정됨
JWT_SECRET=설정됨
USE_MOCK_AUTH=false
USE_MOCK_DATABASE=false
USE_MOCK_AI=true
USE_MOCK_STORAGE=true
```

## 📋 다음 단계

### 즉시 해야 할 일
1. **Import 경로 수정** (Claude Code)
   - Dashboard 페이지 수정
   - 다른 페이지 확인

2. **데이터베이스 설정**
   - PostgreSQL 실행
   - Prisma 마이그레이션
   - 연결 테스트

3. **기능 테스트**
   - 회원가입 작동 확인
   - 로그인 작동 확인
   - 대시보드 접근 확인

### 이후 작업
1. **핵심 기능 완성**
   - 일기 작성/조회
   - AI 감정 분석
   - 강점 발견 로직

2. **사용자 경험 개선**
   - 로딩 상태
   - 에러 처리
   - 애니메이션

3. **배포 준비**
   - 환경 변수 설정
   - 빌드 최적화
   - 도메인 연결

## 💡 팁과 주의사항

### 개발 시작하기
```bash
# 1. 의존성 설치
pnpm install

# 2. PostgreSQL 시작
# pgAdmin 또는 서비스에서 확인

# 3. 마이그레이션
cd backend
pnpm prisma migrate dev

# 4. 서버 실행
pnpm dev  # 루트에서 (전체)
# 또는
cd backend && pnpm dev
cd frontend && pnpm dev
```

### 주의사항
- OneDrive 경로 문제 (캐시 충돌)
- TypeScript strict 모드 활성화
- 환경 변수 실제 값 설정 필요
- Conventional Commits 사용

## 🎯 프로젝트 목표
AI가 사용자의 감정을 분석하고 성장을 도와주는 일기 앱을 만들어, 사용자가 자신의 강점을 발견하고 더 나은 삶을 살 수 있도록 돕는 것입니다.

---

**마지막 업데이트**: 2025-01-29
**현재 작업**: Task 012 - 회원가입/로그인 실제 작동
**다음 세션**: Import 경로 수정 후 DB 연결 및 테스트