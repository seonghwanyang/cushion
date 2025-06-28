import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';
import { NotFoundError, ForbiddenError } from '@/utils/errors';

// Validation schemas
const createDiarySchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
    mood: z.enum(['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'NEUTRAL', 'EXCITED', 'GRATEFUL', 'STRESSED', 'PEACEFUL', 'HOPEFUL']).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

const updateDiarySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    content: z.string().min(1).max(10000).optional(),
    mood: z.enum(['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'NEUTRAL', 'EXCITED', 'GRATEFUL', 'STRESSED', 'PEACEFUL', 'HOPEFUL']).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

const getDiarySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const listDiariesSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    mood: z.enum(['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'NEUTRAL', 'EXCITED', 'GRATEFUL', 'STRESSED', 'PEACEFUL', 'HOPEFUL']).optional(),
    tags: z.string().optional(), // comma-separated
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }),
});

export class DiaryController {
  private get diaryService() {
    return serviceFactory.getDiaryService();
  }

  private get aiService() {
    return serviceFactory.getAIService();
  }

  private get insightService() {
    return serviceFactory.getInsightService();
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const diary = await this.diaryService.create(userId, req.body);
      
      // Trigger AI analysis in background
      this.analyzeDiaryInBackground(userId, diary);
      
      sendSuccess(res, diary, 201);
    } catch (error) {
      next(error);
    }
  }

  private async analyzeDiaryInBackground(userId: string, diary: any): Promise<void> {
    try {
      // Run analysis without blocking the response
      setImmediate(async () => {
        try {
          const analysis = await this.aiService.analyzeDiary(
            diary.id,
            diary.content,
            diary.mood || 'NEUTRAL',
            diary.tags || []
          );
          
          await this.insightService.create(userId, diary.id, analysis);
          console.log(`AI analysis completed for diary ${diary.id}`);
        } catch (error) {
          console.error(`Failed to analyze diary ${diary.id}:`, error);
          // Don't throw - let the diary creation succeed even if analysis fails
        }
      });
    } catch (error) {
      console.error('Failed to trigger background analysis:', error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const diary = await this.diaryService.findById(id);
      
      if (!diary) {
        throw new NotFoundError('Diary not found');
      }
      
      // Check authorization
      if (diary.userId !== userId) {
        throw new ForbiddenError('Not authorized to view this diary');
      }
      
      // Try to get insight for this diary
      const insight = await this.insightService.getByDiaryId(id);
      
      const response = {
        ...diary,
        insight: insight?.analysis || null
      };
      
      sendSuccess(res, response);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, mood, tags, page, limit } = req.query as any;
      
      const filter = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        mood,
        tags: tags ? tags.split(',') : undefined,
      };
      
      const diaries = await this.diaryService.findByUser(userId, filter);
      
      // Pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedDiaries = diaries.slice(start, end);
      
      sendSuccess(res, paginatedDiaries, 200, {
        page,
        totalPages: Math.ceil(diaries.length / limit),
        totalCount: diaries.length,
        hasNext: end < diaries.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const diary = await this.diaryService.update(id, userId, req.body);
      
      sendSuccess(res, diary);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await this.diaryService.delete(id, userId);
      
      sendSuccess(res, { message: '일기가 삭제되었습니다' });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const totalCount = await this.diaryService.count(userId);
      const diaries = await this.diaryService.findByUser(userId);
      
      // Mood statistics
      const moodStats = diaries.reduce((acc, diary) => {
        if (diary.mood) {
          acc[diary.mood] = (acc[diary.mood] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Tag statistics
      const tagStats = diaries.reduce((acc, diary) => {
        diary.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      sendSuccess(res, {
        totalCount,
        moodStats,
        tagStats,
        lastDiaryDate: diaries[0]?.createdAt || null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const diaryController = new DiaryController();
export { createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema };