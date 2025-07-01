# Cushion 프로젝트 인수인계 문서

## 프로젝트 개요
**Cushion**은 AI가 분석하는 감정 일기 웹 애플리케이션입니다. 사용자가 일상의 감정을 기록하면 AI가 감정 패턴을 분석하고 개인의 강점과 성장 포인트를 발견해줍니다.

## 작업 방식 및 협업 구조

### 1. 작업 프로세스
```
1. 기획/분석 (Claude) → TASK_XXX.md 작성
2. 구현 (Claude Code) → TASK_XXX.md 읽고 코딩
3. 검증 (사용자) → 테스트 및 피드백
4. 반복
```

### 2. 역할 분담
- **Claude (현재 채팅)**: 기획, 분석, 문서 작성, 문제 해결 방안 제시
- **Claude Code**: 실제 코드 작성 및 구현
- **사용자**: 테스트, 피드백, 최종 결정

### 3. 파일 구조
```
C:\Users\msd12\OneDrive\Desktop\cushion\
├── cushion_code/          # 실제 코드
│   ├── frontend/          # Next.js 14 프론트엔드
│   ├── backend/           # Express 백엔드
│   ├── packages/          # 공통 패키지
│   └── TASK_XXX.md       # 작업 지시서
└── General_design_Architecture/  # 설계 문서
```

## 완료된 작업 (Task 001-010)

### ✅ Task 001-003: 프로젝트 초기 설정
- Monorepo 구조 설정 (pnpm workspace)
- TypeScript, ESLint, Prettier 설정
- Git hooks (Husky, lint-staged)
- 기본 폴더 구조 확립

### ✅ Task 004-006: Backend 구축
- Express + TypeScript 서버 설정
- JWT 기반 인증 시스템
- Refresh Token 구현
- 일기 CRUD API
- Mock 서비스 (AI, DB, Storage)
- Winston 로깅 시스템

### ✅ Task 007-008: Frontend 기초
- Next.js 14 App Router 설정
- Shadcn/ui 컴포넌트 라이브러리
- 인증 페이지 (로그인/회원가입)
- 기본 레이아웃 및 네비게이션

### ✅ Task 009: UI/UX 개선
- 대시보드 메인 페이지
- 차트 컴포넌트 (Recharts)
- 다크모드 지원
- 반응형 디자인
- 애니메이션 (Framer Motion)

### ✅ Task 010: 인증 시스템 개선 시도
- Google OAuth 설정
- Supabase 통합 준비
- 환경 변수 구조 정립

## 현재 상황 및 문제점

### 🔴 주요 이슈

1. **회원가입/로그인 미작동**
   ```
   - Backend가 Mock 모드로 실행 중
   - USE_MOCK_AUTH=true로 설정되어 있음
   - 실제 데이터베이스 연결 필요
   ```

2. **파일 구조 불일치**
   ```
   - API 파일명: auth.api.ts, diary.api.ts vs insight.ts
   - Import 경로 오류 다발
   - 메서드명 불일치 (stats vs getStats)
   ```

3. **개발 환경 문제**
   ```
   - OneDrive 경로에서 개발 → 캐시 충돌
   - 환경 변수 미설정 (.env.local 파일 없음)
   ```

### 🟡 진행 중 (Task 011)
- 프로젝트 전반적 점검
- Import 경로 정리
- 파일명 규칙 통일

## 앞으로 해야 할 작업

### 1단계: 기본 기능 완성 (최우선)
```markdown
1. [ ] Mock 모드 해제 및 실제 DB 연결
   - PostgreSQL 또는 Supabase 연결
   - Prisma 마이그레이션 실행

2. [ ] 회원가입/로그인 작동
   - API 엔드포인트 검증
   - 프론트엔드 연동 확인

3. [ ] 일기 작성 기능
   - /dashboard/write 페이지 완성
   - 이미지 업로드 (Supabase Storage)
   
4. [ ] AI 분석 실제 구현
   - OpenAI API 연동
   - 감정 분석 및 강점 도출 로직
```

### 2단계: 코드 품질 개선
```markdown
1. [ ] 파일 구조 정리
   - API 클라이언트 파일명 통일
   - Import 경로 일관성
   - 타입 정의 중앙화

2. [ ] 에러 처리 강화
   - API 에러 응답 표준화
   - 사용자 친화적 에러 메시지
   - 로딩/에러 상태 UI

3. [ ] 테스트 추가
   - 단위 테스트 (Jest)
   - E2E 테스트 (Playwright)
```

### 3단계: 배포 준비
```markdown
1. [ ] 환경 설정
   - 프로덕션 환경 변수
   - 도메인 설정

2. [ ] 배포 구성
   - Frontend: Vercel
   - Backend: Railway/Render/Fly.io
   - Database: Supabase

3. [ ] 성능 최적화
   - 이미지 최적화
   - 번들 사이즈 축소
   - 캐싱 전략
```

## 환경 설정 가이드

### 필수 환경 변수 설정

1. **backend/.env.local 생성**
```env
# 필수 설정
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/cushion_dev
JWT_SECRET=32자-이상의-랜덤-문자열
JWT_REFRESH_SECRET=다른-32자-이상의-랜덤-문자열

# Mock 모드 해제
USE_MOCK_AUTH=false
USE_MOCK_DATABASE=false
USE_MOCK_AI=false
USE_MOCK_STORAGE=false

# 선택 설정
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

2. **frontend/.env.local 생성**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### 개발 서버 실행 방법
```bash
# 1. 의존성 설치 (최초 1회)
pnpm install

# 2. 데이터베이스 설정 (PostgreSQL 필요)
cd backend
pnpm prisma migrate dev

# 3. 개발 서버 실행
pnpm dev  # 루트에서 실행 (frontend + backend 동시)

# 또는 개별 실행
cd backend && pnpm dev  # http://localhost:3001
cd frontend && pnpm dev # http://localhost:3000
```

## 주요 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn/ui
- **State**: TanStack Query
- **Charts**: Recharts
- **Animation**: Framer Motion

### Backend  
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **Auth**: JWT + Refresh Token
- **Validation**: Zod
- **Logging**: Winston

### Infrastructure
- **Auth/DB/Storage**: Supabase
- **AI**: OpenAI API
- **Deployment**: Vercel (Frontend), TBD (Backend)

## 프로젝트 특징 및 주의사항

### 강점
1. **타입 안정성**: TypeScript 전체 적용
2. **모던 스택**: 최신 기술 사용
3. **확장성**: Monorepo 구조로 확장 용이
4. **DX**: 개발 경험 최적화 (ESLint, Prettier, Husky)

### 주의사항
1. **OneDrive 경로**: 캐시 충돌 문제 (프로젝트 이동 권장)
2. **Mock 모드**: 개발 초기 Mock 사용, 실제 구현 필요
3. **환경 변수**: .env.local 파일 직접 생성 필요
4. **타입 동기화**: Backend/Frontend 타입 일치 확인

## 연락 및 참고사항

### 주요 URL
- GitHub: (미연동)
- Supabase: https://supabase.com/dashboard
- Google Cloud: https://console.cloud.google.com

### 다음 작업자를 위한 팁
1. **TASK_XXX.md 먼저 읽기** - 작업 지시사항 확인
2. **Mock 모드 확인** - 실제 기능 테스트 시 반드시 해제
3. **타입 에러 주의** - TypeScript strict 모드 활성화됨
4. **커밋 규칙** - Conventional Commits 사용 (feat:, fix:, docs:)

## 긴급 연락처
- 프로젝트 관련 질문: 현재 세션의 대화 내용 참조
- 기술 스택 문서: 각 라이브러리 공식 문서 참조

---

**작성일**: 2025-01-29
**작성자**: Claude (AI Assistant)
**다음 단계**: Task 011 완료 후 회원가입/로그인 기능 실제 작동하도록 수정

이 문서를 기반으로 프로젝트를 이어서 진행하시면 됩니다. 화이팅! 🚀