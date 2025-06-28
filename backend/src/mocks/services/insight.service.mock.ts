import { IInsightService, Insight } from '@/interfaces/services/insight.service.interface';
import { DiaryAnalysis, WeeklyInsight, PortfolioSummary } from '@/interfaces/services/ai.service.interface';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

export class MockInsightService implements IInsightService {
  private insights = new Map<string, Insight>();
  private diaryInsightMap = new Map<string, string>(); // diaryId -> insightId
  private userInsightsMap = new Map<string, Set<string>>(); // userId -> Set<insightId>
  private weeklyInsights = new Map<string, WeeklyInsight[]>(); // userId -> WeeklyInsight[]
  private portfolioSummaries = new Map<string, PortfolioSummary>(); // userId -> PortfolioSummary

  constructor() {
    logger.info('Mock Insight Service initialized');
  }

  async create(
    userId: string,
    diaryId: string,
    analysis: DiaryAnalysis
  ): Promise<Insight> {
    const insight: Insight = {
      id: `mock-insight-${uuidv4()}`,
      userId,
      diaryId,
      analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.insights.set(insight.id, insight);
    this.diaryInsightMap.set(diaryId, insight.id);
    
    if (!this.userInsightsMap.has(userId)) {
      this.userInsightsMap.set(userId, new Set());
    }
    this.userInsightsMap.get(userId)!.add(insight.id);

    logger.info('Created insight', { insightId: insight.id, userId, diaryId });
    return insight;
  }

  async getById(id: string): Promise<Insight | null> {
    return this.insights.get(id) || null;
  }

  async getByDiaryId(diaryId: string): Promise<Insight | null> {
    const insightId = this.diaryInsightMap.get(diaryId);
    if (!insightId) return null;
    return this.insights.get(insightId) || null;
  }

  async getUserInsights(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    insights: Insight[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startDate = options?.startDate;
    const endDate = options?.endDate;

    const userInsightIds = this.userInsightsMap.get(userId) || new Set();
    let userInsights = Array.from(userInsightIds)
      .map(id => this.insights.get(id)!)
      .filter(insight => insight !== undefined);

    // Date filtering
    if (startDate || endDate) {
      userInsights = userInsights.filter(insight => {
        const insightDate = insight.createdAt;
        if (startDate && insightDate < startDate) return false;
        if (endDate && insightDate > endDate) return false;
        return true;
      });
    }

    // Sort by creation date (newest first)
    userInsights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = userInsights.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      insights: userInsights.slice(startIndex, endIndex),
      total,
      page,
      limit,
      totalPages
    };
  }

  async getLatestInsight(userId: string): Promise<Insight | null> {
    const result = await this.getUserInsights(userId, { limit: 1 });
    return result.insights[0] || null;
  }

  async storeWeeklyInsight(
    userId: string,
    weeklyInsight: WeeklyInsight
  ): Promise<WeeklyInsight> {
    if (!this.weeklyInsights.has(userId)) {
      this.weeklyInsights.set(userId, []);
    }
    
    const userWeeklyInsights = this.weeklyInsights.get(userId)!;
    userWeeklyInsights.push(weeklyInsight);
    
    // Keep only last 12 weeks
    if (userWeeklyInsights.length > 12) {
      userWeeklyInsights.shift();
    }

    logger.info('Stored weekly insight', { userId });
    return weeklyInsight;
  }

  async getWeeklyInsights(
    userId: string,
    limit: number = 12
  ): Promise<WeeklyInsight[]> {
    const insights = this.weeklyInsights.get(userId) || [];
    return insights.slice(-limit).reverse(); // Most recent first
  }

  async storePortfolioSummary(
    userId: string,
    portfolio: PortfolioSummary
  ): Promise<PortfolioSummary> {
    this.portfolioSummaries.set(userId, portfolio);
    logger.info('Stored portfolio summary', { userId });
    return portfolio;
  }

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary | null> {
    return this.portfolioSummaries.get(userId) || null;
  }

  async deleteById(id: string): Promise<void> {
    const insight = this.insights.get(id);
    if (!insight) return;

    this.insights.delete(id);
    this.diaryInsightMap.delete(insight.diaryId);
    
    const userInsights = this.userInsightsMap.get(insight.userId);
    if (userInsights) {
      userInsights.delete(id);
    }

    logger.info('Deleted insight', { insightId: id });
  }

  async deleteUserInsights(userId: string): Promise<void> {
    const userInsightIds = this.userInsightsMap.get(userId) || new Set();
    
    for (const insightId of userInsightIds) {
      const insight = this.insights.get(insightId);
      if (insight) {
        this.diaryInsightMap.delete(insight.diaryId);
        this.insights.delete(insightId);
      }
    }

    this.userInsightsMap.delete(userId);
    this.weeklyInsights.delete(userId);
    this.portfolioSummaries.delete(userId);

    logger.info('Deleted all insights for user', { userId });
  }
}