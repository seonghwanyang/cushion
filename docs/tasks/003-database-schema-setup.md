# Task 003: 데이터베이스 스키마 및 Prisma 설정

## 📋 작업 개요

**작업 ID**: 003  
**작업명**: PostgreSQL 스키마 설계 및 Prisma ORM 설정  
**예상 소요시간**: 30-40분  
**우선순위**: 🔴 Critical (데이터 모델 기반)  
**선행 작업**: Task 001, 002 (완료됨)

## 🎯 목표

Cushion 서비스의 핵심 데이터 모델을 정의하고 Prisma ORM을 설정합니다. `docs/cushion-architecture.md`에 정의된 스키마를 구현합니다.

## 📋 작업 내용

### 1. Backend Prisma 초기화

```bash
cd backend
npx prisma init
```

### 2. Prisma Schema 정의

`backend/prisma/schema.prisma` 파일을 다음과 같이 작성:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== Enums ==========

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum UserRole {
  USER
  ADMIN
}

enum MoodType {
  HAPPY
  SAD
  NEUTRAL
  ANXIOUS
  EXCITED
  ANGRY
  PEACEFUL
}

enum InsightType {
  DAILY
  WEEKLY
  MONTHLY
}

enum SubscriptionPlan {
  FREE
  PREMIUM
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  TRIAL
}

// ========== Models ==========

model User {
  id                String             @id @default(cuid())
  email             String             @unique
  password          String
  name              String?
  profileImage      String?
  role              UserRole           @default(USER)
  status            UserStatus         @default(ACTIVE)
  
  // Relations
  profile           Profile?
  diaries           Diary[]
  insights          Insight[]
  portfolio         Portfolio[]
  subscription      Subscription?
  refreshTokens     RefreshToken[]
  securityLogs      SecurityLog[]
  
  // Timestamps
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  lastLoginAt       DateTime?
  
  @@index([email])
  @@index([status])
}

model Profile {
  id                String             @id @default(cuid())
  userId            String             @unique
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Profile Info
  bio               String?
  currentSituation  String?            // 이직준비, 창업, 시험준비 등
  goals             String[]           // 사용자 목표
  
  // Settings
  reminderEnabled   Boolean            @default(true)
  reminderTime      String             @default("21:00")
  weeklyReportDay   Int                @default(0) // 0 = Sunday
  timezone          String             @default("Asia/Seoul")
  
  // Stats
  totalDiaries      Int                @default(0)
  currentStreak     Int                @default(0)
  longestStreak     Int                @default(0)
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model Diary {
  id                String             @id @default(cuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Content
  content           String             @db.Text
  mood              MoodType?
  tags              String[]
  
  // AI Analysis
  isAnalyzed        Boolean            @default(false)
  analyzedAt        DateTime?
  
  // Relations
  insights          Insight[]
  attachments       Attachment[]
  
  // Timestamps
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@index([userId, createdAt])
  @@index([userId, isAnalyzed])
}

model Insight {
  id                String             @id @default(cuid())
  diaryId           String
  diary             Diary              @relation(fields: [diaryId], references: [id], onDelete: Cascade)
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Type
  type              InsightType
  
  // AI Analysis Results
  content           Json               // 전체 분석 결과
  strengths         String[]           // 발견된 강점
  skills            Json               // { technical: [], soft: [] }
  emotions          String[]           // 감지된 감정
  growthAreas       String[]           // 성장 영역
  evidence          String[]           // 구체적 증거
  
  // Feedback
  feedback          String             @db.Text
  confidence        Float              @default(0.0) // AI 분석 신뢰도
  
  // AI Metadata
  model             String?            // 사용된 AI 모델
  tokensUsed        Int?               // 토큰 사용량
  processingTime    Int?               // 처리 시간 (ms)
  
  createdAt         DateTime           @default(now())
  
  @@index([diaryId])
  @@index([userId, type])
  @@index([userId, createdAt])
}

model Portfolio {
  id                String             @id @default(cuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Portfolio Info
  title             String
  period            Json               // { start: Date, end: Date }
  format            String             // linkedin, resume, general
  
  // Content
  summary           String             @db.Text
  keyStrengths      Json               // 주요 강점과 증거
  achievements      Json               // 성과와 경험
  growthStory       String             @db.Text
  
  // LinkedIn Optimization
  linkedinHeadline  String?
  linkedinAbout     String?            @db.Text
  linkedinSkills    String[]
  
  // Metadata
  isPublic          Boolean            @default(false)
  views             Int                @default(0)
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@index([userId, createdAt])
}

model Attachment {
  id                String             @id @default(cuid())
  diaryId           String
  diary             Diary              @relation(fields: [diaryId], references: [id], onDelete: Cascade)
  
  // File Info
  filename          String
  mimeType          String
  size              Int                // bytes
  url               String             // S3 URL
  
  // Metadata
  uploadedAt        DateTime           @default(now())
  
  @@index([diaryId])
}

model Subscription {
  id                String             @id @default(cuid())
  userId            String             @unique
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Plan Info
  plan              SubscriptionPlan   @default(FREE)
  status            SubscriptionStatus @default(ACTIVE)
  
  // Billing
  stripeCustomerId  String?            @unique
  stripeSubscriptionId String?         @unique
  
  // Dates
  trialStartDate    DateTime?
  trialEndDate      DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd  DateTime?
  cancelledAt       DateTime?
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@index([status])
}

model RefreshToken {
  id                String             @id @default(cuid())
  jti               String             @unique // JWT ID
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Token Info
  token             String             @db.Text // Hashed token
  deviceId          String?
  deviceName        String?
  
  // Status
  revoked           Boolean            @default(false)
  expiresAt         DateTime
  
  createdAt         DateTime           @default(now())
  
  @@index([userId])
  @@index([jti])
}

model SecurityLog {
  id                String             @id @default(cuid())
  userId            String?
  user              User?              @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Event Info
  eventType         String             // LOGIN_SUCCESS, LOGIN_FAILURE, etc.
  ipAddress         String
  userAgent         String
  
  // Details
  details           Json?              // Additional event details
  
  createdAt         DateTime           @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}

// ========== Future Models (Phase 2+) ==========

model WeeklyReport {
  id                String             @id @default(cuid())
  userId            String
  
  // Report Period
  startDate         DateTime
  endDate           DateTime
  
  // Summary
  totalDiaries      Int
  dominantMood      String?
  topStrengths      String[]
  consistentSkills  String[]
  growthProgress    Json
  
  // AI Generated
  weeklyFeedback    String             @db.Text
  recommendations   String[]
  
  createdAt         DateTime           @default(now())
  
  @@index([userId, startDate])
}

model AuditLog {
  id                String             @id @default(cuid())
  userId            String?
  
  // Action Info
  action            String
  resource          String
  resourceId        String?
  
  // Changes
  oldValue          Json?
  newValue          Json?
  
  // Context
  ipAddress         String?
  userAgent         String?
  
  createdAt         DateTime           @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resourceId])
}
```

### 3. 환경 변수 설정

`.env` 파일 생성 (`.env.example`을 복사):
```bash
cp .env.example .env
```

`.env` 파일에서 DATABASE_URL 확인:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cushion_dev"
```

### 4. 데이터베이스 마이그레이션

```bash
# Docker로 PostgreSQL 실행 (이미 실행중이 아닌 경우)
docker-compose up -d postgres

# 마이그레이션 생성 및 실행
cd backend
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

### 5. Seed 데이터 생성

`backend/prisma/seed.ts` 파일 생성:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean database
  await prisma.diary.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.create({
    data: {
      email: 'test@cushion.app',
      password: hashedPassword,
      name: '김테스트',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: '전환기를 겪고 있는 개발자입니다.',
          currentSituation: '이직준비',
          goals: ['더 나은 회사로 이직', '연봉 상승', '기술 스택 확장'],
          reminderEnabled: true,
          reminderTime: '21:00',
        },
      },
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // Create sample diaries
  const diaries = [
    {
      content: '오늘은 새로운 프로젝트 아이디어를 구상했다. 팀원들과 브레인스토밍을 하면서 창의적인 해결책을 제시했고, 모두가 긍정적인 반응을 보였다.',
      mood: 'EXCITED' as const,
      tags: ['프로젝트', '브레인스토밍', '창의성'],
      createdAt: new Date('2024-01-15'),
    },
    {
      content: '면접 준비를 하면서 내가 지금까지 해온 프로젝트들을 정리했다. 생각보다 많은 것을 이뤄냈다는 것을 깨달았다.',
      mood: 'HAPPY' as const,
      tags: ['면접준비', '회고', '성장'],
      createdAt: new Date('2024-01-16'),
    },
    {
      content: '알고리즘 문제를 3시간 동안 풀었다. 어려웠지만 끝까지 포기하지 않고 해결했다. 문제 해결 능력이 향상되고 있음을 느낀다.',
      mood: 'NEUTRAL' as const,
      tags: ['알고리즘', '문제해결', '인내'],
      createdAt: new Date('2024-01-17'),
    },
  ];

  for (const diaryData of diaries) {
    const diary = await prisma.diary.create({
      data: {
        ...diaryData,
        userId: testUser.id,
      },
    });

    // Create sample insight
    await prisma.insight.create({
      data: {
        diaryId: diary.id,
        userId: testUser.id,
        type: 'DAILY',
        content: {
          analysis: '일기 분석 결과',
          sentiment: 'positive',
        },
        strengths: ['문제해결능력', '창의성', '리더십'],
        skills: {
          technical: ['프로젝트 기획', '알고리즘'],
          soft: ['커뮤니케이션', '인내심'],
        },
        emotions: ['자신감', '성취감'],
        growthAreas: ['시간 관리'],
        evidence: [
          '팀원들과의 효과적인 브레인스토밍',
          '긍정적인 피드백 수용',
        ],
        feedback: '오늘 보여준 창의적인 문제 해결 능력과 팀워크는 훌륭했습니다. 이런 강점을 계속 발전시켜 나가세요.',
        confidence: 0.85,
        model: 'gpt-4',
        tokensUsed: 250,
        processingTime: 1500,
      },
    });
  }

  console.log(`✅ Created ${diaries.length} sample diaries with insights`);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cushion.app',
      password: hashedPassword,
      name: '관리자',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Cushion 서비스 관리자',
          currentSituation: '운영',
          goals: ['서비스 품질 향상', '사용자 만족도 증대'],
        },
      },
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6. Package.json 스크립트 추가

`backend/package.json`에 다음 스크립트 추가:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:create": "prisma migrate dev --create-only",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:reset": "prisma migrate reset --force"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 7. TypeScript 타입 생성

`packages/types/src/index.ts` 파일 생성:

```typescript
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
```

`packages/types/package.json`:

```json
{
  "name": "@cushion/types",
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@prisma/client": "^5.0.0"
  }
}
```

### 8. Prisma 관련 gitignore 추가

`.gitignore`에 다음 추가 (없다면):

```gitignore
# Prisma
*.db
*.db-journal
migrations/dev.db
```

## 🚀 실행 명령어

```bash
# 1. Docker PostgreSQL 실행
docker-compose up -d postgres

# 2. Backend 폴더로 이동
cd backend

# 3. 마이그레이션 실행
npx prisma migrate dev --name init

# 4. Seed 데이터 생성
npm run prisma:seed

# 5. Prisma Studio로 확인 (선택사항)
npm run prisma:studio
```

## ✅ 완료 조건

1. Prisma schema 파일 생성 완료
2. 데이터베이스 마이그레이션 성공
3. Seed 데이터 생성 성공
4. Prisma Studio에서 데이터 확인 가능
5. TypeScript 타입 자동 생성 확인

## 📝 체크리스트 업데이트

작업 완료 후 `docs/cushion-checklist.md` 파일을 업데이트하세요:
- Phase 1의 "DB 스키마 설계" 체크

## 🔄 다음 단계

이 작업이 완료되면 다음 작업으로 진행:
- Task 004: 기본 API 구조 및 인증 시스템 구현
- Task 005: 일기 CRUD API 구현

---
작성일: 2024-01-20
작성자: Cushion AI Assistant
