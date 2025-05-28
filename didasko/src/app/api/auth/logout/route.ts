import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Remove session from DB
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });
  }

  // Return a redirect response to the home page
  return NextResponse.redirect(
    new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  );
}
