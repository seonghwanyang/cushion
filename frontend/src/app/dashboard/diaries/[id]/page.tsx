'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { diaryApi, MoodType } from '@/lib/api/diary.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DiaryAnalysis } from '@/components/diary/DiaryAnalysis'
import { ArrowLeft, Calendar, Hash } from 'lucide-react'

const moodEmojis: Record<MoodType, string> = {
  HAPPY: '😊',
  SAD: '😢',
  ANGRY: '😠',
  ANXIOUS: '😰',
  NEUTRAL: '😐',
  EXCITED: '🤩',
  GRATEFUL: '🙏',
  STRESSED: '😫',
  PEACEFUL: '😌',
  HOPEFUL: '🤗',
}

const moodColors: Record<MoodType, string> = {
  HAPPY: 'bg-yellow-100 text-yellow-800',
  SAD: 'bg-blue-100 text-blue-800',
  ANGRY: 'bg-red-100 text-red-800',
  ANXIOUS: 'bg-purple-100 text-purple-800',
  NEUTRAL: 'bg-gray-100 text-gray-800',
  EXCITED: 'bg-orange-100 text-orange-800',
  GRATEFUL: 'bg-green-100 text-green-800',
  STRESSED: 'bg-pink-100 text-pink-800',
  PEACEFUL: 'bg-cyan-100 text-cyan-800',
  HOPEFUL: 'bg-indigo-100 text-indigo-800',
}

interface DiaryDetailPageProps {
  params: {
    id: string
  }
}

export default function DiaryDetailPage({ params }: DiaryDetailPageProps) {
  const router = useRouter()
  const { id } = params

  const { data, isLoading, error } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryApi.getById(id),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/diaries">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/diaries">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              일기를 불러올 수 없습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/diaries">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            수정
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            삭제
          </Button>
        </div>
      </div>

      {/* Diary Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {format(new Date(data.createdAt), 'yyyy년 M월 d일 (EEEE)', {
                  locale: ko,
                })}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(data.createdAt), 'HH:mm', { locale: ko })}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                moodColors[data.mood]
              }`}
            >
              <span className="text-lg">{moodEmojis[data.mood]}</span>
              <span>{data.mood}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{data.content}</p>
          </div>
          
          {data.tags.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">태그</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <DiaryAnalysis 
        analysis={(data as any).insight} 
        isLoading={false}
      />
    </div>
  )
}