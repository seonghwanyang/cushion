import apiClient from './client';

export type MoodType = 'HAPPY' | 'SAD' | 'ANGRY' | 'ANXIOUS' | 'NEUTRAL' | 'EXCITED' | 'GRATEFUL' | 'STRESSED' | 'PEACEFUL' | 'HOPEFUL';

export interface Diary {
  id: string;
  userId: string;
  content: string;
  mood: MoodType;
  tags: string[];
  isAnalyzed: boolean;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiaryRequest {
  content: string;
  mood: MoodType;
  tags?: string[];
}

export interface UpdateDiaryRequest {
  content?: string;
  mood?: MoodType;
  tags?: string[];
}

export interface DiaryListResponse {
  diaries: Diary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DiaryStats {
  totalEntries: number;
  moodDistribution: Record<MoodType, number>;
  topTags: Array<{ tag: string; count: number }>;
  entriesByMonth: Array<{ month: string; count: number }>;
}

export const diaryApi = {
  async create(data: CreateDiaryRequest): Promise<Diary> {
    const response = await apiClient.post('/diaries', data);
    return response.data;
  },
  
  async getList(params?: {
    page?: number;
    limit?: number;
    mood?: MoodType;
    tags?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<DiaryListResponse> {
    const response = await apiClient.get('/diaries', { params });
    return response.data;
  },
  
  async getById(id: string): Promise<Diary> {
    const response = await apiClient.get(`/diaries/${id}`);
    return response.data;
  },
  
  async update(id: string, data: UpdateDiaryRequest): Promise<Diary> {
    const response = await apiClient.put(`/diaries/${id}`, data);
    return response.data;
  },
  
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/diaries/${id}`);
  },
  
  async getStats(): Promise<DiaryStats> {
    const response = await apiClient.get('/diaries/stats');
    return response.data;
  },
};