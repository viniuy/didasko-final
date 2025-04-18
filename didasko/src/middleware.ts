import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@/lib/types';

// Define public paths that don't require authentication
const publicPaths = [
  '/',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/session',
];

// Define role-based access control
const roleBasedAccess: Record<Role, string[]> = {
  [Role.ADMIN]: ['/dashboard/admin', '/grading'],
  [Role.FACULTY]: ['/dashboard/faculty', '/grading'],
  [Role.ACADEMIC_HEAD]: ['/dashboard/academic-head', '/grading'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Allow access to public paths without authentication
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    // Redirect to Google sign-in
    const url = new URL('/api/auth/signin/google', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // For dashboard and grading routes, check role-based access
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/grading')) {
    const role = token.role as Role;
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
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
