import { DiaryAnalysis, WeeklyInsight, PortfolioSummary } from './ai.service.interface';

export interface Insight {
  id: string;
  userId: string;
  diaryId: string;
  analysis: DiaryAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsightService {
  // Create and store a new insight
  create(
    userId: string,
    diaryId: string,
    analysis: DiaryAnalysis
  ): Promise<Insight>;

  // Get insight by ID
  getById(id: string): Promise<Insight | null>;

  // Get insight by diary ID
  getByDiaryId(diaryId: string): Promise<Insight | null>;

  // Get all insights for a user
  getUserInsights(
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
  }>;

  // Get the latest insight for a user
  getLatestInsight(userId: string): Promise<Insight | null>;

  // Store weekly insight
  storeWeeklyInsight(
    userId: string,
    weeklyInsight: WeeklyInsight
  ): Promise<WeeklyInsight>;

  // Get weekly insights for a user
  getWeeklyInsights(
    userId: string,
    limit?: number
  ): Promise<WeeklyInsight[]>;

  // Store portfolio summary
  storePortfolioSummary(
    userId: string,
    portfolio: PortfolioSummary
  ): Promise<PortfolioSummary>;

  // Get portfolio summary for a user
  getPortfolioSummary(userId: string): Promise<PortfolioSummary | null>;

  // Delete insight by ID
  deleteById(id: string): Promise<void>;

  // Delete all insights for a user
  deleteUserInsights(userId: string): Promise<void>;
}