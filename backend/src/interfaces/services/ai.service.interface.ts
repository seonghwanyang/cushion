import { MoodType } from '@prisma/client';

export interface StrengthAnalysis {
  category: 'technical' | 'soft_skills' | 'leadership' | 'creative' | 'analytical';
  name: string;
  evidence: string;
  confidence: number; // 0-100
}

export interface EmotionAnalysis {
  primary: string;
  secondary: string[];
  intensity: number; // 0-100
}

export interface DiaryAnalysis {
  diaryId: string;
  strengths: StrengthAnalysis[];
  emotions: EmotionAnalysis;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  growthAreas: string[];
  insights: string[];
  analyzedAt: Date;
}

export interface WeeklyInsight {
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  diaryCount: number;
  dominantMoods: MoodType[];
  topStrengths: StrengthAnalysis[];
  emotionalPattern: {
    mood: MoodType;
    count: number;
    percentage: number;
  }[];
  weeklyThemes: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface PortfolioSummary {
  userId: string;
  totalDiaries: number;
  topStrengths: {
    strength: StrengthAnalysis;
    frequency: number;
  }[];
  growthJourney: {
    month: string;
    strengths: string[];
    improvements: string[];
  }[];
  consistentThemes: string[];
  personalityTraits: string[];
}

export interface IAIService {
  analyzeDiary(
    diaryId: string,
    content: string,
    mood: MoodType,
    tags: string[]
  ): Promise<DiaryAnalysis>;

  generateWeeklyInsight(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyInsight>;

  generatePortfolioSummary(userId: string): Promise<PortfolioSummary>;

  extractKeywords(content: string): Promise<string[]>;
}