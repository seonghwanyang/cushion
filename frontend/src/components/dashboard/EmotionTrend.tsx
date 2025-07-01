'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface EmotionTrendProps {
  data?: Array<{ date: string; mood: string; value: number }>;
  loading?: boolean;
}

export function EmotionTrend({ data, loading }: EmotionTrendProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // API 데이터를 차트 형식으로 변환
  const processData = () => {
    if (!data || data.length === 0) return [];
    
    // 날짜별로 그룹화
    const groupedData = data.reduce((acc, item) => {
      const date = format(new Date(item.date), 'MM/dd');
      if (!acc[date]) {
        acc[date] = { date, positive: 0, neutral: 0, negative: 0 };
      }
      
      // 감정을 긍정/중립/부정으로 분류
      if (['HAPPY', 'EXCITED', 'GRATEFUL', 'PEACEFUL', 'HOPEFUL'].includes(item.mood)) {
        acc[date].positive += item.value;
      } else if (['NEUTRAL'].includes(item.mood)) {
        acc[date].neutral += item.value;
      } else {
        acc[date].negative += item.value;
      }
      
      return acc;
    }, {} as Record<string, { date: string; positive: number; neutral: number; negative: number }>);
    
    return Object.values(groupedData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  const chartData = processData();
  
  if (!loading && chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        감정 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
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