# TASK_018: 일기 목록 오류 해결 및 Mock 데이터 완전 제거

## 🚨 현재 문제
1. ✅ 일기 작성은 성공
2. ❌ **일기 목록으로 이동 시 "일기를 불러오는 중 오류가 발생함"**
3. ❌ Dashboard에 Mock 데이터 잔존
4. ❌ 실제 DB 데이터를 불러오지 못함

## 🔍 문제 분석

### 1. 일기 목록 오류 원인
- Frontend가 여전히 Mock API를 호출하고 있을 가능성
- 백엔드 diary list API 문제
- 데이터 형식 불일치 (Mock vs 실제 DB)

### 2. Mock 데이터 잔존 위치
- `frontend/src/app/dashboard/components/*` - 각 통계 컴포넌트
- `frontend/src/app/diaries/page.tsx` - 일기 목록 페이지
- API 호출 부분이 Mock을 참조하고 있을 수 있음

## 🛠️ 해결 방법

### Step 1: 일기 목록 API 확인

**1-1. 백엔드 로그 확인**
```bash
# 백엔드 콘솔에서 GET /api/v1/diaries 요청 확인
# 에러 메시지 확인
```

**1-2. Frontend API 호출 확인**
**파일**: `frontend/src/lib/api/diary.ts`

```typescript
// Mock API 호출 제거 확인
export const diaryApi = {
  // 일기 목록 조회
  async getList(params?: DiaryListParams): Promise<DiaryListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.mood) queryParams.append('mood', params.mood);
    if (params?.tags) queryParams.append('tags', params.tags.join(','));
    
    const response = await apiClient.get(`/diaries?${queryParams}`);
    return response.data;
  },
  
  // 통계 조회 - 실제 API 엔드포인트 확인
  async getStats(): Promise<DiaryStats> {
    const response = await apiClient.get('/diaries/stats');
    return response.data;
  },
};
```

### Step 2: 일기 목록 페이지 수정

**파일**: `frontend/src/app/diaries/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { diaryApi } from '@/lib/api/diary';
import type { Diary } from '@/types/diary';
// Mock import 제거!
// import { mockDiaries } from '@/mocks/diary.mock';

export default function DiariesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchDiaries();
  }, [page]);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await diaryApi.getList({
        page,
        limit: 10,
      });
      
      console.log('Diaries response:', response); // 디버깅용
      
      // API 응답 구조에 맞게 수정
      if (response.data && Array.isArray(response.data)) {
        setDiaries(response.data);
      } else if (response.diaries && Array.isArray(response.diaries)) {
        setDiaries(response.diaries);
      } else if (Array.isArray(response)) {
        setDiaries(response);
      } else {
        throw new Error('Invalid response format');
      }
      
      // 페이지네이션 정보
      if (response.meta) {
        setTotalPages(response.meta.totalPages || 1);
      } else if (response.totalPages) {
        setTotalPages(response.totalPages);
      }
      
    } catch (err) {
      console.error('Failed to fetch diaries:', err);
      setError('일기를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">일기를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="text-red-500">{error}</div>
        <button 
          onClick={() => fetchDiaries()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">내 일기</h1>
        <button
          onClick={() => router.push('/diaries/new')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          새 일기 작성
        </button>
      </div>

      {diaries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          아직 작성한 일기가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {diaries.map((diary) => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Dashboard Mock 데이터 제거

**3-1. StrengthRadar 컴포넌트**
**파일**: `frontend/src/app/dashboard/components/StrengthRadar.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { diaryApi } from '@/lib/api/diary';
// Mock import 제거!
// import { mockStrengthData } from '@/mocks/dashboard.mock';

export default function StrengthRadar() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await diaryApi.getStats();
        
        // stats.strengthDistribution을 Radar 차트 형식으로 변환
        const labels = stats.strengthDistribution.map(s => s.strength);
        const values = stats.strengthDistribution.map(s => s.count);
        
        setData({
          labels,
          datasets: [{
            label: '강점 분포',
            data: values,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgb(99, 102, 241)',
            pointBackgroundColor: 'rgb(99, 102, 241)',
          }],
        });
      } catch (error) {
        console.error('Failed to fetch strength data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return <Radar data={data} />;
}
```

**3-2. 나머지 Dashboard 컴포넌트들도 동일하게 수정**
- EmotionTrend.tsx
- WeeklyHeatmap.tsx  
- GrowthProgress.tsx

### Step 4: 백엔드 API 응답 형식 확인

**파일**: `backend/src/api/controllers/diary.controller.ts`

list 메서드 수정:
```typescript
async list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, startDate, endDate, mood, tags } = req.query;
    
    const options = {
      page: Number(page),
      limit: Number(limit),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      mood: mood as string,
      tags: tags ? (tags as string).split(',') : undefined,
    };
    
    const result = await this.diaryService.findByUser(userId, options);
    
    // 통일된 응답 형식
    sendSuccess(res, result.diaries, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}
```

### Step 5: 통계 API 구현 확인

**파일**: `backend/src/api/routes/diary.routes.ts`

stats 라우트 확인:
```typescript
router.get('/stats', authenticate, diaryController.getStats);
```

**파일**: `backend/src/api/controllers/diary.controller.ts`

getStats 메서드 추가/수정:
```typescript
async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const stats = await this.diaryService.getStats(userId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
```

## 📋 작업 체크리스트

### 1. 일기 목록 오류 해결
- [ ] 백엔드 로그에서 정확한 에러 확인
- [ ] Frontend diary.ts API 호출 확인
- [ ] 일기 목록 페이지 Mock import 제거
- [ ] API 응답 형식과 Frontend 파싱 로직 일치 확인

### 2. Dashboard Mock 데이터 제거
- [ ] StrengthRadar.tsx Mock 제거 및 실제 API 연결
- [ ] EmotionTrend.tsx Mock 제거 및 실제 API 연결
- [ ] WeeklyHeatmap.tsx Mock 제거 및 실제 API 연결
- [ ] GrowthProgress.tsx Mock 제거 및 실제 API 연결

### 3. 백엔드 API 확인
- [ ] GET /api/v1/diaries 응답 형식 확인
- [ ] GET /api/v1/diaries/stats 엔드포인트 구현 확인
- [ ] 에러 핸들링 개선

### 4. 테스트
- [ ] 일기 작성 → 목록 확인
- [ ] Dashboard 각 컴포넌트 데이터 표시 확인
- [ ] 페이지네이션 동작 확인

## 🎯 성공 기준
- ✅ 일기 목록이 정상적으로 표시됨
- ✅ Dashboard에 실제 통계 데이터 표시
- ✅ Mock 데이터 import가 코드에서 완전히 제거됨
- ✅ 모든 API 호출이 실제 백엔드로 연결됨

## 💡 디버깅 팁

### 1. Network 탭 확인
- GET /api/v1/diaries 요청/응답 확인
- 응답 데이터 구조 확인

### 2. Console 로그 추가
```typescript
console.log('API Response:', response);
console.log('Response type:', typeof response);
console.log('Response keys:', Object.keys(response));
```

### 3. 백엔드 응답 형식 통일
```typescript
// 성공 응답 형식
{
  "success": true,
  "data": [...],  // 또는 { diaries: [...] }
  "meta": {
    "page": 1,
    "totalPages": 5,
    "total": 50
  }
}
```

---

**작성일**: 2025-01-29
**작성자**: Claude
**우선순위**: 🔥 최우선
**예상 소요시간**: 1-2시간
**다음 작업**: 프로덕션 배포 준비