import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/diaries') || 
                          request.nextUrl.pathname.startsWith('/write')
  
  // For now, we'll let the client-side handle auth redirects
  // In a real app, you'd check cookies/tokens here
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register', '/diaries/:path*', '/write/:path*'],
}