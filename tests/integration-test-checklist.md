# Cushion 통합 테스트 체크리스트

## 1. 환경 설정
- [ ] Backend .env 파일 설정 완료
- [ ] Frontend .env.local 파일 설정 완료
- [ ] Mock 모드 환경변수 확인 (USE_MOCK_* = true)

## 2. Backend 테스트
### 2.1 서버 시작
- [ ] `pnpm dev:mock` 명령으로 서버 정상 시작
- [ ] Mock 서비스 로그 확인 ("Using Mock * Service")
- [ ] 포트 3001에서 응답 확인

### 2.2 인증 API
- [ ] POST /api/v1/auth/register - 회원가입 성공
- [ ] POST /api/v1/auth/login - 로그인 성공
- [ ] GET /api/v1/auth/me - 사용자 정보 조회
- [ ] POST /api/v1/auth/logout - 로그아웃

### 2.3 일기 API
- [ ] POST /api/v1/diaries - 일기 작성
- [ ] GET /api/v1/diaries - 일기 목록 조회
- [ ] GET /api/v1/diaries/:id - 일기 상세 조회
- [ ] PUT /api/v1/diaries/:id - 일기 수정
- [ ] DELETE /api/v1/diaries/:id - 일기 삭제
- [ ] GET /api/v1/diaries/stats - 통계 조회

### 2.4 AI 분석 API
- [ ] 일기 작성 시 자동 AI 분석 실행 확인
- [ ] GET /api/v1/insights/latest - 최신 인사이트
- [ ] GET /api/v1/insights - 인사이트 목록
- [ ] GET /api/v1/insights/weekly - 주간 리포트
- [ ] GET /api/v1/insights/portfolio - 포트폴리오

## 3. Frontend 테스트
### 3.1 페이지 접근
- [ ] / - 홈페이지 접근
- [ ] /auth/login - 로그인 페이지
- [ ] /auth/register - 회원가입 페이지
- [ ] /dashboard/diaries - 일기 목록 (인증 필요)
- [ ] /dashboard/write - 일기 작성 (인증 필요)
- [ ] /dashboard/diaries/[id] - 일기 상세 (인증 필요)

### 3.2 사용자 플로우
- [ ] 회원가입 → 자동 로그인
- [ ] 로그인 → 대시보드 리다이렉트
- [ ] 일기 작성 → 목록에 표시
- [ ] 일기 클릭 → AI 분석 결과 표시
- [ ] 로그아웃 → 로그인 페이지로

### 3.3 UI/UX
- [ ] 반응형 디자인 (모바일, 태블릿, 데스크탑)
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 빈 상태 처리
- [ ] 폼 유효성 검사

## 4. 통합 시나리오
### 시나리오 1: 신규 사용자
1. [ ] 회원가입
2. [ ] 첫 일기 작성
3. [ ] AI 분석 결과 확인
4. [ ] 두 번째 일기 작성
5. [ ] 일기 목록에서 확인

### 시나리오 2: 기존 사용자
1. [ ] 로그인 (test@cushion.app)
2. [ ] 기존 일기 목록 확인
3. [ ] 새 일기 작성
4. [ ] AI 분석 결과 확인
5. [ ] 로그아웃

### 시나리오 3: 에러 케이스
1. [ ] 잘못된 로그인 정보
2. [ ] 중복 이메일 회원가입
3. [ ] 인증 없이 보호된 페이지 접근
4. [ ] 네트워크 에러 시뮬레이션

## 5. 성능 체크
- [ ] 페이지 로드 시간 < 3초
- [ ] API 응답 시간 < 500ms
- [ ] AI 분석 완료 시간 < 2초
- [ ] 메모리 사용량 안정적

## 6. 테스트 명령어

### Backend API 테스트
```bash
# 로그인
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cushion.app","password":"password123"}'

# 일기 작성
curl -X POST http://localhost:3001/api/v1/diaries \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":"테스트 일기입니다","mood":"HAPPY","tags":["테스트"]}'

# 인사이트 조회
curl -X GET http://localhost:3001/api/v1/insights/latest \
  -H "Authorization: Bearer {TOKEN}"
```

### Frontend 접근
```
홈페이지: http://localhost:3000
로그인: http://localhost:3000/auth/login
회원가입: http://localhost:3000/auth/register
대시보드: http://localhost:3000/dashboard/diaries
```

## 7. 체크리스트 완료 기준
- 모든 API 엔드포인트 정상 작동
- 모든 페이지 접근 가능
- 주요 사용자 시나리오 성공
- 에러 처리 적절히 작동
- 성능 기준 충족