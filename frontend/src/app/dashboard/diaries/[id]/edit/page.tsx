'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diaryApi, MoodType } from '@/lib/api/diary'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const diarySchema = z.object({
  content: z.string().min(1, '일기를 작성해주세요'),
  mood: z.enum(['HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'NEUTRAL', 'EXCITED', 'GRATEFUL', 'STRESSED', 'PEACEFUL', 'HOPEFUL'] as const),
  tags: z.string().optional(),
})

type DiaryFormData = z.infer<typeof diarySchema>

const moodOptions: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'HAPPY', label: '행복해요', emoji: '😊' },
  { value: 'SAD', label: '슬퍼요', emoji: '😢' },
  { value: 'ANGRY', label: '화나요', emoji: '😠' },
  { value: 'ANXIOUS', label: '불안해요', emoji: '😰' },
  { value: 'NEUTRAL', label: '그저 그래요', emoji: '😐' },
  { value: 'EXCITED', label: '신나요', emoji: '🤩' },
  { value: 'GRATEFUL', label: '감사해요', emoji: '🙏' },
  { value: 'STRESSED', label: '스트레스 받아요', emoji: '😫' },
  { value: 'PEACEFUL', label: '평화로워요', emoji: '😌' },
  { value: 'HOPEFUL', label: '희망차요', emoji: '🤗' },
]

interface EditDiaryPageProps {
  params: {
    id: string
  }
}

export default function EditDiaryPage({ params }: EditDiaryPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = params
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 기존 일기 데이터 가져오기
  const { data: diary, isLoading, error: queryError } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryApi.getById(id),
  })

  console.log('[EditDiaryPage] ID:', id)
  console.log('[EditDiaryPage] Diary data:', diary)
  console.log('[EditDiaryPage] Loading:', isLoading)
  console.log('[EditDiaryPage] Error:', queryError)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
  })

  // 일기 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (diary) {
      reset({
        content: diary.content,
        mood: diary.mood,
        tags: diary.tags && Array.isArray(diary.tags) ? diary.tags.join(', ') : '',
      })
    }
  }, [diary, reset])

  const selectedMood = watch('mood')

  const updateDiaryMutation = useMutation({
    mutationFn: (data: DiaryFormData) => {
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : []
      
      return diaryApi.update(id, {
        content: data.content,
        mood: data.mood,
        tags,
      })
    },
    onSuccess: () => {
      // 모든 일기 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['diary', id] })
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diary-stats'] })
      queryClient.invalidateQueries({ queryKey: ['recent-diaries'] })
      
      // 일기 목록 페이지로 이동
      router.push('/dashboard/diaries')
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || '일기 수정에 실패했습니다')
    },
  })

  const onSubmit = (data: DiaryFormData) => {
    setSubmitError(null)
    updateDiaryMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cushion-orange mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!diary) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              일기를 찾을 수 없습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일기 수정</CardTitle>
          <CardDescription>
            일기 내용을 수정하세요. 수정 후에도 AI 분석은 유지됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>오늘의 기분</Label>
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('mood', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedMood === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-xs">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">일기 내용</Label>
              <textarea
                id="content"
                {...register('content')}
                className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="오늘 있었던 일, 느꼈던 감정을 자유롭게 적어보세요..."
                disabled={updateDiaryMutation.isPending}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">태그 (선택)</Label>
              <input
                id="tags"
                {...register('tags')}
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="콤마로 구분해서 입력 (예: 일상, 가족, 취미)"
                disabled={updateDiaryMutation.isPending}
              />
              <p className="text-xs text-gray-500">
                태그를 추가하면 나중에 일기를 찾기 쉬워요
              </p>
            </div>

            {submitError && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateDiaryMutation.isPending}
              >
                {updateDiaryMutation.isPending ? '수정 중...' : '일기 수정'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateDiaryMutation.isPending}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}