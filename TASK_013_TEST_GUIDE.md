# TASK_013 테스트 가이드

## 현재 상태
- ✅ Supabase Auth 통합 완료
- ✅ Backend에서 USE_SUPABASE_AUTH=true 설정
- ✅ 조건부 미들웨어 적용 (기존 코드 보존)
- ✅ Frontend는 이미 Supabase 사용 중

## 서버 실행 방법

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 테스트 시나리오

### 1. Google 로그인 테스트
1. http://localhost:3000/auth/login 접속
2. "Google로 계속하기" 버튼 클릭
3. Google 계정 선택
4. 자동으로 /dashboard로 리다이렉트 확인

### 2. 이메일 회원가입 테스트
1. http://localhost:3000/auth/register 접속
2. 이메일과 비밀번호 입력
3. 회원가입 성공 후 자동 로그인 확인

### 3. Dashboard 접속 테스트
1. 로그인된 상태에서 http://localhost:3000/dashboard 접속
2. 정상적으로 대시보드가 표시되는지 확인

### 4. API 인증 테스트
1. 개발자 도구 > Network 탭 열기
2. Dashboard에서 API 호출 확인
3. Authorization 헤더에 Bearer 토큰이 포함되어 있는지 확인
4. API 응답이 200 OK인지 확인

### 5. 로그아웃 테스트
1. 우측 상단 사용자 메뉴 클릭
2. 로그아웃 클릭
3. /auth/login으로 리다이렉트 확인

## 문제 해결

### "Supabase is not configured" 에러
- Frontend의 .env.local 파일 확인
- NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 확인

### 401 Unauthorized 에러
- Backend의 .env.local에서 USE_SUPABASE_AUTH=true 확인
- Backend 서버 재시작

### Google 로그인 실패
1. Supabase Dashboard > Authentication > Providers
2. Google Provider 활성화 확인
3. Redirect URLs에 http://localhost:3000/auth/callback 추가

## 롤백 방법
문제 발생 시 Backend의 .env.local에서:
```
USE_SUPABASE_AUTH=false
```
로 변경하고 서버 재시작

## 다음 단계
- 2주 후 (2025-02-12): Mock 파일들에 @deprecated 표시
- 4주 후: Mock 코드 완전 제거