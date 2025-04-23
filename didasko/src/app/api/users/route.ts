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

    // If email is provided, return single user, otherwise return all users
    if (email) {
      console.log('Users API - Looking up email:', email);
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      console.log('Users API - Found user:', JSON.stringify(user, null, 2));

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    } else {
      // Return all users
      const users = await prisma.user.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({ users }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in Users API:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch user(s)', details: error?.message },
      { status: 500 },
    );
  }
}

export async function GETAll() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}
