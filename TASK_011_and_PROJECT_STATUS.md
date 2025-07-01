# Task 011: 프로젝트 전반적 점검 및 일관성 개선

## 현재 발생한 문제의 근본 원인

### 1. 파일 명명 규칙 불일치
- `auth.api.ts`, `diary.api.ts` vs `insight.ts`
- import 경로 혼란 야기

### 2. API 인터페이스 불일치
- Backend API와 Frontend 클라이언트 메서드명 불일치
- 타입 정의와 실제 사용 불일치

### 3. 개발 환경 문제
- OneDrive 경로에서 개발로 인한 캐시/동기화 충돌
- Mock 모드와 실제 모드 혼재

## 전반적 점검 작업

### 1. 파일 구조 및 명명 규칙 통일

#### API 클라이언트 파일
```
frontend/src/lib/api/
├── index.ts          # 통합 export
├── auth.ts           # 인증 API
├── diary.ts          # 일기 API  
├── insight.ts        # 인사이트 API
└── client.ts         # Axios 클라이언트
```

#### 파일명 규칙
- `.api.ts` 접미사 제거
- 모든 API는 `index.ts`에서 통합 export

### 2. Import 경로 점검

#### 현재 상태 확인
```bash
# 잘못된 import 찾기
grep -r "@/lib/api/diary" frontend/src --include="*.tsx" --include="*.ts"
grep -r "diaryApi.stats" frontend/src --include="*.tsx" --include="*.ts"
grep -r "diaryApi.list" frontend/src --include="*.tsx" --include="*.ts"
```

#### 수정 대상 파일들
- [ ] `frontend/src/app/dashboard/page.tsx`
- [ ] `frontend/src/app/dashboard/diaries/page.tsx`
- [ ] `frontend/src/app/dashboard/write/page.tsx`
- [ ] 기타 diary API를 사용하는 모든 파일

### 3. API 메서드 일관성 검증

#### Backend API 엔드포인트
```
GET    /api/diaries          → getList()
POST   /api/diaries          → create()
GET    /api/diaries/:id      → getById()
PUT    /api/diaries/:id      → update()
DELETE /api/diaries/:id      → delete()
GET    /api/diaries/stats    → getStats()
```

#### Frontend 클라이언트 메서드 매핑 확인
- 모든 Backend 엔드포인트에 대응하는 Frontend 메서드 존재 여부
- 메서드명 일관성
- 파라미터 및 응답 타입 일치

### 4. 타입 정의 검증

#### 공통 타입 위치
```
frontend/src/types/
├── api/
│   ├── auth.types.ts
│   ├── diary.types.ts
│   └── insight.types.ts
└── index.ts
```

#### Backend과 Frontend 타입 동기화
- Diary, User, Insight 등 핵심 모델 타입 일치
- API 요청/응답 타입 일치

### 5. 환경 설정 점검

#### 환경 변수 파일 구조
```
backend/
├── .env.example      # Git 포함 (템플릿)
├── .env.development  # Git 포함 (더미값)
└── .env.local       # Git 제외 (실제값)

frontend/
├── .env.example     # Git 포함 (템플릿)
├── .env.development # Git 포함 (더미값)
└── .env.local      # Git 제외 (실제값)
```

#### Mock 모드 설정
- `USE_MOCK_*` 플래그들을 `.env.local`로 이동
- 개발자가 필요에 따라 토글 가능하도록

### 6. 개발 환경 개선

#### OneDrive 문제 해결
1. **즉시 조치**: 캐시 디렉토리 설정
   ```javascript
   // next.config.js
   module.exports = {
     // 캐시를 프로젝트 외부로
     distDir: process.env.NEXT_DIST_DIR || '.next',
   }
   ```

2. **권장 사항**: 프로젝트 이동
   ```
   C:\Users\msd12\OneDrive\Desktop\cushion → C:\dev\cushion
   ```

#### 개발 스크립트 개선
```json
// package.json
{
  "scripts": {
    "dev": "pnpm run clean:cache && next dev",
    "clean:cache": "rimraf .next node_modules/.cache"
  }
}
```

## 작업 우선순위

### 긴급 (오늘 처리)
1. [ ] Dashboard 페이지 import 오류 수정
2. [ ] API 메서드명 통일 (stats → getStats 등)
3. [ ] 캐시 정리 및 서버 재시작

### 높음 (이번 주)
1. [ ] 파일명 규칙 통일 (.api.ts 제거)
2. [ ] API 클라이언트 index.ts 생성
3. [ ] 모든 import 경로 업데이트

### 중간 (다음 주)
1. [ ] 타입 정의 중앙화
2. [ ] Backend/Frontend 타입 동기화
3. [ ] 환경 변수 구조 정리

### 낮음 (향후)
1. [ ] 프로젝트 위치 이동 (OneDrive 외부)
2. [ ] E2E 테스트 추가
3. [ ] API 문서화

## 검증 스크립트

### 1. Import 경로 검증
```bash
#!/bin/bash
# check-imports.sh

echo "Checking for inconsistent imports..."
grep -r "@/lib/api/" frontend/src --include="*.tsx" --include="*.ts" | grep -v ".api"
```

### 2. API 메서드 사용 검증
```bash
#!/bin/bash
# check-api-methods.sh

echo "Checking for old API method names..."
grep -r "\.stats()" frontend/src --include="*.tsx" --include="*.ts"
grep -r "\.list(" frontend/src --include="*.tsx" --include="*.ts"
```

## 예상 결과

1. **즉시 효과**
   - Dashboard 페이지 정상 작동
   - 더 이상의 import 오류 없음

2. **장기 효과**
   - 일관된 코드 구조
   - 새로운 개발자도 쉽게 이해 가능
   - 유사한 오류 재발 방지

## 주의사항

- 파일명 변경 시 모든 import 경로 동시 수정
- Git 이력 유지를 위해 `git mv` 사용
- 각 단계별로 테스트 수행
- TypeScript 컴파일 에러 확인

---

# 다음 세션 전달 사항

## 프로젝트 현황

### 완료된 작업 (Task 001-010)
1. ✅ 프로젝트 초기 설정 및 구조 확립
2. ✅ Backend API 서버 구축 (Express + TypeScript)
3. ✅ Frontend Next.js 14 앱 설정
4. ✅ 인증 시스템 구현 (JWT + Refresh Token)
5. ✅ 일기 CRUD API 구현
6. ✅ AI 분석 서비스 통합 (Mock)
7. ✅ Dashboard UI 구현 (차트, 통계)
8. ✅ 다크모드 및 반응형 디자인
9. ✅ Supabase 통합 준비
10. ✅ Google OAuth 설정

### 현재 진행 중 (Task 011)
- 🔧 프로젝트 전반적 점검 및 일관성 개선
- 🔧 Import 경로 및 파일명 규칙 통일
- 🔧 API 메서드명 일치화
- 🔧 OneDrive 캐시 문제 해결

### 주요 이슈
1. **회원가입 기능 미작동**
   - Mock 모드가 기본값으로 설정됨
   - 실제 DB 연결 필요

2. **파일 구조 불일치**
   - API 파일명: `.api.ts` vs `.ts` 혼재
   - Import 경로 오류 다수 존재

3. **개발 환경**
   - OneDrive 경로에서 개발 중 (캐시 충돌)
   - 환경 변수 설정 미완료

### 남은 작업

#### 필수 기능
1. [ ] 회원가입/로그인 실제 작동
2. [ ] Google OAuth 완전 구현
3. [ ] 일기 작성 기능 연동
4. [ ] AI 분석 실제 구현 (OpenAI API)
5. [ ] 이미지 업로드 (Supabase Storage)

#### 개선 사항
1. [ ] 파일 구조 및 import 정리
2. [ ] 타입 정의 중앙화
3. [ ] 에러 처리 강화
4. [ ] 로딩 상태 개선
5. [ ] PWA 기능 추가

#### 배포 준비
1. [ ] 환경 변수 프로덕션 설정
2. [ ] Vercel 배포 설정
3. [ ] 데이터베이스 마이그레이션
4. [ ] 도메인 연결
5. [ ] 모니터링 설정

### 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express, TypeScript, Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT + Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI API
- **배포**: Vercel (Frontend), TBD (Backend)

### 접속 정보
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- 주요 페이지:
  - 홈: http://localhost:3000
  - 로그인: http://localhost:3000/auth/login
  - 회원가입: http://localhost:3000/auth/register
  - 대시보드: http://localhost:3000/dashboard

### 다음 단계 권장사항
1. Task 011 완료 (파일 구조 정리)
2. 회원가입/로그인 기능 실제 작동하도록 수정
3. 일기 작성 및 조회 기능 완성
4. AI 분석 기능 실제 구현
5. 배포 준비

---

이 문서를 다음 세션에서 참고하여 작업을 이어가세요!