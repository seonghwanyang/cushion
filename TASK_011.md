# Task 011: Dashboard 페이지 오류 수정 및 캐시 문제 해결

## 현재 발생한 오류

### 1. Module Not Found 오류
```
Module not found: Can't resolve '@/lib/api/diary'
```
- 위치: `/src/app/dashboard/page.tsx:19:0`
- 원인: import 경로와 실제 파일명 불일치

### 2. Webpack 캐시 오류
```
Error: ENOENT: no such file or directory, rename...
```
- 원인: OneDrive 경로에서 Next.js 캐시 충돌

## 수정해야 할 사항

### 1. Import 경로 수정
Dashboard page의 import 문 수정:
```typescript
// 현재 (잘못됨)
import { diaryApi } from '@/lib/api/diary';

// 수정 후
import { diaryApi } from '@/lib/api/diary.api';
```

### 2. API 메서드명 수정
Dashboard page에서 사용하는 메서드명 변경:
```typescript
// 현재 (잘못됨)
diaryApi.stats()
diaryApi.list({ limit: 5 })

// 수정 후
diaryApi.getStats()
diaryApi.getList({ limit: 5 })
```

### 3. 캐시 문제 해결
OneDrive 동기화와 충돌하는 Next.js 캐시 문제 해결:

#### 옵션 1: .next 폴더 제외
`.gitignore`와 OneDrive 제외 설정 확인

#### 옵션 2: 캐시 설정 변경
`next.config.js`에 캐시 디렉토리 설정:
```javascript
module.exports = {
  // 기존 설정...
  distDir: '.next',
  // 캐시를 메모리에만 저장하도록 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
}
```

## 작업 순서

1. **즉시 수정 (빠른 해결)**
   - [ ] dashboard/page.tsx의 import 경로 수정
   - [ ] API 메서드명 수정 (stats → getStats, list → getList)

2. **캐시 정리**
   - [ ] .next 폴더 삭제
   - [ ] node_modules/.cache 폴더 삭제 (있다면)

3. **장기적 해결**
   - [ ] next.config.js에 캐시 설정 추가
   - [ ] OneDrive 제외 폴더 설정 안내 문서 작성

## 테스트 방법

1. 수정 후 서버 재시작:
   ```bash
   # Frontend
   cd frontend
   rm -rf .next
   pnpm dev
   ```

2. 대시보드 접속:
   - http://localhost:3000/dashboard

3. 콘솔 에러 확인

## 예상 결과

- Module not found 오류 해결
- 대시보드 페이지 정상 렌더링
- 통계 데이터 표시
- 캐시 관련 경고 제거

## 추가 권장사항

### API 파일명 일관성
현재 파일명이 혼재되어 있음:
- `auth.api.ts`
- `diary.api.ts`
- `insight.ts` (`.api` 없음)

일관성을 위해 다음 중 하나로 통일 권장:
1. 모두 `.api.ts`로 통일
2. 모두 `.ts`로 통일
3. index.ts에서 통합 export

### OneDrive 사용 시 주의사항
개발 프로젝트는 OneDrive 외부 경로 사용 권장:
- 예: `C:\dev\cushion` 
- 이유: 실시간 동기화가 개발 도구와 충돌

## 주의사항

- 파일 수정 시 TypeScript 타입 체크 확인
- 다른 페이지에서도 동일한 import 오류가 있는지 확인
- 캐시 설정 변경 시 성능 영향 고려