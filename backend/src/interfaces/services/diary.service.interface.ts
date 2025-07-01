import type { Diary, MoodType } from '@prisma/client';

export interface CreateDiaryInput {
  content: string;
  mood?: MoodType;
  tags?: string[];
}

export interface UpdateDiaryInput {
  content?: string;
  mood?: MoodType;
  tags?: string[];
}

export interface DiaryFilter {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  mood?: MoodType;
  tags?: string[];
}

export interface DiaryListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  mood?: MoodType;
  tags?: string[];
  isAnalyzed?: boolean;
}

export interface DiaryListResult {
  data: Diary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DiaryStats {
  totalCount: number;
  currentStreak: number;
  longestStreak: number;
  totalStrengths: number;
  growthScore: number;
  moodDistribution: Record<string, number>;
  strengthDistribution: Array<{ strength: string; count: number }>;
  emotionTrend: Array<{ date: string; mood: string; value: number }>;
}

export interface IDiaryService {
  create(userId: string, input: CreateDiaryInput): Promise<Diary>;
  findById(id: string, userId: string): Promise<Diary>;
  findByUser(userId: string, filter?: DiaryFilter): Promise<Diary[]>;
  update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary>;
  delete(id: string, userId: string): Promise<void>;
  count(userId: string): Promise<number>;
  list(userId: string, options?: DiaryListOptions): Promise<DiaryListResult>;
  getStats(userId: string): Promise<DiaryStats>;
}