import { IDiaryService, CreateDiaryInput, UpdateDiaryInput, DiaryFilter, DiaryListOptions, DiaryListResult, DiaryStats } from '@/interfaces/services/diary.service.interface';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import type { Diary } from '@prisma/client';
import { mockDiaries, generateMockDiaries } from '../data/diaries.mock';
import { logger } from '@/utils/logger';

export class MockDiaryService implements IDiaryService {
  private diaries = new Map<string, Diary>();
  private userDiaries = new Map<string, Set<string>>();

  constructor() {
    this.initializeMockData();
    logger.info('Mock Diary Service initialized with sample data');
  }

  private initializeMockData(): void {
    // Load default mock data
    mockDiaries.forEach(diary => {
      this.diaries.set(diary.id, { ...diary });
      this.addToUserDiaries(diary.userId, diary.id);
    });

    // Generate additional mock data for mock-user-1
    const additionalDiaries = generateMockDiaries('mock-user-1', 10);
    additionalDiaries.forEach(diary => {
      this.diaries.set(diary.id, diary);
      this.addToUserDiaries(diary.userId, diary.id);
    });

    logger.info(`Initialized ${this.diaries.size} mock diaries`);
  }

  private addToUserDiaries(userId: string, diaryId: string): void {
    if (!this.userDiaries.has(userId)) {
      this.userDiaries.set(userId, new Set());
    }
    this.userDiaries.get(userId)!.add(diaryId);
  }

  async create(userId: string, input: CreateDiaryInput): Promise<Diary> {
    await this.simulateDelay();

    const diary: Diary = {
      id: `mock-diary-${uuidv4()}`,
      userId,
      content: input.content,
      mood: input.mood || 'NEUTRAL',
      tags: input.tags || [],
      isAnalyzed: false,
      analyzedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.diaries.set(diary.id, diary);
    this.addToUserDiaries(userId, diary.id);

    // Simulate random error in development mode (10% chance)
    if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
      throw new Error('Mock error: Failed to create diary');
    }

    logger.info(`Created mock diary ${diary.id} for user ${userId}`);
    return diary;
  }

  async findById(id: string, userId: string): Promise<Diary> {
    await this.simulateDelay();
    const diary = this.diaries.get(id);
    
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }
    
    if (diary.userId !== userId) {
      throw new ForbiddenError('Not authorized to view this diary');
    }
    
    return diary;
  }

  async findByUser(userId: string, filter?: DiaryFilter): Promise<Diary[]> {
    await this.simulateDelay();

    const userDiaryIds = this.userDiaries.get(userId) || new Set();
    let diaries = Array.from(userDiaryIds)
      .map(id => this.diaries.get(id)!)
      .filter(diary => diary !== undefined);

    // Apply filters
    if (filter) {
      if (filter.startDate) {
        diaries = diaries.filter(d => d.createdAt >= filter.startDate!);
      }
      if (filter.endDate) {
        diaries = diaries.filter(d => d.createdAt <= filter.endDate!);
      }
      if (filter.mood) {
        diaries = diaries.filter(d => d.mood === filter.mood);
      }
      if (filter.tags && filter.tags.length > 0) {
        diaries = diaries.filter(d => 
          filter.tags!.some(tag => d.tags.includes(tag))
        );
      }
    }

    // Sort by creation date (newest first)
    return diaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async list(userId: string, options?: DiaryListOptions): Promise<DiaryListResult> {
    await this.simulateDelay();
    const page = Number(options?.page) || 1;
    const limit = Number(options?.limit) || 10;
    const skip = (page - 1) * limit;

    const userDiaryIds = this.userDiaries.get(userId) || new Set();
    let diaries = Array.from(userDiaryIds)
      .map(id => this.diaries.get(id))
      .filter(diary => diary !== undefined);

    // Apply filters
    if (options?.startDate) {
      diaries = diaries.filter(d => d.createdAt >= options.startDate!);
    }
    if (options?.endDate) {
      diaries = diaries.filter(d => d.createdAt <= options.endDate!);
    }
    if (options?.mood) {
      diaries = diaries.filter(d => d.mood === options.mood);
    }
    if (options?.tags && options.tags.length > 0) {
      diaries = diaries.filter(d => 
        options.tags!.some(tag => d.tags.includes(tag))
      );
    }
    if (options?.isAnalyzed !== undefined) {
      diaries = diaries.filter(d => d.isAnalyzed === options.isAnalyzed);
    }

    // Sort by creation date (newest first)
    diaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = diaries.length;
    const paginatedDiaries = diaries.slice(skip, skip + limit);

    return {
      data: paginatedDiaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary> {
    await this.simulateDelay();

    const diary = this.diaries.get(id);
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }

    if (diary.userId !== userId) {
      throw new ForbiddenError('You can only update your own diaries');
    }

    const updatedDiary: Diary = {
      ...diary,
      content: input.content ?? diary.content,
      mood: input.mood ?? diary.mood,
      tags: input.tags ?? diary.tags,
      updatedAt: new Date(),
    };

    this.diaries.set(id, updatedDiary);
    return updatedDiary;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.simulateDelay();

    const diary = this.diaries.get(id);
    if (!diary) {
      throw new NotFoundError('Diary not found');
    }

    if (diary.userId !== userId) {
      throw new ForbiddenError('You can only delete your own diaries');
    }

    // Delete from maps
    this.diaries.delete(id);
    this.userDiaries.get(userId)?.delete(id);

    logger.info(`Deleted diary ${id} for user ${userId}`);
  }

  async count(userId: string): Promise<number> {
    await this.simulateDelay();
    const userDiaryIds = this.userDiaries.get(userId) || new Set();
    let count = 0;
    
    userDiaryIds.forEach(id => {
      const diary = this.diaries.get(id);
      if (diary) {
        count++;
      }
    });
    
    return count;
  }

  async getStats(userId: string): Promise<DiaryStats> {
    await this.simulateDelay();
    const userDiaryIds = this.userDiaries.get(userId) || new Set();
    const diaries = Array.from(userDiaryIds).map(id => this.diaries.get(id)).filter(d => d !== undefined);
    
    // Calculate total count
    const totalCount = diaries.length;
    
    // Calculate current streak (simplified)
    const currentStreak = Math.min(totalCount, 7);
    const longestStreak = Math.max(currentStreak, Math.min(totalCount, 14));
    
    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {};
    diaries.forEach(diary => {
      if (diary.mood) {
        moodDistribution[diary.mood] = (moodDistribution[diary.mood] || 0) + 1;
      }
    });
    
    // Mock strength distribution
    const strengthDistribution = [
      { strength: 'Problem Solving', count: 8 },
      { strength: 'Communication', count: 6 },
      { strength: 'Leadership', count: 4 },
      { strength: 'Creativity', count: 3 },
    ];
    
    // Mock emotion trend
    const emotionTrend = diaries.slice(0, 7).map((diary, index) => ({
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mood: diary.mood || 'NEUTRAL',
      value: 5 + Math.floor(Math.random() * 5),
    }));
    
    const totalStrengths = strengthDistribution.reduce((sum, s) => sum + s.count, 0);
    const growthScore = Math.min(100, Math.round(
      (totalCount * 0.3) + 
      (currentStreak * 2) + 
      (totalStrengths * 0.5)
    ));
    
    return {
      totalCount,
      currentStreak,
      longestStreak,
      totalStrengths,
      growthScore,
      moodDistribution,
      strengthDistribution,
      emotionTrend,
    };
  }

  private async simulateDelay(ms: number = 150): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}