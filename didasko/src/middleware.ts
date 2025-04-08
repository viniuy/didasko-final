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
    return NextResponse.redirect(new URL('/', request.url));
  }

  // For dashboard routes, check role-based access
  if (pathname.startsWith('/dashboard')) {
    const role = token.role as Role;
    const allowedPaths = roleBasedAccess[role] || [];

    if (!allowedPaths.some((path) => pathname.startsWith(path))) {
      // Redirect to appropriate dashboard if trying to access unauthorized path
      const redirectPath = allowedPaths[0] || '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api/auth).*)'], // Exclude NextAuth routes
};
