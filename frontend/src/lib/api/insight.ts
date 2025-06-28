import { apiClient } from './client';

export interface WeeklyInsight {
  weekStartDate: Date;
  weekEndDate: Date;
  totalDiaries: number;
  consistentStrengths: Array<{
    strength: string;
    category: string;
    confidence: number;
  }>;
  keyAchievements: string[];
  recommendations: string[];
  growthProgress: Array<{
    area: string;
    progress: number;
    evidence: string[];
  }>;
}

export const insightApi = {
  // 특정 일기의 인사이트 조회
  getByDiaryId: async (diaryId: string) => {
    const response = await apiClient.get(`/insights/diary/${diaryId}`);
    return response.data;
  },

  // 사용자의 모든 인사이트 조회
  list: async (params?: { limit?: number; offset?: number }) => {
    const response = await apiClient.get('/insights', { params });
    return response.data;
  },

  // 주간 인사이트 조회
  getWeekly: async (): Promise<WeeklyInsight> => {
    const response = await apiClient.get('/insights/weekly');
    return response.data;
  },

  // 월간 인사이트 조회
  getMonthly: async () => {
    const response = await apiClient.get('/insights/monthly');
    return response.data;
  },

  // 인사이트 재생성 요청
  regenerate: async (diaryId: string) => {
    const response = await apiClient.post(`/insights/diary/${diaryId}/regenerate`);
    return response.data;
  },
};