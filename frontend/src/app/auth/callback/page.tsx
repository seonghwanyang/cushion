'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore((state) => state.login)
  
  useEffect(() => {
    const handleCallback = async () => {
      if (!isSupabaseConfigured()) {
        setError('Supabase가 구성되지 않았습니다.')
        return
      }

      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase!.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('인증 처리 중 오류가 발생했습니다.')
          return
        }
        
        if (!session) {
          console.error('No session found')
          setError('세션을 찾을 수 없습니다.')
          return
        }
        
        // Store the user data in our auth store
        const user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || null,
          profileImage: session.user.user_metadata?.avatar_url || null,
          role: 'USER' as const,
          status: 'ACTIVE' as const
        }
        
        // Use the Supabase session tokens
        login(user, session.access_token, session.refresh_token!)
        
        // TODO: Sync user data with backend database
        // This would involve calling your backend API to create/update the user record
        
        // Redirect to the intended page or dashboard
        const next = searchParams.get('next') || '/dashboard'
        router.push(next)
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('인증 처리 중 오류가 발생했습니다.')
      }
    }
    
    handleCallback()
  }, [router, searchParams, login])
  
  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">인증 오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/auth/login"
            className="text-primary hover:underline"
          >
            로그인 페이지로 돌아가기
          </a>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">인증 처리 중입니다...</p>
        </div>
      </CardContent>
    </Card>
  )
}