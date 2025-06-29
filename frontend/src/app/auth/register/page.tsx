'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  name: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["passwordConfirm"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      console.log('[RegisterPage] Success data:', data);
      login(data.user, data.tokens.accessToken, data.tokens.refreshToken)
      router.push('/dashboard/diaries')
    },
    onError: (error: any) => {
      console.error('[RegisterPage] Error:', error);
      console.error('[RegisterPage] Error response:', error.response);
      setError(error.response?.data?.error?.message || error.response?.data?.message || '회원가입에 실패했습니다')
    },
  })

  const onSubmit = (data: RegisterFormData) => {
    setError(null)
    const { passwordConfirm, ...registerData } = data
    registerMutation.mutate(registerData)
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>
          새로운 계정을 만들어주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 (선택)</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              {...register('name')}
              disabled={registerMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={registerMutation.isPending}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              disabled={registerMutation.isPending}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              {...register('passwordConfirm')}
              disabled={registerMutation.isPending}
            />
            {errors.passwordConfirm && (
              <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>
        
        <GoogleSignInButton className="w-full" />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}