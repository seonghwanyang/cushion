import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';
import { NotFoundError } from '@/utils/errors';

// Validation schemas
const getWeeklyInsightsSchema = z.object({
  query: z.object({
    weeks: z.string().transform(Number).optional().default('4'),
  }),
});

const generateWeeklyInsightSchema = z.object({
  body: z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
  }),
});

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
      const insight = await this.insightService.getLatestInsight(userId);
      
      if (!insight) {
        throw new NotFoundError('No insights found');
      }
      
      sendSuccess(res, insight);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await this.insightService.getUserInsights(userId, {
        page: Number(page),
        limit: Number(limit),
      });
      
      sendSuccess(res, result.insights, 200, {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { weeks = 4 } = req.query as any;
      
      const insights = await this.insightService.getWeeklyInsights(userId, Number(weeks));
      
      sendSuccess(res, insights);
    } catch (error) {
      next(error);
    }
  }

  async generateWeeklyInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.body;
      
      const weeklyInsight = await this.aiService.generateWeeklyInsight(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
      
      const stored = await this.insightService.storeWeeklyInsight(userId, weeklyInsight);
      
      sendSuccess(res, stored, 201);
    } catch (error) {
      next(error);
    }
  }

  async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      let portfolio = await this.insightService.getPortfolioSummary(userId);
      
      if (!portfolio) {
        // Generate portfolio if it doesn't exist
        portfolio = await this.aiService.generatePortfolioSummary(userId);
        await this.insightService.storePortfolioSummary(userId, portfolio);
      }
      
      sendSuccess(res, portfolio);
    } catch (error) {
      next(error);
    }
  }
}

export const insightController = new InsightController();
export { getWeeklyInsightsSchema, generateWeeklyInsightSchema };