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
  totalCount: number;
  currentStreak: number;
  totalStrengths: number;
  growthScore: number;
  strengthDistribution?: any;
  emotionTrend?: any;
  totalEntries?: number;
  moodDistribution?: Record<MoodType, number>;
  topTags?: Array<{ tag: string; count: number }>;
  entriesByMonth?: Array<{ month: string; count: number }>;
}

export const diaryApi = {
  async create(data: CreateDiaryRequest): Promise<Diary> {
    const response = await apiClient.post('/diaries', data);
    // Backend returns data wrapped in success response
    return response.data.data;
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
    // Backend returns data wrapped in success response
    return {
      diaries: response.data.data || [],
      total: response.data.meta?.totalCount || 0,
      page: response.data.meta?.page || 1,
      limit: params?.limit || 10,
      totalPages: response.data.meta?.totalPages || 1,
    };
  },
  
  async getById(id: string): Promise<Diary> {
    const response = await apiClient.get(`/diaries/${id}`);
    // Backend returns data wrapped in success response
    return response.data.data;
  },
  
  async update(id: string, data: UpdateDiaryRequest): Promise<Diary> {
    const response = await apiClient.put(`/diaries/${id}`, data);
    // Backend returns data wrapped in success response
    return response.data.data;
  },
  
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/diaries/${id}`);
  },
  
  async getStats(): Promise<DiaryStats> {
    const response = await apiClient.get('/diaries/stats');
    // Backend returns data wrapped in success response
    return response.data.data;
  },
};