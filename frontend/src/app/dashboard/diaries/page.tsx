'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { diaryApi, MoodType } from '@/lib/api/diary.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function DiariesPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['diaries', page, limit],
    queryFn: () => diaryApi.getList({ page, limit }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-gray-500">일기를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          일기를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!data || data.diaries.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          아직 작성한 일기가 없습니다
        </h2>
        <p className="mt-2 text-gray-600">
          첫 번째 일기를 작성해보세요!
        </p>
        <Link href="/write" className="mt-4 inline-block">
          <Button>일기 쓰기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">내 일기</h1>
        <Link href="/write">
          <Button>새 일기 쓰기</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {data.diaries.map((diary) => (
          <Card key={diary.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {format(new Date(diary.createdAt), 'yyyy년 M월 d일 (EEEE)', {
                    locale: ko,
                  })}
                </CardTitle>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    moodColors[diary.mood]
                  }`}
                >
                  <span>{moodEmojis[diary.mood]}</span>
                  <span>{diary.mood}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 line-clamp-3">{diary.content}</p>
              {diary.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {diary.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <Link href={`/dashboard/diaries/${diary.id}`}>
                <Button variant="link" className="mt-3 p-0">
                  자세히 보기 →
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === data.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}