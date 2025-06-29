# Cushion - AI 일기 서비스

> "당신의 모든 순간이 의미 있습니다"

전환기를 겪는 사람들을 위한 AI 기반 일기 서비스입니다.

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- pnpm 8+

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
pnpm dev
```

## 🔑 환경 변수 설정

### 1. 환경 변수 파일 생성

```bash
# Backend 환경 변수 설정
cd backend
cp .env.local .env.local.backup  # 기존 파일이 있다면 백업
# backend/.env.local 파일을 열어 실제 값으로 수정

# Frontend 환경 변수 설정
cd ../frontend
cp .env.local .env.local.backup  # 기존 파일이 있다면 백업
# frontend/.env.local 파일을 열어 실제 값으로 수정
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com) 에서 새 프로젝트 생성
2. Settings > API 메뉴에서 다음 값들을 복사:
   - `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (Backend only)

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials 메뉴로 이동
4. Create Credentials > OAuth 2.0 Client ID 선택
5. Application type: Web application 선택
6. Authorized redirect URIs에 다음 추가:
   - `http://localhost:3000/auth/callback` (개발용)
   - `https://your-domain.com/auth/callback` (프로덕션용)
7. 생성된 Client ID와 Client Secret을 환경 변수에 추가

### 4. Supabase에서 Google OAuth 활성화

1. Supabase Dashboard > Authentication > Providers
2. Google 활성화
3. Google Cloud Console에서 복사한 Client ID와 Client Secret 입력
4. Redirect URL을 Google Cloud Console의 Authorized redirect URIs에 추가

### 5. 개발 서버 실행

```bash
# Backend 서버 (포트 3001)
cd backend
npm run dev:mock  # Mock 데이터로 실행
# 또는
npm run dev       # 실제 DB 연결

# Frontend 서버 (포트 3000)
cd ../frontend
npm run dev
```

## 📁 프로젝트 구조

```
cushion/
├── frontend/          # Next.js 앱
├── backend/           # Express API
├── packages/          # 공유 패키지
│   ├── types/        # TypeScript 타입
│   └── utils/        # 유틸리티
└── docs/             # 문서
```

자세한 내용은 [docs/cushion-readme.md](./docs/cushion-readme.md)를 참조하세요.