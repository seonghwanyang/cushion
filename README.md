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