# TASK_019: 서버 성능 최적화 및 로딩 속도 개선

## 🐌 현재 문제
- 서버 시작 후 첫 페이지 로딩이 느림
- TypeScript 컴파일 시간이 오래 걸림
- 개발 환경에서도 답답한 속도

## 🚀 해결 방법

### 1. Backend 최적화

#### 1-1. SWC 사용 (TypeScript 컴파일 10배 빠르게)
```bash
cd backend
pnpm add -D @swc/core @swc/cli
```

**파일**: `backend/tsconfig.json`
```json
{
  "ts-node": {
    "swc": true,
    "transpileOnly": true
  }
}
```

#### 1-2. Nodemon 설정 개선
**파일**: `backend/nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts", "node_modules"],
  "exec": "node -r @swc-node/register ./src/server.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### 1-3. Prisma Client 사전 생성
```bash
# postinstall script 추가
# package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### 2. Frontend 최적화

#### 2-1. Next.js Turbopack 사용 (실험적)
```bash
# package.json
"scripts": {
  "dev": "next dev --turbo"
}
```

#### 2-2. 동적 import 사용
```typescript
// Dashboard 컴포넌트 lazy loading
const StrengthRadar = dynamic(() => import('./components/StrengthRadar'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

### 3. 프로덕션 빌드로 테스트

```bash
# Backend
cd backend
pnpm build
pnpm start

# Frontend
cd frontend
pnpm build
pnpm start
```

프로덕션 빌드는 훨씬 빠름!

---

**예상 개선 효과**:
- TypeScript 컴파일: 5-10초 → 0.5-1초
- 첫 페이지 로딩: 10-15초 → 2-3초

## 🐛 추가 버그 수정

### 4. 일기 상세보기 페이지 오류

**문제**: `RangeError: Invalid time value` - createdAt이 유효하지 않은 날짜 형식

**원인**: 
- Backend에서 날짜가 문자열로 전달되지 않고 있음
- 또는 null/undefined 값이 전달됨

**해결방법**:

#### 4-1. 안전한 날짜 파싱
**파일**: `frontend/src/app/dashboard/diaries/[id]/page.tsx`
```typescript
// 날짜 파싱 헬퍼 함수 추가
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
};

// 사용
<CardTitle className="text-2xl">
  {format(parseDate(data.createdAt), 'yyyy년 M월 d일 (EEEE)', {
    locale: ko,
  })}
</CardTitle>
```

#### 4-2. Backend 응답 확인
**파일**: `backend/src/api/controllers/diary.controller.ts`
```typescript
async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const diary = await this.diaryService.findById(id, userId);
    
    // 날짜 형식 확인
    const response = {
      ...diary,
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
    };
    
    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}
```

### 5. 일기 수정/삭제 기능 구현

#### 5-1. 일기 목록에 수정/삭제 버튼 추가
**파일**: `frontend/src/app/dashboard/diaries/page.tsx`
```typescript
import { Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 컴포넌트 내부
const router = useRouter();

const handleEdit = (id: string) => {
  router.push(`/dashboard/diaries/${id}/edit`);
};

const handleDelete = async (id: string) => {
  if (!confirm('정말로 이 일기를 삭제하시겠습니까?')) return;
  
  try {
    await diaryApi.delete(id);
    refetch();
  } catch (error) {
    alert('삭제 중 오류가 발생했습니다.');
  }
};

// 카드 내부에 버튼 추가
<CardContent>
  <p className="text-gray-700 line-clamp-3">{diary.content}</p>
  {diary.tags.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {diary.tags.map((tag) => (
        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
          #{tag}
        </span>
      ))}
    </div>
  )}
  <div className="mt-4 flex items-center justify-between">
    <Link href={`/dashboard/diaries/${diary.id}`}>
      <Button variant="link" className="p-0">
        자세히 보기 →
      </Button>
    </Link>
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(diary.id)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(diary.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
</CardContent>
```

#### 5-2. 상세 페이지 수정/삭제 기능 활성화
**파일**: `frontend/src/app/dashboard/diaries/[id]/page.tsx`
```typescript
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

const router = useRouter();

const deleteMutation = useMutation({
  mutationFn: () => diaryApi.delete(id),
  onSuccess: () => {
    router.push('/dashboard/diaries');
  },
  onError: () => {
    alert('삭제 중 오류가 발생했습니다.');
  },
});

const handleEdit = () => {
  router.push(`/dashboard/diaries/${id}/edit`);
};

const handleDelete = () => {
  if (confirm('정말로 이 일기를 삭제하시겠습니까?')) {
    deleteMutation.mutate();
  }
};

// 버튼에 이벤트 연결
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={handleEdit}>
    수정
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    className="text-destructive"
    onClick={handleDelete}
    disabled={deleteMutation.isPending}
  >
    {deleteMutation.isPending ? '삭제 중...' : '삭제'}
  </Button>
</div>
```

#### 5-3. 일기 수정 페이지 생성
**파일**: `frontend/src/app/dashboard/diaries/[id]/edit/page.tsx`
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { diaryApi } from '@/lib/api/diary'
import DiaryForm from '@/components/diary/DiaryForm'

export default function EditDiaryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryApi.getById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => diaryApi.update(id, data),
    onSuccess: () => {
      router.push(`/dashboard/diaries/${id}`);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!diary) return <div>일기를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">일기 수정</h1>
      <DiaryForm
        initialData={{
          content: diary.content,
          mood: diary.mood,
          tags: diary.tags,
        }}
        onSubmit={(data) => updateMutation.mutate(data)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
```

## 📋 작업 체크리스트

1. [ ] 서버 성능 최적화 (SWC 설치)
2. [ ] 일기 상세보기 날짜 오류 수정
3. [ ] 일기 목록에 수정/삭제 버튼 추가
4. [ ] 일기 상세 페이지 수정/삭제 기능 활성화
5. [ ] 일기 수정 페이지 생성
6. [ ] API 응답 형식 확인 (날짜 형식)