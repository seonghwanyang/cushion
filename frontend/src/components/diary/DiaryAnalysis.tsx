import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Heart, Target, Lightbulb, TrendingUp } from 'lucide-react';

interface StrengthAnalysis {
  category: 'technical' | 'soft_skills' | 'leadership' | 'creative' | 'analytical';
  name: string;
  evidence: string;
  confidence: number;
}

interface EmotionAnalysis {
  primary: string;
  secondary: string[];
  intensity: number;
}

interface DiaryAnalysis {
  diaryId: string;
  strengths: StrengthAnalysis[];
  emotions: EmotionAnalysis;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  growthAreas: string[];
  insights: string[];
  analyzedAt: Date;
}

interface DiaryAnalysisProps {
  analysis: DiaryAnalysis | null;
  isLoading?: boolean;
}

const categoryIcons = {
  technical: Brain,
  soft_skills: Heart,
  leadership: Target,
  creative: Lightbulb,
  analytical: TrendingUp,
};

const categoryLabels = {
  technical: '기술적 역량',
  soft_skills: '소프트 스킬',
  leadership: '리더십',
  creative: '창의성',
  analytical: '분석력',
};

const sentimentColors = {
  positive: 'text-green-600 bg-green-50',
  negative: 'text-red-600 bg-red-50',
  neutral: 'text-gray-600 bg-gray-50',
  mixed: 'text-blue-600 bg-blue-50',
};

const sentimentLabels = {
  positive: '긍정적',
  negative: '부정적',
  neutral: '중립적',
  mixed: '복합적',
};

export function DiaryAnalysis({ analysis, isLoading }: DiaryAnalysisProps) {
  if (isLoading) {
    return <DiaryAnalysisSkeleton />;
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            아직 분석 결과가 없습니다. 잠시 후 다시 확인해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 강점 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            발견된 강점
          </CardTitle>
          <CardDescription>
            일기에서 발견된 당신의 강점입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.strengths.map((strength, index) => {
            const Icon = categoryIcons[strength.category];
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{strength.name}</span>
                    <Badge variant="secondary">
                      {categoryLabels[strength.category]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {strength.confidence}% 확신도
                  </span>
                </div>
                <Progress value={strength.confidence} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {strength.evidence}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 감정 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            감정 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">주요 감정: {analysis.emotions.primary}</span>
              <Badge
                className={sentimentColors[analysis.sentiment]}
                variant="outline"
              >
                {sentimentLabels[analysis.sentiment]}
              </Badge>
            </div>
            <Progress value={analysis.emotions.intensity} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              감정 강도: {analysis.emotions.intensity}%
            </p>
          </div>
          {analysis.emotions.secondary.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">부가 감정</p>
              <div className="flex flex-wrap gap-2">
                {analysis.emotions.secondary.map((emotion, index) => (
                  <Badge key={index} variant="secondary">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 키워드 & 성장 영역 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>핵심 키워드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>성장 영역</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.growthAreas.map((area, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg text-sm"
              >
                {insight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DiaryAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}