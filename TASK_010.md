# Task 010: 회원가입 기능 수정, Google OAuth 및 Supabase 연동

## Claude Code 작업 지시사항

### ⚠️ 반드시 지켜야 할 사항
1. **기존 코드 구조 유지** - 현재 아키텍처와 패턴을 따를 것
2. **단계별 테스트** - 각 기능 구현 후 즉시 테스트
3. **에러 로깅** - 모든 에러는 상세히 로깅하여 디버깅 가능하게
4. **환경 변수** - 민감한 정보는 절대 코드에 하드코딩하지 말 것
5. **타입 안정성** - TypeScript 타입을 엄격하게 정의

### 🔑 환경 변수 설정 위치 가이드

#### Backend 환경 변수
```bash
# backend/.env.local (로컬 개발용 - gitignore에 포함)
# 실제 비밀 키들을 여기에 저장

DATABASE_URL=your_actual_database_url
JWT_SECRET=your_actual_jwt_secret

# Supabase
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

#### Frontend 환경 변수
```bash
# frontend/.env.local (로컬 개발용 - gitignore에 포함)
# 공개되어도 괜찮은 키들 (NEXT_PUBLIC_ 접두사)

NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id
```

### 📋 환경 변수 파일 구조 설명
```
cushion_code/
├── backend/
│   ├── .env.example      # 예시 파일 (깃에 포함)
│   ├── .env.development  # 개발 환경 (깃에 포함 - 더미값)
│   └── .env.local       # 실제 키 (gitignore - 생성 필요)
└── frontend/
    ├── .env.example     # 예시 파일 (깃에 포함)
    ├── .env.development # 개발 환경 (깃에 포함 - 더미값)
    └── .env.local      # 실제 키 (gitignore - 생성 필요)
```

## 1단계: 회원가입 디버깅 및 수정

### 1.1 Backend 디버깅
```typescript
// backend/src/controllers/auth.controller.ts 수정 시 주의사항
// 1. 모든 단계에 console.log 추가
// 2. try-catch로 모든 에러 캐치
// 3. 에러 응답은 구체적으로

export const register = async (req: Request, res: Response) => {
  console.log('회원가입 요청 받음:', req.body);
  
  try {
    // 1. 입력 검증
    console.log('입력 검증 시작');
    
    // 2. 중복 체크
    console.log('이메일 중복 체크');
    
    // 3. 사용자 생성
    console.log('사용자 생성 시도');
    
    // 4. 응답
    console.log('회원가입 성공');
  } catch (error) {
    console.error('회원가입 에러:', error);
    // 구체적인 에러 메시지 반환
  }
};
```

### 1.2 CORS 설정 확인
```typescript
// backend/src/app.ts에서 CORS 설정 확인
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true, // 쿠키 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 2단계: Supabase 통합

### 2.1 Supabase 설정
```bash
# Backend 패키지 설치
cd backend
pnpm add @supabase/supabase-js

# Frontend 패키지 설치
cd ../frontend
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2.2 Supabase 클라이언트 설정
```typescript
// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ 주의: 환경 변수는 .env.local에서 로드
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ 주의: NEXT_PUBLIC_ 접두사 필수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2.3 Supabase Auth 통합
```typescript
// Supabase를 사용한 인증 흐름
// 1. 회원가입/로그인은 Supabase Auth 사용
// 2. 사용자 데이터는 자체 DB에도 동기화
// 3. JWT는 Supabase 토큰 사용 가능
```

## 3단계: Google OAuth 구현 (Supabase 통합)

### 3.1 Supabase OAuth 설정
```typescript
// frontend/src/components/auth/GoogleSignInButton.tsx
import { supabase } from '@/lib/supabase';

const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/auth/callback'
    }
  });
  
  if (error) {
    console.error('Google 로그인 에러:', error);
  }
};
```

### 3.2 OAuth 콜백 처리
```typescript
// frontend/src/app/auth/callback/page.tsx
// Supabase OAuth 콜백 처리 페이지
// 로그인 성공 후 사용자 정보를 백엔드와 동기화
```

## 4단계: 환경 변수 생성 가이드

### 4.1 .env.local 파일 생성
```bash
# Backend .env.local 생성
cd backend
cp .env.example .env.local
# 실제 키 값으로 수정

# Frontend .env.local 생성  
cd ../frontend
cp .env.example .env.local
# 실제 키 값으로 수정
```

### 4.2 필요한 키 획득 방법 문서화
```markdown
## Supabase 키 획득 방법
1. https://supabase.com 에서 프로젝트 생성
2. Settings > API 에서 다음 값 복사:
   - Project URL → SUPABASE_URL
   - anon public → SUPABASE_ANON_KEY  
   - service_role secret → SUPABASE_SERVICE_ROLE_KEY

## Google OAuth 키 획득 방법
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials
4. Create Credentials > OAuth 2.0 Client ID
5. Authorized redirect URIs에 추가:
   - http://localhost:3000/auth/callback (Supabase)
   - http://localhost:3001/api/auth/google/callback (자체 구현 시)
```

## 5단계: 테스트 및 검증

### 5.1 Supabase 연동 테스트
```typescript
// 테스트 스크립트 작성
// backend/src/scripts/test-supabase.ts
import { supabase } from '../config/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('test')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Supabase 연결 실패:', error);
  } else {
    console.log('Supabase 연결 성공');
  }
}
```

## 6단계: 구현 우선순위

1. **긴급** - 회원가입 버그 수정
2. **높음** - .env.local 파일 설정 가이드 작성
3. **높음** - Supabase 클라이언트 설정
4. **중간** - Supabase Auth 통합
5. **중간** - Google OAuth (Supabase 통합)
6. **낮음** - 추가 소셜 로그인 (GitHub, Kakao 등)

## 📌 최종 체크리스트

- [ ] 회원가입 기능 정상 작동
- [ ] .env.local 파일 생성 및 설정
- [ ] Supabase 연결 테스트 성공
- [ ] Google OAuth 로그인 구현
- [ ] 사용자 데이터 동기화
- [ ] 환경 변수 설정 문서화
- [ ] .gitignore 확인 (.env.local 제외)

## 🚨 중요 보안 사항

1. **.env.local 파일은 절대 Git에 커밋하지 않음**
2. **Service Role Key는 백엔드에서만 사용**
3. **Anon Key는 프론트엔드에서 사용 가능**
4. **실제 키는 사용자가 직접 설정하도록 안내**

## 📝 사용자에게 전달할 내용

작업 완료 후 사용자에게 다음 내용 전달:
```
1. backend/.env.local 파일을 생성하고 실제 키를 입력하세요
2. frontend/.env.local 파일을 생성하고 실제 키를 입력하세요
3. Supabase 프로젝트를 생성하고 키를 복사하세요
4. Google Cloud Console에서 OAuth 클라이언트를 생성하세요
5. 각 .env.local 파일에 키를 입력한 후 서버를 재시작하세요
```

---
**작업 시작 전 반드시 현재 코드를 백업하고, 단계별로 테스트하며 진행하세요!**