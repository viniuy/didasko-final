import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';

// Define public paths that don't require authentication
const publicPaths = ['/', '/api/auth/signin', '/api/auth/callback'];

// Define role-based access control
const roleBasedAccess = {
  [Role.ADMIN]: ['/dashboard/admin'],
  [Role.FACULTY]: ['/dashboard/faculty'],
  [Role.ACADEMIC_HEAD]: ['/dashboard/academic-head'],
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
    // Store the attempted URL to redirect back after login
    const url = new URL('/', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // For dashboard routes, check role-based access
  if (pathname.startsWith('/dashboard')) {
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
