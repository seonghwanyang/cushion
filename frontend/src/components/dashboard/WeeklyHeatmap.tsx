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