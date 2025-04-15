import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Users API - Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    console.log('Users API - Looking up email:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('Users API - Found user:', JSON.stringify(user, null, 2));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in Users API:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error?.message },
      { status: 500 }
    );
  }
} 