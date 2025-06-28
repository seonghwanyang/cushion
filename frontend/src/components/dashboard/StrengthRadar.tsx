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