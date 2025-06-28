# Task 001: Cushion 프로젝트 초기 설정

## 📋 작업 개요

**작업 ID**: 001  
**작업명**: Cushion 프로젝트 초기 구조 설정  
**예상 소요시간**: 30-45분  
**우선순위**: 🔴 Critical (최우선)

## 🎯 배경 설명

Cushion은 전환기(이직, 창업, 시험 준비 등)를 겪는 사람들을 위한 AI 일기 서비스입니다. 사용자가 매일 2-3분간 일기를 작성하면 AI가 숨겨진 강점과 성장 포인트를 발견하고, 이를 커리어 포트폴리오로 변환해주는 서비스입니다.

현재 `cushion_code` 폴더에는 `docs` 폴더(기술 문서)와 `.git` 폴더만 있는 상태입니다.

## 📁 현재 상태

```
C:\Users\msd12\OneDrive\Desktop\cushion\cushion_code\
├── .git/                    # Git 저장소 (이미 초기화됨)
└── docs/                    # 기술 문서 폴더
    ├── tasks/              # 작업 명세서 폴더 (방금 생성)
    │   └── 001-initial-setup.md (이 파일)
    └── [13개의 기술 문서 MD 파일들...]
```

## ⚠️ 주의사항

1. **작업 위치**: 반드시 `C:\Users\msd12\OneDrive\Desktop\cushion\cushion_code\` 폴더에서 작업
2. **Git**: 이미 `.git` 폴더가 있으므로 `git init` 하지 말 것
3. **패키지 매니저**: pnpm 사용 (npm이나 yarn 사용하지 말 것)

## 📋 작업 내용

### 1. 프로젝트 루트 설정

`cushion_code` 폴더에 다음 파일들을 생성:

#### `.gitignore`
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
.idea/
.vscode/
*.swp
*.swo

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
*.db
*.db-journal
migrations/

# Logs
logs/
*.log

# OS
Thumbs.db

# IDEs
.idea/
*.sublime-*

# Temporary files
tmp/
temp/
```

#### `package.json` (루트)
```json
{
  "name": "cushion",
  "version": "0.1.0",
  "private": true,
  "description": "AI 일기 서비스 - 당신의 모든 순간이 의미 있습니다",
  "author": "Cushion Team",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "build": "pnpm run -r build",
    "test": "pnpm run -r test",
    "lint": "pnpm run -r lint",
    "type-check": "pnpm run -r type-check",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'packages/*'
```

#### `.env.example`
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/cushion_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-in-production"
ENCRYPTION_KEY="64-character-hex-string-for-encryption-change-this"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# AWS (Optional for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="cushion-uploads"

# Frontend URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

#### `README.md`
```markdown
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

\```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
pnpm dev
\```

## 📁 프로젝트 구조

\```
cushion/
├── frontend/          # Next.js 앱
├── backend/           # Express API
├── packages/          # 공유 패키지
│   ├── types/        # TypeScript 타입
│   └── utils/        # 유틸리티
└── docs/             # 문서
\```

자세한 내용은 [docs/cushion-readme.md](./docs/cushion-readme.md)를 참조하세요.
```

### 2. 폴더 구조 생성

다음 폴더들을 생성:

```
cushion_code/
├── frontend/
├── backend/
├── packages/
│   ├── types/
│   └── utils/
└── .husky/
```

### 3. Frontend 초기 설정

`frontend/package.json`:
```json
{
  "name": "@cushion/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  }
}
```

### 4. Backend 초기 설정

`backend/package.json`:
```json
{
  "name": "@cushion/backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "@types/cors": "^2.8.13",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### 5. Docker 설정

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cushion-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cushion_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cushion-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## ✅ 완료 조건

1. 모든 폴더와 파일이 생성됨
2. `pnpm install`이 루트에서 실행 가능
3. Docker 컨테이너가 정상 실행됨 (`docker-compose up -d`)
4. Git에 초기 커밋 준비 완료

## 🔄 다음 단계

이 작업이 완료되면 다음 작업으로 진행:
- Task 002: TypeScript 및 린터 설정
- Task 003: 데이터베이스 스키마 구현
- Task 004: 기본 API 엔드포인트 구현

---
작성일: 2024-01-20
작성자: Cushion AI Assistant
