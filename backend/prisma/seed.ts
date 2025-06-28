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