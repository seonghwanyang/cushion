# Task 006: Frontend 초기 설정 및 Mock API 연동

## 📋 작업 개요

**작업 ID**: 006  
**작업명**: Next.js Frontend 설정 및 기본 UI 구현  
**예상 소요시간**: 3-4시간  
**우선순위**: 🔴 Critical (사용자 인터페이스 구축)  
**선행 작업**: Task 005 (완료됨)

## 🎯 목표

1. Next.js 14 App Router 기반 프로젝트 설정
2. Tailwind CSS + shadcn/ui 디자인 시스템 구축
3. 인증 관련 페이지 구현 (로그인/회원가입)
4. 일기 작성 및 목록 페이지 구현
5. Mock API와 완전한 연동

## 📋 작업 내용

### 1. Frontend 프로젝트 초기화

#### Next.js 설정 확인
Frontend 폴더가 이미 있으므로 필요한 파일들을 설정합니다.

#### `frontend/package.json` 업데이트
```json
{
  "name": "@cushion/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.0.0"
  }
}
```

### 2. 프로젝트 구조 설정

```
frontend/
├── src/
│   ├── app/                    # App Router
│   │   ├── (auth)/            # 인증 관련 라우트 그룹
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/       # 대시보드 라우트 그룹
│   │   │   ├── diaries/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── write/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈페이지
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── auth/              # 인증 관련 컴포넌트
│   │   └── diary/             # 일기 관련 컴포넌트
│   ├── lib/
│   │   ├── api/               # API 클라이언트
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── stores/            # Zustand 스토어
│   │   └── utils.ts           # 유틸리티
│   └── types/                 # TypeScript 타입
├── public/
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

### 3. 기본 설정 파일들

#### `frontend/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

#### `frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cushion: {
          brown: "#8B6F47",
          orange: "#FF6B35",
          beige: "#F5E6D3",
          gray: "#6B6B6B",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### `frontend/postcss.config.js`
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. 글로벌 스타일

#### `frontend/src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;
    --primary: 24 47% 42%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 60 4.8% 95.9%;
    --secondary-foreground: 24 9.8% 10%;
    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;
    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 20 5.9% 90%;
    --input: 20 5.9% 90%;
    --ring: 24 47% 42%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 60 9.1% 97.8%;
    --primary-foreground: 24 9.8% 10%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 24 5.7% 82.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Cushion 커스텀 스타일 */
@layer components {
  .cushion-gradient {
    @apply bg-gradient-to-br from-cushion-orange to-cushion-brown;
  }
  
  .cushion-card {
    @apply bg-white rounded-2xl p-6 border border-cushion-beige/20 shadow-sm;
  }
  
  .cushion-button {
    @apply bg-cushion-orange text-white rounded-xl px-6 py-3 font-medium transition-all hover:bg-cushion-brown;
  }
}
```

### 5. API 클라이언트 설정

#### `frontend/src/lib/api/client.ts`
```typescript
import axios from 'axios';
import { getAuthToken, removeAuthToken } from '@/lib/utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - 토큰 추가
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 처리
      removeAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### `frontend/src/lib/api/auth.ts`
```typescript
import { apiClient } from './client';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
```

#### `frontend/src/lib/api/diary.ts`
```typescript
import { apiClient } from './client';

export interface Diary {
  id: string;
  userId: string;
  content: string;
  mood?: string;
  tags: string[];
  isAnalyzed: boolean;
  analyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiaryInput {
  content: string;
  mood?: string;
  tags?: string[];
}

export interface UpdateDiaryInput {
  content?: string;
  mood?: string;
  tags?: string[];
}

export interface DiaryListResponse {
  data: Diary[];
  meta: {
    page: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
  };
}

export const diaryApi = {
  create: async (data: CreateDiaryInput): Promise<Diary> => {
    const response = await apiClient.post('/diaries', data);
    return response.data.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    mood?: string;
    tags?: string;
  }): Promise<DiaryListResponse> => {
    const response = await apiClient.get('/diaries', { params });
    return response.data;
  },

  get: async (id: string): Promise<Diary> => {
    const response = await apiClient.get(`/diaries/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: UpdateDiaryInput): Promise<Diary> => {
    const response = await apiClient.put(`/diaries/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/diaries/${id}`);
  },

  stats: async () => {
    const response = await apiClient.get('/diaries/stats');
    return response.data.data;
  },
};
```

### 6. Zustand Store 설정

#### `frontend/src/lib/stores/auth.store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
      }),

      clearAuth: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 7. UI 컴포넌트 (shadcn/ui)

#### `frontend/src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### `frontend/src/components/ui/button.tsx`
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cushion: "bg-cushion-orange text-white hover:bg-cushion-brown",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 8. 인증 페이지

#### `frontend/src/app/(auth)/login/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data);
      setAuth(response.user, response.tokens);
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
      });
      router.push('/diaries');
    } catch (error: any) {
      toast({
        title: '로그인 실패',
        description: error.response?.data?.error?.message || '다시 시도해주세요',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cushion-beige/20">
      <div className="w-full max-w-md">
        <div className="cushion-card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cushion-brown">Cushion</h1>
            <p className="text-cushion-gray mt-2">당신의 모든 순간이 의미 있습니다</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@cushion.app"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="password123"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="cushion"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-cushion-gray">
              계정이 없으신가요?{' '}
              <Link href="/register" className="text-cushion-orange hover:underline">
                회원가입
              </Link>
            </p>
          </div>

          {/* 개발 모드 힌트 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
              <p className="font-semibold">개발 모드 테스트 계정:</p>
              <p>Email: test@cushion.app</p>
              <p>Password: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 9. 일기 작성 페이지

#### `frontend/src/app/(dashboard)/write/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { diaryApi } from '@/lib/api/diary';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const diarySchema = z.object({
  content: z.string().min(10, '최소 10자 이상 작성해주세요').max(10000),
  mood: z.string().optional(),
  tags: z.string().optional(),
});

type DiaryForm = z.infer<typeof diarySchema>;

const moods = [
  { value: 'HAPPY', label: '😊 행복해요' },
  { value: 'SAD', label: '😢 슬퍼요' },
  { value: 'NEUTRAL', label: '😐 그저 그래요' },
  { value: 'ANXIOUS', label: '😰 불안해요' },
  { value: 'EXCITED', label: '🎉 신나요' },
  { value: 'ANGRY', label: '😠 화나요' },
  { value: 'PEACEFUL', label: '😌 평온해요' },
];

export default function WritePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiaryForm>({
    resolver: zodResolver(diarySchema),
  });

  const selectedMood = watch('mood');

  const onSubmit = async (data: DiaryForm) => {
    try {
      setIsLoading(true);
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      await diaryApi.create({
        content: data.content,
        mood: data.mood,
        tags,
      });

      toast({
        title: '일기 저장 완료',
        description: '오늘의 기록이 저장되었습니다.',
      });
      
      router.push('/diaries');
    } catch (error: any) {
      toast({
        title: '저장 실패',
        description: error.response?.data?.error?.message || '다시 시도해주세요',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cushion-brown">오늘의 일기</h1>
        <p className="text-cushion-gray mt-2">
          오늘 하루를 기록해보세요. 2-3분이면 충분해요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="cushion-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>오늘의 기분은 어떠세요?</Label>
              <Select value={selectedMood} onValueChange={(value) => setValue('mood', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="기분을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">오늘의 이야기</Label>
              <Textarea
                id="content"
                rows={10}
                placeholder="오늘은 어떤 일이 있었나요? 무엇을 느꼈나요? 편하게 적어보세요..."
                {...register('content')}
                disabled={isLoading}
                className="resize-none"
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">태그 (선택사항)</Label>
              <Input
                id="tags"
                placeholder="프로젝트, 회의, 학습 (쉼표로 구분)"
                {...register('tags')}
                disabled={isLoading}
              />
              <p className="text-xs text-cushion-gray">
                오늘의 키워드를 태그로 남겨보세요
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="cushion"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '저장 중...' : '일기 저장하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 10. 레이아웃 설정

#### `frontend/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cushion - 당신의 모든 순간이 의미 있습니다',
  description: 'AI 기반 일기 서비스로 숨겨진 강점을 발견하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

#### `frontend/src/app/(dashboard)/layout.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, clearAuth, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // 에러 무시 (토큰이 이미 만료된 경우 등)
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/diaries" className="text-2xl font-bold text-cushion-brown">
                Cushion
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/diaries"
                  className="text-cushion-gray hover:text-cushion-brown px-3 py-2 rounded-md text-sm font-medium"
                >
                  내 일기
                </Link>
                <Link
                  href="/write"
                  className="text-cushion-gray hover:text-cushion-brown px-3 py-2 rounded-md text-sm font-medium"
                >
                  일기 쓰기
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-cushion-gray">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

## 🚀 실행 및 테스트

### 1. 패키지 설치 및 실행
```bash
# Frontend 디렉토리로 이동
cd frontend

# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

### 2. 테스트 시나리오
1. http://localhost:3000 접속
2. 로그인 페이지에서 테스트 계정으로 로그인
   - Email: test@cushion.app
   - Password: password123
3. 일기 작성 페이지에서 새 일기 작성
4. 일기 목록 페이지에서 작성한 일기 확인

## ✅ 완료 조건

1. Next.js 개발 서버가 정상 실행됨
2. 로그인/회원가입 페이지 접근 가능
3. Mock API와 정상 연동 (로그인 성공)
4. 일기 작성 및 목록 조회 가능
5. 인증 상태 유지 (새로고침 후에도)
6. 로그아웃 기능 정상 작동

## 📝 주의사항

1. **환경 변수**: 
   - API URL은 Next.js rewrites로 프록시 처리
   - CORS 문제 없이 API 호출 가능

2. **상태 관리**:
   - Zustand persist로 인증 정보 로컬 스토리지 저장
   - 새로고침 후에도 로그인 상태 유지

3. **디자인**:
   - Cushion 브랜드 컬러 적용
   - shadcn/ui 컴포넌트 커스터마이징

## 🔄 다음 단계

### Task 007: UI/UX 개선 및 추가 기능
1. 일기 상세 페이지 구현
2. 일기 수정/삭제 기능
3. 로딩 상태 및 에러 처리 개선
4. 반응형 디자인 최적화
5. AI 분석 결과 표시 (Mock)

---
작성일: 2024-01-20
작성자: Cushion AI Assistant