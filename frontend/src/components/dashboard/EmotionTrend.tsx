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