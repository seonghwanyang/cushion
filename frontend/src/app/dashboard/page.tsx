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
    queryFn: () => diaryApi.getStats(),
  });

  const { data: weeklyInsight, isLoading: insightLoading } = useQuery({
    queryKey: ['weekly-insight'],
    queryFn: () => insightApi.getWeekly(),
  });

  const { data: recentDiaries } = useQuery({
    queryKey: ['recent-diaries'],
    queryFn: () => diaryApi.getList({ limit: 5 }),
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
          loading={isLoading}
        />
        <StatsCard
          title="연속 작성"
          value={stats?.currentStreak || 0}
          suffix="일"
          icon={Activity}
          color="green"
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
                    {weeklyInsight.consistentStrengths?.slice(0, 3).map((strength, idx) => (
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
                    {weeklyInsight.keyAchievements?.slice(0, 3).map((achievement, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-1 text-green-600" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 추천사항 */}
              {weeklyInsight.recommendations?.[0] && (
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
            <WeeklyHeatmap diaries={recentDiaries?.diaries || []} />
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
          {recentDiaries?.diaries?.map((diary) => (
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
          )) || (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                아직 작성한 일기가 없습니다.
              </CardContent>
            </Card>
          )}
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