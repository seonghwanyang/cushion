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