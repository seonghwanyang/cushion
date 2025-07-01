import { config } from '@/config';
import { logger } from '@/utils/logger';

// Interfaces
import { IAuthService } from '@/interfaces/services/auth.service.interface';
import { IDiaryService } from '@/interfaces/services/diary.service.interface';
import { IJWTService } from '@/interfaces/services/jwt.service.interface';
import { IAIService } from '@/interfaces/services/ai.service.interface';
import { IInsightService } from '@/interfaces/services/insight.service.interface';

// Mock implementations
import { MockAuthService } from '@/mocks/services/auth.service.mock';
import { MockDiaryService } from '@/mocks/services/diary.service.mock';
import { MockJWTService } from '@/mocks/services/jwt.service.mock';
import { MockAIService } from '@/mocks/services/ai.service.mock';
import { MockInsightService } from '@/mocks/services/insight.service.mock';

// Real implementations
import { AuthService } from '@/services/auth.service';
import { JWTService } from '@/services/jwt.service';
import { DiaryService } from '@/services/diary.service';
import { InsightService } from '@/services/insight.service';
import { prisma } from '@/config/database';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getAuthService(): IAuthService {
    const key = 'auth';
    if (!this.services.has(key)) {
      if (config.features.useMockAuth) {
        logger.info('Using Mock Auth Service');
        this.services.set(key, new MockAuthService());
      } else {
        logger.info('Using Real Auth Service');
        this.services.set(key, new AuthService());
      }
    }
    return this.services.get(key);
  }

  getDiaryService(): IDiaryService {
    const key = 'diary';
    if (!this.services.has(key)) {
      if (config.features.useMockDatabase) {
        logger.info('Using Mock Diary Service');
        this.services.set(key, new MockDiaryService());
      } else {
        logger.info('Using Real Diary Service');
        this.services.set(key, new DiaryService(prisma));
      }
    }
    return this.services.get(key);
  }

  getJWTService(): IJWTService {
    const key = 'jwt';
    if (!this.services.has(key)) {
      if (config.features.useMockAuth) {
        logger.info('Using Mock JWT Service');
        this.services.set(key, new MockJWTService());
      } else {
        logger.info('Using Real JWT Service');
        this.services.set(key, new JWTService());
      }
    }
    return this.services.get(key);
  }

  getAIService(): IAIService {
    const key = 'ai';
    if (!this.services.has(key)) {
      if (config.features.useMockAI) {
        logger.info('Using Mock AI Service');
        this.services.set(key, new MockAIService());
      } else {
        logger.info('Using Real AI Service');
        // TODO: Switch to real implementation when ready
        // this.services.set(key, new AIService());
        this.services.set(key, new MockAIService()); // Temporarily use mock
      }
    }
    return this.services.get(key);
  }

  getInsightService(): IInsightService {
    const key = 'insight';
    if (!this.services.has(key)) {
      if (config.features.useMockDatabase) {
        logger.info('Using Mock Insight Service');
        this.services.set(key, new MockInsightService());
      } else {
        logger.info('Using Real Insight Service');
        this.services.set(key, new InsightService(prisma));
      }
    }
    return this.services.get(key);
  }

  // 테스트를 위한 서비스 리셋
  resetServices(): void {
    this.services.clear();
  }
}

// Singleton 인스턴스 export
export const serviceFactory = ServiceFactory.getInstance();