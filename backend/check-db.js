const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDiaries() {
  try {
    const count = await prisma.diary.count();
    console.log('Total diaries in database:', count);
    
    const recent = await prisma.diary.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true
      }
    });
    
    console.log('\nRecent diaries:');
    recent.forEach((diary, i) => {
      console.log(`${i + 1}. ID: ${diary.id}`);
      console.log(`   User: ${diary.userId}`);
      console.log(`   Content: ${diary.content.substring(0, 50)}...`);
      console.log(`   Created: ${diary.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiaries();