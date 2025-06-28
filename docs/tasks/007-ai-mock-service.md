# Task 007: AI Mock 서비스 구현 및 인사이트 기능

## 📋 작업 개요

**작업 ID**: 007  
**작업명**: AI 분석 Mock 서비스 및 인사이트 시스템 구현  
**예상 소요시간**: 3-4시간  
**우선순위**: 🔴 Critical (핵심 가치 제안)  
**선행 작업**: Task 005, 006 (완료됨)

## 🎯 목표

1. AI 분석 Mock 서비스 구현
2. 일기 분석 후 강점/인사이트 생성
3. 주간/월간 리포트 생성 로직
4. Frontend에서 분석 결과 표시
5. 실시간 분석 피드백 제공

## 📋 작업 내용

### 1. AI Service Interface 정의

#### `backend/src/interfaces/services/ai.service.interface.ts`
```typescript
export interface StrengthAnalysis {
  strength: string;
  evidence: string[];
  confidence: number;
  category: 'technical' | 'soft' | 'leadership' | 'creative' | 'analytical';
}

export interface EmotionAnalysis {
  primary: string;
  secondary?: string;
  intensity: number;
}

export interface DiaryAnalysis {
  strengths: StrengthAnalysis[];
  emotions: EmotionAnalysis;
  keywords: string[];
  growthAreas: string[];
  actionableInsights: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  confidenceScore: number;
}

export interface WeeklyInsight {
  period: {
    start: Date;
    end: Date;
  };
  totalEntries: number;
  consistentStrengths: StrengthAnalysis[];
  emotionalJourney: EmotionAnalysis[];
  keyAchievements: string[];
  growthProgress: {
    area: string;
    progress: number; // 0-100
    evidence: string[];
  }[];
  recommendations: string[];
}

export interface IAIService {
  analyzeDiary(content: string, mood?: string): Promise<DiaryAnalysis>;
  generateWeeklyInsight(diaryIds: string[]): Promise<WeeklyInsight>;
  extractKeywords(content: string): Promise<string[]>;
  generatePortfolioSummary(userId: string): Promise<string>;
}
```

### 2. Mock AI Service 구현

#### `backend/src/mocks/services/ai.service.mock.ts`
```typescript
import { IAIService, DiaryAnalysis, StrengthAnalysis, EmotionAnalysis, WeeklyInsight } from '@/interfaces/services/ai.service.interface';
import { logger } from '@/utils/logger';

export class MockAIService implements IAIService {
  // 강점 키워드 맵핑
  private strengthKeywords = {
    technical: {
      keywords: ['코딩', '개발', '프로그래밍', '알고리즘', '디버깅', '구현', '해결', '분석', '설계', '테스트'],
      strengths: ['문제 해결 능력', '기술적 사고력', '분석력', '논리적 사고', '디버깅 능력'],
    },
    soft: {
      keywords: ['팀', '협업', '소통', '대화', '회의', '발표', '설득', '경청', '피드백', '조율'],
      strengths: ['커뮤니케이션 능력', '팀워크', '리더십', '공감 능력', '협상력'],
    },
    leadership: {
      keywords: ['리드', '결정', '책임', '주도', '기획', '전략', '목표', '비전', '동기부여', '멘토링'],
      strengths: ['리더십', '의사결정력', '전략적 사고', '비전 제시', '팀 관리 능력'],
    },
    creative: {
      keywords: ['아이디어', '창의', '새로운', '혁신', '디자인', '기획', '브레인스토밍', '상상', '영감'],
      strengths: ['창의력', '혁신적 사고', '문제 재정의 능력', '아이디어 발상력', '디자인 사고'],
    },
    analytical: {
      keywords: ['분석', '데이터', '통계', '리서치', '조사', '평가', '측정', '개선', '최적화', '효율'],
      strengths: ['분석력', '데이터 해석 능력', '비판적 사고', '체계적 사고', '개선 지향성'],
    },
  };

  // 감정 분석 키워드
  private emotionKeywords = {
    positive: ['기쁘', '행복', '뿌듯', '만족', '성취', '즐거', '신나', '희망', '감사', '자신감'],
    negative: ['힘들', '어려', '걱정', '불안', '스트레스', '피곤', '지친', '실망', '좌절'],
    neutral: ['평범', '그저', '보통', '일상', '무난'],
  };

  // 성장 영역 템플릿
  private growthAreaTemplates = [
    '시간 관리 능력을 더 개발하면 좋을 것 같아요',
    '자기 주도적 학습 습관을 강화해보세요',
    '스트레스 관리 방법을 찾아보는 것을 추천해요',
    '목표 설정을 더 구체적으로 해보면 어떨까요',
    '팀원들과의 소통을 더 활발히 해보세요',
  ];

  async analyzeDiary(content: string, mood?: string): Promise<DiaryAnalysis> {
    await this.simulateDelay(500); // AI 처리 시간 시뮬레이션
    
    logger.info('Analyzing diary with Mock AI Service', { contentLength: content.length, mood });

    // 강점 분석
    const strengths = this.analyzeStrengths(content);
    
    // 감정 분석
    const emotions = this.analyzeEmotions(content, mood);
    
    // 키워드 추출
    const keywords = await this.extractKeywords(content);
    
    // 성장 영역 도출
    const growthAreas = this.identifyGrowthAreas(content, strengths);
    
    // 실행 가능한 인사이트 생성
    const actionableInsights = this.generateActionableInsights(strengths, emotions);
    
    // 전반적인 감정 톤 결정
    const overallSentiment = this.determineOverallSentiment(content, emotions);

    return {
      strengths,
      emotions,
      keywords,
      growthAreas,
      actionableInsights,
      overallSentiment,
      confidenceScore: 0.75 + Math.random() * 0.2, // 75-95% 신뢰도
    };
  }

  private analyzeStrengths(content: string): StrengthAnalysis[] {
    const strengths: StrengthAnalysis[] = [];
    const contentLower = content.toLowerCase();

    // 각 카테고리별로 강점 분석
    Object.entries(this.strengthKeywords).forEach(([category, data]) => {
      const foundKeywords = data.keywords.filter(keyword => 
        contentLower.includes(keyword)
      );

      if (foundKeywords.length > 0) {
        // 찾은 키워드 수에 따라 1-2개의 강점 선택
        const strengthCount = Math.min(2, Math.ceil(foundKeywords.length / 3));
        const selectedStrengths = this.selectRandom(data.strengths, strengthCount);

        selectedStrengths.forEach(strength => {
          // 문장에서 증거 추출
          const evidence = this.extractEvidence(content, foundKeywords);
          
          strengths.push({
            strength,
            evidence,
            confidence: 0.7 + (foundKeywords.length * 0.05),
            category: category as any,
          });
        });
      }
    });

    // 강점이 없으면 기본 강점 추가
    if (strengths.length === 0) {
      strengths.push({
        strength: '꾸준함',
        evidence: ['오늘도 일기를 작성하며 자기 성찰의 시간을 가졌습니다'],
        confidence: 0.8,
        category: 'soft',
      });
    }

    return strengths.slice(0, 3); // 최대 3개까지만 반환
  }

  private analyzeEmotions(content: string, mood?: string): EmotionAnalysis {
    const contentLower = content.toLowerCase();
    
    // 기분이 명시되어 있으면 우선 사용
    if (mood) {
      const moodEmotionMap: Record<string, EmotionAnalysis> = {
        HAPPY: { primary: '행복', secondary: '만족', intensity: 0.8 },
        SAD: { primary: '슬픔', secondary: '아쉬움', intensity: 0.7 },
        NEUTRAL: { primary: '평온', intensity: 0.5 },
        ANXIOUS: { primary: '불안', secondary: '걱정', intensity: 0.8 },
        EXCITED: { primary: '흥분', secondary: '기대', intensity: 0.9 },
        ANGRY: { primary: '화남', secondary: '답답함', intensity: 0.8 },
        PEACEFUL: { primary: '평화', secondary: '안정', intensity: 0.6 },
      };
      
      return moodEmotionMap[mood] || { primary: '평온', intensity: 0.5 };
    }

    // 텍스트에서 감정 분석
    let positiveScore = 0;
    let negativeScore = 0;

    this.emotionKeywords.positive.forEach(keyword => {
      if (contentLower.includes(keyword)) positiveScore++;
    });

    this.emotionKeywords.negative.forEach(keyword => {
      if (contentLower.includes(keyword)) negativeScore++;
    });

    if (positiveScore > negativeScore) {
      return {
        primary: '긍정적',
        secondary: '희망적',
        intensity: Math.min(0.9, 0.5 + positiveScore * 0.1),
      };
    } else if (negativeScore > positiveScore) {
      return {
        primary: '도전적',
        secondary: '성장중',
        intensity: Math.min(0.8, 0.5 + negativeScore * 0.1),
      };
    }

    return { primary: '차분함', intensity: 0.6 };
  }

  async extractKeywords(content: string): Promise<string[]> {
    await this.simulateDelay(100);

    // 간단한 키워드 추출 로직
    const stopWords = ['그리고', '하지만', '그래서', '오늘', '내일', '어제', '있다', '없다', '하다', '되다'];
    
    // 명사 추출 시뮬레이션 (실제로는 형태소 분석기 사용)
    const words = content
      .split(/[\s,.!?]+/)
      .filter(word => word.length > 1)
      .filter(word => !stopWords.includes(word))
      .filter(word => /[가-힣]{2,}/.test(word));

    // 빈도수 계산
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // 상위 5개 키워드 반환
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private identifyGrowthAreas(content: string, strengths: StrengthAnalysis[]): string[] {
    // 강점이 적으면 더 많은 성장 영역 제안
    const growthCount = Math.max(1, 3 - strengths.length);
    return this.selectRandom(this.growthAreaTemplates, growthCount);
  }

  private generateActionableInsights(
    strengths: StrengthAnalysis[],
    emotions: EmotionAnalysis
  ): string[] {
    const insights: string[] = [];

    // 강점 기반 인사이트
    strengths.forEach(strength => {
      const templates = [
        `오늘 보여준 ${strength.strength}을(를) 프로젝트에 적극 활용해보세요`,
        `${strength.strength}은(는) 당신의 핵심 역량입니다. 이를 더 발전시켜보세요`,
        `${strength.strength}을(를) 팀원들과 공유하면 시너지를 낼 수 있을 거예요`,
      ];
      insights.push(this.selectRandom(templates, 1)[0]);
    });

    // 감정 기반 인사이트
    if (emotions.intensity > 0.7) {
      insights.push('현재의 긍정적인 에너지를 유지하며 도전적인 과제에 임해보세요');
    } else if (emotions.primary === '도전적') {
      insights.push('어려움을 겪고 있지만, 이는 성장의 기회입니다. 작은 성취부터 시작해보세요');
    }

    return insights.slice(0, 3);
  }

  private determineOverallSentiment(
    content: string,
    emotions: EmotionAnalysis
  ): 'positive' | 'neutral' | 'negative' {
    const contentLower = content.toLowerCase();
    let score = 0;

    // 긍정 키워드 체크
    this.emotionKeywords.positive.forEach(keyword => {
      if (contentLower.includes(keyword)) score += 1;
    });

    // 부정 키워드 체크
    this.emotionKeywords.negative.forEach(keyword => {
      if (contentLower.includes(keyword)) score -= 1;
    });

    // 감정 강도 반영
    if (emotions.primary === '긍정적' || emotions.primary === '행복') {
      score += 2;
    } else if (emotions.primary === '도전적' || emotions.primary === '슬픔') {
      score -= 1;
    }

    if (score > 1) return 'positive';
    if (score < -1) return 'negative';
    return 'neutral';
  }

  async generateWeeklyInsight(diaryIds: string[]): Promise<WeeklyInsight> {
    await this.simulateDelay(1000);

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Mock 주간 인사이트 생성
    const consistentStrengths: StrengthAnalysis[] = [
      {
        strength: '문제 해결 능력',
        evidence: [
          '월요일: 복잡한 버그를 3시간 만에 해결',
          '수요일: 팀 회의에서 창의적인 해결책 제시',
          '금요일: 알고리즘 문제 독립적으로 해결',
        ],
        confidence: 0.85,
        category: 'technical',
      },
      {
        strength: '꾸준함',
        evidence: [
          '이번 주 7일 연속 일기 작성',
          '매일 30분 이상 자기 성찰 시간 확보',
        ],
        confidence: 0.95,
        category: 'soft',
      },
    ];

    const emotionalJourney: EmotionAnalysis[] = [
      { primary: '희망적', intensity: 0.7 },
      { primary: '도전적', intensity: 0.6 },
      { primary: '성취감', intensity: 0.8 },
    ];

    const keyAchievements = [
      '프로젝트 마일스톤 달성',
      '새로운 기술 스택 학습 완료',
      '팀 내 갈등 상황 원만히 해결',
    ];

    const growthProgress = [
      {
        area: '시간 관리',
        progress: 75,
        evidence: ['일일 계획 수립 및 80% 달성', '우선순위 정리 습관화'],
      },
      {
        area: '기술 역량',
        progress: 60,
        evidence: ['React 고급 패턴 학습', 'TypeScript 활용도 향상'],
      },
    ];

    const recommendations = [
      '이번 주 보여준 문제 해결 능력을 더 큰 프로젝트에 적용해보세요',
      '꾸준한 기록 습관이 자리잡았으니, 이제 더 깊은 성찰을 시도해보세요',
      '팀원들과 학습 내용을 공유하는 세션을 만들어보는 건 어떨까요?',
    ];

    return {
      period: { start: weekStart, end: now },
      totalEntries: diaryIds.length,
      consistentStrengths,
      emotionalJourney,
      keyAchievements,
      growthProgress,
      recommendations,
    };
  }

  async generatePortfolioSummary(userId: string): Promise<string> {
    await this.simulateDelay(800);

    // Mock 포트폴리오 요약 생성
    const summary = `
전환기 동안 꾸준한 자기 성찰과 성장을 보여준 인재입니다.

**핵심 강점:**
• 문제 해결 능력: 복잡한 상황에서도 논리적이고 창의적인 해결책을 제시
• 커뮤니케이션: 팀원들과의 원활한 소통과 갈등 조정 능력 보유
• 학습 능력: 새로운 기술과 도구를 빠르게 습득하고 실무에 적용

**주요 성과:**
• 30일 연속 일일 목표 달성으로 꾸준함과 실행력 입증
• 독학으로 3개의 새로운 기술 스택 마스터
• 팀 프로젝트에서 리더 역할 수행하며 성공적으로 완수

**성장 스토리:**
처음에는 방향성을 잃고 불안해했지만, 매일의 작은 성취를 통해 자신감을 회복했습니다. 
특히 기술적 역량과 소프트 스킬의 균형잡힌 성장을 보여주었으며, 
어려운 상황을 학습과 성장의 기회로 전환하는 긍정적인 마인드셋을 갖추고 있습니다.
    `.trim();

    return summary;
  }

  private extractEvidence(content: string, keywords: string[]): string[] {
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
    const evidence: string[] = [];

    sentences.forEach(sentence => {
      const hasKeyword = keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      );
      
      if (hasKeyword && sentence.length > 10 && sentence.length < 100) {
        evidence.push(sentence.trim());
      }
    });

    // 증거가 없으면 일반적인 문장 추가
    if (evidence.length === 0) {
      evidence.push('일기 전반에서 이러한 역량이 드러났습니다');
    }

    return evidence.slice(0, 3);
  }

  private selectRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Insight Service Interface

#### `backend/src/interfaces/services/insight.service.interface.ts`
```typescript
import type { Insight } from '@prisma/client';
import { DiaryAnalysis } from './ai.service.interface';

export interface CreateInsightInput {
  diaryId: string;
  userId: string;
  analysis: DiaryAnalysis;
}

export interface IInsightService {
  create(input: CreateInsightInput): Promise<Insight>;
  findByDiary(diaryId: string): Promise<Insight | null>;
  findByUser(userId: string, limit?: number): Promise<Insight[]>;
  findLatestByUser(userId: string): Promise<Insight | null>;
}
```

### 4. Mock Insight Service

#### `backend/src/mocks/services/insight.service.mock.ts`
```typescript
import { IInsightService, CreateInsightInput } from '@/interfaces/services/insight.service.interface';
import type { Insight, InsightType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class MockInsightService implements IInsightService {
  private insights = new Map<string, Insight>();
  private diaryInsights = new Map<string, string>(); // diaryId -> insightId
  private userInsights = new Map<string, Set<string>>(); // userId -> Set<insightId>

  async create(input: CreateInsightInput): Promise<Insight> {
    const { diaryId, userId, analysis } = input;

    // 이미 분석된 일기인지 확인
    if (this.diaryInsights.has(diaryId)) {
      const existingId = this.diaryInsights.get(diaryId)!;
      return this.insights.get(existingId)!;
    }

    const insight: Insight = {
      id: `mock-insight-${uuidv4()}`,
      diaryId,
      userId,
      type: 'DAILY' as InsightType,
      content: {
        analysis,
        generatedAt: new Date().toISOString(),
      },
      strengths: analysis.strengths.map(s => s.strength),
      skills: {
        technical: analysis.strengths
          .filter(s => s.category === 'technical')
          .map(s => s.strength),
        soft: analysis.strengths
          .filter(s => s.category === 'soft')
          .map(s => s.strength),
      },
      emotions: [analysis.emotions.primary, analysis.emotions.secondary].filter(Boolean) as string[],
      growthAreas: analysis.growthAreas,
      evidence: analysis.strengths.flatMap(s => s.evidence),
      feedback: this.generateFeedback(analysis),
      confidence: analysis.confidenceScore,
      model: 'gpt-4-mock',
      tokensUsed: Math.floor(Math.random() * 500) + 200,
      processingTime: Math.floor(Math.random() * 1000) + 500,
      createdAt: new Date(),
    };

    // 저장
    this.insights.set(insight.id, insight);
    this.diaryInsights.set(diaryId, insight.id);
    
    if (!this.userInsights.has(userId)) {
      this.userInsights.set(userId, new Set());
    }
    this.userInsights.get(userId)!.add(insight.id);

    await this.simulateDelay(200);
    return insight;
  }

  async findByDiary(diaryId: string): Promise<Insight | null> {
    await this.simulateDelay(100);
    
    const insightId = this.diaryInsights.get(diaryId);
    if (!insightId) return null;
    
    return this.insights.get(insightId) || null;
  }

  async findByUser(userId: string, limit: number = 10): Promise<Insight[]> {
    await this.simulateDelay(150);
    
    const userInsightIds = this.userInsights.get(userId) || new Set();
    const insights = Array.from(userInsightIds)
      .map(id => this.insights.get(id)!)
      .filter(insight => insight !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return insights;
  }

  async findLatestByUser(userId: string): Promise<Insight | null> {
    const insights = await this.findByUser(userId, 1);
    return insights[0] || null;
  }

  private generateFeedback(analysis: DiaryAnalysis): string {
    const templates = [
      `오늘 일기에서 ${analysis.strengths[0]?.strength || '꾸준함'}이 특히 돋보였어요. ${analysis.actionableInsights[0] || '이 강점을 계속 발전시켜 나가세요.'}`,
      `${analysis.emotions.primary} 감정 속에서도 긍정적인 면을 찾아내는 모습이 인상적이에요. ${analysis.growthAreas[0] || '새로운 도전을 시도해보는 것도 좋겠어요.'}`,
      `오늘의 경험이 당신을 더 성장시켰네요. 특히 ${analysis.keywords[0] || '오늘'}과 관련된 부분에서 큰 발전이 보여요.`,
    ];

    return this.selectRandom(templates, 1)[0];
  }

  private selectRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5. Service Factory 업데이트

#### `backend/src/factories/service.factory.ts` 수정
```typescript
// AI 서비스 추가
import { IAIService } from '@/interfaces/services/ai.service.interface';
import { IInsightService } from '@/interfaces/services/insight.service.interface';
import { MockAIService } from '@/mocks/services/ai.service.mock';
import { MockInsightService } from '@/mocks/services/insight.service.mock';

// getAIService 메서드 추가
getAIService(): IAIService {
  const key = 'ai';
  if (!this.services.has(key)) {
    if (config.features.useMockAI) {
      logger.info('Using Mock AI Service');
      this.services.set(key, new MockAIService());
    } else {
      // TODO: Real AI Service implementation
      logger.info('Using Mock AI Service (Real not implemented)');
      this.services.set(key, new MockAIService());
    }
  }
  return this.services.get(key);
}

getInsightService(): IInsightService {
  const key = 'insight';
  if (!this.services.has(key)) {
    if (config.features.useMockDatabase) {
      logger.info('Using Mock Insight Service');
      this.services.set(key, new MockInsightService());
    } else {
      // TODO: Real Insight Service implementation
      logger.info('Using Mock Insight Service (Real not implemented)');
      this.services.set(key, new MockInsightService());
    }
  }
  return this.services.get(key);
}
```

### 6. Diary Controller 업데이트 (AI 분석 추가)

#### `backend/src/api/controllers/diary.controller.ts` 수정
```typescript
// create 메서드 수정
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const diary = await this.diaryService.create(userId, req.body);
    
    // AI 분석 자동 실행 (비동기)
    this.analyzeDiaryInBackground(diary.id, userId, diary.content, diary.mood || undefined);
    
    sendSuccess(res, diary, 201);
  } catch (error) {
    next(error);
  }
}

// AI 분석 백그라운드 실행
private async analyzeDiaryInBackground(
  diaryId: string,
  userId: string,
  content: string,
  mood?: string
): Promise<void> {
  try {
    const aiService = serviceFactory.getAIService();
    const insightService = serviceFactory.getInsightService();
    
    // AI 분석 실행
    const analysis = await aiService.analyzeDiary(content, mood);
    
    // 인사이트 저장
    await insightService.create({
      diaryId,
      userId,
      analysis,
    });
    
    logger.info(`AI analysis completed for diary ${diaryId}`);
  } catch (error) {
    logger.error('Failed to analyze diary:', error);
    // 에러가 발생해도 일기 작성은 성공하도록 함
  }
}

// 일기 조회 시 인사이트 포함
async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const diary = await this.diaryService.findById(id);
    
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }
    
    if (diary.userId !== userId) {
      throw new UnauthorizedError('Not authorized to view this diary');
    }
    
    // 인사이트 조회
    const insightService = serviceFactory.getInsightService();
    const insight = await insightService.findByDiary(id);
    
    sendSuccess(res, {
      ...diary,
      insight: insight ? {
        id: insight.id,
        analysis: insight.content,
        feedback: insight.feedback,
        createdAt: insight.createdAt,
      } : null,
    });
  } catch (error) {
    next(error);
  }
}
```

### 7. Insights API 엔드포인트

#### `backend/src/api/controllers/insight.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';
import { NotFoundError } from '@/utils/errors';

export class InsightController {
  private get insightService() {
    return serviceFactory.getInsightService();
  }

  private get aiService() {
    return serviceFactory.getAIService();
  }

  async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const insight = await this.insightService.findLatestByUser(userId);
      
      sendSuccess(res, insight);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = Number(req.query.limit) || 10;
      
      const insights = await this.insightService.findByUser(userId, limit);
      
      sendSuccess(res, insights);
    } catch (error) {
      next(error);
    }
  }

  async getWeekly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // 최근 7일간의 일기 ID 가져오기
      const diaryService = serviceFactory.getDiaryService();
      const recentDiaries = await diaryService.findByUser(userId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
      
      if (recentDiaries.length === 0) {
        throw new NotFoundError('최근 7일간 작성한 일기가 없습니다');
      }
      
      const diaryIds = recentDiaries.map(d => d.id);
      const weeklyInsight = await this.aiService.generateWeeklyInsight(diaryIds);
      
      sendSuccess(res, weeklyInsight);
    } catch (error) {
      next(error);
    }
  }

  async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const portfolio = await this.aiService.generatePortfolioSummary(userId);
      
      sendSuccess(res, { summary: portfolio });
    } catch (error) {
      next(error);
    }
  }
}

export const insightController = new InsightController();
```

#### `backend/src/api/routes/insight.routes.ts`
```typescript
import { Router } from 'express';
import { insightController } from '../controllers/insight.controller';
import { authenticate } from '../middleware/auth.middleware';

export const insightRouter = Router();

// 모든 insight 라우트는 인증 필요
insightRouter.use(authenticate);

// Routes
insightRouter.get('/latest', insightController.getLatest.bind(insightController));
insightRouter.get('/weekly', insightController.getWeekly.bind(insightController));
insightRouter.get('/portfolio', insightController.getPortfolio.bind(insightController));
insightRouter.get('/', insightController.list.bind(insightController));
```

### 8. Frontend AI 분석 결과 표시

#### `frontend/src/components/diary/DiaryAnalysis.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Heart, Target } from 'lucide-react';

interface DiaryAnalysisProps {
  analysis: any; // TODO: 타입 정의
  feedback?: string;
}

export function DiaryAnalysis({ analysis, feedback }: DiaryAnalysisProps) {
  if (!analysis) return null;

  return (
    <div className="space-y-4 mt-6">
      {/* AI 피드백 */}
      {feedback && (
        <Card className="border-cushion-orange/20 bg-cushion-beige/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cushion-orange" />
              AI 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-cushion-gray">{feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* 발견된 강점 */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              오늘 발견한 강점
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.strengths.map((strength: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {strength.strength}
                    </Badge>
                    <span className="text-xs text-cushion-gray">
                      신뢰도 {Math.round(strength.confidence * 100)}%
                    </span>
                  </div>
                  {strength.evidence && strength.evidence.length > 0 && (
                    <ul className="text-sm text-cushion-gray space-y-1 ml-4">
                      {strength.evidence.map((e: string, i: number) => (
                        <li key={i} className="list-disc">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 감정 분석 */}
      {analysis.emotions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              감정 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">{analysis.emotions.primary}</p>
                {analysis.emotions.secondary && (
                  <p className="text-sm text-cushion-gray">
                    {analysis.emotions.secondary}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-cushion-orange h-2 rounded-full transition-all"
                    style={{
                      width: `${(analysis.emotions.intensity || 0.5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성장 영역 */}
      {analysis.growthAreas && analysis.growthAreas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              성장 기회
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.growthAreas.map((area: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 키워드 */}
      {analysis.keywords && analysis.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {analysis.keywords.map((keyword: string, index: number) => (
            <Badge key={index} variant="outline">
              #{keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### `frontend/src/app/dashboard/diaries/[id]/page.tsx`
```typescript
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { diaryApi } from '@/lib/api/diary';
import { DiaryAnalysis } from '@/components/diary/DiaryAnalysis';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function DiaryDetailPage() {
  const params = useParams();
  const diaryId = params.id as string;

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', diaryId],
    queryFn: () => diaryApi.get(diaryId),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!diary) {
    return <div>일기를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">
                {format(new Date(diary.createdAt), 'yyyy년 M월 d일', { locale: ko })}
              </h1>
              {diary.mood && (
                <p className="text-cushion-gray mt-1">기분: {diary.mood}</p>
              )}
            </div>
            <div className="text-right">
              {diary.tags.length > 0 && (
                <div className="flex gap-2 justify-end">
                  {diary.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm text-cushion-gray"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap">{diary.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI 분석 결과 */}
      {diary.insight && (
        <DiaryAnalysis
          analysis={diary.insight.analysis}
          feedback={diary.insight.feedback}
        />
      )}
    </div>
  );
}
```

## 🚀 테스트 시나리오

### 1. Backend AI 서비스 테스트
```bash
# 1. Backend 서버 재시작
cd backend
pnpm dev:mock

# 2. 로그인
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@cushion.app", "password": "password123"}'

# 3. 일기 작성 (AI 분석 자동 실행)
curl -X POST http://localhost:3001/api/v1/diaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "content": "오늘은 팀 프로젝트에서 리더 역할을 맡았다. 처음에는 부담스러웠지만, 팀원들과 소통하면서 프로젝트를 성공적으로 이끌었다. 새로운 아이디어를 제안했고, 모두가 긍정적으로 받아들여줬다.",
    "mood": "HAPPY",
    "tags": ["리더십", "프로젝트", "성장"]
  }'

# 4. 최신 인사이트 조회
curl -X GET http://localhost:3001/api/v1/insights/latest \
  -H "Authorization: Bearer {token}"

# 5. 주간 인사이트 조회
curl -X GET http://localhost:3001/api/v1/insights/weekly \
  -H "Authorization: Bearer {token}"
```

### 2. Frontend 테스트
1. 일기 작성 페이지에서 새 일기 작성
2. 일기 목록에서 방금 작성한 일기 클릭
3. AI 분석 결과 확인 (강점, 감정, 성장 영역 등)

## ✅ 완료 조건

1. AI Mock 서비스가 정상 작동
2. 일기 작성 시 자동으로 AI 분석 실행
3. 분석 결과가 의미 있고 다양함
4. Frontend에서 분석 결과 표시
5. 주간 인사이트 생성 가능

## 📝 주의사항

1. **분석 품질**: Mock이지만 실제와 유사한 품질의 분석 제공
2. **성능**: 백그라운드 분석으로 UX 저하 방지
3. **에러 처리**: AI 분석 실패해도 일기 작성은 성공
4. **일관성**: 같은 일기는 항상 같은 분석 결과

## 🔄 다음 단계

### Task 008: UI/UX 개선
1. AI 분석 결과 시각화 개선
2. 주간/월간 대시보드
3. 성장 그래프
4. 포트폴리오 생성 UI

---
작성일: 2024-01-20
작성자: Cushion AI Assistant