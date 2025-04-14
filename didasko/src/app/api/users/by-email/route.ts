import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    console.log('Looking up user by email:', email);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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

    if (!user) {
      console.log('User not found for email:', email);
      // For development, let's create a default user if none exists
      if (email === 'admin@example.com') {
        console.log('Creating default admin user');
        const defaultUser = await prisma.user.create({
          data: {
            name: 'Admin User',
            email: 'admin@example.com',
            department: 'Administration',
            workType: 'FULL_TIME',
            role: 'ADMIN',
            permission: 'GRANTED',
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });
        console.log('Created default user:', defaultUser);
        return NextResponse.json({ user: defaultUser });
      }

      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', user);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error looking up user by email:', error);
    return NextResponse.json(
      { error: 'Failed to look up user' },
      { status: 500 },
    );
  }
}
