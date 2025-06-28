# Cushion 배포 가이드

## 배포 옵션

### 1. Vercel + Railway (추천)
**Frontend**: Vercel
- Next.js 최적화
- 자동 배포
- 글로벌 CDN

**Backend**: Railway
- PostgreSQL 포함
- Redis 포함
- 자동 스케일링

### 2. AWS (엔터프라이즈)
- EC2 / ECS
- RDS PostgreSQL
- ElastiCache Redis
- S3 + CloudFront

### 3. Docker Compose (자체 호스팅)
- 단일 서버 배포
- 모든 서비스 포함
- 쉬운 관리

## 배포 체크리스트

### 사전 준비
- [ ] 모든 환경 변수 설정
- [ ] 프로덕션 시크릿 생성
- [ ] 데이터베이스 백업 계획
- [ ] 모니터링 설정
- [ ] 도메인 준비

### 보안 설정
- [ ] HTTPS 인증서
- [ ] CORS 설정 확인
- [ ] Rate limiting 설정
- [ ] SQL injection 방지
- [ ] XSS 방지

### 배포 단계
1. [ ] 코드 동결
2. [ ] 최종 테스트
3. [ ] 데이터베이스 마이그레이션
4. [ ] Backend 배포
5. [ ] Frontend 배포
6. [ ] 스모크 테스트
7. [ ] 모니터링 확인

### 롤백 계획
- [ ] 이전 버전 태그
- [ ] 데이터베이스 백업
- [ ] 빠른 롤백 스크립트
- [ ] 사용자 공지 준비

## Vercel 배포 (Frontend)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
cd frontend
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_API_URL

# 배포
vercel --prod
```

### Vercel 환경 변수
```
NEXT_PUBLIC_API_URL=https://api.cushion.app/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

## Railway 배포 (Backend)

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 생성
railway init

# 서비스 추가
railway add
# PostgreSQL 선택
# Redis 선택

# 환경 변수 설정
railway variables set NODE_ENV=production
railway variables set USE_MOCK_AUTH=false
railway variables set USE_MOCK_DATABASE=false
railway variables set USE_MOCK_AI=false
railway variables set USE_MOCK_STORAGE=false

# 배포
railway up
```

### Railway 환경 변수
```
NODE_ENV=production
DATABASE_URL=자동 설정됨
REDIS_URL=자동 설정됨
JWT_SECRET=생성된 시크릿
JWT_REFRESH_SECRET=생성된 시크릿
OPENAI_API_KEY=OpenAI API 키
```

## Docker 배포 (자체 호스팅)

### 1. 서버 준비
```bash
# Docker & Docker Compose 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt-get install docker-compose-plugin
```

### 2. 프로젝트 클론
```bash
git clone https://github.com/your-repo/cushion.git
cd cushion
```

### 3. 환경 변수 설정
```bash
cp .env.production .env
# .env 파일 편집하여 실제 값 입력
```

### 4. Docker 빌드 및 실행
```bash
# 프로덕션 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f
```

### 5. SSL 설정 (Nginx + Let's Encrypt)
```bash
# Nginx 설치
sudo apt-get install nginx

# Certbot 설치
sudo snap install --classic certbot

# SSL 인증서 발급
sudo certbot --nginx -d cushion.app -d www.cushion.app
```

## 모니터링

### 필수 메트릭
- 응답 시간
- 에러율
- 활성 사용자
- API 사용량
- 데이터베이스 연결

### 추천 도구
- **Sentry** (에러 추적)
  ```javascript
  // frontend/src/app/layout.tsx
  import * as Sentry from "@sentry/nextjs";
  
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  ```

- **Datadog** (APM)
  ```javascript
  // backend/src/server.ts
  import tracer from 'dd-trace';
  tracer.init();
  ```

- **LogRocket** (프론트엔드)
  ```javascript
  // frontend/src/app/providers.tsx
  import LogRocket from 'logrocket';
  LogRocket.init('cushion/production');
  ```

## 데이터베이스 마이그레이션

### 1. 백업
```bash
# PostgreSQL 백업
pg_dump -h localhost -U postgres cushion_prod > backup_$(date +%Y%m%d).sql
```

### 2. 마이그레이션 실행
```bash
cd backend
npx prisma migrate deploy
```

### 3. 시드 데이터 (선택사항)
```bash
npx prisma db seed
```

## 성능 최적화

### Frontend
- [ ] 이미지 최적화 (next/image)
- [ ] 코드 스플리팅
- [ ] 정적 페이지 생성
- [ ] CDN 활용

### Backend
- [ ] 데이터베이스 인덱싱
- [ ] Redis 캐싱
- [ ] API 응답 압축
- [ ] Connection pooling

## 문제 해결

### 일반적인 문제
1. **503 Service Unavailable**
   - 헬스체크 확인
   - 포트 설정 확인
   - 로그 확인

2. **Database Connection Error**
   - DATABASE_URL 확인
   - 네트워크 연결 확인
   - 최대 연결 수 확인

3. **CORS 에러**
   - API URL 설정 확인
   - CORS 미들웨어 설정

### 롤백 절차
```bash
# Git 태그로 롤백
git checkout v1.0.0
docker-compose build
docker-compose up -d

# 데이터베이스 롤백
psql -h localhost -U postgres cushion_prod < backup_20240120.sql
```

## 보안 체크리스트

- [ ] 모든 시크릿 환경 변수로 관리
- [ ] HTTPS 강제 적용
- [ ] Rate limiting 설정
- [ ] SQL injection 방지 (Prisma 사용)
- [ ] XSS 방지 (React 기본 제공)
- [ ] CSRF 토큰 구현
- [ ] 정기적인 의존성 업데이트

## 배포 후 체크리스트

- [ ] 모든 페이지 접근 테스트
- [ ] 주요 기능 동작 확인
- [ ] 에러 로깅 확인
- [ ] 성능 메트릭 확인
- [ ] SSL 인증서 확인
- [ ] 백업 스케줄 설정

---

마지막 업데이트: 2024-01-20