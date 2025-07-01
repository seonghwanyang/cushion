'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils/date'
import { diaryApi, MoodType } from '@/lib/api/diary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Trash2, Eye } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['diaries', page, limit],
    queryFn: async () => {
      const result = await diaryApi.getList({ page, limit });
      console.log('[DiariesPage] API response:', result);
      return result;
    },
    staleTime: 0, // 항상 최신 데이터 가져오기
    refetchOnMount: 'always', // 마운트될 때마다 새로 가져오기
    refetchOnWindowFocus: true, // 포커스될 때마다 새로 가져오기
  })

  // 페이지가 포커스될 때마다 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refetch()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetch])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => diaryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      setDeleteId(null)
    },
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

  if (!data || !data.diaries || data.diaries.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          아직 작성한 일기가 없습니다
        </h2>
        <p className="mt-2 text-gray-600">
          첫 번째 일기를 작성해보세요!
        </p>
        <Link href="/dashboard/write" className="mt-4 inline-block">
          <Button>일기 쓰기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">내 일기</h1>
        <Link href="/dashboard/write">
          <Button>새 일기 쓰기</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {data.diaries.map((diary) => (
          <Card key={diary.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {formatDate(diary.createdAt, 'yyyy년 M월 d일 (EEEE)')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(diary.createdAt, 'HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      moodColors[diary.mood]
                    }`}
                  >
                    <span>{moodEmojis[diary.mood]}</span>
                    <span>{diary.mood}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 line-clamp-3">{diary.content}</p>
              {diary.tags && diary.tags.length > 0 && (
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
              <div className="flex items-center justify-between mt-3">
                <Link href={`/dashboard/diaries/${diary.id}`}>
                  <Button variant="link" className="p-0">
                    <Eye className="h-4 w-4 mr-1" />
                    자세히 보기
                  </Button>
                </Link>
                <div className="flex gap-1">
                  <Link href={`/dashboard/diaries/${diary.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteId(diary.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일기를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 일기와 관련된 모든 분석 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}