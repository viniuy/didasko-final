import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Remove session from DB
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });
  }

  // Clear the session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.callback-url');
  response.cookies.delete('next-auth.csrf-token');

  return response;
}
