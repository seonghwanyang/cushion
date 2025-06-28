# Cushion Frontend

## 개요
Next.js 14 App Router 기반의 감정 일기장 프론트엔드 애플리케이션

## 주요 기능
- 사용자 인증 (로그인/회원가입)
- 일기 작성 및 목록 보기
- 감정 선택 및 태그 기능
- Mock API 연동

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand
- React Hook Form + Zod

## 프로젝트 구조
```
src/
├── app/                    # App Router 페이지
│   ├── auth/              # 인증 관련 페이지
│   │   ├── login/         # 로그인
│   │   └── register/      # 회원가입
│   └── dashboard/         # 대시보드 페이지
│       ├── diaries/       # 일기 목록
│       └── write/         # 일기 작성
├── components/            # 재사용 가능한 컴포넌트
│   └── ui/               # UI 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── api/              # API 클라이언트
│   └── stores/           # Zustand 스토어
└── types/                # TypeScript 타입 정의
```

## 설치 및 실행

1. 의존성 설치
```bash
pnpm install
```

2. 개발 서버 실행
```bash
pnpm dev
```

3. 빌드
```bash
pnpm build
```

## 환경 변수
`.env.local` 파일에 다음 환경 변수를 설정:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_USE_MOCK_API=true
```

## 구현된 기능
- ✅ 로그인/회원가입 페이지
- ✅ JWT 토큰 기반 인증
- ✅ 일기 목록 조회
- ✅ 일기 작성
- ✅ 감정 선택 UI
- ✅ 태그 기능
- ✅ 자동 토큰 갱신
- ✅ 로그아웃

## 테스트 계정
Mock 모드에서 사용 가능한 테스트 계정:
- Email: test@example.com
- Password: password123