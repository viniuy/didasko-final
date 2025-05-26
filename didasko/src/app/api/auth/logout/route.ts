import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Create response
    const response = NextResponse.json({ success: true });

    // Remove our custom auth cookie
    removeAuthCookie(response);

    // Clear the NextAuth session cookie
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('next-auth.csrf-token');

    // Set cache control headers
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
  }
}
