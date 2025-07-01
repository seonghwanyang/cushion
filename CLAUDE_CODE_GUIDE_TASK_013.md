# Claude Code를 위한 Supabase Auth 전환 가이드

## 🎯 핵심 요약
기존 자체 JWT 인증을 **Supabase Auth로 완전 전환**합니다. Frontend에서 Supabase 클라이언트로 직접 인증하고, Backend는 토큰 검증만 수행합니다.

## ⚠️ 중요 정보

### 1. Supabase 프로젝트 정보
- **URL**: `https://hfhqctnrcesbulljsbwt.supabase.co`
- **Anon Key**: `.env.local`에 이미 설정됨
- **Service Role Key**: Backend `.env.local`에 설정됨

### 2. Google OAuth 설정
- Google Cloud Console에 등록된 Redirect URI:
  - `http://localhost:3000/auth/callback` ✅ (이것을 사용)
  - ~~`http://localhost:3001/api/auth/google/callback`~~ (제거)
  - `https://hfhqctnrcesbulljsbwt.supabase.co/auth/v1/callback` (Supabase 내부용)

### 3. 인증 흐름 변경
```
기존: Frontend → Backend API → JWT 발급 → Frontend
변경: Frontend → Supabase Auth → 자동 세션 관리
```

## 📋 작업 순서 (권장)

### Phase 1: Frontend Supabase 통합
1. `supabase.ts` 파일 확인/수정
2. `auth.ts` API 클라이언트 Supabase로 변경
3. `client.ts` 인터셉터 수정 (Supabase 토큰 사용)
4. Auth 관련 페이지 수정

### Phase 2: Backend 토큰 검증
1. `supabase-admin.ts` 생성
2. Auth middleware Supabase 토큰 검증으로 변경
3. 기존 auth routes 제거/수정

### Phase 3: 테스트 및 정리
1. 회원가입/로그인 테스트
2. Google OAuth 테스트
3. 기존 JWT 코드 제거
4. 환경 변수 정리

## 🔧 개발 팁

### 1. Supabase 로컬 개발
```typescript
// Frontend에서 세션 확인
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)

// 인증 상태 변경 리스너
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

### 2. 에러 처리
```typescript
// Supabase 에러는 error.message에 사용자 친화적 메시지 포함
const { data, error } = await supabase.auth.signUp({...})
if (error) {
  // error.message를 직접 사용자에게 표시 가능
  toast.error(error.message)
}
```

### 3. 타입 안전성
```typescript
// Supabase 사용자 타입 확장
interface UserMetadata {
  name?: string
  avatar_url?: string
}

// user.user_metadata as UserMetadata
```

## ⚡ 주의사항

### 1. 패키지 설치
```bash
# Frontend
cd frontend
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

# Backend  
cd backend
pnpm add @supabase/supabase-js
```

### 2. Next.js 설정
- middleware.ts에서 `@supabase/auth-helpers-nextjs` 사용
- 서버 컴포넌트에서는 쿠키 기반 인증 필요

### 3. CORS 설정
- Supabase는 자동으로 CORS 처리
- Backend CORS는 기존 설정 유지

### 4. 기존 사용자 처리
- 기존 JWT 사용자는 재가입 필요
- 또는 이메일 기반 마이그레이션 스크립트 작성 가능

## 🧪 테스트 체크리스트

- [ ] 이메일 회원가입 → 자동 로그인 → Dashboard 접근
- [ ] 이메일 로그인 → 세션 유지 → 새로고침 후 확인  
- [ ] Google 로그인 → Callback 처리 → 사용자 정보 확인
- [ ] 로그아웃 → 세션 삭제 → Protected route 차단
- [ ] API 호출 시 인증 토큰 자동 포함
- [ ] 401 에러 시 자동 로그아웃 및 리다이렉트

## 💡 추가 개선 사항 (선택)

1. **이메일 인증 추가**
   ```typescript
   await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: 'http://localhost:3000/auth/confirm'
     }
   })
   ```

2. **프로필 이미지 업로드**
   - Supabase Storage 활용
   - user_metadata에 avatar_url 저장

3. **비밀번호 재설정**
   ```typescript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'http://localhost:3000/auth/reset-password'
   })
   ```

---

**작업 시작 전 확인사항:**
1. 현재 `TASK_011_COMPLETE.md`의 import 경로 수정 완료 여부
2. PostgreSQL 및 Backend 서버 실행 상태
3. Supabase 대시보드 접근 가능 여부

화이팅! 🚀