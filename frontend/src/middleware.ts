/**
 * Next.js Middleware
 * Implements route protection and authentication flow
 * Redirects unauthenticated users away from protected routes
 */

import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/signin', '/signup', '/']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/tasks', '/chat', '/profile']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If it's a protected route, check for auth token
  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value

    // No token found, redirect to signin
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if ((pathname.startsWith('/signin') || pathname.startsWith('/signup')) && request.cookies.get('auth_token')?.value) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Apply middleware to specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
