# Task 009: UI/UX 개선 및 사용자 경험 향상

## 📋 작업 개요

**작업 ID**: 009  
**작업명**: UI/UX 개선 및 핵심 사용자 경험 향상  
**예상 소요시간**: 4-5시간  
**우선순위**: 🟡 High (사용자 만족도)  
**선행 작업**: Task 001-008 (완료됨)

## 🎯 목표

1. 주간/월간 대시보드 구현
2. 성장 시각화 (차트, 그래프)
3. 애니메이션 및 트랜지션 추가
4. 반응형 디자인 최적화
5. 로딩/에러/빈 상태 개선
6. 다크 모드 지원

## 📋 작업 내용

### 1. 대시보드 메인 페이지

#### `frontend/src/app/dashboard/page.tsx`
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Calendar, 
  Brain, 
  Target,
  ChevronRight,
  Sparkles,
  BarChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { diaryApi } from '@/lib/api/diary';
import { insightApi } from '@/lib/api/insight';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { StrengthRadar } from '@/components/dashboard/StrengthRadar';
import { EmotionTrend } from '@/components/dashboard/EmotionTrend';
import { WeeklyHeatmap } from '@/components/dashboard/WeeklyHeatmap';
import { GrowthProgress } from '@/components/dashboard/GrowthProgress';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['diary-stats'],
    queryFn: () => diaryApi.stats(),
  });

  const { data: weeklyInsight, isLoading: insightLoading } = useQuery({
    queryKey: ['weekly-insight'],
    queryFn: () => insightApi.getWeekly(),
  });

  const { data: recentDiaries } = useQuery({
    queryKey: ['recent-diaries'],
    queryFn: () => diaryApi.list({ limit: 5 }),
  });

  const isLoading = statsLoading || insightLoading;

  // 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 헤더 섹션 */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              대시보드
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>
          <Link href="/dashboard/write">
            <Button className="cushion-button group">
              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
              오늘의 일기 쓰기
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 통계 카드 */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <StatsCard
          title="총 일기 수"
          value={stats?.totalCount || 0}
          icon={Calendar}
          color="blue"
          trend={+15}
          loading={isLoading}
        />
        <StatsCard
          title="연속 작성"
          value={stats?.currentStreak || 0}
          suffix="일"
          icon={Activity}
          color="green"
          trend={+3}
          loading={isLoading}
        />
        <StatsCard
          title="발견한 강점"
          value={stats?.totalStrengths || 0}
          suffix="개"
          icon={Target}
          color="orange"
          loading={isLoading}
        />
        <StatsCard
          title="성장 점수"
          value={stats?.growthScore || 0}
          suffix="점"
          icon={TrendingUp}
          color="purple"
          trend={+8}
          loading={isLoading}
        />
      </motion.div>

      {/* 주간 인사이트 */}
      {weeklyInsight && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-cushion-orange/20 bg-gradient-to-br from-cushion-beige/10 to-white dark:to-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cushion-orange" />
                이번 주 AI 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                    핵심 강점
                  </h4>
                  <div className="space-y-2">
                    {weeklyInsight.consistentStrengths.slice(0, 3).map((strength, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cushion-orange" />
                        <span className="text-sm">{strength.strength}</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(strength.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                    주요 성과
                  </h4>
                  <div className="space-y-2">
                    {weeklyInsight.keyAchievements.slice(0, 3).map((achievement, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-1 text-green-600" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 추천사항 */}
              {weeklyInsight.recommendations[0] && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 {weeklyInsight.recommendations[0]}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 시각화 섹션 */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        {/* 강점 레이더 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              강점 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StrengthRadar data={stats?.strengthDistribution} loading={isLoading} />
          </CardContent>
        </Card>

        {/* 감정 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              감정 변화 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmotionTrend data={stats?.emotionTrend} loading={isLoading} />
          </CardContent>
        </Card>
      </motion.div>

      {/* 주간 히트맵 */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>주간 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyHeatmap diaries={recentDiaries?.data || []} />
          </CardContent>
        </Card>
      </motion.div>

      {/* 성장 진행 상황 */}
      {weeklyInsight?.growthProgress && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>성장 영역별 진행 상황</CardTitle>
            </CardHeader>
            <CardContent>
              <GrowthProgress areas={weeklyInsight.growthProgress} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 최근 일기 미리보기 */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">최근 일기</h2>
          <Link href="/dashboard/diaries">
            <Button variant="ghost" size="sm">
              전체 보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {recentDiaries?.data.map((diary) => (
            <motion.div
              key={diary.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={`/dashboard/diaries/${diary.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(diary.createdAt), 'MM월 dd일')}
                        </p>
                        <p className="mt-1 line-clamp-2">{diary.content}</p>
                      </div>
                      {diary.isAnalyzed && (
                        <Brain className="w-4 h-4 text-cushion-orange ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// 통계 카드 컴포넌트
function StatsCard({ 
  title, 
  value, 
  suffix, 
  icon: Icon, 
  color, 
  trend,
  loading 
}: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-2xl font-bold">{value}</p>
                {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
              </div>
              {trend && (
                <p className="text-xs text-green-600 mt-1">
                  +{trend}% 지난주 대비
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

### 2. 차트 컴포넌트들

#### `frontend/src/components/dashboard/StrengthRadar.tsx`
```typescript
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface StrengthRadarProps {
  data?: {
    category: string;
    value: number;
    fullMark: number;
  }[];
  loading?: boolean;
}

export function StrengthRadar({ data, loading }: StrengthRadarProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // Mock 데이터 (실제로는 API에서 가져옴)
  const mockData = data || [
    {
      category: '기술력',
      value: 85,
      fullMark: 100,
    },
    {
      category: '리더십',
      value: 70,
      fullMark: 100,
    },
    {
      category: '창의성',
      value: 90,
      fullMark: 100,
    },
    {
      category: '소통능력',
      value: 75,
      fullMark: 100,
    },
    {
      category: '분석력',
      value: 80,
      fullMark: 100,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={mockData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey="category" 
          className="text-sm"
          tick={{ fill: '#6b7280' }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fill: '#6b7280' }}
        />
        <Radar
          name="강점"
          dataKey="value"
          stroke="#FF6B35"
          fill="#FF6B35"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

#### `frontend/src/components/dashboard/EmotionTrend.tsx`
```typescript
'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface EmotionTrendProps {
  data?: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  loading?: boolean;
}

export function EmotionTrend({ data, loading }: EmotionTrendProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // Mock 데이터
  const mockData = data || Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: format(date, 'MM/dd'),
      positive: Math.floor(Math.random() * 40) + 40,
      neutral: Math.floor(Math.random() * 30) + 20,
      negative: Math.floor(Math.random() * 20) + 10,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="positive"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          name="긍정"
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke="#6b7280"
          strokeWidth={2}
          dot={{ fill: '#6b7280', r: 4 }}
          name="중립"
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 4 }}
          name="부정"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### `frontend/src/components/dashboard/WeeklyHeatmap.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tooltip } from '@/components/ui/tooltip';

interface WeeklyHeatmapProps {
  diaries: any[];
}

export function WeeklyHeatmap({ diaries }: WeeklyHeatmapProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 월요일 시작
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayDiaries = diaries.filter(d => 
      isSameDay(new Date(d.createdAt), date)
    );
    
    return {
      date,
      count: dayDiaries.length,
      hasAnalysis: dayDiaries.some(d => d.isAnalyzed),
    };
  });

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-cushion-orange/30';
    if (count === 2) return 'bg-cushion-orange/60';
    return 'bg-cushion-orange';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {format(day.date, 'EEE', { locale: ko })}
            </p>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div
                className={`
                  w-full aspect-square rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${getIntensity(day.count)}
                  ${day.count > 0 ? 'shadow-sm' : ''}
                `}
              />
              {day.hasAnalysis && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              )}
              {isSameDay(day.date, today) && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-cushion-brown rounded-full" />
                </div>
              )}
            </motion.div>
            <p className="text-xs text-gray-500 mt-1">
              {format(day.date, 'd')}
            </p>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
          <span>없음</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cushion-orange/30 rounded" />
          <span>1개</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cushion-orange/60 rounded" />
          <span>2개</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cushion-orange rounded" />
          <span>3개+</span>
        </div>
      </div>
    </div>
  );
}
```

#### `frontend/src/components/dashboard/GrowthProgress.tsx`
```typescript
'use client';

import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, Brain, Target } from 'lucide-react';

interface GrowthProgressProps {
  areas: {
    area: string;
    progress: number;
    evidence: string[];
  }[];
}

export function GrowthProgress({ areas }: GrowthProgressProps) {
  const getIcon = (area: string) => {
    const iconMap: Record<string, any> = {
      '시간 관리': Clock,
      '기술 역량': Brain,
      '리더십': Users,
      '목표 달성': Target,
    };
    return iconMap[area] || TrendingUp;
  };

  const getColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      {areas.map((area, idx) => {
        const Icon = getIcon(area.area);
        const color = getColor(area.progress);
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{area.area}</span>
              </div>
              <span className="text-sm text-gray-600">{area.progress}%</span>
            </div>
            
            <Progress value={area.progress} className="h-2" />
            
            {area.evidence.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  최근 성과: {area.evidence[0]}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
```

### 3. API 추가

#### `frontend/src/lib/api/insight.ts`
```typescript
import { apiClient } from './client';

export const insightApi = {
  getLatest: async () => {
    const response = await apiClient.get('/insights/latest');
    return response.data.data;
  },

  getWeekly: async () => {
    const response = await apiClient.get('/insights/weekly');
    return response.data.data;
  },

  getPortfolio: async () => {
    const response = await apiClient.get('/insights/portfolio');
    return response.data.data;
  },

  list: async (limit: number = 10) => {
    const response = await apiClient.get('/insights', {
      params: { limit }
    });
    return response.data.data;
  },
};
```

### 4. 다크 모드 지원

#### `frontend/src/app/providers.tsx` 수정
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### `frontend/src/components/ui/theme-toggle.tsx`
```typescript
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5. 로딩 상태 개선

#### `frontend/src/components/ui/loading-spinner.tsx`
```typescript
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} border-2 border-cushion-orange border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
```

#### `frontend/src/components/ui/empty-state.tsx`
```typescript
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
```

### 6. 애니메이션 유틸리티

#### `frontend/src/lib/animations.ts`
```typescript
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { type: 'spring', stiffness: 100 }
};

export const slideIn = (direction: 'left' | 'right' | 'up' | 'down') => {
  const directionOffset = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: -100 },
    down: { y: 100 }
  };

  return {
    initial: { ...directionOffset[direction], opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    exit: { ...directionOffset[direction], opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 120 }
  };
};
```

### 7. 반응형 네비게이션

#### `frontend/src/components/navigation/MobileNav.tsx`
```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BookOpen, PenSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: '대시보드', icon: Home },
    { href: '/dashboard/diaries', label: '내 일기', icon: BookOpen },
    { href: '/dashboard/write', label: '일기 쓰기', icon: PenSquare },
    { href: '/dashboard/profile', label: '프로필', icon: User },
  ];

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-40"
            >
              <div className="p-6 mt-16 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg
                          ${isActive 
                            ? 'bg-cushion-orange text-white' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 8. Package.json 업데이트

#### `frontend/package.json` 의존성 추가
```json
{
  "dependencies": {
    // ... 기존 의존성
    "framer-motion": "^10.16.0",
    "recharts": "^2.10.0",
    "next-themes": "^0.2.1",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tooltip": "^1.0.7"
  }
}
```

## 🚀 테스트 시나리오

### 1. 대시보드 확인
- 통계 카드 애니메이션
- 차트 렌더링
- 주간 인사이트 표시
- 반응형 레이아웃

### 2. 테마 전환
- 라이트/다크 모드 전환
- 색상 일관성
- 차트 가독성

### 3. 모바일 테스트
- 반응형 네비게이션
- 터치 인터랙션
- 스크롤 성능

### 4. 애니메이션 성능
- 페이지 전환
- 호버 효과
- 로딩 상태

## ✅ 완료 조건

1. 대시보드에 모든 시각화 요소 표시
2. 다크 모드 완벽 지원
3. 모든 애니메이션 부드럽게 작동
4. 반응형 디자인 (모바일/태블릿/데스크탑)
5. 로딩/에러/빈 상태 처리

## 📝 주의사항

1. **성능**: 차트와 애니메이션이 많으므로 성능 최적화 필요
2. **접근성**: 모든 인터랙티브 요소에 적절한 ARIA 레이블
3. **일관성**: Cushion 브랜드 컬러와 디자인 시스템 유지
4. **사용성**: 모바일에서도 쉽게 사용 가능하도록

## 🔄 다음 단계

UI/UX 개선이 완료되면:
1. 사용자 테스트 및 피드백 수집
2. 성능 최적화
3. PWA 기능 추가
4. 실제 서비스 배포

---
작성일: 2024-01-20
작성자: Cushion AI Assistant