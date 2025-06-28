# Cushion 기술 아키텍처

## 🏗 시스템 아키텍처 개요

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Web Client    │────▶│   API Gateway   │────▶│  Backend API    │
│   (Next.js)     │     │   (Express)     │     │   (Node.js)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │     Redis       │     │   PostgreSQL    │
                        │    (Cache)      │     │   (Database)    │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │   OpenAI API    │     │   AWS S3        │
                        │ (AI Analysis)   │     │ (File Storage)  │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
```

## 📁 프로젝트 구조

### Frontend (Next.js + TypeScript)
```
frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   ├── (main)/            # 메인 앱 페이지
│   │   ├── api/               # API Routes
│   │   └── layout.tsx         # 루트 레이아웃
│   │
│   ├── core/                   # 비즈니스 로직 (Clean Architecture)
│   │   ├── entities/          # 도메인 모델
│   │   │   ├── Diary.ts
│   │   │   ├── User.ts
│   │   │   └── Insight.ts
│   │   ├── usecases/          # 비즈니스 규칙
│   │   │   ├── CreateDiary.ts
│   │   │   ├── AnalyzeDiary.ts
│   │   │   └── GeneratePortfolio.ts
│   │   └── interfaces/        # 추상화 계층
│   │       ├── repositories/
│   │       └── services/
│   │
│   ├── infrastructure/         # 외부 의존성
│   │   ├── api/              # API 클라이언트
│   │   │   ├── client.ts
│   │   │   └── endpoints.ts
│   │   ├── services/         # 외부 서비스
│   │   │   ├── AuthService.ts
│   │   │   └── StorageService.ts
│   │   └── repositories/     # 데이터 접근
│   │       ├── DiaryRepository.ts
│   │       └── UserRepository.ts
│   │
│   ├── presentation/           # UI 레이어
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── common/      # 공통 컴포넌트
│   │   │   ├── diary/       # 일기 관련
│   │   │   ├── insights/    # 인사이트 관련
│   │   │   └── portfolio/   # 포트폴리오 관련
│   │   ├── hooks/           # 커스텀 훅
│   │   │   ├── useDiary.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useAI.ts
│   │   └── styles/          # 스타일 관련
│   │       ├── globals.css
│   │       └── theme.ts
│   │
│   └── shared/                 # 공통 유틸리티
│       ├── utils/            # 유틸 함수
│       ├── constants/        # 상수
│       └── types/            # TypeScript 타입
```

### Backend (Express + TypeScript)
```
backend/
├── src/
│   ├── api/                    # API 레이어
│   │   ├── routes/           # 라우트 정의
│   │   │   ├── auth.routes.ts
│   │   │   ├── diary.routes.ts
│   │   │   └── insight.routes.ts
│   │   ├── controllers/      # 컨트롤러
│   │   │   ├── AuthController.ts
│   │   │   ├── DiaryController.ts
│   │   │   └── InsightController.ts
│   │   └── middleware/       # 미들웨어
│   │       ├── auth.ts
│   │       ├── validation.ts
│   │       └── errorHandler.ts
│   │
│   ├── services/               # 비즈니스 로직
│   │   ├── AuthService.ts
│   │   ├── DiaryService.ts
│   │   ├── AIService.ts
│   │   └── PortfolioService.ts
│   │
│   ├── infrastructure/         # 인프라 레이어
│   │   ├── database/         # DB 관련
│   │   │   ├── prisma/      # Prisma 설정
│   │   │   └── seeds/       # 시드 데이터
│   │   ├── cache/           # Redis 캐시
│   │   │   └── RedisClient.ts
│   │   └── external/        # 외부 서비스
│   │       ├── OpenAIClient.ts
│   │       └── S3Client.ts
│   │
│   ├── domain/                 # 도메인 레이어
│   │   ├── models/          # 도메인 모델
│   │   ├── repositories/    # 리포지토리 인터페이스
│   │   └── valueObjects/    # 값 객체
│   │
│   └── shared/                 # 공통 코드
│       ├── utils/
│       ├── errors/
│       └── types/
```

## 🔧 핵심 기술 스택 상세

### Frontend 기술 선택

#### React 18 + Next.js 14
- **App Router**: 서버 컴포넌트로 성능 최적화
- **ISR**: 정적 페이지 생성으로 SEO 최적화
- **Edge Runtime**: 엣지에서 실행되는 빠른 API

#### 상태 관리
```typescript
// Zustand - 전역 상태
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// React Query - 서버 상태
export const useDiaries = () => {
  return useQuery({
    queryKey: ['diaries'],
    queryFn: fetchDiaries,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

### Backend 아키텍처

#### Clean Architecture 적용
```typescript
// Domain Layer - 비즈니스 규칙
export class Diary {
  constructor(
    private id: string,
    private userId: string,
    private content: string,
    private createdAt: Date
  ) {}

  // 비즈니스 로직
  canEdit(): boolean {
    const hoursSinceCreation = 
      (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  }
}

// Use Case - 애플리케이션 비즈니스 규칙
export class AnalyzeDiaryUseCase {
  constructor(
    private diaryRepo: DiaryRepository,
    private aiService: AIService,
    private insightRepo: InsightRepository
  ) {}

  async execute(diaryId: string): Promise<Insight> {
    const diary = await this.diaryRepo.findById(diaryId);
    const analysis = await this.aiService.analyze(diary.content);
    const insight = new Insight(diaryId, analysis);
    return this.insightRepo.save(insight);
  }
}
```

#### API 설계 원칙
```typescript
// RESTful API with consistent structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
  };
}

// Example endpoint
router.post('/api/v1/diaries', 
  authenticate,
  validate(createDiarySchema),
  async (req, res) => {
    const result = await diaryController.create(req.body);
    res.json({
      success: true,
      data: result
    });
  }
);
```

## 🤖 AI 통합 아키텍처

### AI Service 설계
```typescript
export class AIAnalysisService {
  private openai: OpenAI;
  private cache: Redis;
  private prompts: PromptManager;

  async analyzeDiary(content: string): Promise<Analysis> {
    // 1. 캐시 확인
    const cached = await this.checkCache(content);
    if (cached) return cached;

    // 2. 콘텐츠 전처리
    const processed = this.preprocessContent(content);

    // 3. AI 분석 실행
    const result = await this.runAnalysis(processed);

    // 4. 후처리 및 캐싱
    const formatted = this.postprocess(result);
    await this.cache.set(content, formatted);

    return formatted;
  }

  private async runAnalysis(content: string) {
    // LangGraph를 사용한 체인 구성
    const chain = new AnalysisChain()
      .addNode('extract_events', this.extractEvents)
      .addNode('identify_skills', this.identifySkills)
      .addNode('generate_insights', this.generateInsights)
      .addNode('create_feedback', this.createFeedback);

    return chain.run(content);
  }
}
```

### 프롬프트 관리
```typescript
// prompts/strength-extraction.ts
export const STRENGTH_EXTRACTION_PROMPT = `
당신은 전문 커리어 코치입니다. 
사용자의 일기에서 숨겨진 강점과 역량을 찾아주세요.

일기 내용: {content}

다음 관점에서 분석해주세요:
1. 기술적 스킬 (하드 스킬)
2. 소프트 스킬 (의사소통, 리더십 등)
3. 문제 해결 능력
4. 성장 포인트

출력 형식:
{
  "strengths": ["강점1", "강점2"],
  "skills": {"technical": [], "soft": []},
  "growth_areas": ["성장영역1"],
  "evidence": ["구체적 증거1", "구체적 증거2"]
}
`;
```

## 🗄 데이터베이스 설계

### Prisma Schema
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  profile       Profile?
  diaries       Diary[]
  subscription  Subscription?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Diary {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  content       String    @db.Text
  mood          String?
  tags          String[]
  insights      Insight[]
  attachments   Attachment[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId, createdAt])
}

model Insight {
  id            String    @id @default(cuid())
  diaryId       String
  diary         Diary     @relation(fields: [diaryId], references: [id])
  type          InsightType
  content       Json      // AI 분석 결과
  strengths     String[]
  skills        Json
  createdAt     DateTime  @default(now())
  
  @@index([diaryId])
}

enum InsightType {
  DAILY
  WEEKLY
  MONTHLY
}
```

## 🔐 보안 아키텍처

### 인증/인가
```typescript
// JWT + Refresh Token 전략
export class AuthService {
  generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string, type: 'access' | 'refresh') {
    const secret = type === 'access' 
      ? process.env.JWT_SECRET 
      : process.env.JWT_REFRESH_SECRET;
      
    return jwt.verify(token, secret);
  }
}
```

### 데이터 암호화
```typescript
// 민감한 데이터 암호화
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## 🚀 배포 아키텍처

### 개발/스테이징 환경
- **Frontend**: Vercel (자동 배포, Preview URLs)
- **Backend**: Railway (간편한 설정, 자동 스케일링)
- **Database**: Supabase (PostgreSQL + 실시간 기능)
- **Cache**: Railway Redis

### 프로덕션 환경 (확장 시)
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
    ports:
      - "3000:3000"

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=cushion
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 📈 성능 최적화

### Frontend 최적화
1. **코드 스플리팅**: 라우트별 자동 분할
2. **이미지 최적화**: Next.js Image 컴포넌트
3. **폰트 최적화**: next/font 사용
4. **번들 크기**: Tree shaking, 동적 임포트

### Backend 최적화
1. **쿼리 최적화**: Prisma의 include/select 활용
2. **캐싱 전략**: Redis로 AI 결과 캐싱
3. **Rate Limiting**: 사용자별 요청 제한
4. **Connection Pooling**: DB 연결 풀 관리

### AI 비용 최적화
1. **토큰 관리**: 프롬프트 최적화로 토큰 절약
2. **캐싱**: 유사 콘텐츠 캐시 활용
3. **모델 선택**: 작업별 적절한 모델 사용
4. **배치 처리**: 여러 요청 묶어서 처리