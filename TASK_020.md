# TASK_020: AI 분석 서비스 구현

## 🎯 목표
사용자의 일기를 분석하여 감정, 강점, 성장 포인트를 추출하고 개인화된 피드백 제공

## 🏗️ AI 서비스 아키텍처

### 1. 기본 구조
```
일기 작성 → AI 분석 요청 → 분석 결과 저장 → 사용자에게 인사이트 제공
```

### 2. OpenAI API 설정

#### 2-1. 환경 변수
```env
# backend/.env.local
USE_MOCK_AI=false
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini  # 비용 효율적
OPENAI_MAX_TOKENS=1000
```

#### 2-2. AI 서비스 구현
**파일**: `backend/src/services/ai.service.ts`
```typescript
import OpenAI from 'openai';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class AIService implements IAIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  
  async analyzeDiary(
    diaryId: string,
    content: string,
    mood: string,
    tags: string[]
  ): Promise<AIAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(content, mood, tags);
      
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 사용자의 일기를 분석하여 강점과 성장 포인트를 찾아주는 전문 심리 상담사입니다.
            
            분석 시 다음 사항을 포함해주세요:
            1. 감정 분석: 일기에서 드러나는 주요 감정들
            2. 강점 발견: 일기에서 발견되는 사용자의 강점 (최대 5개)
            3. 성장 영역: 발전 가능한 영역
            4. 구체적 증거: 강점을 뒷받침하는 일기 내용 인용
            5. 따뜻한 피드백: 격려와 응원의 메시지
            
            응답은 반드시 JSON 형식으로 해주세요.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const analysis = JSON.parse(completion.choices[0].message.content!);
      
      return {
        diaryId,
        emotions: analysis.emotions || [],
        strengths: analysis.strengths || [],
        growthAreas: analysis.growthAreas || [],
        evidence: analysis.evidence || [],
        feedback: analysis.feedback || '',
        skills: {
          technical: analysis.technicalSkills || [],
          soft: analysis.softSkills || [],
        },
        confidence: 0.85,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      logger.error('AI analysis failed:', error);
      throw error;
    }
  }
  
  private buildAnalysisPrompt(content: string, mood: string, tags: string[]): string {
    return `
    일기 내용: "${content}"
    오늘의 기분: ${mood}
    태그: ${tags.join(', ')}
    
    위 일기를 분석하여 다음 형식의 JSON으로 응답해주세요:
    {
      "emotions": ["감정1", "감정2", ...],
      "strengths": ["강점1", "강점2", ...],
      "growthAreas": ["성장영역1", "성장영역2", ...],
      "evidence": ["강점을 보여주는 구체적 증거1", ...],
      "feedback": "사용자에게 전하는 따뜻하고 구체적인 피드백",
      "technicalSkills": ["기술적 역량1", ...],
      "softSkills": ["소프트 스킬1", ...]
    }
    `;
  }
}
```

### 3. 프롬프트 엔지니어링 전략

#### 3-1. 페르소나 설정
```typescript
const ANALYST_PERSONA = `
당신은 10년 경력의 심리상담사이자 커리어 코치입니다.
- 따뜻하고 공감적인 태도
- 구체적이고 실용적인 조언
- 긍정적이면서도 현실적인 피드백
- 한국 문화와 정서를 이해
`;
```

#### 3-2. Few-shot 예시
```typescript
const ANALYSIS_EXAMPLES = `
예시 1:
일기: "오늘 팀 미팅에서 새로운 아이디어를 제안했는데 다들 좋아해줬다."
강점: ["창의성", "소통능력", "리더십"]
증거: ["새로운 아이디어를 제안" - 창의성과 주도성을 보여줌]

예시 2:
일기: "어려운 버그를 3시간 만에 해결했다. 포기하지 않아서 다행이다."
강점: ["문제해결능력", "끈기", "기술력"]
증거: ["포기하지 않아서" - 인내심과 끈기를 보여줌]
`;
```

### 4. 비용 최적화

#### 4-1. 캐싱 전략
```typescript
// 유사한 일기는 캐싱된 분석 결과 활용
const cacheKey = crypto.createHash('md5')
  .update(content.toLowerCase().trim())
  .digest('hex');
```

#### 4-2. 배치 처리
```typescript
// 여러 일기를 한 번에 분석 (토큰 절약)
async analyzeBatch(diaries: Diary[]): Promise<AIAnalysis[]> {
  // 구현
}
```

### 5. 분석 결과 활용

#### 5-1. Dashboard 통계
- 주간/월간 강점 트렌드
- 감정 변화 그래프
- 성장 영역 추적

#### 5-2. 개인화된 리포트
```typescript
// 주간 리포트 생성
async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const diaries = await this.getDiariesForWeek(userId);
  const analyses = await this.getAnalysesForDiaries(diaries);
  
  return {
    dominantStrengths: this.extractDominantStrengths(analyses),
    emotionTrend: this.calculateEmotionTrend(analyses),
    growthProgress: this.measureGrowthProgress(analyses),
    personalizedAdvice: await this.generateAdvice(analyses),
  };
}
```

### 6. 구현 순서

1. **Phase 1: 기본 분석** (1-2일)
   - OpenAI API 연동
   - 단일 일기 분석
   - 결과 저장

2. **Phase 2: 고도화** (2-3일)
   - 프롬프트 최적화
   - 배치 처리
   - 캐싱 구현

3. **Phase 3: 인사이트** (2-3일)
   - 주간/월간 리포트
   - 성장 추적
   - 개인화 추천

## 💰 예상 비용

| 모델 | 입력 가격 | 출력 가격 | 월 예상 비용 (1000명) |
|------|-----------|-----------|---------------------|
| GPT-4o-mini | $0.15/1M | $0.6/1M | ~$30-50 |
| GPT-3.5-turbo | $0.5/1M | $1.5/1M | ~$100-150 |
| GPT-4o | $2.5/1M | $10/1M | ~$500-800 |

**추천**: GPT-4o-mini로 시작, 필요시 업그레이드

---

**작성일**: 2025-01-29
**우선순위**: 🔥🔥 높음
**예상 소요시간**: 5-7일