# TASK_012: 회원가입/로그인 기능 실제 작동 확인 및 수정

## 현재 상황

### 환경 설정
Backend `.env.local`에서 Mock 모드가 해제되어 있음:
- `USE_MOCK_AUTH=false` 
- `USE_MOCK_DATABASE=false`
- `DATABASE_URL=postgresql://postgres:didajrtm3309@localhost:5432/cushion_dev`

### 예상되는 문제점
1. PostgreSQL 데이터베이스가 실행되지 않았을 가능성
2. Prisma 마이그레이션이 실행되지 않았을 가능성
3. 데이터베이스 스키마와 코드 불일치 가능성

## 수행해야 할 작업

### 1. PostgreSQL 상태 확인
```bash
# Windows에서 PostgreSQL 서비스 확인
# PowerShell 관리자 권한으로 실행
Get-Service -Name postgresql*

# 또는 pgAdmin 실행하여 확인
```

### 2. 데이터베이스 생성 (필요한 경우)
```sql
-- pgAdmin 또는 psql에서 실행
CREATE DATABASE cushion_dev;
```

### 3. Prisma 마이그레이션 실행
```bash
cd backend

# Prisma 클라이언트 생성
pnpm prisma generate

# 마이그레이션 실행
pnpm prisma migrate dev

# 데이터베이스 상태 확인
pnpm prisma studio
```

### 4. Backend 서버 실행 및 테스트
```bash
cd backend
pnpm dev

# 다른 터미널에서
cd frontend
pnpm dev
```

### 5. 회원가입 테스트
1. http://localhost:3000/auth/register 접속
2. 테스트 계정으로 회원가입:
   - 이름: Test User
   - 이메일: test@example.com
   - 비밀번호: Test1234!
3. 콘솔 및 네트워크 탭에서 에러 확인

### 6. 로그인 테스트
1. http://localhost:3000/auth/login 접속
2. 위에서 생성한 계정으로 로그인
3. 성공 시 대시보드로 리다이렉트되는지 확인

## 예상되는 오류 및 해결방법

### 1. Database connection error
```
Error: P1001: Can't reach database server at `localhost:5432`
```
**해결**: PostgreSQL 서비스 시작

### 2. Migration pending
```
Error: P1017: Server has closed the connection
```
**해결**: `pnpm prisma migrate dev` 실행

### 3. Authentication error
```
Error: Invalid credentials
```
**해결**: 
- 비밀번호 해시 확인
- JWT 시크릿 확인
- CORS 설정 확인

## 디버깅 체크리스트

### Backend 확인사항
- [ ] PostgreSQL 실행 중
- [ ] cushion_dev 데이터베이스 존재
- [ ] Prisma 마이그레이션 완료
- [ ] Backend 서버 정상 시작 (포트 3001)
- [ ] `/api/v1/auth/register` 엔드포인트 응답

### Frontend 확인사항
- [ ] API_URL이 올바르게 설정됨 (http://localhost:3001/api/v1)
- [ ] 회원가입 폼 유효성 검사 통과
- [ ] API 요청이 올바른 URL로 전송됨
- [ ] CORS 에러 없음

### 데이터베이스 확인사항
- [ ] users 테이블 존재
- [ ] 회원가입 후 사용자 레코드 생성됨
- [ ] 비밀번호가 해시되어 저장됨

## 성공 기준

1. 회원가입 완료 후 자동 로그인
2. 로그인 후 대시보드 페이지로 이동
3. 새로고침 후에도 로그인 상태 유지
4. 로그아웃 기능 정상 작동

## 추가 개선사항

### 사용자 경험 개선
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 개선
- [ ] 성공 메시지 토스트
- [ ] 폼 유효성 검사 실시간 피드백

### 보안 강화
- [ ] Rate limiting 추가
- [ ] 비밀번호 강도 검증
- [ ] 이메일 인증 (선택사항)
- [ ] 2FA 지원 (선택사항)

---

**작성일**: 2025-01-29
**우선순위**: 높음
**예상 소요시간**: 1-2시간

## 주의사항

1. **데이터베이스 비밀번호**: 현재 `.env.local`에 실제 비밀번호가 포함되어 있습니다. 프로덕션 환경에서는 반드시 안전한 비밀번호로 변경하세요.

2. **JWT 시크릿**: 현재 설정된 JWT 시크릿은 예제용입니다. 프로덕션에서는 더 강력한 랜덤 문자열을 사용하세요.

3. **CORS 설정**: 현재 localhost만 허용되어 있습니다. 배포 시 실제 도메인으로 업데이트 필요합니다.