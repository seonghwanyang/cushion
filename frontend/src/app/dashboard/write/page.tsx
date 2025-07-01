'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { diaryApi, MoodType } from '@/lib/api/diary'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function WriteDiaryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      mood: 'NEUTRAL',
    },
  })

  const selectedMood = watch('mood')

  const createDiaryMutation = useMutation({
    mutationFn: diaryApi.create,
    onSuccess: () => {
      // 일기 목록 캐시 무효화 - 모든 diary 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diary-stats'] })
      queryClient.invalidateQueries({ queryKey: ['recent-diaries'] })
      // 일기 목록 페이지로 이동
      router.push('/dashboard/diaries')
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || '일기 작성에 실패했습니다')
    },
  })

  const onSubmit = (data: DiaryFormData) => {
    setError(null)
    const tags = data.tags
      ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : []
    
    createDiaryMutation.mutate({
      content: data.content,
      mood: data.mood,
      tags,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>오늘의 일기</CardTitle>
          <CardDescription>
            오늘 하루는 어떠셨나요? 솔직한 감정을 기록해보세요.
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
                disabled={createDiaryMutation.isPending}
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
                disabled={createDiaryMutation.isPending}
              />
              <p className="text-xs text-gray-500">
                태그를 추가하면 나중에 일기를 찾기 쉬워요
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createDiaryMutation.isPending}
              >
                {createDiaryMutation.isPending ? '저장 중...' : '일기 저장'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={createDiaryMutation.isPending}
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