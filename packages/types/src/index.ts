// Re-export Prisma types
export type {
  User,
  Profile,
  Diary,
  Insight,
  Portfolio,
  Attachment,
  Subscription,
  RefreshToken,
  SecurityLog,
} from '@prisma/client';

export {
  UserStatus,
  UserRole,
  MoodType,
  InsightType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';

// Custom types
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

export interface DiaryWithInsights extends Diary {
  insights: Insight[];
}

export interface UserWithProfile extends User {
  profile: Profile | null;
}

export interface AnalysisResult {
  strengths: string[];
  skills: {
    technical: string[];
    soft: string[];
  };
  emotions: string[];
  growthAreas: string[];
  evidence: string[];
  feedback: string;
  confidence: number;
}