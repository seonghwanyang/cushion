# Cushion 개발 전략 문서

## 📋 개발 철학: Mock-First Development

### 핵심 원칙

1. **인터페이스 우선 설계**
   - 모든 서비스는 인터페이스를 먼저 정의
   - Mock과 실제 구현이 동일한 인터페이스를 구현
   - 의존성 역전 원칙(DIP) 준수

2. **점진적 실제 구현 전환**
   - Feature Flag를 통한 Mock/Real 전환
   - 서비스별 독립적 전환 가능
   - 실시간 A/B 테스트 가능

3. **엄격한 분리 원칙**
   - Mock 코드는 별도 파일로 분리 (*.mock.ts)
   - 프로덕션 빌드에서 Mock 코드 자동 제외
   - 환경 변수로 Mock 사용 여부 제어

## 🏗️ 아키텍처 패턴

### 1. Service Interface Pattern

```typescript
// interfaces/services/diary.service.interface.ts
export interface IDiaryService {
  create(userId: string, data: CreateDiaryInput): Promise<Diary>;
  findById(id: string): Promise<Diary | null>;
  findByUser(userId: string): Promise<Diary[]>;
  update(id: string, data: UpdateDiaryInput): Promise<Diary>;
  delete(id: string): Promise<void>;
}

// services/diary/diary.service.ts (실제 구현)
export class DiaryService implements IDiaryService {
  constructor(private prisma: PrismaClient) {}
  // 실제 DB 연동 구현
}

// services/diary/diary.service.mock.ts (Mock 구현)
export class MockDiaryService implements IDiaryService {
  private mockData = new Map<string, Diary>();
  // In-memory Mock 구현
}
```

### 2. Service Factory Pattern

```typescript
// factories/service.factory.ts
export class ServiceFactory {
  static createDiaryService(config: Config): IDiaryService {
    if (config.features.useMockDiary) {
      return new MockDiaryService();
    }
    return new DiaryService(prisma);
  }
  
  static createAIService(config: Config): IAIService {
    if (config.features.useMockAI) {
      return new MockAIService();
    }
    return new OpenAIService(config.openai);
  }
}
```

### 3. Feature Flag System

```typescript
// config/features.ts
export interface FeatureFlags {
  useMockDatabase: boolean;
  useMockAI: boolean;
  useMockAuth: boolean;
  useMockStorage: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  const env = process.env.NODE_ENV;
  const flags = process.env.FEATURE_FLAGS?.split(',') || [];
  
  return {
    useMockDatabase: env === 'development' && flags.includes('mockDB'),
    useMockAI: env === 'development' && flags.includes('mockAI'),
    useMockAuth: env === 'test' || flags.includes('mockAuth'),
    useMockStorage: env !== 'production' && flags.includes('mockStorage'),
  };
};
```

## 🔄 Mock에서 실제 구현으로 전환 프로세스

### Phase 1: Mock 개발 (Week 1-2)
1. 인터페이스 정의
2. Mock 서비스 구현
3. Frontend 개발 진행
4. Mock 데이터로 E2E 테스트

### Phase 2: 실제 구현 추가 (Week 3-4)
1. 실제 서비스 구현 (DB, AI 등)
2. 동일한 인터페이스 구현 확인
3. 단위 테스트로 Mock과 실제 구현 비교
4. Feature Flag로 점진적 전환

### Phase 3: 검증 및 전환 (Week 5)
1. Mock과 실제 구현 동시 실행
2. 결과 비교 및 검증
3. 성능 테스트
4. 완전 전환

## ⚠️ Mock 데이터 관리 규칙

### 1. Mock 데이터 구조
```typescript
// mocks/data/diary.mock.data.ts
export const mockDiaries: Diary[] = [
  {
    id: 'mock-diary-1',
    userId: 'mock-user-1',
    content: '오늘은 새로운 프로젝트를 시작했다...',
    mood: 'HAPPY',
    tags: ['프로젝트', '시작'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  // ... 더 많은 mock 데이터
];
```

### 2. Mock 데이터 일관성 규칙
- ID는 항상 'mock-' 접두사 사용
- 날짜는 고정된 값 사용 (테스트 안정성)
- 관계형 데이터는 ID 참조 일치 보장

### 3. Mock 서비스 동작 규칙
- 비동기 동작 시뮬레이션 (setTimeout 사용)
- 에러 케이스도 구현 (랜덤 또는 특정 조건)
- 상태 변경은 메모리에만 저장

## 🚨 충돌 방지 전략

### 1. 네이밍 컨벤션
- Mock 파일: `*.mock.ts`, `*.mock.tsx`
- Mock 클래스: `Mock*Service`, `Mock*Repository`
- Mock 데이터: `mock*Data`

### 2. 빌드 시 Mock 제외
```javascript
// webpack.config.js
module.exports = {
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /\.mock\.(ts|tsx|js|jsx)$/,
      contextRegExp: process.env.NODE_ENV === 'production' ? /.*/ : /^$/,
    }),
  ],
};
```

### 3. TypeScript 경로 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@services/*": ["src/services/*"],
      "@mocks/*": ["src/mocks/*"],
      "@interfaces/*": ["src/interfaces/*"]
    }
  }
}
```

## 📊 모니터링 및 검증

### 1. Mock vs Real 비교 로깅
```typescript
// middleware/comparison.middleware.ts
export const compareResults = async (req, res, next) => {
  if (config.enableComparison) {
    const mockResult = await mockService.execute(req);
    const realResult = await realService.execute(req);
    
    logger.info('Service Comparison', {
      endpoint: req.path,
      mockResult: summarize(mockResult),
      realResult: summarize(realResult),
      match: deepEqual(mockResult, realResult),
    });
  }
  next();
};
```

### 2. 전환 메트릭
- Mock 사용률
- 응답 시간 비교
- 에러율 비교
- 데이터 일치율

## 🔐 보안 고려사항

1. **Mock 데이터에 실제 개인정보 사용 금지**
2. **프로덕션 환경에서 Mock 코드 완전 제거 확인**
3. **Feature Flag 접근 권한 관리**
4. **Mock API 엔드포인트 프로덕션 노출 방지**

## 📝 체크리스트

### Mock 구현 시
- [ ] 인터페이스 정의 완료
- [ ] Mock 데이터 준비
- [ ] Mock 서비스 구현
- [ ] 단위 테스트 작성
- [ ] Frontend 연동 테스트

### 실제 구현 전환 시
- [ ] 실제 서비스 구현
- [ ] 인터페이스 일치 확인
- [ ] Mock과 동일한 테스트 통과
- [ ] Feature Flag 설정
- [ ] 점진적 롤아웃 계획
- [ ] 롤백 계획 수립
- [ ] 모니터링 설정

### 전환 완료 후
- [ ] Mock 코드 제거 여부 결정
- [ ] 문서 업데이트
- [ ] 성능 최적화
- [ ] 사후 분석 리포트

---
작성일: 2024-01-20
작성자: Cushion Team