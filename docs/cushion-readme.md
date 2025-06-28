# Cushion - AI 일기 서비스

> "당신의 모든 순간이 의미 있습니다"

전환기를 겪는 사람들을 위한 AI 기반 일기 서비스. 2분의 일기 작성으로 숨겨진 강점을 발견하고, 커리어 포트폴리오로 전환할 수 있습니다.

## 🎯 프로젝트 개요

### 핵심 가치
- **쉬운 행위**: 2분이면 충분한 일기 쓰기
- **가치 발견**: AI가 찾아주는 숨겨진 강점
- **마음의 안정**: 성장의 가시화를 통한 불안 해소

### 타겟 사용자
- 이직/전직 준비자
- 창업 도전자
- 시험 준비자
- 육아휴직 복직자
- 번아웃 회복자

## 🛠 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Routing**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Animation**: Framer Motion

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **AI**: OpenAI API + LangGraph

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: Supabase
- **File Storage**: AWS S3

## 📁 프로젝트 구조

```
Cushion_code/
├── frontend/                 # React 애플리케이션
│   ├── src/
│   │   ├── core/           # 비즈니스 로직
│   │   ├── infrastructure/ # 외부 의존성
│   │   ├── presentation/   # UI 레이어
│   │   └── shared/         # 공통 유틸리티
│   └── public/
├── backend/                  # Node.js API 서버
│   ├── src/
│   │   ├── api/           # API 엔드포인트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # 데이터 모델
│   │   └── utils/         # 유틸리티
│   └── prisma/
├── docs/                     # 프로젝트 문서
└── scripts/                  # 유틸리티 스크립트
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 20.x
- PostgreSQL 14+
- Redis 7+
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/cushion.git
cd cushion

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 데이터베이스 마이그레이션
npm run db:migrate

# 개발 서버 실행
npm run dev
```

### 환경 변수
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cushion"
REDIS_URL="redis://localhost:6379"

# API Keys
OPENAI_API_KEY="your-openai-key"
JWT_SECRET="your-jwt-secret"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📝 개발 가이드

### 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

### 코드 스타일
- ESLint + Prettier 사용
- TypeScript strict mode
- 함수형 컴포넌트 선호
- 커스텀 훅 활용

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage
```

## 📊 주요 기능

### 1. Smart Diary (스마트 일기)
- 3가지 간단한 질문으로 시작
- 음성 입력 지원 (2분 이내)
- 맞춤형 프롬프트 제공

### 2. AI Insight Engine (AI 인사이트 엔진)
- 실시간 패턴 분석
- 숨겨진 강점 발견
- 커리어 역량 매핑

### 3. Growth Portfolio (성장 포트폴리오)
- 자동 포트폴리오 생성
- LinkedIn 최적화 문구
- PDF/Web 내보내기

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- 이메일: contact@cushion.app
- 웹사이트: https://cushion.app
- 이슈: https://github.com/yourusername/cushion/issues