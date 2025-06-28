import type { Diary, MoodType } from '@prisma/client';

export const mockDiaries: Diary[] = [
  {
    id: 'mock-diary-1',
    userId: 'mock-user-1',
    content: '오늘은 새로운 프로젝트 아이디어를 구상했다. 팀원들과 브레인스토밍을 하면서 창의적인 해결책을 제시했고, 모두가 긍정적인 반응을 보였다. 내가 제안한 아키텍처가 채택되어 기쁘다.',
    mood: 'EXCITED' as MoodType,
    tags: ['프로젝트', '브레인스토밍', '창의성', '리더십'],
    isAnalyzed: true,
    analyzedAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
  },
  {
    id: 'mock-diary-2',
    userId: 'mock-user-1',
    content: '면접 준비를 하면서 내가 지금까지 해온 프로젝트들을 정리했다. 생각보다 많은 것을 이뤄냈다는 것을 깨달았다. 특히 작년에 완성한 오픈소스 프로젝트가 1000개의 스타를 받은 것이 자랑스럽다.',
    mood: 'HAPPY' as MoodType,
    tags: ['면접준비', '회고', '성장', '오픈소스'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-16T10:00:00Z'),
    updatedAt: new Date('2024-01-16T10:00:00Z'),
  },
  {
    id: 'mock-diary-3',
    userId: 'mock-user-1',
    content: '알고리즘 문제를 3시간 동안 풀었다. 어려웠지만 끝까지 포기하지 않고 해결했다. 문제 해결 능력이 향상되고 있음을 느낀다. 내일은 더 어려운 문제에 도전해볼 계획이다.',
    mood: 'NEUTRAL' as MoodType,
    tags: ['알고리즘', '문제해결', '인내', '학습'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-17T11:00:00Z'),
    updatedAt: new Date('2024-01-17T11:00:00Z'),
  },
  {
    id: 'mock-diary-4',
    userId: 'mock-user-1',
    content: '오늘은 코드 리뷰에서 좋은 피드백을 많이 받았다. 동료들이 내 코드의 가독성과 효율성을 칭찬해줬다. 최근에 공부한 디자인 패턴을 적용한 것이 효과적이었다.',
    mood: 'HAPPY' as MoodType,
    tags: ['코드리뷰', '피드백', '디자인패턴', '협업'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-18T14:00:00Z'),
    updatedAt: new Date('2024-01-18T14:00:00Z'),
  },
  {
    id: 'mock-diary-5',
    userId: 'mock-user-1',
    content: '프로젝트 데드라인이 다가와서 스트레스를 받고 있다. 하지만 차근차근 할 일을 정리하고 우선순위를 매기니 마음이 좀 편해졌다. 오늘은 핵심 기능 구현에 집중했다.',
    mood: 'ANXIOUS' as MoodType,
    tags: ['데드라인', '스트레스관리', '우선순위', '집중'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-19T09:30:00Z'),
    updatedAt: new Date('2024-01-19T09:30:00Z'),
  },
  {
    id: 'mock-diary-6',
    userId: 'mock-user-1',
    content: '새로운 프레임워크를 배우기 시작했다. 처음엔 어렵게 느껴졌지만, 공식 문서를 차근차근 읽으니 이해가 되기 시작했다. 튜토리얼 프로젝트를 만들어보니 재미있다.',
    mood: 'EXCITED' as MoodType,
    tags: ['학습', '프레임워크', '문서화', '튜토리얼'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
  },
  {
    id: 'mock-diary-7',
    userId: 'mock-user-1',
    content: '오늘은 버그를 하나도 해결하지 못했다. 디버깅에 하루종일 매달렸는데 원인을 찾지 못해서 답답하다. 내일은 새로운 마음으로 다시 도전해봐야겠다.',
    mood: 'SAD' as MoodType,
    tags: ['디버깅', '버그', '답답함', '도전'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-21T17:00:00Z'),
    updatedAt: new Date('2024-01-21T17:00:00Z'),
  },
  {
    id: 'mock-diary-8',
    userId: 'mock-user-1',
    content: '멘토링 세션에서 좋은 조언을 많이 들었다. 특히 커리어 개발에 대한 조언이 도움이 되었다. 앞으로 어떤 방향으로 성장해야 할지 명확해진 것 같다.',
    mood: 'PEACEFUL' as MoodType,
    tags: ['멘토링', '커리어', '조언', '성장방향'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-22T15:00:00Z'),
    updatedAt: new Date('2024-01-22T15:00:00Z'),
  },
  {
    id: 'mock-diary-9',
    userId: 'mock-user-1',
    content: '팀 빌딩 행사에 참여했다. 동료들과 더 가까워진 것 같아 좋았다. 평소에 말할 기회가 없었던 다른 팀 사람들과도 이야기를 나눌 수 있었다.',
    mood: 'HAPPY' as MoodType,
    tags: ['팀빌딩', '네트워킹', '동료', '소통'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-23T16:00:00Z'),
    updatedAt: new Date('2024-01-23T16:00:00Z'),
  },
  {
    id: 'mock-diary-10',
    userId: 'mock-user-1',
    content: '오늘 드디어 어제의 버그를 해결했다! 문제는 비동기 처리 부분에 있었다. 해결하고 나니 뿌듯하고, 비동기 프로그래밍에 대한 이해도가 더 깊어진 것 같다.',
    mood: 'EXCITED' as MoodType,
    tags: ['버그해결', '비동기', '성취감', '학습'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-24T11:00:00Z'),
    updatedAt: new Date('2024-01-24T11:00:00Z'),
  },
  {
    id: 'mock-diary-11',
    userId: 'mock-user-2',
    content: '고객 미팅이 성공적으로 끝났다. 프레젠테이션 준비를 열심히 한 보람이 있었다. 고객이 우리 제품에 대해 매우 긍정적인 반응을 보였다.',
    mood: 'HAPPY' as MoodType,
    tags: ['미팅', '프레젠테이션', '성공', '고객'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-18T14:00:00Z'),
    updatedAt: new Date('2024-01-18T14:00:00Z'),
  },
  {
    id: 'mock-diary-12',
    userId: 'mock-user-1',
    content: 'React Native로 첫 모바일 앱을 만들기 시작했다. 웹 개발과는 다른 점이 많아서 흥미롭다. 특히 네이티브 기능을 다루는 부분이 재미있다.',
    mood: 'EXCITED' as MoodType,
    tags: ['React Native', '모바일개발', '새로운도전', '학습'],
    isAnalyzed: false,
    analyzedAt: null,
    createdAt: new Date('2024-01-25T10:00:00Z'),
    updatedAt: new Date('2024-01-25T10:00:00Z'),
  },
];

// 개발용 Mock 데이터 생성 함수
export function generateMockDiaries(userId: string, count: number): Diary[] {
  const moods: MoodType[] = ['HAPPY', 'SAD', 'NEUTRAL', 'ANXIOUS', 'EXCITED', 'ANGRY', 'PEACEFUL'];
  const contents = [
    '오늘은 코딩 챌린지를 완료했다. 새로운 알고리즘을 배웠고 문제 해결 능력이 향상되었다.',
    '팀 프로젝트에서 리더 역할을 맡았다. 책임감이 무겁지만 성장하는 기회라고 생각한다.',
    '면접 준비를 하면서 내 강점과 약점을 정리했다. 자기 이해가 깊어진 느낌이다.',
    '새로운 기술 스택을 학습했다. 처음엔 어려웠지만 점점 익숙해지고 있다.',
    '멘토링 세션에 참여했다. 선배 개발자의 조언이 큰 도움이 되었다.',
    '오픈소스 프로젝트에 첫 기여를 했다. PR이 머지되어서 정말 기쁘다.',
    '기술 블로그 글을 작성했다. 내가 배운 것을 정리하니 더 명확해졌다.',
    '페어 프로그래밍을 처음 해봤다. 다른 사람의 사고 과정을 보는 것이 인상적이었다.',
    '컨퍼런스에서 발표를 했다. 긴장했지만 좋은 경험이었다.',
    '새로운 개발 도구를 도입했다. 생산성이 크게 향상된 것 같다.',
  ];
  
  const tagSets = [
    ['학습', '성장', '알고리즘'],
    ['프로젝트', '팀워크', '리더십'],
    ['코딩', '문제해결', '디버깅'],
    ['네트워킹', '커리어', '멘토링'],
    ['자기계발', '목표', '계획'],
    ['오픈소스', '기여', '커뮤니티'],
    ['블로그', '글쓰기', '공유'],
    ['협업', '소통', '피드백'],
    ['발표', '컨퍼런스', '공유'],
    ['도구', '생산성', '효율성'],
  ];

  const diaries: Diary[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // 하루씩 이전
    
    const isAnalyzed = Math.random() > 0.3;
    diaries.push({
      id: `mock-diary-gen-${userId}-${i}`,
      userId,
      content: contents[i % contents.length],
      mood: moods[Math.floor(Math.random() * moods.length)],
      tags: tagSets[i % tagSets.length],
      isAnalyzed,
      analyzedAt: isAnalyzed ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return diaries;
}