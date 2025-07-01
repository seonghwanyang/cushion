import { PrismaClient, Diary, Prisma } from '@prisma/client';
import { IDiaryService, CreateDiaryInput, UpdateDiaryInput, DiaryListOptions, DiaryListResult, DiaryStats } from '@/interfaces/services/diary.service.interface';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class DiaryService implements IDiaryService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, input: CreateDiaryInput): Promise<Diary> {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        logger.error(`User not found: ${userId}`);
        throw new Error(`User not found: ${userId}`);
      }
      
      const diary = await this.prisma.diary.create({
        data: {
          userId,
          content: input.content,
          mood: input.mood,
          tags: input.tags || [],
        },
      });

      logger.info(`Diary created: ${diary.id} for user: ${userId}`);
      return diary;
    } catch (error) {
      logger.error('Failed to create diary:', error);
      throw error;
    }
  }

  async findById(id: string, userId: string): Promise<Diary> {
    const diary = await this.prisma.diary.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!diary) {
      throw new NotFoundError('Diary not found');
    }

    return diary;
  }

  async findByUser(userId: string, filter?: any): Promise<Diary[]> {
    const where: Prisma.DiaryWhereInput = {
      userId,
      ...(filter?.startDate && { createdAt: { gte: filter.startDate } }),
      ...(filter?.endDate && { createdAt: { lte: filter.endDate } }),
      ...(filter?.mood && { mood: filter.mood }),
      ...(filter?.tags && filter.tags.length > 0 && { tags: { hasSome: filter.tags } }),
    };

    return await this.prisma.diary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async list(userId: string, options?: DiaryListOptions): Promise<DiaryListResult> {
    const page = Number(options?.page) || 1;
    const limit = Number(options?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DiaryWhereInput = {
      userId,
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && { createdAt: { lte: options.endDate } }),
      ...(options?.mood && { mood: options.mood }),
      ...(options?.tags && options.tags.length > 0 && { tags: { hasSome: options.tags } }),
      ...(options?.isAnalyzed !== undefined && { isAnalyzed: options.isAnalyzed }),
    };

    const [data, total] = await Promise.all([
      this.prisma.diary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.diary.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary> {
    // First check if diary exists and belongs to user
    await this.findById(id, userId);

    const diary = await this.prisma.diary.update({
      where: { id },
      data: {
        ...(input.content && { content: input.content }),
        ...(input.mood && { mood: input.mood }),
        ...(input.tags && { tags: input.tags }),
      },
    });

    logger.info(`Diary updated: ${diary.id}`);
    return diary;
  }

  async delete(id: string, userId: string): Promise<void> {
    // First check if diary exists and belongs to user
    await this.findById(id, userId);

    await this.prisma.diary.delete({
      where: { id },
    });

    logger.info(`Diary deleted: ${id}`);
  }

  async count(userId: string): Promise<number> {
    return await this.prisma.diary.count({
      where: { userId },
    });
  }

  async getStats(userId: string): Promise<DiaryStats> {
    const [totalCount, currentStreak, analyzedCount, moodCounts] = await Promise.all([
      // Total count
      this.prisma.diary.count({ where: { userId } }),
      
      // Current streak (simplified - counts consecutive days from today)
      this.calculateCurrentStreak(userId),
      
      // Analyzed count
      this.prisma.diary.count({ where: { userId, isAnalyzed: true } }),
      
      // Mood distribution
      this.prisma.diary.groupBy({
        by: ['mood'],
        where: { userId },
        _count: true,
      }),
    ]);

    // Get recent insights
    const recentInsights = await this.prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        strengths: true,
        createdAt: true,
      },
    });

    // Calculate strength distribution
    const strengthMap = new Map<string, number>();
    recentInsights.forEach(insight => {
      insight.strengths.forEach(strength => {
        strengthMap.set(strength, (strengthMap.get(strength) || 0) + 1);
      });
    });

    const strengthDistribution = Array.from(strengthMap.entries())
      .map(([strength, count]) => ({ strength, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate emotion trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDiaries = await this.prisma.diary.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        mood: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        mood: true,
        createdAt: true,
      },
    });

    const emotionTrend = recentDiaries.map(diary => ({
      date: diary.createdAt.toISOString().split('T')[0],
      mood: diary.mood!,
      value: this.getMoodValue(diary.mood!),
    }));

    // Calculate mood distribution
    const moodDistribution = moodCounts.reduce((acc, item) => {
      if (item.mood) {
        acc[item.mood] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get total strengths and growth score from profile
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        totalDiaries: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    const totalStrengths = strengthDistribution.reduce((sum, s) => sum + s.count, 0);
    const growthScore = Math.min(100, Math.round(
      (totalCount * 0.3) + 
      (currentStreak * 2) + 
      (totalStrengths * 0.5) + 
      (analyzedCount * 0.2)
    ));

    return {
      totalCount,
      currentStreak,
      longestStreak: profile?.longestStreak || currentStreak,
      totalStrengths,
      growthScore,
      moodDistribution,
      strengthDistribution,
      emotionTrend,
    };
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    const diaries = await this.prisma.diary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (diaries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < diaries.length; i++) {
      const diaryDate = new Date(diaries[i].createdAt);
      diaryDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (diaryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (diaryDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  private getMoodValue(mood: string): number {
    const moodValues: Record<string, number> = {
      HAPPY: 8,
      EXCITED: 9,
      GRATEFUL: 9,
      PEACEFUL: 7,
      HOPEFUL: 8,
      NEUTRAL: 5,
      ANXIOUS: 3,
      SAD: 2,
      ANGRY: 2,
      STRESSED: 3,
    };
    return moodValues[mood] || 5;
  }
}