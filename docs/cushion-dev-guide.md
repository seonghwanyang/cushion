# Cushion 개발 가이드

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/yourusername/cushion.git
cd Cushion_code

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 2. 환경 변수 설정

`.env.local` 파일을 다음과 같이 수정:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/cushion_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"
ENCRYPTION_KEY="64-character-hex-string-for-encryption"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# AWS (Optional for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="cushion-uploads"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. 데이터베이스 설정

```bash
# PostgreSQL 실행 (Docker 사용 시)
docker run -d \
  --name cushion-postgres \
  -e POSTGRES_DB=cushion_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Redis 실행
docker run -d \
  --name cushion-redis \
  -p 6379:6379 \
  redis:7-alpine

# Prisma 마이그레이션
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 시드 데이터 (선택사항)
npm run db:seed
```

### 4. 개발 서버 실행

```bash
# 터미널 1 - Backend
cd backend
npm run dev

# 터미널 2 - Frontend
cd frontend
npm run dev
```

이제 http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 💻 개발 워크플로우

### 1. 브랜치 전략

```bash
# 새 기능 개발
git checkout -b feature/diary-voice-input

# 버그 수정
git checkout -b fix/ai-response-delay

# 긴급 수정
git checkout -b hotfix/auth-error
```

### 2. 코드 작성 규칙

#### TypeScript 스타일
```typescript
// ✅ Good: 명확한 타입 정의
interface DiaryCreateInput {
  content: string;
  mood?: MoodType;
  tags?: string[];
}

// ✅ Good: 함수 시그니처
async function createDiary(
  input: DiaryCreateInput,
  userId: string
): Promise<Diary> {
  // 구현
}

// ❌ Bad: any 타입 사용
function processDiary(data: any) {
  // 피하세요
}
```

#### React 컴포넌트
```tsx
// ✅ Good: 함수형 컴포넌트 + TypeScript
interface DiaryEditorProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
}

export const DiaryEditor: FC<DiaryEditorProps> = ({
  initialContent = '',
  onSave
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      toast.success('일기가 저장되었습니다');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="diary-editor">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘은 어떤 하루였나요?"
        className="w-full h-64 p-4 border rounded-lg"
      />
      <Button
        onClick={handleSave}
        disabled={isSaving || !content.trim()}
      >
        {isSaving ? '저장 중...' : '저장하기'}
      </Button>
    </div>
  );
};
```

### 3. API 개발

#### 엔드포인트 생성
```typescript
// backend/src/api/routes/diary.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { diaryController } from '../controllers/DiaryController';
import { createDiarySchema, updateDiarySchema } from '../schemas/diary';

const router = Router();

// 모든 라우트에 인증 적용
router.use(authenticate);

// 일기 목록 조회
router.get('/', diaryController.list);

// 일기 생성
router.post(
  '/',
  validate(createDiarySchema),
  diaryController.create
);

// 일기 상세 조회
router.get('/:id', diaryController.get);

// 일기 수정
router.put(
  '/:id',
  validate(updateDiarySchema),
  diaryController.update
);

// 일기 삭제
router.delete('/:id', diaryController.delete);

// AI 분석 요청
router.post('/:id/analyze', diaryController.analyze);

export default router;
```

#### 컨트롤러 구현
```typescript
// backend/src/api/controllers/DiaryController.ts
export class DiaryController {
  constructor(
    private diaryService: DiaryService,
    private aiService: AIService
  ) {}

  create = async (req: Request, res: Response) => {
    try {
      const { content, mood, tags } = req.body;
      const userId = req.user.id;

      const diary = await this.diaryService.create({
        content,
        mood,
        tags,
        userId
      });

      // 비동기로 AI 분석 시작
      this.aiService.analyzeDiary(diary.id).catch(console.error);

      res.status(201).json({
        success: true,
        data: diary
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DIARY_CREATE_ERROR',
          message: error.message
        }
      });
    }
  };

  analyze = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 권한 확인
      const diary = await this.diaryService.findById(id);
      if (diary.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '권한이 없습니다'
          }
        });
      }

      const insight = await this.aiService.analyzeDiary(id);

      res.json({
        success: true,
        data: insight
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'AI 분석 중 오류가 발생했습니다'
        }
      });
    }
  };
}
```

### 4. AI 통합 개발

#### AI 서비스 구현
```typescript
// backend/src/services/AIService.ts
export class AIService {
  private openai: OpenAI;
  private cache: RedisClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.cache = new RedisClient();
  }

  async analyzeDiary(diaryId: string): Promise<Insight> {
    // 1. 캐시 확인
    const cacheKey = `insight:${diaryId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. 일기 내용 조회
    const diary = await prisma.diary.findUnique({
      where: { id: diaryId }
    });

    // 3. AI 분석 실행
    const analysis = await this.performAnalysis(diary.content);

    // 4. 인사이트 저장
    const insight = await prisma.insight.create({
      data: {
        diaryId,
        type: 'DAILY',
        content: analysis,
        strengths: analysis.strengths,
        skills: analysis.skills
      }
    });

    // 5. 캐시 저장 (1시간)
    await this.cache.setex(
      cacheKey,
      3600,
      JSON.stringify(insight)
    );

    return insight;
  }

  private async performAnalysis(content: string) {
    const prompt = this.buildPrompt(content);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 전문 커리어 코치입니다...'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  private buildPrompt(content: string): string {
    return `
      다음 일기에서 작성자의 강점과 역량을 분석해주세요.
      
      일기 내용:
      ${content}
      
      다음 형식으로 응답해주세요:
      {
        "strengths": ["강점1", "강점2", ...],
        "skills": {
          "technical": ["기술1", "기술2", ...],
          "soft": ["소프트스킬1", ...]
        },
        "growthAreas": ["성장영역1", ...],
        "evidence": ["구체적 증거1", ...],
        "feedback": "종합적인 피드백 메시지"
      }
    `;
  }
}
```

### 5. 테스트 작성

#### 단위 테스트
```typescript
// backend/src/services/__tests__/DiaryService.test.ts
describe('DiaryService', () => {
  let diaryService: DiaryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      diary: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    };
    
    diaryService = new DiaryService(mockPrisma);
  });

  describe('create', () => {
    it('should create a new diary', async () => {
      const input = {
        content: '오늘은 팀 미팅에서...',
        mood: 'positive',
        userId: 'user123'
      };

      const expectedDiary = {
        id: 'diary123',
        ...input,
        createdAt: new Date()
      };

      mockPrisma.diary.create.mockResolvedValue(expectedDiary);

      const result = await diaryService.create(input);

      expect(mockPrisma.diary.create).toHaveBeenCalledWith({
        data: input
      });
      expect(result).toEqual(expectedDiary);
    });

    it('should throw error for empty content', async () => {
      const input = {
        content: '',
        userId: 'user123'
      };

      await expect(diaryService.create(input))
        .rejects
        .toThrow('Content cannot be empty');
    });
  });
});
```

#### 통합 테스트
```typescript
// backend/src/api/__tests__/diary.integration.test.ts
describe('Diary API Integration', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    // 테스트 사용자 생성 및 로그인
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.data.accessToken;
  });

  describe('POST /api/diaries', () => {
    it('should create a diary with valid data', async () => {
      const response = await request(app)
        .post('/api/diaries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '오늘은 새로운 프로젝트를 시작했다...',
          mood: 'excited',
          tags: ['프로젝트', '시작']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('오늘은 새로운 프로젝트를 시작했다...');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/diaries')
        .send({
          content: 'Test content'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

## 🛠 개발 도구

### VS Code 추천 익스텐션
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 유용한 스크립트

```json
{
  "scripts": {
    // 개발
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    
    // 테스트
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:e2e": "cd e2e && npm test",
    
    // 빌드
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    
    // 린트 & 포맷
    "lint": "npm run lint:backend && npm run lint:frontend",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    
    // DB 관련
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:seed": "cd backend && npm run db:seed",
    "db:studio": "cd backend && npx prisma studio",
    
    // 기타 유틸리티
    "clean": "find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +",
    "fresh": "npm run clean && npm install"
  }
}
```

## 🐛 디버깅 팁

### 1. 로그 설정
```typescript
// 개발 환경에서 상세 로그
import debug from 'debug';

const log = debug('cushion:diary');

export class DiaryService {
  async create(input: DiaryCreateInput) {
    log('Creating diary with input:', input);
    
    try {
      const diary = await this.repository.create(input);
      log('Diary created successfully:', diary.id);
      return diary;
    } catch (error) {
      log('Error creating diary:', error);
      throw error;
    }
  }
}

// 실행: DEBUG=cushion:* npm run dev
```

### 2. AI 응답 디버깅
```typescript
// AI 응답 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('AI Prompt:', prompt);
  console.log('AI Response:', completion.choices[0].message);
  console.log('Token Usage:', completion.usage);
}
```

### 3. 데이터베이스 쿼리 로깅
```typescript
// Prisma 쿼리 로깅 활성화
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// 쿼리 이벤트 리스너
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## 🚨 일반적인 문제 해결

### 1. 데이터베이스 연결 오류
```bash
# 문제: P1001: Can't reach database server
# 해결:
# 1. PostgreSQL이 실행 중인지 확인
docker ps | grep postgres

# 2. 연결 문자열 확인
echo $DATABASE_URL

# 3. 마이그레이션 재실행
npx prisma migrate reset --force
npx prisma migrate dev
```

### 2. AI API 오류
```typescript
// 문제: OpenAI API 429 (Rate Limit)
// 해결: 재시도 로직 구현
class AIServiceWithRetry extends AIService {
  async performAnalysis(content: string, retries = 3) {
    try {
      return await super.performAnalysis(content);
    } catch (error) {
      if (error.status === 429 && retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performAnalysis(content, retries - 1);
      }
      throw error;
    }
  }
}
```

### 3. 빌드 오류
```bash
# 문제: Module not found
# 해결:
# 1. 캐시 삭제
rm -rf .next
rm -rf node_modules/.cache

# 2. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 3. TypeScript 재컴파일
npx tsc --build --clean
npx tsc --build
```

## 📚 추가 리소스

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 프로젝트 관련 문서
- [비즈니스 플레이북](./docs/BUSINESS_PLAYBOOK.md)
- [API 명세서](./docs/API_SPECIFICATION.md)
- [데이터베이스 스키마](./backend/prisma/schema.prisma)
- [디자인 시스템](./docs/DESIGN_SYSTEM.md)

### 팀 규칙
- 코드 리뷰는 최소 1명 이상
- PR 제목은 커밋 컨벤션 따르기
- 테스트 없는 코드는 머지 금지
- 매주 금요일 회고 미팅

## 🤝 도움 요청

문제가 발생하면:
1. 먼저 이 문서의 문제 해결 섹션 확인
2. GitHub Issues 검색
3. 팀 Slack의 #dev-help 채널
4. 긴급한 경우 팀 리드에게 직접 연락

Happy Coding! 🚀