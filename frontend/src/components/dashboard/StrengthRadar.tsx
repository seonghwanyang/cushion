'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface StrengthRadarProps {
  data?: Array<{ strength: string; count: number }>;
  loading?: boolean;
}

export function StrengthRadar({ data, loading }: StrengthRadarProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // API 데이터를 Radar 차트 형식으로 변환
  const chartData = data?.map(item => ({
    category: item.strength,
    value: item.count * 20, // count를 0-100 스케일로 변환
    fullMark: 100,
  })) || [];
  
  if (!loading && chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        아직 분석된 강점이 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
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