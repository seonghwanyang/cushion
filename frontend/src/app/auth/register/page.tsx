'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authApi } from '@/lib/api/auth'
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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const { passwordConfirm, ...registerData } = data
      const result = await authApi.register(registerData)
      
      if (result.error) {
        setError(result.error.message || '회원가입에 실패했습니다')
        return
      }

      // 회원가입 성공
      setSuccess(true)
      
      // Supabase는 이메일 확인이 필요할 수 있음
      if (result.session) {
        // 세션이 있으면 자동 로그인되었으므로 대시보드로 이동
        router.push('/dashboard')
        router.refresh()
      } else {
        // 이메일 확인이 필요한 경우
        setError('가입 확인 이메일을 발송했습니다. 이메일을 확인해주세요.')
      }
    } catch (err: any) {
      console.error('Register error:', err)
      setError(err.message || '회원가입 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (success && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">회원가입 완료</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.
          </p>
          <Button 
            className="w-full mt-4" 
            onClick={() => router.push('/auth/login')}
          >
            로그인 페이지로 이동
          </Button>
        </CardContent>
      </Card>
    )
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
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            {errors.passwordConfirm && (
              <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>
          {error && (
            <div className={`rounded-md p-3 ${error.includes('이메일을 확인') ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${error.includes('이메일을 확인') ? 'text-blue-800' : 'text-red-800'}`}>
                {error}
              </p>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입'}
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