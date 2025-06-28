# Cushion API 명세서

## 🌐 API 개요

### Base URL
- 개발: `http://localhost:3001/api/v1`
- 스테이징: `https://api-staging.cushion.app/v1`
- 프로덕션: `https://api.cushion.app/v1`

### 인증
모든 API 요청(인증 관련 제외)에는 Bearer 토큰이 필요합니다.

```http
Authorization: Bearer {access_token}
```

### 응답 형식
모든 응답은 다음 형식을 따릅니다:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
    hasNext?: boolean;
  };
}
```

## 📋 엔드포인트 목록

### 인증 (Authentication)

#### 회원가입
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "홍길동"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid_123456",
      "email": "user@example.com",
      "name": "홍길동",
      "createdAt": "2024-01-20T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

#### 로그인
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid_123456",
      "email": "user@example.com",
      "name": "홍길동"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

#### 토큰 갱신
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### 로그아웃
```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다"
  }
}
```

### 일기 (Diaries)

#### 일기 목록 조회
```http
GET /diaries?page=1&limit=20&sort=createdAt&order=desc
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 20, 최대: 100)
- `sort` (optional): 정렬 기준 (createdAt, updatedAt)
- `order` (optional): 정렬 순서 (asc, desc)
- `startDate` (optional): 시작 날짜 (ISO 8601)
- `endDate` (optional): 종료 날짜 (ISO 8601)
- `mood` (optional): 기분 필터 (happy, sad, neutral, anxious, excited)
- `tags` (optional): 태그 필터 (쉼표로 구분)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "diary_123",
      "content": "오늘은 팀 회의에서 새로운 프로젝트...",
      "mood": "excited",
      "tags": ["회의", "프로젝트"],
      "hasInsight": true,
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "totalPages": 5,
    "totalCount": 95,
    "hasNext": true
  }
}
```

#### 일기 생성
```http
POST /diaries
```

**Request Body:**
```json
{
  "content": "오늘은 팀 회의에서 새로운 프로젝트 아이디어를 제안했다...",
  "mood": "excited",
  "tags": ["회의", "프로젝트", "아이디어"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "diary_123",
    "userId": "user_123",
    "content": "오늘은 팀 회의에서 새로운 프로젝트 아이디어를 제안했다...",
    "mood": "excited",
    "tags": ["회의", "프로젝트", "아이디어"],
    "createdAt": "2024-01-20T14:30:00Z",
    "updatedAt": "2024-01-20T14:30:00Z"
  }
}
```

#### 일기 상세 조회
```http
GET /diaries/{diaryId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "diary_123",
    "userId": "user_123",
    "content": "오늘은 팀 회의에서 새로운 프로젝트 아이디어를 제안했다...",
    "mood": "excited",
    "tags": ["회의", "프로젝트", "아이디어"],
    "insights": [
      {
        "id": "insight_456",
        "type": "DAILY",
        "strengths": ["리더십", "창의성", "소통능력"],
        "feedback": "팀 회의에서 새로운 아이디어를 제안하는 것은 훌륭한 리더십의 표현입니다...",
        "createdAt": "2024-01-20T14:35:00Z"
      }
    ],
    "createdAt": "2024-01-20T14:30:00Z",
    "updatedAt": "2024-01-20T14:30:00Z"
  }
}
```

#### 일기 수정
```http
PUT /diaries/{diaryId}
```

**Request Body:**
```json
{
  "content": "오늘은 팀 회의에서 새로운 프로젝트 아이디어를 제안했다. 팀원들의 반응이 좋았다...",
  "mood": "happy",
  "tags": ["회의", "프로젝트", "아이디어", "성공"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "diary_123",
    "content": "오늘은 팀 회의에서 새로운 프로젝트 아이디어를 제안했다. 팀원들의 반응이 좋았다...",
    "mood": "happy",
    "tags": ["회의", "프로젝트", "아이디어", "성공"],
    "updatedAt": "2024-01-20T15:00:00Z"
  }
}
```

#### 일기 삭제
```http
DELETE /diaries/{diaryId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "일기가 삭제되었습니다"
  }
}
```

### AI 인사이트 (Insights)

#### 일기 분석 요청
```http
POST /insights/analyze/{diaryId}
```

**Request Body (optional):**
```json
{
  "analysisType": "deep",
  "focus": ["leadership", "technical", "communication"]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "message": "분석이 시작되었습니다",
    "estimatedTime": 30,
    "jobId": "job_789"
  }
}
```

#### 분석 상태 확인
```http
GET /insights/status/{jobId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "status": "completed",
    "result": {
      "insightId": "insight_456",
      "diaryId": "diary_123"
    }
  }
}
```

#### 인사이트 조회
```http
GET /insights/{insightId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "insight_456",
    "diaryId": "diary_123",
    "type": "DAILY",
    "content": {
      "strengths": ["리더십", "창의성", "소통능력"],
      "skills": {
        "technical": ["프로젝트 기획", "아이디어 발상"],
        "soft": ["팀워크", "프레젠테이션", "설득력"]
      },
      "growthAreas": ["시간 관리", "세부 계획 수립"],
      "evidence": [
        "새로운 프로젝트 아이디어를 주도적으로 제안",
        "팀원들의 긍정적인 반응 유도"
      ]
    },
    "feedback": "오늘 회의에서 보여준 리더십이 인상적입니다. 새로운 아이디어를 제안하고 팀원들의 동의를 이끌어내는 것은 뛰어난 소통 능력의 증거입니다...",
    "createdAt": "2024-01-20T14:35:00Z"
  }
}
```

#### 주간 인사이트 조회
```http
GET /insights/weekly?startDate=2024-01-14&endDate=2024-01-20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-14",
      "end": "2024-01-20"
    },
    "summary": {
      "totalDiaries": 5,
      "dominantMood": "positive",
      "topStrengths": ["리더십", "문제해결", "창의성"],
      "consistentSkills": ["소통", "협업"],
      "growthProgress": {
        "시간관리": {
          "previousScore": 3,
          "currentScore": 4,
          "improvement": 33.3
        }
      }
    },
    "weeklyFeedback": "이번 주는 특히 리더십 면에서 큰 성장을 보였습니다...",
    "recommendations": [
      "발견된 리더십 역량을 더욱 발전시키기 위해...",
      "시간 관리 능력 향상을 위한 구체적인 방법..."
    ]
  }
}
```

### 포트폴리오 (Portfolio)

#### 포트폴리오 생성
```http
POST /portfolio/generate
```

**Request Body:**
```json
{
  "period": "last_3_months",
  "format": "linkedin",
  "focusAreas": ["leadership", "project_management"],
  "includeInsights": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "portfolio_123",
    "title": "3개월 성장 포트폴리오",
    "sections": {
      "summary": "지난 3개월간 프로젝트 리더십과 팀 협업 능력에서 눈에 띄는 성장을 보였습니다...",
      "keyStrengths": [
        {
          "strength": "프로젝트 리더십",
          "evidence": ["신규 프로젝트 3개 주도", "팀원 만족도 95%"],
          "examples": ["1월 15일: 새로운 마케팅 캠페인 아이디어 제안 및 실행..."]
        }
      ],
      "achievements": [
        {
          "title": "팀 프로젝트 성공적 완료",
          "description": "2개월간의 대규모 프로젝트를 예정보다 1주 빨리 완료",
          "skills": ["프로젝트 관리", "일정 조율", "리스크 관리"]
        }
      ],
      "growthStory": "처음에는 팀 회의에서 의견을 내는 것조차 어려웠지만..."
    },
    "linkedinOptimized": {
      "headline": "창의적인 문제 해결사 | 프로젝트 리더 | 팀 협업 전문가",
      "about": "3개월간의 집중적인 성장을 통해...",
      "skills": ["Project Management", "Team Leadership", "Creative Problem Solving"]
    },
    "createdAt": "2024-01-20T16:00:00Z"
  }
}
```

#### 포트폴리오 조회
```http
GET /portfolio/{portfolioId}
```

#### 포트폴리오 내보내기
```http
GET /portfolio/{portfolioId}/export?format=pdf
```

**Query Parameters:**
- `format`: pdf, docx, html, markdown

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.cushion.app/exports/portfolio_123.pdf",
    "expiresAt": "2024-01-20T18:00:00Z"
  }
}
```

### 사용자 프로필 (Profile)

#### 프로필 조회
```http
GET /profile
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "홍길동",
      "profileImage": "https://cdn.cushion.app/avatars/user_123.jpg"
    },
    "stats": {
      "totalDiaries": 45,
      "currentStreak": 7,
      "longestStreak": 15,
      "totalInsights": 42,
      "joinedAt": "2023-12-01T10:00:00Z"
    },
    "subscription": {
      "plan": "premium",
      "status": "active",
      "expiresAt": "2024-12-01T10:00:00Z"
    }
  }
}
```

#### 프로필 수정
```http
PUT /profile
```

**Request Body:**
```json
{
  "name": "홍길동",
  "currentSituation": "job_seeking",
  "goals": ["이직 성공", "연봉 상승"],
  "notificationSettings": {
    "dailyReminder": true,
    "reminderTime": "21:00",
    "weeklyReport": true
  }
}
```

### 통계 (Statistics)

#### 성장 통계 조회
```http
GET /stats/growth?period=monthly
```

**Query Parameters:**
- `period`: daily, weekly, monthly, yearly

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "diaryStats": {
      "total": 20,
      "averageLength": 245,
      "moodDistribution": {
        "happy": 8,
        "neutral": 7,
        "anxious": 3,
        "excited": 2
      }
    },
    "strengthProgress": [
      {
        "strength": "리더십",
        "occurrences": [2, 3, 5, 7, 8],
        "trend": "increasing"
      }
    ],
    "skillsAcquired": [
      {
        "skill": "프로젝트 관리",
        "firstAppeared": "2024-01-05",
        "frequency": 12
      }
    ]
  }
}
```

## 🔒 에러 코드

### 공통 에러 코드
- `UNAUTHORIZED` (401): 인증되지 않은 요청
- `FORBIDDEN` (403): 권한 없음
- `NOT_FOUND` (404): 리소스를 찾을 수 없음
- `VALIDATION_ERROR` (400): 입력 데이터 검증 실패
- `INTERNAL_ERROR` (500): 서버 내부 오류

### 도메인별 에러 코드

#### 인증 관련
- `AUTH_INVALID_CREDENTIALS`: 잘못된 이메일 또는 비밀번호
- `AUTH_EMAIL_EXISTS`: 이미 존재하는 이메일
- `AUTH_TOKEN_EXPIRED`: 만료된 토큰
- `AUTH_TOKEN_INVALID`: 유효하지 않은 토큰

#### 일기 관련
- `DIARY_NOT_FOUND`: 일기를 찾을 수 없음
- `DIARY_ACCESS_DENIED`: 일기 접근 권한 없음
- `DIARY_LIMIT_EXCEEDED`: 일일 작성 한도 초과

#### AI 관련
- `AI_ANALYSIS_FAILED`: AI 분석 실패
- `AI_QUOTA_EXCEEDED`: AI 분석 한도 초과
- `AI_SERVICE_UNAVAILABLE`: AI 서비스 일시적 불가

## 📡 웹소켓 이벤트

### 연결
```javascript
const socket = io('wss://api.cushion.app', {
  auth: {
    token: 'Bearer {access_token}'
  }
});
```

### 이벤트

#### 분석 완료
```javascript
socket.on('analysis:completed', (data) => {
  console.log('분석 완료:', data);
  // {
  //   diaryId: 'diary_123',
  //   insightId: 'insight_456',
  //   type: 'DAILY'
  // }
});
```

#### 주간 리포트 생성
```javascript
socket.on('report:weekly', (data) => {
  console.log('주간 리포트:', data);
  // {
  //   reportId: 'report_789',
  //   period: { start: '2024-01-14', end: '2024-01-20' }
  // }
});
```

## 🧪 테스트 환경

### 테스트 계정
- Email: `test@cushion.app`
- Password: `TestPassword123!`

### 테스트 API 키
```
Test API Key: test_pk_1234567890abcdef
```

### Rate Limits
- 개발: 1000 requests/hour
- 프로덕션: 10000 requests/hour
- AI 분석: 100 requests/day (Free), 1000 requests/day (Premium)