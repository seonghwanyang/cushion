import { PrismaClient, Insight, InsightType } from '@prisma/client';
import { IInsightService, WeeklyInsight, PortfolioSummary } from '@/interfaces/services/insight.service.interface';
import { serviceFactory } from '@/factories/service.factory';
import { logger } from '@/utils/logger';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export class InsightService implements IInsightService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, diaryId: string, analysis: any): Promise<Insight> {
    // Extract strength names as strings
    const strengthNames = analysis.strengths?.map((s: any) => 
      typeof s === 'string' ? s : s.name || s.category
    ) || [];
    
    // Extract emotion names as strings
    const emotionNames = analysis.emotions ? 
      (typeof analysis.emotions === 'string' ? [analysis.emotions] :
       analysis.emotions.primary ? [analysis.emotions.primary] :
       Array.isArray(analysis.emotions) ? analysis.emotions : []) : [];

    const insight = await this.prisma.insight.create({
      data: {
        diaryId,
        userId,
        type: InsightType.DAILY,
        content: analysis,
        strengths: strengthNames,
        skills: analysis.skills || { technical: [], soft: [] },
        emotions: emotionNames,
        growthAreas: analysis.growthAreas || [],
        evidence: analysis.evidence || [],
        feedback: analysis.feedback || analysis.insights?.[0] || '',
        confidence: analysis.confidence || 0.7,
        model: 'gpt-4',
        tokensUsed: 1000,
        processingTime: 2000,
      },
    });

    // Mark diary as analyzed
    await this.prisma.diary.update({
      where: { id: diaryId },
      data: { 
        isAnalyzed: true,
        analyzedAt: new Date(),
      },
    });

    logger.info(`Insight created for diary ${diaryId}`);
    return insight;
  }

  async getByDiaryId(diaryId: string): Promise<Insight | null> {
    const insight = await this.prisma.insight.findFirst({
      where: { diaryId },
      orderBy: { createdAt: 'desc' },
    });

    return insight;
  }

  async getLatest(userId: string): Promise<Insight | null> {
    const insight = await this.prisma.insight.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        diary: true,
      },
    });

    return insight;
  }

  async list(userId: string, limit: number = 10): Promise<Insight[]> {
    const insights = await this.prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        diary: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    return insights;
  }

  async getWeeklyInsights(userId: string, targetDate?: Date): Promise<WeeklyInsight> {
    const date = targetDate || new Date();
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    // Get all diaries for the week
    const weekDiaries = await this.prisma.diary.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        insights: true,
      },
    });

    // Get insights for the week
    const weekInsights = await this.prisma.insight.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Calculate consistent strengths
    const strengthFrequency = new Map<string, number>();
    weekInsights.forEach(insight => {
      insight.strengths.forEach(strength => {
        strengthFrequency.set(strength, (strengthFrequency.get(strength) || 0) + 1);
      });
    });

    const consistentStrengths = Array.from(strengthFrequency.entries())
      .filter(([_, count]) => count >= 2) // Appeared at least twice
      .map(([strength, count]) => ({
        strength,
        frequency: count,
        confidence: Math.min(0.9, 0.5 + (count * 0.1)),
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Extract key achievements from evidence
    const keyAchievements: string[] = [];
    weekInsights.forEach(insight => {
      insight.evidence.slice(0, 2).forEach(evidence => {
        if (evidence.length > 20) {
          keyAchievements.push(evidence);
        }
      });
    });

    // Calculate growth progress
    const growthAreas = new Set<string>();
    weekInsights.forEach(insight => {
      insight.growthAreas.forEach(area => growthAreas.add(area));
    });

    const growthProgress = Array.from(growthAreas).map(area => {
      const relevantInsights = weekInsights.filter(i => i.growthAreas.includes(area));
      const progress = Math.min(100, relevantInsights.length * 20);
      
      return {
        area,
        progress,
        trend: progress > 50 ? 'improving' as const : 'stable' as const,
      };
    });

    // Calculate emotional balance
    const emotions = weekDiaries.map(d => d.mood).filter(Boolean);
    const positiveEmotions = ['HAPPY', 'EXCITED', 'GRATEFUL', 'PEACEFUL', 'HOPEFUL'];
    const positiveCount = emotions.filter(e => positiveEmotions.includes(e!)).length;
    const emotionalBalance = emotions.length > 0 ? (positiveCount / emotions.length) * 100 : 50;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (emotionalBalance < 40) {
      recommendations.push('스트레스 관리에 더 신경 쓰시면 좋을 것 같아요. 명상이나 운동을 시도해보세요.');
    }
    
    if (consistentStrengths.length > 0) {
      recommendations.push(`${consistentStrengths[0].strength} 역량이 뛰어나시네요. 이를 활용한 프로젝트를 시작해보는 건 어떨까요?`);
    }
    
    if (weekDiaries.length < 5) {
      recommendations.push('일기를 더 자주 작성하시면 더 정확한 인사이트를 얻을 수 있어요.');
    }

    return {
      weekStart,
      weekEnd,
      totalDiaries: weekDiaries.length,
      analyzedDiaries: weekDiaries.filter(d => d.isAnalyzed).length,
      consistentStrengths,
      keyAchievements: keyAchievements.slice(0, 5),
      growthProgress,
      emotionalBalance,
      recommendations,
    };
  }

  async generateWeeklyInsight(userId: string): Promise<WeeklyInsight> {
    // Get diaries from the past week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const diaries = await this.prisma.diary.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        isAnalyzed: false,
      },
    });

    // Analyze each diary using AI service
    const aiService = serviceFactory.getAIService();
    
    for (const diary of diaries) {
      try {
        const analysis = await aiService.analyzeDiary(diary.content);
        
        // Save insight
        await this.prisma.insight.create({
          data: {
            diaryId: diary.id,
            userId,
            type: InsightType.DAILY,
            content: analysis,
            strengths: analysis.strengths || [],
            skills: analysis.skills || { technical: [], soft: [] },
            emotions: analysis.emotions || [],
            growthAreas: analysis.growthAreas || [],
            evidence: analysis.evidence || [],
            feedback: analysis.feedback || '',
            confidence: analysis.confidence || 0.7,
            model: 'gpt-4',
            tokensUsed: 1000, // Mock value
            processingTime: 2000, // Mock value
          },
        });

        // Mark diary as analyzed
        await this.prisma.diary.update({
          where: { id: diary.id },
          data: { 
            isAnalyzed: true,
            analyzedAt: new Date(),
          },
        });

        logger.info(`Diary ${diary.id} analyzed successfully`);
      } catch (error) {
        logger.error(`Failed to analyze diary ${diary.id}:`, error);
      }
    }

    // Generate weekly insight
    return this.getWeeklyInsights(userId);
  }

  async getPortfolio(userId: string): Promise<PortfolioSummary> {
    // Get all insights for the user
    const insights = await this.prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get user profile
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    // Aggregate strengths
    const strengthMap = new Map<string, { count: number; evidence: string[] }>();
    
    insights.forEach(insight => {
      insight.strengths.forEach((strength, idx) => {
        const existing = strengthMap.get(strength) || { count: 0, evidence: [] };
        existing.count++;
        if (insight.evidence[idx]) {
          existing.evidence.push(insight.evidence[idx]);
        }
        strengthMap.set(strength, existing);
      });
    });

    const topStrengths = Array.from(strengthMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([strength, data]) => ({
        name: strength,
        score: Math.min(100, data.count * 10),
        evidence: data.evidence.slice(0, 3),
      }));

    // Aggregate skills
    const technicalSkills = new Set<string>();
    const softSkills = new Set<string>();

    insights.forEach(insight => {
      const skills = insight.skills as any;
      if (skills?.technical) {
        skills.technical.forEach((skill: string) => technicalSkills.add(skill));
      }
      if (skills?.soft) {
        skills.soft.forEach((skill: string) => softSkills.add(skill));
      }
    });

    // Get recent achievements
    const achievements = insights
      .flatMap(i => i.evidence)
      .filter(e => e.length > 30)
      .slice(0, 10);

    // Generate growth story
    const growthStory = this.generateGrowthStory(insights, profile);

    return {
      userId,
      period: {
        start: insights[insights.length - 1]?.createdAt || new Date(),
        end: insights[0]?.createdAt || new Date(),
      },
      topStrengths,
      skillSummary: {
        technical: Array.from(technicalSkills),
        soft: Array.from(softSkills),
      },
      achievements,
      growthStory,
      totalDiaries: profile?.totalDiaries || insights.length,
      consistency: profile?.currentStreak || 0,
    };
  }

  private generateGrowthStory(insights: Insight[], profile: any): string {
    if (insights.length === 0) {
      return '아직 충분한 데이터가 없습니다. 더 많은 일기를 작성해주세요.';
    }

    const strengths = new Set<string>();
    insights.forEach(i => i.strengths.forEach(s => strengths.add(s)));

    const story = `지난 ${insights.length}개의 일기를 통해 발견한 당신의 이야기입니다. 
    
당신은 ${Array.from(strengths).slice(0, 3).join(', ')} 등의 강점을 보여주셨습니다. 
    
특히 최근에는 ${insights[0].strengths[0] || '성장'}에서 뛰어난 모습을 보이고 있습니다.
    
${profile?.currentSituation ? `${profile.currentSituation}을(를) 준비하시는 과정에서 ` : ''}
꾸준히 성장하고 있는 모습이 인상적입니다.`;

    return story;
  }
}