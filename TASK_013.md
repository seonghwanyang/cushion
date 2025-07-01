# TASK_013: Supabase Auth로 인증 시스템 전환

## 목표
현재 자체 JWT 기반 인증 시스템을 Supabase Auth로 완전히 전환하여 프로덕션 준비를 완료합니다.

## 현재 상황
- Backend에서 자체 JWT 토큰 발행 중
- Google OAuth redirect_uri_mismatch 오류 발생
- Supabase 프로젝트는 이미 생성되어 있음

## 주요 변경사항

### 1. Frontend 변경사항

#### A. Supabase 클라이언트 설정 확인
**파일**: `frontend/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

#### B. 인증 API 클라이언트 수정
**파일**: `frontend/src/lib/api/auth.ts`
- 기존 Backend API 호출을 Supabase Auth로 변경
- 로그인, 회원가입, 로그아웃 메서드 수정

```typescript
import { supabase } from '@/lib/supabase'

export const authApi = {
  // 이메일 회원가입
  async register(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name } // 메타데이터로 이름 저장
      }
    })
    return { data, error }
  },

  // 이메일 로그인
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Google 로그인
  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  // 로그아웃
  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 현재 사용자 가져오기
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 세션 가져오기
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}
```

#### C. API 클라이언트 인터셉터 수정
**파일**: `frontend/src/lib/api/client.ts`
```typescript
import axios from 'axios'
import { supabase } from '@/lib/supabase'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Request 인터셉터 - Supabase 토큰 추가
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  
  return config
})

// Response 인터셉터 - 401 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

#### D. 인증 페이지 수정
**파일**: `frontend/src/app/auth/register/page.tsx`
- authApi.register 호출 방식 변경
- 에러 처리 로직 수정
- 성공 시 자동 로그인 처리

**파일**: `frontend/src/app/auth/login/page.tsx`
- authApi.login 호출 방식 변경
- Google 로그인 버튼 수정

**파일**: `frontend/src/app/auth/callback/page.tsx`
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=' + error.message)
      } else {
        router.push('/dashboard')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cushion-orange mx-auto"></div>
      </div>
    </div>
  )
}
```

#### E. Auth Store 수정
**파일**: `frontend/src/lib/stores/auth.store.ts`
- Supabase 세션 기반으로 변경
- onAuthStateChange 리스너 추가

#### F. Middleware 수정
**파일**: `frontend/src/middleware.ts`
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 보호된 라우트
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // 인증된 사용자가 auth 페이지 접근 시
  if (req.nextUrl.pathname.startsWith('/auth/') && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}
```

### 2. Backend 변경사항

#### A. Supabase Admin 클라이언트 설정
**파일**: `backend/src/lib/supabase-admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

#### B. Auth Middleware 수정
**파일**: `backend/src/middlewares/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Supabase 토큰 검증
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // req.user에 Supabase user 객체 저장
    req.user = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || 'User'
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

#### C. Auth Routes 제거/수정
**파일**: `backend/src/routes/auth.routes.ts`
- 기존 register, login, refresh 엔드포인트 제거
- Google OAuth 관련 엔드포인트 제거
- /me 엔드포인트는 유지 (Supabase 토큰 기반)

#### D. User Service 수정
**파일**: `backend/src/services/user.service.ts`
- Supabase Auth와 동기화
- 사용자 생성 시 Supabase user.id 사용

### 3. Database 스키마 수정

#### A. Users 테이블 수정
```sql
-- Supabase Auth와 연동
ALTER TABLE users 
ADD COLUMN supabase_id UUID UNIQUE,
ADD CONSTRAINT fk_supabase_user 
  FOREIGN KEY (supabase_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 기존 password 컬럼 제거 (선택사항)
ALTER TABLE users DROP COLUMN password;
```

#### B. Prisma 스키마 업데이트
**파일**: `backend/prisma/schema.prisma`
```prisma
model User {
  id           String    @id @default(cuid())
  supabaseId   String    @unique @map("supabase_id")
  email        String    @unique
  name         String
  profileImage String?   @map("profile_image")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  
  diaries      Diary[]
  
  @@map("users")
}
```

### 4. 환경 변수 정리

#### Frontend `.env.local`
```env
# 기존 변수 유지
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://hfhqctnrcesbulljsbwt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 제거할 변수
# NEXT_PUBLIC_GOOGLE_CLIENT_ID (Supabase 대시보드에서 관리)
```

#### Backend `.env.local`
```env
# 기존 변수 유지
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...

# Supabase Admin
SUPABASE_URL=https://hfhqctnrcesbulljsbwt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 제거할 변수
# JWT_SECRET
# JWT_REFRESH_SECRET
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# USE_MOCK_AUTH (항상 false)
```

### 5. 테스트 시나리오

1. **이메일 회원가입 테스트**
   - 새 계정으로 회원가입
   - 자동 로그인 확인
   - Dashboard 접근 확인

2. **이메일 로그인 테스트**
   - 기존 계정으로 로그인
   - 세션 유지 확인
   - 새로고침 후에도 로그인 유지

3. **Google 로그인 테스트**
   - Google OAuth 로그인
   - Callback 처리 확인
   - 사용자 정보 동기화

4. **API 인증 테스트**
   - 일기 작성 API 호출
   - 인증 토큰 확인
   - 401 에러 처리

5. **로그아웃 테스트**
   - 로그아웃 기능
   - 세션 삭제 확인
   - Protected route 접근 차단

## 주의사항

1. **Supabase 대시보드 설정**
   - Google OAuth Provider 활성화 필요
   - Redirect URL 설정: `http://localhost:3000/auth/callback`
   - Site URL 설정: `http://localhost:3000`

2. **기존 사용자 마이그레이션**
   - 기존 JWT 사용자는 재가입 필요
   - 또는 마이그레이션 스크립트 작성

3. **보안 고려사항**
   - Service Role Key는 Backend에서만 사용
   - Anon Key는 Frontend에서 사용
   - RLS (Row Level Security) 정책 설정 권장

## 완료 기준

- [ ] 이메일 회원가입/로그인 작동
- [ ] Google OAuth 로그인 작동
- [ ] 인증된 API 호출 성공
- [ ] 로그아웃 및 세션 관리 작동
- [ ] 기존 JWT 관련 코드 제거

---

**작성일**: 2025-01-29
**우선순위**: 매우 높음
**예상 소요시간**: 3-4시간