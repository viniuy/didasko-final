import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Role } from '@/lib/types';

// Define public paths that don't require authentication
const publicPaths = ['/', '/login', '/api/auth/login'];

// Define role-based access control
const roleBasedAccess: Record<Role, string[]> = {
  [Role.ADMIN]: ['/dashboard/admin', '/grading'],
  [Role.FACULTY]: ['/dashboard/faculty', '/grading'],
  [Role.ACADEMIC_HEAD]: ['/dashboard/academic-head', '/grading'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public paths without authentication
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the token from the cookie
  const token = request.cookies.get('auth-token')?.value;

  // Check if user is authenticated
  if (!token || !verifyToken(token)) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For API routes, allow the request to proceed if authenticated
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For dashboard and grading routes, check role-based access
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/grading')) {
    const userData = verifyToken(token);
    const role = userData?.role as Role;
    const allowedPaths = roleBasedAccess[role] || [];

    if (!allowedPaths.some((path) => pathname.startsWith(path))) {
      // Redirect to appropriate dashboard if trying to access unauthorized path
      const redirectPath = allowedPaths[0] || '/';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
