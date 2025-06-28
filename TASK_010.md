# Task 010: 회원가입 기능 수정 및 구글 OAuth 로그인 구현

## Claude Code 작업 지시사항

### ⚠️ 반드시 지켜야 할 사항
1. **기존 코드 구조 유지** - 현재 아키텍처와 패턴을 따를 것
2. **단계별 테스트** - 각 기능 구현 후 즉시 테스트
3. **에러 로깅** - 모든 에러는 상세히 로깅하여 디버깅 가능하게
4. **환경 변수** - 민감한 정보는 절대 코드에 하드코딩하지 말 것
5. **타입 안정성** - TypeScript 타입을 엄격하게 정의

### 📋 작업 전 확인사항
```bash
# 1. 현재 서버 상태 확인
curl http://localhost:3001/api/health
curl http://localhost:3000

# 2. 데이터베이스 연결 확인
# backend 로그에서 "Database connected" 메시지 확인

# 3. 현재 브랜치 확인 (main 브랜치에서 작업)
cd cushion_code
git status
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

### 1.2 Frontend 디버깅
```typescript
// frontend/src/app/auth/register/page.tsx 수정 시
// 1. 네트워크 요청 로깅
// 2. 에러 상태 UI에 표시
// 3. 로딩 상태 관리

const handleSubmit = async (e: FormEvent) => {
  console.log('회원가입 폼 제출');
  
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch(...);
    console.log('응답 상태:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('서버 에러:', errorData);
      setError(errorData.message || '회원가입에 실패했습니다');
      return;
    }
    
    // 성공 처리
  } catch (error) {
    console.error('네트워크 에러:', error);
    setError('서버와 연결할 수 없습니다');
  } finally {
    setLoading(false);
  }
};
```

### 1.3 CORS 설정 확인
```typescript
// backend/src/app.ts에서 CORS 설정 확인
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true, // 쿠키 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 2단계: Google OAuth 구현

### 2.1 패키지 설치
```bash
# Backend
cd backend
pnpm add passport passport-google-oauth20 @types/passport @types/passport-google-oauth20

# Frontend
cd ../frontend
pnpm add @react-oauth/google
```

### 2.2 Google Cloud Console 설정 안내
```
⚠️ Claude Code 주의: 실제 Google Client ID/Secret은 생성하지 말고, 
다음 더미 값을 .env.development에 추가하세요:

GOOGLE_CLIENT_ID=dummy-google-client-id
GOOGLE_CLIENT_SECRET=dummy-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=dummy-google-client-id

실제 값은 사용자가 Google Cloud Console에서 생성 후 교체할 예정
```

### 2.3 Backend OAuth 구현
```typescript
// backend/src/config/passport.ts - 새 파일 생성
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// ⚠️ 주의: User 모델 import 경로 확인
// ⚠️ 주의: 환경 변수 검증 추가

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (accessToken, refreshToken, profile, done) => {
      // 구현 시 주의사항:
      // 1. 기존 사용자 확인 (googleId 또는 email로)
      // 2. 없으면 새 사용자 생성
      // 3. JWT 토큰 생성
      // 4. 에러 처리
    }
  )
);
```

### 2.4 Frontend Google 로그인 컴포넌트
```typescript
// frontend/src/components/auth/GoogleSignInButton.tsx
// ⚠️ 주의사항:
// 1. @react-oauth/google의 GoogleOAuthProvider로 앱 감싸기 (providers.tsx)
// 2. 에러 처리 UI 포함
// 3. 로딩 상태 표시
// 4. 접근성 고려 (aria-label 등)
```

## 3단계: 테스트 및 검증

### 3.1 회원가입 테스트 시나리오
```bash
# 1. 정상 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'

# 2. 중복 이메일
# 같은 요청 다시 실행 - 에러 메시지 확인

# 3. 잘못된 입력
# 이메일 형식 오류, 짧은 비밀번호 등
```

### 3.2 Google OAuth 테스트
```
1. Frontend에서 Google 로그인 버튼 클릭
2. Google 로그인 팝업 확인
3. 콜백 처리 확인
4. 토큰 저장 및 리다이렉션 확인
```

## 4단계: 마무리 작업

### 4.1 문서 업데이트
- [ ] README.md에 Google OAuth 설정 방법 추가
- [ ] .env.example 파일 업데이트

### 4.2 커밋 메시지 규칙
```bash
# 기능별로 커밋 분리
git commit -m "fix: 회원가입 API 에러 처리 개선"
git commit -m "feat: Google OAuth 백엔드 구현"
git commit -m "feat: Google OAuth 프론트엔드 통합"
```

## ⚡ 긴급 대응 사항

### 회원가입이 안 되는 문제를 최우선으로 해결
1. **즉시 확인할 것**:
   - POST /api/auth/register 엔드포인트 응답
   - 데이터베이스 연결 상태
   - bcrypt 해싱 동작
   - JWT 토큰 생성

2. **콘솔/네트워크 탭 확인**:
   - Frontend: 개발자 도구 > Network 탭에서 register 요청 확인
   - Backend: 터미널에서 모든 로그 확인

3. **일반적인 문제 원인**:
   - CORS 설정 누락
   - 환경 변수 미설정
   - 데이터베이스 연결 실패
   - 포트 충돌 (3000, 3001)

## 📌 최종 체크리스트

- [ ] 회원가입 기능 정상 작동
- [ ] 로그인 기능 정상 작동
- [ ] Google OAuth 로그인 구현
- [ ] 에러 처리 및 사용자 피드백
- [ ] 환경 변수 정리
- [ ] 타입 정의 완성
- [ ] 테스트 완료
- [ ] 문서 업데이트

## 🚨 절대 하지 말아야 할 것
1. 실제 Google API 키 하드코딩
2. 비밀번호 평문 저장
3. SQL Injection 가능한 쿼리
4. 민감한 정보 로깅
5. CORS 모든 origin 허용 (*)

---
**작업 시작 전 반드시 현재 코드를 백업하고, 단계별로 테스트하며 진행하세요!**