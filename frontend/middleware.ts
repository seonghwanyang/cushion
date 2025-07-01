import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for static files and API routes
  const path = req.nextUrl.pathname
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  console.log('[Middleware] Path:', path)

  // Create a response that we can modify
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    const supabase = createMiddlewareClient({ req, res })
    
    // Get and refresh session
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[Middleware] Session error:', error)
    }

    console.log('[Middleware] Session exists:', !!session)

    // Define protected routes
    const isProtectedRoute = path.startsWith('/dashboard') || 
                            path.startsWith('/profile') ||
                            path.startsWith('/settings')

    // Define auth routes
    const isAuthRoute = path.startsWith('/auth/')

    // If user is not authenticated and trying to access protected route
    if (!session && isProtectedRoute) {
      console.log('[Middleware] Redirecting to login, no session for protected route')
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth routes (except callback)
    if (session && isAuthRoute && !path.includes('/callback')) {
      console.log('[Middleware] Redirecting to dashboard, session exists for auth route')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // IMPORTANT: Return the response to ensure cookies are set
    return res
  } catch (error) {
    console.error('[Middleware] Error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}