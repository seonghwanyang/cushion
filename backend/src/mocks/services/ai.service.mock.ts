import { IAIService, DiaryAnalysis, StrengthAnalysis, EmotionAnalysis, WeeklyInsight, PortfolioSummary } from '@/interfaces/services/ai.service.interface';
import { MoodType } from '@prisma/client';
import { logger } from '@/utils/logger';

export class MockAIService implements IAIService {
  // 강점 키워드 매핑
  private strengthKeywords = {
    technical: {
      name: '기술적 문제해결',
      keywords: ['해결', '구현', '개발', '코딩', '프로그래밍', '버그', '수정', '최적화', '알고리즘', '시스템', '기술', '완성', '배포', '테스트'],
      evidence: '기술적 과제를 체계적으로 해결하는 능력을 보여주었습니다'
    },
    soft_skills: {
      name: '대인관계 및 소통',
      keywords: ['소통', '대화', '협업', '팀', '동료', '친구', '가족', '이해', '공감', '경청', '도움', '지원', '함께', '나눔'],
      evidence: '타인과의 관계에서 긍정적인 소통 능력을 발휘했습니다'
    },
    leadership: {
      name: '리더십과 주도성',
      keywords: ['주도', '리드', '결정', '계획', '목표', '비전', '책임', '이끌', '제안', '추진', '기획', '전략', '관리', '조직'],
      evidence: '주도적으로 상황을 이끌어가는 리더십을 보여주었습니다'
    },
    creative: {
      name: '창의성과 혁신',
      keywords: ['창의', '아이디어', '새로운', '혁신', '창작', '예술', '디자인', '상상', '독창', '영감', '브레인스토밍', '발견', '시도'],
      evidence: '창의적인 사고와 새로운 시도를 통해 혁신을 추구했습니다'
    },
    analytical: {
      name: '분석적 사고',
      keywords: ['분석', '파악', '이해', '검토', '평가', '판단', '논리', '근거', '데이터', '통찰', '깊이', '고민', '성찰', '비교'],
      evidence: '체계적이고 논리적인 분석 능력을 보여주었습니다'
    }
  };

  // 감정 키워드 매핑
  private emotionKeywords = {
    positive: ['기쁨', '행복', '즐거움', '만족', '뿌듯', '감사', '희망', '설렘', '평화', '안정', '성취', '자신감', '편안'],
    negative: ['슬픔', '우울', '불안', '걱정', '스트레스', '화', '짜증', '실망', '후회', '외로움', '피곤', '답답', '막막']
  };

  // 성장 영역 매핑
  private growthAreas = {
    timeManagement: {
      keywords: ['바쁜', '시간', '늦', '서두르', '급하', '미루'],
      area: '시간 관리',
      suggestion: '일정 관리와 우선순위 설정을 통해 더 효율적인 시간 활용이 가능합니다'
    },
    stressManagement: {
      keywords: ['스트레스', '압박', '부담', '힘들', '지친', '피곤'],
      area: '스트레스 관리',
      suggestion: '적절한 휴식과 이완 기법을 통해 스트레스를 효과적으로 관리할 수 있습니다'
    },
    communication: {
      keywords: ['오해', '갈등', '말', '표현', '전달', '소통'],
      area: '커뮤니케이션',
      suggestion: '명확한 의사 표현과 적극적 경청을 통해 소통 능력을 향상시킬 수 있습니다'
    },
    selfCare: {
      keywords: ['피곤', '지친', '무기력', '의욕', '건강', '운동'],
      area: '자기 관리',
      suggestion: '규칙적인 생활 습관과 자기 돌봄을 통해 전반적인 삶의 질을 높일 수 있습니다'
    },
    goalSetting: {
      keywords: ['목표', '방향', '막막', '불확실', '계획', '미래'],
      area: '목표 설정',
      suggestion: '구체적이고 달성 가능한 목표 설정을 통해 동기부여와 성취감을 높일 수 있습니다'
    }
  };

  async analyzeDiary(
    diaryId: string,
    content: string,
    mood: MoodType,
    tags: string[]
  ): Promise<DiaryAnalysis> {
    logger.info('Starting AI analysis for diary', { diaryId });
    
    // 시뮬레이션 딜레이
    await this.simulateDelay(500);

    const strengths = this.analyzeStrengths(content, tags);
    const emotions = this.analyzeEmotions(content, mood);
    const keywords = await this.extractKeywords(content);
    const sentiment = this.analyzeSentiment(content, mood);
    const growthAreas = this.identifyGrowthAreas(content);
    const insights = this.generateInsights(strengths, emotions, growthAreas, mood);

    const analysis: DiaryAnalysis = {
      diaryId,
      strengths,
      emotions,
      keywords,
      sentiment,
      growthAreas: growthAreas.map(g => g.area),
      insights,
      analyzedAt: new Date()
    };

    logger.info('AI analysis completed', { 
      diaryId, 
      strengthsCount: strengths.length,
      sentiment 
    });

    return analysis;
  }

  private analyzeStrengths(content: string, tags: string[]): StrengthAnalysis[] {
    const strengths: StrengthAnalysis[] = [];
    const combinedText = `${content} ${tags.join(' ')}`.toLowerCase();

    for (const [category, data] of Object.entries(this.strengthKeywords)) {
      const matchCount = data.keywords.filter(keyword => 
        combinedText.includes(keyword)
      ).length;

      if (matchCount > 0) {
        strengths.push({
          category: category as any,
          name: data.name,
          evidence: data.evidence,
          confidence: Math.min(75 + (matchCount * 5), 95)
        });
      }
    }

    // 최대 3개의 강점만 반환 (confidence 높은 순)
    return strengths
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  private analyzeEmotions(content: string, mood: MoodType): EmotionAnalysis {
    const lowerContent = content.toLowerCase();
    
    // 무드 기반 주요 감정 매핑
    const moodEmotionMap: Record<MoodType, string> = {
      HAPPY: '기쁨',
      SAD: '슬픔',
      ANGRY: '분노',
      ANXIOUS: '불안',
      NEUTRAL: '평온',
      EXCITED: '흥분',
      GRATEFUL: '감사',
      STRESSED: '스트레스',
      PEACEFUL: '평화',
      HOPEFUL: '희망'
    };

    const primary = moodEmotionMap[mood] || '평온';
    
    // 부가 감정 찾기
    const secondary: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;

    this.emotionKeywords.positive.forEach(keyword => {
      if (lowerContent.includes(keyword) && keyword !== primary) {
        secondary.push(keyword);
        positiveCount++;
      }
    });

    this.emotionKeywords.negative.forEach(keyword => {
      if (lowerContent.includes(keyword) && keyword !== primary) {
        secondary.push(keyword);
        negativeCount++;
      }
    });

    // 감정 강도 계산
    const totalEmotions = positiveCount + negativeCount + 1;
    const intensity = Math.min(50 + (totalEmotions * 10), 90);

    return {
      primary,
      secondary: secondary.slice(0, 3),
      intensity
    };
  }

  async extractKeywords(content: string): Promise<string[]> {
    // 간단한 키워드 추출 로직
    const words = content
      .split(/[\s,.:;!?]+/)
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase());

    // 빈도수 계산
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // 불용어 제거 (간단한 한국어 불용어)
    const stopWords = ['그리고', '하지만', '그러나', '그래서', '왜냐하면', '오늘', '내가', '나는', '있다', '없다', '하다', '되다'];
    
    // 빈도수 높은 순으로 정렬하고 불용어 제거
    return Array.from(wordFreq.entries())
      .filter(([word]) => !stopWords.includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private analyzeSentiment(content: string, mood: MoodType): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const lowerContent = content.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // 긍정 키워드 점수
    this.emotionKeywords.positive.forEach(keyword => {
      if (lowerContent.includes(keyword)) positiveScore++;
    });

    // 부정 키워드 점수
    this.emotionKeywords.negative.forEach(keyword => {
      if (lowerContent.includes(keyword)) negativeScore++;
    });

    // 무드도 고려
    const positiveMoods: MoodType[] = ['HAPPY', 'EXCITED', 'GRATEFUL', 'PEACEFUL', 'HOPEFUL'];
    const negativeMoods: MoodType[] = ['SAD', 'ANGRY', 'ANXIOUS', 'STRESSED'];

    if (positiveMoods.includes(mood)) positiveScore += 2;
    if (negativeMoods.includes(mood)) negativeScore += 2;

    // 감정 판단
    if (positiveScore > 0 && negativeScore > 0) return 'mixed';
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private identifyGrowthAreas(content: string): Array<{ area: string; suggestion: string }> {
    const lowerContent = content.toLowerCase();
    const areas: Array<{ area: string; suggestion: string }> = [];

    for (const [key, data] of Object.entries(this.growthAreas)) {
      const hasKeyword = data.keywords.some(keyword => lowerContent.includes(keyword));
      if (hasKeyword) {
        areas.push({
          area: data.area,
          suggestion: data.suggestion
        });
      }
    }

    return areas.slice(0, 2); // 최대 2개
  }

  private generateInsights(
    strengths: StrengthAnalysis[],
    emotions: EmotionAnalysis,
    growthAreas: Array<{ area: string; suggestion: string }>,
    mood: MoodType
  ): string[] {
    const insights: string[] = [];

    // 강점 기반 인사이트
    if (strengths.length > 0) {
      const topStrength = strengths[0];
      insights.push(
        `오늘 ${topStrength.name} 영역에서 뛰어난 역량을 보여주셨네요. 이러한 강점을 계속 발전시켜 나가세요.`
      );
    }

    // 감정 기반 인사이트
    if (emotions.intensity > 70) {
      insights.push(
        `감정의 강도가 높은 하루였군요. ${emotions.primary}의 감정을 충분히 느끼고 표현하는 것은 건강한 감정 관리의 시작입니다.`
      );
    }

    // 성장 영역 기반 인사이트
    if (growthAreas.length > 0) {
      insights.push(growthAreas[0].suggestion);
    }

    // 무드별 격려 메시지
    const moodMessages: Partial<Record<MoodType, string>> = {
      HAPPY: '긍정적인 에너지가 느껴지네요. 이런 좋은 기운을 주변과 나누어보세요.',
      SAD: '힘든 감정을 인정하고 표현하는 것도 용기입니다. 내일은 더 나은 날이 될 거예요.',
      ANXIOUS: '불안한 마음을 일기로 표현하신 것만으로도 큰 걸음입니다. 심호흡하고 한 걸음씩 나아가세요.',
      STRESSED: '스트레스를 인지하는 것이 관리의 첫걸음입니다. 잠시 휴식을 취해보는 건 어떨까요?',
      GRATEFUL: '감사하는 마음은 행복을 배가시킵니다. 이런 긍정적인 시각을 유지하세요.',
      EXCITED: '열정이 느껴지는 하루네요! 이 에너지를 목표 달성에 활용해보세요.',
      PEACEFUL: '내면의 평화를 찾으신 것 같아 좋네요. 이런 평온함을 자주 느끼시길 바랍니다.',
      HOPEFUL: '희망은 미래를 밝게 만드는 원동력입니다. 그 희망을 현실로 만들어가세요.'
    };

    if (moodMessages[mood]) {
      insights.push(moodMessages[mood]!);
    }

    return insights;
  }

  async generateWeeklyInsight(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyInsight> {
    logger.info('Generating weekly insight', { userId, startDate, endDate });
    
    // Mock 데이터 생성
    const moods: MoodType[] = ['HAPPY', 'GRATEFUL', 'PEACEFUL', 'NEUTRAL', 'ANXIOUS'];
    const dominantMoods = moods.slice(0, 3);
    
    const topStrengths: StrengthAnalysis[] = [
      {
        category: 'technical',
        name: '기술적 문제해결',
        evidence: '이번 주 여러 기술적 과제를 성공적으로 해결했습니다',
        confidence: 88
      },
      {
        category: 'soft_skills',
        name: '대인관계 및 소통',
        evidence: '팀원들과의 원활한 소통으로 프로젝트를 진행했습니다',
        confidence: 82
      }
    ];

    const emotionalPattern = dominantMoods.map((mood, index) => ({
      mood,
      count: 3 - index,
      percentage: (3 - index) * 20
    }));

    return {
      userId,
      weekStartDate: startDate,
      weekEndDate: endDate,
      diaryCount: 5,
      dominantMoods,
      topStrengths,
      emotionalPattern,
      weeklyThemes: ['성장', '도전', '협업', '성취'],
      recommendations: [
        '이번 주 보여주신 기술적 문제해결 능력을 계속 발전시켜보세요',
        '긍정적인 감정 상태를 유지하고 있어 좋습니다',
        '규칙적인 일기 작성을 통해 자기 성찰을 지속하세요'
      ],
      createdAt: new Date()
    };
  }

  async generatePortfolioSummary(userId: string): Promise<PortfolioSummary> {
    logger.info('Generating portfolio summary', { userId });

    return {
      userId,
      totalDiaries: 25,
      topStrengths: [
        {
          strength: {
            category: 'technical',
            name: '기술적 문제해결',
            evidence: '지속적으로 기술적 과제를 해결하는 능력을 보여주었습니다',
            confidence: 90
          },
          frequency: 15
        },
        {
          strength: {
            category: 'creative',
            name: '창의성과 혁신',
            evidence: '새로운 아이디어와 접근법을 자주 제시했습니다',
            confidence: 85
          },
          frequency: 12
        }
      ],
      growthJourney: [
        {
          month: '2024-01',
          strengths: ['문제해결', '창의성'],
          improvements: ['시간관리', '스트레스 관리']
        }
      ],
      consistentThemes: ['성장', '학습', '도전', '협업'],
      personalityTraits: ['분석적', '창의적', '주도적', '긍정적']
    };
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}