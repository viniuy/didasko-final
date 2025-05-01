import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    console.log('Looking up user by ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    if (!user) {
      console.log('User not found for ID:', id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error looking up user by ID:', error);
    return NextResponse.json(
      { error: 'Failed to look up user' },
      { status: 500 },
    );
  }
}
