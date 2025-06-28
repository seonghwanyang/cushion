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

export interface IDiaryService {
  create(userId: string, input: CreateDiaryInput): Promise<Diary>;
  findById(id: string): Promise<Diary | null>;
  findByUser(userId: string, filter?: DiaryFilter): Promise<Diary[]>;
  update(id: string, userId: string, input: UpdateDiaryInput): Promise<Diary>;
  delete(id: string, userId: string): Promise<void>;
  count(userId: string): Promise<number>;
}